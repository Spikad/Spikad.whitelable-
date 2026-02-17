-- Create Shipping Profiles table
create table if not exists shipping_profiles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  tenant_id uuid references tenants(id) not null,
  name text not null, -- e.g. "Standard Shipping"
  price numeric not null default 0,
  free_over_amount numeric -- null means never free
);

-- RLS Policies
alter table shipping_profiles enable row level security;

-- Public Read (for Storefront)
create policy "Public read shipping profiles"
  on shipping_profiles for select
  using (true);

-- Tenant write access
create policy "Tenant owners can manage shipping profiles"
  on shipping_profiles for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = shipping_profiles.tenant_id
    )
  );
