-- Add Stripe Connect fields to tenants table
alter table tenants 
add column if not exists stripe_connect_id text,
add column if not exists charges_enabled boolean default false;

-- Create index for faster lookups by connect ID (useful for webhooks)
create index if not exists idx_tenants_stripe_connect_id on tenants(stripe_connect_id);
