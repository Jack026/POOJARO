-- ===========================================================================
-- POOJARO — Enterprise Supabase Schema & Zero-Trust Row Level Security (RLS)
-- ===========================================================================
-- Run this script in your Supabase SQL Editor (https://app.supabase.com)
-- It enables strict security, creates all tables, and sets non-bypassable RLS.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Core Tables (Declared FIRST so functions and policies have no forward-reference issues)
-- ---------------------------------------------------------------------------

-- Settings
create table if not exists public.settings (
  id text primary key default 'store_settings',
  store_name text not null default 'POOJARO',
  support_email text not null default 'support@poojaro.in',
  support_phone text not null default '+91 98765 43210',
  whatsapp_number text not null default '919876543210',
  free_delivery_threshold numeric not null default 499,
  delivery_fee numeric not null default 49,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Admin Users (Created before is_admin() function)
create table if not exists public.admin_users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('owner', 'manager', 'staff', 'editor', 'support')),
  is_active boolean not null default true,
  password_hash text not null,
  last_login_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categories
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  parent_id text references public.categories(id) on delete set null,
  description text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Occasions
create table if not exists public.occasions (
  id text primary key,
  name text not null,
  slug text not null unique,
  tagline text not null default '',
  description text not null default '',
  image_url text not null default '',
  icon text not null default 'Home',
  sort_order int not null default 0,
  is_active boolean not null default true,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Festivals
create table if not exists public.festivals (
  id text primary key,
  name text not null,
  slug text not null unique,
  headline text not null default '',
  tagline text not null default '',
  description text not null default '',
  image_url text not null default '',
  icon text not null default 'Sparkles',
  start_date timestamptz,
  end_date timestamptz,
  accent text not null default '#B78332',
  sort_order int not null default 0,
  is_active boolean not null default true,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kit Components (Master components for kits)
create table if not exists public.kit_components (
  id text primary key,
  name text not null,
  sku text not null unique,
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 10,
  cost_price numeric not null default 0,
  unit text not null default 'piece',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text not null unique,
  subtitle text not null default '',
  description text not null default '',
  category_id text references public.categories(id) on delete set null,
  occasion_id text references public.occasions(id) on delete set null,
  festival_id text references public.festivals(id) on delete set null,
  is_kit boolean not null default false,
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  keywords text[] not null default '{}',
  price numeric not null check (price >= 0),
  compare_at_price numeric check (compare_at_price is null or compare_at_price >= 0),
  cost_price numeric not null default 0 check (cost_price >= 0),
  sku text not null unique,
  barcode text,
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 5,
  track_quantity boolean not null default true,
  status text not null default 'draft' check (status in ('published', 'draft', 'archived', 'active')),
  images jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  kit_items jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  rating numeric not null default 0,
  review_count int not null default 0,
  sort_order int not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customers / Users
create table if not exists public.users (
  id text primary key,
  email text not null unique,
  phone text,
  name text not null,
  addresses jsonb not null default '[]'::jsonb,
  default_address_id text,
  preferences jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Carts
create table if not exists public.carts (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  coupon_code text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Coupons
create table if not exists public.coupons (
  id text primary key,
  code text not null unique,
  description text not null default '',
  type text not null check (type in ('percentage', 'flat', 'fixed')),
  value numeric not null check (value > 0),
  min_order_amount numeric not null default 0,
  max_discount numeric,
  usage_limit int,
  usage_count int not null default 0,
  per_user_limit int not null default 1,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  user_id text references public.users(id) on delete set null,
  email text not null,
  phone text not null,
  items jsonb not null,
  shipping_address jsonb not null,
  billing_address jsonb,
  pricing jsonb not null,
  payment_method text not null,
  payment_status text not null check (payment_status in ('pending', 'paid', 'captured', 'failed', 'refunded')),
  status text not null check (status in ('pending', 'payment_confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded', 'placed', 'confirmed', 'packing')),
  status_history jsonb not null default '[]'::jsonb,
  tracking jsonb,
  notes jsonb not null default '[]'::jsonb,
  razorpay_order_id text,
  razorpay_payment_id text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Coupon Redemptions
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id text not null references public.coupons(id) on delete cascade,
  user_id text references public.users(id) on delete set null,
  order_id text not null references public.orders(id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

-- Inventory Transactions (Immutable Ledger)
create table if not exists public.inventory_transactions (
  id text primary key,
  target_id text not null,
  target_type text not null check (target_type in ('product', 'component', 'variant')),
  delta int not null,
  new_qty int not null check (new_qty >= 0),
  reason text not null,
  note text not null default '',
  order_id text references public.orders(id) on delete set null,
  actor_id text not null,
  actor_name text not null,
  actor_kind text not null check (actor_kind in ('admin', 'customer', 'system')),
  created_at timestamptz not null default now()
);

-- Banners
create table if not exists public.banners (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  image_url text not null,
  link_url text not null,
  slot text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reviews
create table if not exists public.reviews (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  user_id text references public.users(id) on delete set null,
  user_name text not null,
  rating int not null check (rating between 1 and 5),
  title text not null default '',
  body text not null,
  is_verified_purchase boolean not null default false,
  status text not null default 'pending' check (status in ('approved', 'pending', 'rejected', 'published')),
  helpful_count int not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Testimonials
create table if not exists public.testimonials (
  id text primary key,
  name text not null,
  location text not null default '',
  quote text not null,
  avatar_url text,
  rating int not null default 5,
  is_active boolean not null default true,
  sort_order int not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recommendation Rules (Ritual Finder)
create table if not exists public.recommendation_rules (
  id text primary key,
  name text not null,
  condition jsonb not null,
  recommendations jsonb not null,
  is_active boolean not null default true,
  priority int not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- App Notifications
create table if not exists public.notifications (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  type text not null default 'order',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Audit Logs (Tamper-proof Immutable Security Log)
create table if not exists public.audit_logs (
  id text primary key,
  actor_id text not null,
  actor_name text not null,
  actor_kind text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  diff jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Analytics Events
create table if not exists public.analytics_events (
  id text primary key,
  event_name text not null,
  user_id text,
  session_id text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Counters (e.g. order sequence numbering)
create table if not exists public.counters (
  id text primary key,
  name text not null unique,
  current_value bigint not null default 100
);

-- ---------------------------------------------------------------------------
-- 2. Helper Security Functions (Defined AFTER tables exist)
-- ---------------------------------------------------------------------------

-- Check if current authenticated caller is an admin or service role
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_email text;
  v_uid text;
begin
  -- Service role, postgres superuser, or supabase_admin bypass
  v_role := coalesce(
    auth.jwt() ->> 'role',
    current_setting('request.jwt.claim.role', true),
    current_user
  );

  if v_role in ('service_role', 'postgres', 'supabase_admin') then
    return true;
  end if;

  v_email := auth.jwt() ->> 'email';
  v_uid := auth.uid()::text;

  return exists (
    select 1
    from public.admin_users
    where (
      (v_email is not null and lower(email) = lower(v_email))
      or (v_uid is not null and id = v_uid)
    )
    and is_active = true
  );
end;
$$;

-- Atomic sequence generator for order numbers
create or replace function public.next_order_number()
returns text
language plpgsql
security definer
as $$
declare
  v_num bigint;
begin
  insert into public.counters (id, name, current_value)
  values ('order_counter', 'order', 101)
  on conflict (id) do update set current_value = public.counters.current_value + 1
  returning current_value into v_num;

  return 'PJR-' || lpad(v_num::text, 6, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Indexes for Ultra-High Performance
-- ---------------------------------------------------------------------------

create index if not exists idx_products_category on public.products(category_id) where status in ('published', 'active');
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_featured on public.products(is_featured) where status in ('published', 'active');
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_reviews_product on public.reviews(product_id) where status in ('published', 'approved');
create index if not exists idx_inv_tx_target on public.inventory_transactions(target_id, target_type);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- 4. ZERO-TRUST ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------

-- Enable RLS on every table
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.occasions enable row level security;
alter table public.festivals enable row level security;
alter table public.kit_components enable row level security;
alter table public.products enable row level security;
alter table public.users enable row level security;
alter table public.carts enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.banners enable row level security;
alter table public.reviews enable row level security;
alter table public.testimonials enable row level security;
alter table public.recommendation_rules enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.analytics_events enable row level security;
alter table public.counters enable row level security;

-- ---------------------------------------------------------------------------
-- 5. RLS POLICIES (Idempotent: drops then creates each policy)
-- ---------------------------------------------------------------------------

-- Public Catalog Read Access (Published & Active)
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products for select using (status in ('published', 'active') or public.is_admin());

drop policy if exists "Public can view active categories" on public.categories;
create policy "Public can view active categories" on public.categories for select using (is_active = true or public.is_admin());

drop policy if exists "Public can view active occasions" on public.occasions;
create policy "Public can view active occasions" on public.occasions for select using (is_active = true or public.is_admin());

drop policy if exists "Public can view active festivals" on public.festivals;
create policy "Public can view active festivals" on public.festivals for select using (is_active = true or public.is_admin());

drop policy if exists "Public can view active banners" on public.banners;
create policy "Public can view active banners" on public.banners for select using (is_active = true or public.is_admin());

drop policy if exists "Public can view approved reviews" on public.reviews;
create policy "Public can view approved reviews" on public.reviews for select using (status in ('published', 'approved') or public.is_admin());

drop policy if exists "Public can view active testimonials" on public.testimonials;
create policy "Public can view active testimonials" on public.testimonials for select using (is_active = true or public.is_admin());

drop policy if exists "Public can view active recommendation rules" on public.recommendation_rules;
create policy "Public can view active recommendation rules" on public.recommendation_rules for select using (is_active = true or public.is_admin());

drop policy if exists "Public can view general store settings" on public.settings;
create policy "Public can view general store settings" on public.settings for select using (true);

-- Customer Data Isolation (Only the owner user can access their data)
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users for select using (auth.uid()::text = id or public.is_admin());

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users for update using (auth.uid()::text = id or public.is_admin());

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users for insert with check (auth.uid()::text = id or public.is_admin());

drop policy if exists "Customers can view own orders" on public.orders;
create policy "Customers can view own orders" on public.orders for select using (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "Customers can manage own cart" on public.carts;
create policy "Customers can manage own cart" on public.carts for all using (auth.uid()::text = user_id or public.is_admin()) with check (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "Customers can view own notifications" on public.notifications;
create policy "Customers can view own notifications" on public.notifications for select using (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "Customers can mark own notifications as read" on public.notifications;
create policy "Customers can mark own notifications as read" on public.notifications for update using (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "Customers can submit product reviews" on public.reviews;
create policy "Customers can submit product reviews" on public.reviews for insert with check (auth.uid()::text = user_id or public.is_admin());

-- Analytics: Any visitor can insert events, but only admin can view them
drop policy if exists "Allow inserting analytics events" on public.analytics_events;
create policy "Allow inserting analytics events" on public.analytics_events for insert with check (true);

drop policy if exists "Only admin can view analytics events" on public.analytics_events;
create policy "Only admin can view analytics events" on public.analytics_events for select using (public.is_admin());

-- Admin & Service Role Full Authority
drop policy if exists "Service role and admins full access on settings" on public.settings;
create policy "Service role and admins full access on settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on categories" on public.categories;
create policy "Service role and admins full access on categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on occasions" on public.occasions;
create policy "Service role and admins full access on occasions" on public.occasions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on festivals" on public.festivals;
create policy "Service role and admins full access on festivals" on public.festivals for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on kit_components" on public.kit_components;
create policy "Service role and admins full access on kit_components" on public.kit_components for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on products" on public.products;
create policy "Service role and admins full access on products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on users" on public.users;
create policy "Service role and admins full access on users" on public.users for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on carts" on public.carts;
create policy "Service role and admins full access on carts" on public.carts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on coupons" on public.coupons;
create policy "Service role and admins full access on coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on orders" on public.orders;
create policy "Service role and admins full access on orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on coupon_redemptions" on public.coupon_redemptions;
create policy "Service role and admins full access on coupon_redemptions" on public.coupon_redemptions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on inventory_transactions" on public.inventory_transactions;
create policy "Service role and admins full access on inventory_transactions" on public.inventory_transactions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on banners" on public.banners;
create policy "Service role and admins full access on banners" on public.banners for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on reviews" on public.reviews;
create policy "Service role and admins full access on reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on testimonials" on public.testimonials;
create policy "Service role and admins full access on testimonials" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on recommendation_rules" on public.recommendation_rules;
create policy "Service role and admins full access on recommendation_rules" on public.recommendation_rules for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on notifications" on public.notifications;
create policy "Service role and admins full access on notifications" on public.notifications for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on admin_users" on public.admin_users;
create policy "Service role and admins full access on admin_users" on public.admin_users for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on audit_logs" on public.audit_logs;
create policy "Service role and admins full access on audit_logs" on public.audit_logs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Service role and admins full access on counters" on public.counters;
create policy "Service role and admins full access on counters" on public.counters for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Storage Buckets & Policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('poojaro-products', 'poojaro-products', true),
  ('poojaro-banners', 'poojaro-banners', true),
  ('poojaro-media', 'poojaro-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id in ('poojaro-products', 'poojaro-banners', 'poojaro-media'));

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media"
  on storage.objects for insert
  with check (
    bucket_id in ('poojaro-products', 'poojaro-banners', 'poojaro-media')
    and (public.is_admin() or auth.jwt() ->> 'role' = 'service_role')
  );

drop policy if exists "Admins can update and delete media" on storage.objects;
create policy "Admins can update and delete media"
  on storage.objects for update
  using (
    bucket_id in ('poojaro-products', 'poojaro-banners', 'poojaro-media')
    and (public.is_admin() or auth.jwt() ->> 'role' = 'service_role')
  );

drop policy if exists "Admins can remove media" on storage.objects;
create policy "Admins can remove media"
  on storage.objects for delete
  using (
    bucket_id in ('poojaro-products', 'poojaro-banners', 'poojaro-media')
    and (public.is_admin() or auth.jwt() ->> 'role' = 'service_role')
  );
