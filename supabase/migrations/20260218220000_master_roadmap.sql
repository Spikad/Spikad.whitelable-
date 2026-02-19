-- Master Roadmap Migration
-- Adds feature flags, domains, scheduled jobs, commerce/service schemas,
-- storefront backend tables, marketplace, operations, analytics helpers,
-- subscription addons and automation schemas.

-- 1. Feature Flags / Plans
create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  price_monthly numeric(10,2) default 0,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.features (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  description text,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.plan_features (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references public.plans(id) on delete cascade,
  feature_id uuid references public.features(id) on delete cascade,
  enabled boolean default true,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.tenant_features (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  feature_id uuid references public.features(id) on delete cascade,
  enabled boolean,
  created_at timestamptz default timezone('utc', now()) not null
);

-- 1b. Domains
create table if not exists public.custom_domains (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  domain text not null unique,
  status text check (status in ('pending','verified','failed')) default 'pending',
  dns_record jsonb,
  created_at timestamptz default timezone('utc', now()) not null
);

-- 1c. Scheduled Jobs
create table if not exists public.cron_jobs (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  schedule text not null, -- cron expression
  last_run timestamptz,
  status text check (status in ('idle','running','failed')) default 'idle',
  created_at timestamptz default timezone('utc', now()) not null
);

-- 2. Commerce System (Service Economy)
-- Product type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
    CREATE TYPE public.product_type AS ENUM ('physical','service','digital');
  END IF;
END$$;

alter table public.products
  add column if not exists product_type public.product_type default 'physical';

create table if not exists public.service_settings (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  duration_minutes integer not null default 60,
  buffer_time_minutes integer not null default 0,
  created_at timestamptz default timezone('utc', now()) not null
);

-- Booking / availability
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  product_id uuid references public.products(id),
  customer_id uuid references public.profiles(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text check (status in ('pending','confirmed','cancelled','completed')) default 'pending',
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.availability_slots (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  day_of_week integer check (day_of_week between 0 and 6) not null,
  open_time time not null,
  close_time time not null,
  created_at timestamptz default timezone('utc', now()) not null
);

-- Availability check function
CREATE OR REPLACE FUNCTION public.check_availability(p_tenant uuid, p_start timestamptz, p_end timestamptz)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1) Ensure no overlapping bookings for the tenant
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.tenant_id = p_tenant
      AND b.status <> 'cancelled'
      AND tstzrange(b.start_time, b.end_time) && tstzrange(p_start, p_end)
  ) THEN
    RETURN false;
  END IF;

  -- 2) Optionally ensure falls within availability slots (based on day_of_week)
  IF NOT EXISTS (
    SELECT 1 FROM public.availability_slots a
    WHERE a.tenant_id = p_tenant
      AND a.day_of_week = EXTRACT(dow FROM p_start)::int
      AND a.open_time <= (p_start AT TIME ZONE 'UTC')::time
      AND a.close_time >= (p_end AT TIME ZONE 'UTC')::time
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Inventory log
create table if not exists public.inventory_adjustments (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) not null,
  quantity_change integer not null,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz default timezone('utc', now()) not null
);

-- 5. Storefront Builder (backend)
create table if not exists public.installed_themes (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  theme_name text not null,
  config jsonb,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.pages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  slug text not null,
  title text,
  is_published boolean default false,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.page_sections (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid references public.pages(id) on delete cascade,
  section_type text not null,
  config_json jsonb,
  sort_order integer default 0,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.blog_categories (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  name text not null,
  slug text not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  slug text not null,
  title text not null,
  content text,
  published_at timestamptz,
  category_id uuid references public.blog_categories(id),
  created_at timestamptz default timezone('utc', now()) not null
);

-- 6. Marketplace & Platform
create table if not exists public.affiliates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  code text not null unique,
  commission_rate numeric(5,4) default 0.05,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) not null,
  affiliate_id uuid references public.affiliates(id) not null,
  amount numeric(10,2) not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.translations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  key text not null,
  language_code text not null,
  value text not null,
  created_at timestamptz default timezone('utc', now()) not null,
  unique (tenant_id, key, language_code)
);

-- 7. Operations & Logistics
create table if not exists public.shipments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) not null,
  tracking_number text,
  carrier text,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.returns (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) not null,
  reason text,
  status text check (status in ('requested','approved','received','rejected')) default 'requested',
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.webhook_logs (
  id uuid primary key default uuid_generate_v4(),
  source text,
  payload jsonb,
  status text check (status in ('received','processed','failed')) default 'received',
  created_at timestamptz default timezone('utc', now()) not null
);

-- 8. Analytics Functions (additional)
CREATE OR REPLACE FUNCTION public.get_monthly_revenue(p_tenant uuid, p_year integer, p_month integer)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  s timestamptz := make_timestamptz(p_year, p_month, 1, 0,0,0,'UTC');
  e timestamptz := (s + interval '1 month');
  result numeric := 0;
BEGIN
  SELECT COALESCE(SUM(total_amount),0) INTO result
  FROM public.orders
  WHERE tenant_id = p_tenant
    AND created_at >= s AND created_at < e
    AND status IN ('paid','processing','shipped','delivered','completed');
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_conversion_rate(p_tenant uuid, p_start timestamptz, p_end timestamptz)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  orders_count numeric := 0;
  sessions_count numeric := 0;
BEGIN
  -- Basic: conversion = orders / sessions. Requires sessions table or events; fallback to orders only.
  SELECT COUNT(*)::numeric INTO orders_count FROM public.orders WHERE tenant_id = p_tenant AND created_at BETWEEN p_start AND p_end AND status IN ('paid','processing','completed');
  -- If there is a sessions table, user can extend this function.
  sessions_count := GREATEST(orders_count, 1); -- avoid div by zero; fallback
  RETURN (orders_count / sessions_count)::numeric;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_ltv(p_tenant uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  avg_order numeric := 0;
  orders_per_customer numeric := 0;
BEGIN
  SELECT COALESCE(AVG(total_amount),0) INTO avg_order FROM public.orders WHERE tenant_id = p_tenant AND status IN ('paid','processing','completed');
  SELECT CASE WHEN COUNT(DISTINCT customer_id)=0 THEN 0 ELSE (COUNT(*)::numeric / COUNT(DISTINCT customer_id)) END INTO orders_per_customer FROM public.orders WHERE tenant_id = p_tenant AND status IN ('paid','processing','completed');
  RETURN avg_order * orders_per_customer;
END;
$$;

-- 9. Subscription / Addons
create table if not exists public.addons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price_monthly numeric(10,2) default 0,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.tenant_addons (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  addon_id uuid references public.addons(id) not null,
  active_since timestamptz default timezone('utc', now()) not null
);

-- 10. Automation & Email
create table if not exists public.email_campaigns (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  name text not null,
  subject text,
  template text,
  is_active boolean default true,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.automation_triggers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  event_type text not null,
  action_config jsonb,
  is_active boolean default true,
  created_at timestamptz default timezone('utc', now()) not null
);

-- Finish: grant basic access to service_role where appropriate
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- 11. SECURITY (ROW LEVEL SECURITY)
-- Enable RLS on all new tables

-- 12. Security (RLS) - ENABLED
alter table public.plans enable row level security;
alter table public.features enable row level security;
alter table public.custom_domains enable row level security;
alter table public.cron_jobs enable row level security;
alter table public.service_settings enable row level security;
alter table public.bookings enable row level security;
alter table public.availability_slots enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_categories enable row level security;
alter table public.affiliates enable row level security;
alter table public.referrals enable row level security;
alter table public.shipments enable row level security;
alter table public.returns enable row level security;
alter table public.addons enable row level security;
alter table public.tenant_addons enable row level security;
alter table public.email_campaigns enable row level security;

-- Universal Read Policy for Tenants
create policy "Tenant Read Access" on public.plans for select using (true);
create policy "Tenant Read Access" on public.features for select using (true);

-- Tenant Isolation Policies (Generic Pattern)
-- NOTE: In production, you would generate these individually for finer control
-- For now, we assume if you belong to the tenant, you can read everything

-- Example for bookings
create policy "Tenants manage their own bookings"
  on public.bookings for all
  using (tenant_id = (select tenant_id from public.tenant_users where user_id = auth.uid()));

-- Example for pages
create policy "Tenants manage their own pages"
  on public.pages for all
  using (tenant_id = (select tenant_id from public.tenant_users where user_id = auth.uid()));

-- Public read access for published pages/blogs
create policy "Public read published pages"
  on public.pages for select
  using (is_published = true);

create policy "Public read published blog posts"
  on public.blog_posts for select
  using (published_at is not null);
CREATE POLICY "Tenant Isolation Policy" ON public.installed_themes
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Policy" ON public.pages
CREATE POLICY "Tenant Isolation Policy" ON public.blog_posts
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Policy (Shipments)" ON public.shipments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = shipments.order_id AND orders.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Tenant Isolation Policy (Returns)" ON public.returns
  FOR ALL USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = returns.order_id AND orders.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Public Read for Published Pages" ON public.pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public Read for Blog Posts" ON public.blog_posts
  FOR SELECT USING (published_at IS NOT NULL);

CREATE POLICY "Public Read for Availability" ON public.availability_slots
  FOR SELECT USING (true);
*/


