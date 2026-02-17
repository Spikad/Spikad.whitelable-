-- Create Email Logs table
create table if not exists email_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  tenant_id uuid references tenants(id), -- Nullable for system emails
  recipient text not null,
  subject text not null,
  template_name text not null,
  status text not null, -- 'sent', 'failed'
  error text,
  metadata jsonb
);

-- RLS
alter table email_logs enable row level security;

-- Tenant owners can view their own logs
create policy "Tenant owners can view email logs"
  on email_logs for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = email_logs.tenant_id
    )
  );

-- Service role (server) can insert/update
-- (Implicitly allowed for service role, but strict RLS might require policy or use service key)
