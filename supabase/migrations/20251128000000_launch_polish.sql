-- 1. Reserved Subdomains Constraint
alter table tenants
add constraint check_reserved_slugs 
check (
  slug not in (
    'app', 'admin', 'www', 'api', 'support', 'docs', 'home', 'shop', 'public', 'assets', 'static', 'spikad'
  )
);

-- 2. Lock down webhook_events
-- No policies defined means DEFAULT DENY for public/anon/authenticated
-- Only service_role can access (which is what API routes use)
alter table webhook_events enable row level security;

-- 3. Refine email_logs RLS
alter table email_logs enable row level security;

-- Drop existing if any to be safe
drop policy if exists "Tenants view own email logs" on email_logs;
drop policy if exists "Admins view all email logs" on email_logs;

create policy "Tenants view own email logs"
  on email_logs for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = email_logs.tenant_id
    )
  );

-- System insert only
-- (Implicitly handled by lack of INSERT policy for public)

-- 4. Abandoned Order Cleanup Function
create or replace function cleanup_abandoned_orders()
returns void as $$
begin
  -- Mark pending orders older than 24 hours as 'abandoned'
  update orders
  set status = 'abandoned'
  where status = 'pending'
  and created_at < now() - interval '24 hours';
end;
$$ language plpgsql security definer;
