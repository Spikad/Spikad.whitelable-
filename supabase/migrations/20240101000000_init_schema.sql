-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. TENANTS TABLE
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  custom_domain text unique,
  logo_url text,
  primary_color text default '#000000',
  secondary_color text default '#ffffff',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tenants
alter table public.tenants enable row level security;

-- Policy: Anyone can read tenants (needed for public storefronts to load config)
create policy "Public tenants are viewable by everyone." on public.tenants
  for select using (true);

-- Policy: Only super admins can insert/update/delete (We will define super admins later)
-- For now, allow authenticated users to create a tenant (for onboarding flow)
create policy "Authenticated users can create a tenant." on public.tenants
  for insert with check (auth.role() = 'authenticated');


-- 2. PROFILES TABLE (Extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text check (role in ('super_admin', 'tenant_owner', 'customer', 'staff')) default 'customer',
  tenant_id uuid references public.tenants(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policy: Users can view and edit their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. PRODUCTS TABLE
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  title text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_active boolean default true,
  stock_quantity integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on products
alter table public.products enable row level security;

-- Policy: Public READ access (if tenant matches)
create policy "Public can view active products" on public.products
  for select using (is_active = true);

-- Policy: Tenant Owners can managing (All Access) to their OWN products
create policy "Tenant owners can manage their own products" on public.products
  for all using (
    auth.uid() in (
      select id from public.profiles 
      where tenant_id = products.tenant_id 
      and role in ('tenant_owner', 'staff')
    )
  );


-- 4. ORDERS TABLE (Simplified)
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  customer_id uuid references public.profiles(id),
  total_amount numeric(10, 2) not null,
  status text check (status in ('pending', 'paid', 'shipped', 'cancelled')) default 'pending',
  items jsonb default '[]'::jsonb, -- simplified for now
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on orders
alter table public.orders enable row level security;

-- Policy: Customers can view their own orders
create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = customer_id);

-- Policy: Tenant Owners can view all orders for their tenant
create policy "Tenant owners can view tenant orders" on public.orders
  for select using (
    auth.uid() in (
      select id from public.profiles 
      where tenant_id = orders.tenant_id 
      and role in ('tenant_owner', 'staff')
    )
  );
