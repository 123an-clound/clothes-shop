-- Run with Supabase MCP execute_sql (as postgres). Expected: error message exactly CS_ADMIN_TESTS_PASSED (everything rolls back).
do $$
declare
  u uuid := 'dddddddd-0000-4000-8000-00000000000d';
  adm uuid := 'eeeeeeee-0000-4000-8000-00000000000e';
  pid uuid;
  v_keep uuid;
  n integer;
  ok boolean;
  stats jsonb;
  payload jsonb := '{
    "slug":"cs-test-admin-tee","name":"Admin Tee","description":"d","category_id":"","price":200000,"compare_at_price":"",
    "is_published":true,"is_featured":false,
    "variants":[{"size":"M","color":"Đen","color_hex":"#111111","sku":"CS-TEST-ADM-M","price":"","stock":4},
                {"size":"L","color":"Đen","color_hex":"#111111","sku":"CS-TEST-ADM-L","price":250000,"stock":0}],
    "images":[{"url":"https://images.unsplash.com/photo-1","alt":"a"},{"url":"https://images.unsplash.com/photo-2","alt":"b","color":"Đen"}]
  }';
begin
  insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    ('00000000-0000-0000-0000-000000000000', u, 'authenticated', 'authenticated', 'cs-test-user@example.test', now(), '{}', '{}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', adm, 'authenticated', 'authenticated', 'cs-test-adm@example.test', now(), '{}', '{}', now(), now());
  insert into public.cs_admins (email) values ('cs-test-adm@example.test');

  -- Non-admin is rejected by both functions.
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  ok := false;
  begin perform public.cs_admin_save_product(payload); exception when others then ok := sqlerrm = 'FORBIDDEN'; end;
  if not ok then raise exception 'FAIL A1: non-admin saved a product'; end if;
  ok := false;
  begin perform public.cs_admin_stats(); exception when others then ok := sqlerrm = 'FORBIDDEN'; end;
  if not ok then raise exception 'FAIL A2: non-admin read stats'; end if;

  -- Admin creates a product with 2 variants and 2 images.
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  pid := public.cs_admin_save_product(payload);
  select count(*) into n from public.cs_variants where product_id = pid;
  if n <> 2 then raise exception 'FAIL A3: % variants (want 2)', n; end if;
  select count(*) into n from public.cs_product_images where product_id = pid and ((sort_order = 1 and color = 'Đen') or (sort_order = 0 and color is null));
  if n <> 2 then raise exception 'FAIL A4: images not saved in order with color'; end if;

  -- Update: keep M (new stock), drop L, add XL, rename.
  select id into v_keep from public.cs_variants where product_id = pid and size = 'M';
  perform public.cs_admin_save_product(jsonb_set(jsonb_set(payload, '{id}', to_jsonb(pid::text)), '{variants}', jsonb_build_array(
    jsonb_build_object('id', v_keep, 'size', 'M', 'color', 'Đen', 'color_hex', '#111111', 'sku', 'CS-TEST-ADM-M', 'price', '', 'stock', 9),
    jsonb_build_object('size', 'XL', 'color', 'Đen', 'color_hex', '#111111', 'sku', 'CS-TEST-ADM-XL', 'price', '', 'stock', 2)
  )) || '{"name":"Admin Tee v2","images":[]}'::jsonb);
  select count(*) into n from public.cs_variants where product_id = pid;
  if n <> 2 then raise exception 'FAIL A5: % variants after update (want 2)', n; end if;
  select stock into n from public.cs_variants where id = v_keep;
  if n <> 9 then raise exception 'FAIL A6: kept variant stock % (want 9)', n; end if;
  if not exists (select 1 from public.cs_products where id = pid and name = 'Admin Tee v2') then raise exception 'FAIL A7: rename not saved'; end if;
  select count(*) into n from public.cs_product_images where product_id = pid;
  if n <> 0 then raise exception 'FAIL A8: images not replaced'; end if;

  -- Duplicate SKU is rejected atomically (product name must not change).
  ok := false;
  begin
    perform public.cs_admin_save_product(jsonb_set(payload, '{id}', to_jsonb(pid::text)) || '{"name":"SHOULD NOT SAVE","variants":[
      {"size":"S","color":"Đen","color_hex":"#111111","sku":"DUP","price":"","stock":1},
      {"size":"M","color":"Đen","color_hex":"#111111","sku":"DUP","price":"","stock":1}]}'::jsonb);
  exception when unique_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL A9: duplicate sku accepted'; end if;
  if exists (select 1 from public.cs_products where id = pid and name = 'SHOULD NOT SAVE') then raise exception 'FAIL A10: partial save'; end if;

  stats := public.cs_admin_stats();
  if jsonb_array_length(stats -> 'daily') <> 14 then raise exception 'FAIL A11: daily has % days', jsonb_array_length(stats -> 'daily'); end if;
  if not (stats ? 'low_stock' and stats ? 'recent' and stats ? 'by_status') then raise exception 'FAIL A12: stats shape'; end if;

  raise exception 'CS_ADMIN_TESTS_PASSED';
end;
$$;
