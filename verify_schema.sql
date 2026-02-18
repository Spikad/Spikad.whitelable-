-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants';

-- Check RLS policies on tenants
SELECT * FROM pg_policies WHERE tablename = 'tenants';

-- Check RLS policies on storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
