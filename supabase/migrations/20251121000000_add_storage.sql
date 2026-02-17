-- Create the 'tenant-assets' bucket
insert into storage.buckets (id, name, public)
values ('tenant-assets', 'tenant-assets', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Drop existing policies to ensure idempotency
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Owner Delete" on storage.objects;
drop policy if exists "Owner Update" on storage.objects;

-- Policy: Public Read Access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'tenant-assets' );

-- Policy: Authenticated Upload (Any authenticated user for now)
create policy "Authenticated Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'tenant-assets' 
    and auth.role() = 'authenticated'
  );

-- Policy: Owner Delete/Update
create policy "Owner Delete"
  on storage.objects for delete
  using (
    bucket_id = 'tenant-assets' 
    and auth.uid() = owner
  );

create policy "Owner Update"
  on storage.objects for update
  using (
    bucket_id = 'tenant-assets' 
    and auth.uid() = owner
  );
