-- 1. ADD PLAN TYPE (If missing)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'growth', 'pro'));

CREATE INDEX IF NOT EXISTS idx_tenants_plan_type ON public.tenants(plan_type);

-- 2. ADD STOREFRONT COLUMNS
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS hero_title text,
ADD COLUMN IF NOT EXISTS hero_subtitle text,
ADD COLUMN IF NOT EXISTS hero_image_url text,
ADD COLUMN IF NOT EXISTS hero_bg_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS button_radius text DEFAULT 'rounded-md',
ADD COLUMN IF NOT EXISTS about_page_content text;

-- 3. FIX RLS FOR UPDATES
DROP POLICY IF EXISTS "Users can update own tenant" ON public.tenants;

CREATE POLICY "Users can update own tenant"
ON public.tenants
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE tenant_id = tenants.id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE tenant_id = tenants.id
  )
);

-- 4. FIX STORAGE PERMISSIONS
-- Ensure 'tenant-assets' bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-assets', 'tenant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to tenant-assets
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

-- Allow authenticated uploads to tenant-assets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Uploads to Tenant Assets'
    ) THEN
        CREATE POLICY "Authenticated Uploads to Tenant Assets"
        ON storage.objects
        FOR INSERT
        WITH CHECK ( bucket_id = 'tenant-assets' AND auth.role() = 'authenticated' );
    END IF;
END $$;
