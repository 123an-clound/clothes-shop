-- Allow an admin-managed FAQ list in cs_settings.
alter table public.cs_settings drop constraint cs_settings_key_check;
alter table public.cs_settings add constraint cs_settings_key_check
  check (key in ('theme', 'store', 'seo', 'shipping', 'bank', 'banners', 'policies', 'faq'));
