-- Run with Supabase MCP execute_sql (as postgres).
-- Expected result: an error whose message is exactly CS_TESTS_PASSED.
-- The final raise rolls back every fixture, so this is safe to run against the shared project.
do $$
declare
  a uuid := 'aaaaaaaa-0000-4000-8000-00000000000a';
  b uuid := 'bbbbbbbb-0000-4000-8000-00000000000b';
  adm uuid := 'cccccccc-0000-4000-8000-00000000000c';
  cat uuid;
  p_pub uuid;
  p_hidden uuid;
  v_pub uuid;
  v_hidden uuid;
  o_b uuid;
  v_code text;
  n integer;
  ok boolean;
  ship jsonb := '{"recipient_name":"Test A","phone":"0912345678","address_line":"1 Le Loi","province":"HCM"}';
begin
  -- Fixtures (as postgres)
  insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    ('00000000-0000-0000-0000-000000000000', a, 'authenticated', 'authenticated', 'cs-test-a@example.test', now(), '{}', '{}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', b, 'authenticated', 'authenticated', 'cs-test-b@example.test', now(), '{}', '{}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', adm, 'authenticated', 'authenticated', 'cs-test-admin@example.test', now(), '{}', '{}', now(), now());
  insert into public.cs_admins (email) values ('cs-test-admin@example.test');
  insert into public.cs_settings (key, value) values ('shipping', '{"flat_fee":30000,"free_threshold":500000}')
    on conflict (key) do update set value = excluded.value;
  insert into public.cs_categories (slug, name) values ('cs-test-cat', 'Test') returning id into cat;
  insert into public.cs_products (slug, name, category_id, price, is_published)
    values ('cs-test-pub', 'Pub', cat, 100000, true) returning id into p_pub;
  insert into public.cs_products (slug, name, category_id, price, is_published)
    values ('cs-test-hidden', 'Hidden', cat, 100000, false) returning id into p_hidden;
  insert into public.cs_variants (product_id, size, color, color_hex, sku, stock)
    values (p_pub, 'M', 'Den', '#000000', 'CS-TEST-PUB-M', 3) returning id into v_pub;
  insert into public.cs_variants (product_id, size, color, color_hex, sku, stock)
    values (p_hidden, 'M', 'Den', '#000000', 'CS-TEST-HID-M', 3) returning id into v_hidden;
  insert into public.cs_orders (code, user_id, payment_method, recipient_name, phone, address_line, province, subtotal, shipping_fee, total)
    values ('CS-TEST-B', b, 'cod', 'B', '0900000000', '123 Test', 'HCM', 0, 0, 0) returning id into o_b;

  -- 1 + 7: anon
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
  select count(*) into n from public.cs_products where slug like 'cs-test-%';
  if n <> 1 then raise exception 'FAIL 1a: anon sees % test products (want 1)', n; end if;
  select count(*) into n from public.cs_variants where sku like 'CS-TEST-%';
  if n <> 1 then raise exception 'FAIL 1b: anon sees % test variants (want 1)', n; end if;
  ok := false;
  begin
    perform public.cs_place_order('[]', '{}', 'cod');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'FAIL 7: anon could execute cs_place_order'; end if;
  ok := false;
  begin
    update public.cs_settings set value = '{}' where key = 'shipping';
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'FAIL 1c: anon could update settings'; end if;

  -- 2 + 3: user A
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.cs_orders where id = o_b;
  if n <> 0 then raise exception 'FAIL 2a: user A can read user B order'; end if;
  ok := false;
  begin
    insert into public.cs_products (slug, name, price) values ('cs-test-x', 'X', 1);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'FAIL 2b: user A could insert a product'; end if;
  update public.cs_settings set value = '{}' where key = 'shipping';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL 2c: user A updated settings'; end if;
  ok := false;
  begin
    insert into public.cs_orders (code, user_id, payment_method, recipient_name, phone, address_line, province, subtotal, shipping_fee, total)
      values ('CS-TEST-A', a, 'cod', 'A', '0900000000', '123 Test', 'HCM', 0, 0, 0);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'FAIL 3: user A inserted an order directly'; end if;
  ok := false;
  begin
    insert into public.cs_profiles (id, full_name) values (b, 'hijack');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'FAIL 2d: user A created a profile for user B'; end if;
  insert into public.cs_profiles (id, full_name) values (a, 'Test A');

  -- 4: place order computes price from DB + flat fee and decrements stock
  v_code := public.cs_place_order(jsonb_build_array(jsonb_build_object('variant_id', v_pub, 'quantity', 2, 'price', 1)), ship, 'cod');
  select total into n from public.cs_orders where code = v_code;
  if n is distinct from 230000 then raise exception 'FAIL 4a: total % (want 230000)', n; end if;
  select stock into n from public.cs_variants where id = v_pub;
  if n <> 1 then raise exception 'FAIL 4b: stock % after order (want 1)', n; end if;
  select count(*) into n from public.cs_order_items oi join public.cs_orders o on o.id = oi.order_id where o.code = v_code;
  if n <> 1 then raise exception 'FAIL 4c: user A sees % items of own order (want 1)', n; end if;

  -- 5: oversell, hidden product, bad input
  ok := false;
  begin
    perform public.cs_place_order(jsonb_build_array(jsonb_build_object('variant_id', v_pub, 'quantity', 2)), ship, 'cod');
  exception when others then ok := sqlerrm = 'OUT_OF_STOCK';
  end;
  if not ok then raise exception 'FAIL 5a: oversell not rejected with OUT_OF_STOCK'; end if;
  select stock into n from public.cs_variants where id = v_pub;
  if n <> 1 then raise exception 'FAIL 5b: stock changed after failed order (%)', n; end if;
  ok := false;
  begin
    perform public.cs_place_order(jsonb_build_array(jsonb_build_object('variant_id', v_hidden, 'quantity', 1)), ship, 'cod');
  exception when others then ok := sqlerrm = 'NOT_FOUND';
  end;
  if not ok then raise exception 'FAIL 5c: hidden product orderable'; end if;
  ok := false;
  begin
    perform public.cs_place_order(jsonb_build_array(jsonb_build_object('variant_id', v_pub, 'quantity', 1)), '{"recipient_name":"A","phone":"123"}', 'cod');
  exception when others then ok := sqlerrm = 'INVALID_INPUT';
  end;
  if not ok then raise exception 'FAIL 5d: invalid shipping accepted'; end if;

  -- 6: admin functions
  ok := false;
  begin
    perform public.cs_admin_update_order(o_b, 'confirmed', 'unpaid');
  exception when others then ok := sqlerrm = 'FORBIDDEN';
  end;
  if not ok then raise exception 'FAIL 6a: non-admin updated order'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  select count(*) into n from public.cs_orders where code in ('CS-TEST-B', v_code);
  if n <> 2 then raise exception 'FAIL 6b: admin sees % orders (want 2)', n; end if;
  select count(*) into n from public.cs_products where slug like 'cs-test-%';
  if n <> 2 then raise exception 'FAIL 6c: admin sees % products (want 2)', n; end if;
  perform public.cs_admin_update_order((select id from public.cs_orders where code = v_code), 'cancelled', 'unpaid');
  select stock into n from public.cs_variants where id = v_pub;
  if n <> 3 then raise exception 'FAIL 6d: stock % after cancel (want 3)', n; end if;
  ok := false;
  begin
    perform public.cs_admin_update_order((select id from public.cs_orders where code = v_code), 'confirmed', 'unpaid');
  exception when others then ok := sqlerrm = 'INVALID_TRANSITION';
  end;
  if not ok then raise exception 'FAIL 6e: cancelled order reopened'; end if;

  raise exception 'CS_TESTS_PASSED';
end;
$$;
