-- clothes-shop RLS. Admin = confirmed email listed in cs_admins.

create or replace function public.cs_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.cs_admins a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;
-- anon needs execute because public read policies reference it; it returns false when auth.uid() is null.
revoke execute on function public.cs_is_admin() from public;
grant execute on function public.cs_is_admin() to anon, authenticated;

-- Anonymous visitors never write. Orders are written only through security definer functions.
revoke insert, update, delete, truncate on
  public.cs_admins, public.cs_profiles, public.cs_categories, public.cs_products,
  public.cs_product_images, public.cs_variants, public.cs_orders, public.cs_order_items, public.cs_settings
from anon;
revoke all on public.cs_admins from anon, authenticated;
grant select on public.cs_admins to authenticated;
revoke insert, update, delete, truncate on public.cs_orders, public.cs_order_items from authenticated;

-- cs_admins
create policy cs_admins_admin_select on public.cs_admins
  for select to authenticated using ((select public.cs_is_admin()));

-- cs_profiles
create policy cs_profiles_select on public.cs_profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.cs_is_admin()));
create policy cs_profiles_insert_own on public.cs_profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy cs_profiles_update_own on public.cs_profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- catalog: public read, admin write
create policy cs_categories_public_select on public.cs_categories
  for select to anon, authenticated using (true);
create policy cs_categories_admin_insert on public.cs_categories
  for insert to authenticated with check ((select public.cs_is_admin()));
create policy cs_categories_admin_update on public.cs_categories
  for update to authenticated using ((select public.cs_is_admin())) with check ((select public.cs_is_admin()));
create policy cs_categories_admin_delete on public.cs_categories
  for delete to authenticated using ((select public.cs_is_admin()));

create policy cs_products_public_select on public.cs_products
  for select to anon, authenticated
  using (is_published or (select public.cs_is_admin()));
create policy cs_products_admin_insert on public.cs_products
  for insert to authenticated with check ((select public.cs_is_admin()));
create policy cs_products_admin_update on public.cs_products
  for update to authenticated using ((select public.cs_is_admin())) with check ((select public.cs_is_admin()));
create policy cs_products_admin_delete on public.cs_products
  for delete to authenticated using ((select public.cs_is_admin()));

create policy cs_product_images_public_select on public.cs_product_images
  for select to anon, authenticated
  using (exists (select 1 from public.cs_products p where p.id = product_id and p.is_published)
         or (select public.cs_is_admin()));
create policy cs_product_images_admin_insert on public.cs_product_images
  for insert to authenticated with check ((select public.cs_is_admin()));
create policy cs_product_images_admin_update on public.cs_product_images
  for update to authenticated using ((select public.cs_is_admin())) with check ((select public.cs_is_admin()));
create policy cs_product_images_admin_delete on public.cs_product_images
  for delete to authenticated using ((select public.cs_is_admin()));

create policy cs_variants_public_select on public.cs_variants
  for select to anon, authenticated
  using (exists (select 1 from public.cs_products p where p.id = product_id and p.is_published)
         or (select public.cs_is_admin()));
create policy cs_variants_admin_insert on public.cs_variants
  for insert to authenticated with check ((select public.cs_is_admin()));
create policy cs_variants_admin_update on public.cs_variants
  for update to authenticated using ((select public.cs_is_admin())) with check ((select public.cs_is_admin()));
create policy cs_variants_admin_delete on public.cs_variants
  for delete to authenticated using ((select public.cs_is_admin()));

-- settings: public read (no secrets stored here), admin write
create policy cs_settings_public_select on public.cs_settings
  for select to anon, authenticated using (true);
create policy cs_settings_admin_insert on public.cs_settings
  for insert to authenticated with check ((select public.cs_is_admin()));
create policy cs_settings_admin_update on public.cs_settings
  for update to authenticated using ((select public.cs_is_admin())) with check ((select public.cs_is_admin()));

-- orders: owner or admin reads; no direct writes
create policy cs_orders_select on public.cs_orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.cs_is_admin()));
create policy cs_order_items_select on public.cs_order_items
  for select to authenticated
  using (exists (select 1 from public.cs_orders o
                 where o.id = order_id
                   and (o.user_id = (select auth.uid()) or (select public.cs_is_admin()))));

-- storage: public bucket for product/site images, admin-only writes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cs-products', 'cs-products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy cs_products_bucket_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cs-products' and (select public.cs_is_admin()));
create policy cs_products_bucket_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'cs-products' and (select public.cs_is_admin()))
  with check (bucket_id = 'cs-products' and (select public.cs_is_admin()));
create policy cs_products_bucket_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'cs-products' and (select public.cs_is_admin()));

-- First admin (run once with your own email; lowercase):
-- insert into public.cs_admins (email) values ('<admin-email>') on conflict do nothing;
