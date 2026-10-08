-- clothes-shop schema. Shared Supabase project: every object is prefixed cs_.

create type public.cs_order_status as enum ('pending', 'confirmed', 'shipping', 'completed', 'cancelled');
create type public.cs_payment_method as enum ('cod', 'bank_transfer');
create type public.cs_payment_status as enum ('unpaid', 'paid');

create or replace function public.cs_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.cs_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
comment on table public.cs_admins is 'clothes-shop: admin allowlist by confirmed email';

create table public.cs_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 100),
  phone text check (phone ~ '^0[0-9]{9}$'),
  address_line text check (char_length(address_line) <= 200),
  ward text check (char_length(ward) <= 100),
  district text check (char_length(district) <= 100),
  province text check (char_length(province) <= 100),
  updated_at timestamptz not null default now()
);
comment on table public.cs_profiles is 'clothes-shop: customer profile + default address';

create table public.cs_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  image_url text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.cs_categories is 'clothes-shop: product categories';

create table public.cs_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 150),
  description text not null default '' check (char_length(description) <= 5000),
  category_id uuid references public.cs_categories (id) on delete set null,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price > price),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sold_count integer not null default 0 check (sold_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.cs_products is 'clothes-shop: products';

create table public.cs_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.cs_products (id) on delete cascade,
  url text not null,
  alt text not null default '' check (char_length(alt) <= 200),
  color text,
  sort_order integer not null default 0
);
comment on table public.cs_product_images is 'clothes-shop: product gallery; color links an image to a variant color';

create table public.cs_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.cs_products (id) on delete cascade,
  size text not null check (char_length(size) between 1 and 20),
  color text not null check (char_length(color) between 1 and 50),
  color_hex text not null check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  sku text not null unique check (char_length(sku) between 1 and 64),
  price integer check (price is null or price >= 0),
  stock integer not null default 0 check (stock >= 0),
  unique (product_id, size, color)
);
comment on table public.cs_variants is 'clothes-shop: size x color variants with stock';

create table public.cs_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  status public.cs_order_status not null default 'pending',
  payment_method public.cs_payment_method not null,
  payment_status public.cs_payment_status not null default 'unpaid',
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  ward text not null default '',
  district text not null default '',
  province text not null,
  note text not null default '',
  subtotal integer not null check (subtotal >= 0),
  shipping_fee integer not null check (shipping_fee >= 0),
  total integer not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.cs_orders is 'clothes-shop: orders (written only via cs_place_order / cs_admin_update_order)';

create table public.cs_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.cs_orders (id) on delete cascade,
  variant_id uuid references public.cs_variants (id) on delete set null,
  product_name text not null,
  size text not null,
  color text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);
comment on table public.cs_order_items is 'clothes-shop: order line snapshots';

create table public.cs_settings (
  key text primary key check (key in ('theme', 'store', 'seo', 'shipping', 'bank', 'banners', 'policies')),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
comment on table public.cs_settings is 'clothes-shop: site configuration (theme builder, SEO, shipping, bank)';

create index cs_products_category_published_idx on public.cs_products (category_id, is_published);
create index cs_products_created_idx on public.cs_products (created_at desc);
create index cs_product_images_product_idx on public.cs_product_images (product_id, sort_order);
create index cs_variants_product_idx on public.cs_variants (product_id);
create index cs_orders_user_created_idx on public.cs_orders (user_id, created_at desc);
create index cs_order_items_order_idx on public.cs_order_items (order_id);
create index cs_order_items_variant_idx on public.cs_order_items (variant_id);

create trigger cs_products_updated_at before update on public.cs_products
  for each row execute function public.cs_set_updated_at();
create trigger cs_profiles_updated_at before update on public.cs_profiles
  for each row execute function public.cs_set_updated_at();
create trigger cs_orders_updated_at before update on public.cs_orders
  for each row execute function public.cs_set_updated_at();
create trigger cs_settings_updated_at before update on public.cs_settings
  for each row execute function public.cs_set_updated_at();

alter table public.cs_admins enable row level security;
alter table public.cs_profiles enable row level security;
alter table public.cs_categories enable row level security;
alter table public.cs_products enable row level security;
alter table public.cs_product_images enable row level security;
alter table public.cs_variants enable row level security;
alter table public.cs_orders enable row level security;
alter table public.cs_order_items enable row level security;
alter table public.cs_settings enable row level security;
