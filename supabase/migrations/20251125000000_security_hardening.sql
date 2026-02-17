-- Create Audit Logs table
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  tenant_id uuid references tenants(id), -- Nullable for system-level actions
  actor_id uuid references auth.users(id), -- Who performed the action
  action text not null, -- e.g. 'update_settings', 'delete_product'
  table_name text not null,
  record_id uuid, -- ID of the record that was changed
  old_data jsonb,
  new_data jsonb,
  ip_address text
);

-- RLS for Audit Logs
alter table audit_logs enable row level security;

-- Tenant owners can view their own audit logs
create policy "Tenant owners can view audit logs"
  on audit_logs for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = audit_logs.tenant_id
    )
  );

-- Only system/server can insert (service role)
-- No public insert policy.

-- Create a reusable function to log changes automatically
create or replace function log_audit_event()
returns trigger as $$
begin
  insert into audit_logs (tenant_id, actor_id, action, table_name, record_id, old_data, new_data)
  values (
    coalesce(
      (select tenant_id from profiles where id = auth.uid()),
      (case when TG_TABLE_NAME = 'tenants' then NEW.id else null end) -- Fallback for tenant creation
    ),
    auth.uid(),
    TG_OP, -- INSERT, UPDATE, DELETE
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    case when TG_OP = 'DELETE' or TG_OP = 'UPDATE' then to_jsonb(OLD) else null end,
    case when TG_OP = 'INSERT' or TG_OP = 'UPDATE' then to_jsonb(NEW) else null end
  );
  return null;
end;
$$ language plpgsql security definer;

-- Add triggers to critical tables
create trigger audit_tenants_changes
  after insert or update or delete on tenants
  for each row execute function log_audit_event();

create trigger audit_shipping_changes
  after insert or update or delete on shipping_profiles
  for each row execute function log_audit_event();

-- Products (Optional, can be noisy)
-- create trigger audit_products_changes after ...
