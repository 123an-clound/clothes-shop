-- Storage remove() first selects the object rows, so admins need SELECT on their bucket for deletes to work.
-- Public image URLs keep working without this (public bucket); listing stays admin-only.
create policy cs_products_bucket_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'cs-products' and (select public.cs_is_admin()));
