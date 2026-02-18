-- PROMOTE TO SUPER ADMIN
-- This script promotes the specified email to the 'super_admin' role.
-- This grants access to the /admin dashboard.

UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'flashzook@gmail.com';

-- Verify the change
SELECT id, email, role FROM public.profiles WHERE email = 'flashzook@gmail.com';
