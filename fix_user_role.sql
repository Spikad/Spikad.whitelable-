-- FIX USER ROLE
-- This script will promote all users who have a tenant_id but are still 'customer' to 'tenant_owner'.
-- This fixes the issue where early users (during development) might have missed the role upgrade.

UPDATE public.profiles
SET role = 'tenant_owner'
WHERE tenant_id IS NOT NULL 
AND role = 'customer';

-- Verify the change
SELECT id, email, tenant_id, role FROM public.profiles;
