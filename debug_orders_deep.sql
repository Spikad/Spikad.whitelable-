-- DEBUG: Deep Inspection of Orders and Profiles
-- Run this to see what is actually in the database.

-- 1. Check if ANY orders exist
SELECT count(*) as total_orders FROM public.orders;

-- 2. Show recent orders with their Tenant ID
SELECT 
  id as order_id, 
  tenant_id, 
  total_amount, 
  status, 
  created_at 
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Show your user profile and tenant_id
-- We can't use auth.uid() in SQL Editor easily without assuming a user. 
-- Instead, let's list all profiles to match visually.
SELECT 
  id as user_id, 
  email, 
  tenant_id 
FROM public.profiles;

-- 4. Check if RLS is enabled on orders
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'orders';

-- 5. Test the "View" Policy logic manually for a specific tenant
-- Replace 'YOUR_TENANT_ID' with one found in Step 2 if you want to test specifically.
-- SELECT * FROM public.orders WHERE tenant_id = '...';
