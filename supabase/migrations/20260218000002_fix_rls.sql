-- Fix RLS for Tenants Update
-- Allow users to update their own tenant
DROP POLICY IF EXISTS "Users can update own tenant" ON public.tenants;

CREATE POLICY "Users can update own tenant"
ON public.tenants
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE tenant_id = tenants.id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE tenant_id = tenants.id
  )
);

-- Ensure public read access for tenant assets (Logos, Hero Images)
-- Note: 'tenant-assets' bucket must be public, but we also need RLS on objects table if not globally disabled.
-- We'll add a policy to allow anyone to read objects in 'tenant-assets'.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access to Tenant Assets'
    ) THEN
        CREATE POLICY "Public Access to Tenant Assets"
        ON storage.objects
        FOR SELECT
        USING ( bucket_id = 'tenant-assets' );
    END IF;
END $$;
