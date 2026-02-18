-- FIX ADMIN PERMISSIONS
-- Allow Super Admins to view all profiles and tenants

-- 1. Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
);

-- 2. Tenants Table (Already public read, but ensuring update access)
CREATE POLICY "Super Admins can update all tenants"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

-- 3. Verify
-- You should see more than just your own row after running this.
-- SELECT * FROM public.profiles;
