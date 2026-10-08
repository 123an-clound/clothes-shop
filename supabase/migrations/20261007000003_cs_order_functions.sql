-- clothes-shop order functions. Each call is one transaction: any raise rolls back everything.

create or replace function public.cs_place_order(
  p_items jsonb,
  p_shipping jsonb,
  p_payment_method public.cs_payment_method
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_code text;
  v_subtotal integer := 0;
  v_fee integer;
  v_shipping jsonb;
  v_item record;
  v_variant record;
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 50
     or jsonb_typeof(p_shipping) is distinct from 'object'
     or char_length(btrim(coalesce(p_shipping ->> 'recipient_name', ''))) not between 2 and 100
     or coalesce(p_shipping ->> 'phone', '') !~ '^0[0-9]{9}$'
     or char_length(btrim(coalesce(p_shipping ->> 'address_line', ''))) not between 5 and 200
     or char_length(coalesce(p_shipping ->> 'ward', '')) > 100
     or char_length(coalesce(p_shipping ->> 'district', '')) > 100
     or char_length(btrim(coalesce(p_shipping ->> 'province', ''))) not between 2 and 100
     or char_length(coalesce(p_shipping ->> 'note', '')) > 500 then
    raise exception 'INVALID_INPUT';
  end if;

  if (select count(*) from public.cs_orders
      where user_id = v_uid and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  v_code := 'CS' || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMMDD')
            || upper(substr(md5(gen_random_uuid()::text), 1, 6));

  insert into public.cs_orders (
    code, user_id, payment_method, recipient_name, phone, address_line,
    ward, district, province, note, subtotal, shipping_fee, total
  ) values (
    v_code, v_uid, p_payment_method,
    btrim(p_shipping ->> 'recipient_name'), p_shipping ->> 'phone', btrim(p_shipping ->> 'address_line'),
    btrim(coalesce(p_shipping ->> 'ward', '')), btrim(coalesce(p_shipping ->> 'district', '')),
    btrim(p_shipping ->> 'province'), btrim(coalesce(p_shipping ->> 'note', '')), 0, 0, 0
  ) returning id into v_order_id;

  -- Same variant listed twice is merged; locking in id order avoids deadlocks between concurrent orders.
  for v_item in
    select i.variant_id, sum(i.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as i (variant_id uuid, quantity integer)
    group by i.variant_id
    order by i.variant_id
  loop
    if v_item.variant_id is null or v_item.quantity is null or v_item.quantity not between 1 and 20 then
      raise exception 'INVALID_INPUT';
    end if;

    select v.id, v.product_id, v.size, v.color, v.stock, coalesce(v.price, p.price) as unit_price, p.name
      into v_variant
    from public.cs_variants v
    join public.cs_products p on p.id = v.product_id
    where v.id = v_item.variant_id and p.is_published
    for update of v;

    if not found then
      raise exception 'NOT_FOUND' using detail = v_item.variant_id::text;
    end if;
    if v_variant.stock < v_item.quantity then
      raise exception 'OUT_OF_STOCK' using detail = v_item.variant_id::text;
    end if;

    update public.cs_variants set stock = stock - v_item.quantity where id = v_variant.id;
    update public.cs_products set sold_count = sold_count + v_item.quantity where id = v_variant.product_id;

    insert into public.cs_order_items (order_id, variant_id, product_name, size, color, unit_price, quantity)
    values (v_order_id, v_variant.id, v_variant.name, v_variant.size, v_variant.color, v_variant.unit_price, v_item.quantity);

    v_subtotal := v_subtotal + v_variant.unit_price * v_item.quantity;
  end loop;

  -- Must stay in sync with src/lib/shipping.ts calcShippingFee.
  select value into v_shipping from public.cs_settings where key = 'shipping';
  v_fee := case
    when v_subtotal >= coalesce((v_shipping ->> 'free_threshold')::integer, 500000) then 0
    else coalesce((v_shipping ->> 'flat_fee')::integer, 30000)
  end;

  update public.cs_orders
  set subtotal = v_subtotal, shipping_fee = v_fee, total = v_subtotal + v_fee
  where id = v_order_id;

  return v_code;
end;
$$;
revoke execute on function public.cs_place_order(jsonb, jsonb, public.cs_payment_method) from public, anon;
grant execute on function public.cs_place_order(jsonb, jsonb, public.cs_payment_method) to authenticated;

create or replace function public.cs_admin_update_order(
  p_order_id uuid,
  p_status public.cs_order_status,
  p_payment_status public.cs_payment_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.cs_order_status;
begin
  if not public.cs_is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select status into v_old from public.cs_orders where id = p_order_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_old in ('cancelled', 'completed') and p_status <> v_old then
    raise exception 'INVALID_TRANSITION';
  end if;

  if p_status = 'cancelled' and v_old <> 'cancelled' then
    update public.cs_variants v
    set stock = v.stock + s.quantity
    from (select variant_id, sum(quantity)::integer as quantity
          from public.cs_order_items
          where order_id = p_order_id and variant_id is not null
          group by variant_id) s
    where v.id = s.variant_id;

    update public.cs_products p
    set sold_count = greatest(p.sold_count - s.quantity, 0)
    from (select v.product_id, sum(oi.quantity)::integer as quantity
          from public.cs_order_items oi
          join public.cs_variants v on v.id = oi.variant_id
          where oi.order_id = p_order_id
          group by v.product_id) s
    where p.id = s.product_id;
  end if;

  update public.cs_orders
  set status = p_status, payment_status = p_payment_status
  where id = p_order_id;
end;
$$;
revoke execute on function public.cs_admin_update_order(uuid, public.cs_order_status, public.cs_payment_status) from public, anon;
grant execute on function public.cs_admin_update_order(uuid, public.cs_order_status, public.cs_payment_status) to authenticated;
