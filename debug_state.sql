-- URGE: Deep Inspection
-- 1. Check Columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants';

-- 2. Check RLS Policies
SELECT * FROM pg_policies WHERE tablename = 'tenants';
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Check Tenant Data (Anonymized-ish)
SELECT 
  id, 
  name, 
  slug, 
  hero_title, 
  hero_image_url, 
  logo_url, 
  primary_color, 
  subscription_status, 
  stripe_connect_id, 
  charges_enabled,
  created_at,
  updated_at
FROM tenants;

-- 4. Check Storage Buckets
SELECT id, name, public FROM storage.buckets;
