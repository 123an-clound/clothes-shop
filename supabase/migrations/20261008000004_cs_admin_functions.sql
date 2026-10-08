-- clothes-shop admin functions. Input is validated by Zod in the app; DB constraints are the final guard.

-- Atomic product save: product row + variants diff + gallery replace.
-- p = { id?, slug, name, description, category_id?, price, compare_at_price?, is_published, is_featured,
--       variants: [{ id?, size, color, color_hex, sku, price?, stock }], images: [{ url, alt, color? }] }
create or replace function public.cs_admin_save_product(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v jsonb;
begin
  if not public.cs_is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if jsonb_typeof(p -> 'variants') is distinct from 'array' or jsonb_typeof(p -> 'images') is distinct from 'array' then
    raise exception 'INVALID_INPUT';
  end if;

  if v_id is null then
    insert into public.cs_products (slug, name, description, category_id, price, compare_at_price, is_published, is_featured)
    values (p ->> 'slug', p ->> 'name', coalesce(p ->> 'description', ''), nullif(p ->> 'category_id', '')::uuid,
            (p ->> 'price')::integer, nullif(p ->> 'compare_at_price', '')::integer,
            coalesce((p ->> 'is_published')::boolean, false), coalesce((p ->> 'is_featured')::boolean, false))
    returning id into v_id;
  else
    update public.cs_products set
      slug = p ->> 'slug',
      name = p ->> 'name',
      description = coalesce(p ->> 'description', ''),
      category_id = nullif(p ->> 'category_id', '')::uuid,
      price = (p ->> 'price')::integer,
      compare_at_price = nullif(p ->> 'compare_at_price', '')::integer,
      is_published = coalesce((p ->> 'is_published')::boolean, false),
      is_featured = coalesce((p ->> 'is_featured')::boolean, false)
    where id = v_id;
    if not found then
      raise exception 'NOT_FOUND';
    end if;
  end if;

  -- Variants removed in the editor. Order items keep their snapshot (variant_id -> null).
  delete from public.cs_variants
  where product_id = v_id
    and id not in (
      select nullif(x ->> 'id', '')::uuid from jsonb_array_elements(p -> 'variants') x where nullif(x ->> 'id', '') is not null
    );

  for v in select * from jsonb_array_elements(p -> 'variants') loop
    if nullif(v ->> 'id', '') is null then
      insert into public.cs_variants (product_id, size, color, color_hex, sku, price, stock)
      values (v_id, v ->> 'size', v ->> 'color', v ->> 'color_hex', v ->> 'sku',
              nullif(v ->> 'price', '')::integer, (v ->> 'stock')::integer);
    else
      update public.cs_variants set
        size = v ->> 'size', color = v ->> 'color', color_hex = v ->> 'color_hex', sku = v ->> 'sku',
        price = nullif(v ->> 'price', '')::integer, stock = (v ->> 'stock')::integer
      where id = (v ->> 'id')::uuid and product_id = v_id;
      if not found then
        raise exception 'NOT_FOUND';
      end if;
    end if;
  end loop;

  delete from public.cs_product_images where product_id = v_id;
  insert into public.cs_product_images (product_id, url, alt, color, sort_order)
  select v_id, x.value ->> 'url', coalesce(x.value ->> 'alt', ''), nullif(x.value ->> 'color', ''), (x.ordinality - 1)::integer
  from jsonb_array_elements(p -> 'images') with ordinality as x (value, ordinality);

  return v_id;
end;
$$;
revoke execute on function public.cs_admin_save_product(jsonb) from public, anon;
grant execute on function public.cs_admin_save_product(jsonb) to authenticated;

-- Dashboard numbers in one round trip. Revenue excludes cancelled orders. Times in Vietnam timezone.
create or replace function public.cs_admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.cs_is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select jsonb_build_object(
    'revenue_total', coalesce((select sum(total) from public.cs_orders where status <> 'cancelled'), 0),
    'revenue_30d', coalesce((select sum(total) from public.cs_orders where status <> 'cancelled' and created_at > now() - interval '30 days'), 0),
    'orders_30d', (select count(*) from public.cs_orders where created_at > now() - interval '30 days'),
    'unpaid_transfers', (select count(*) from public.cs_orders where payment_method = 'bank_transfer' and payment_status = 'unpaid' and status not in ('cancelled')),
    'by_status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from public.cs_orders group by status) s), '{}'::jsonb),
    'daily', (
      select jsonb_agg(jsonb_build_object('day', d.day::date, 'revenue', coalesce(o.revenue, 0), 'orders', coalesce(o.orders, 0)) order by d.day)
      from generate_series((now() at time zone 'Asia/Ho_Chi_Minh')::date - 13, (now() at time zone 'Asia/Ho_Chi_Minh')::date, interval '1 day') as d (day)
      left join (
        select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, sum(total) filter (where status <> 'cancelled') as revenue, count(*) as orders
        from public.cs_orders
        where created_at > now() - interval '15 days'
        group by 1
      ) o on o.day = d.day::date
    ),
    'low_stock', coalesce((
      select jsonb_agg(x) from (
        select p.id as product_id, p.name, v.size, v.color, v.stock
        from public.cs_variants v join public.cs_products p on p.id = v.product_id
        where v.stock <= 3 and p.is_published
        order by v.stock, p.name
        limit 20
      ) x
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(x) from (
        select id, code, recipient_name, total, status, payment_method, payment_status, created_at
        from public.cs_orders order by created_at desc limit 8
      ) x
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;
revoke execute on function public.cs_admin_stats() from public, anon;
grant execute on function public.cs_admin_stats() to authenticated;
