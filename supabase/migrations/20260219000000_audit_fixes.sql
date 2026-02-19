-- Audit Fixes Migration
-- 1. Create affiliate_payouts table (Missing in audit)
create table if not exists public.affiliate_payouts (
  id uuid primary key default uuid_generate_v4(),
  affiliate_id uuid references public.affiliates(id) not null,
  amount numeric(10,2) not null,
  status text check (status in ('pending','paid','rejected')) default 'pending',
  requested_at timestamptz default timezone('utc', now()) not null,
  paid_at timestamptz,
  notes text,
  tenant_id uuid references public.tenants(id) not null
);

-- 2. Enhance bookings table (Missing columns)
-- Add notes column
alter table public.bookings 
  add column if not exists notes text;

-- Add metadata column
alter table public.bookings 
  add column if not exists metadata jsonb default '{}'::jsonb;

-- Update status check constraint to include 'no-show'
alter table public.bookings 
  drop constraint if exists bookings_status_check;

alter table public.bookings 
  add constraint bookings_status_check 
  check (status in ('pending','confirmed','cancelled','completed','no-show'));

-- 3. Enhance products table (Missing SEO/Tags)
alter table public.products 
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists tags text[];

-- 4. Enable RLS for new table
alter table public.affiliate_payouts enable row level security;

-- Policy: Tenant Owners/Staff can manage payouts for their tenant
create policy "Tenant Admins can manage payouts"
  on public.affiliate_payouts for all
  using (
    tenant_id in (
      select tenant_id from public.profiles 
      where id = auth.uid() 
      and role in ('tenant_owner', 'staff')
    )
  );
