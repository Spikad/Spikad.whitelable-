-- Add payouts_enabled to tenants
alter table tenants 
add column if not exists payouts_enabled boolean default false;
