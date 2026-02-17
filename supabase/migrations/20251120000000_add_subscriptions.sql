-- Add Stripe Subscription fields to tenants table
alter table public.tenants
add column stripe_customer_id text,
add column subscription_status text check (subscription_status in ('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing')) default null,
add column current_period_end timestamp with time zone;

-- Index for faster lookups during webhooks
create index idx_tenants_stripe_customer_id on public.tenants(stripe_customer_id);
