-- Webhook Idempotency Table
create table if not exists webhook_events (
  id uuid default gen_random_uuid() primary key,
  event_id text not null unique, -- Stripe Event ID
  type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'processed'
);

-- Improve Orders Table for Guest Checkout (Fix #2 implication)
alter table orders 
add column if not exists customer_email text,
add column if not exists customer_name text;
