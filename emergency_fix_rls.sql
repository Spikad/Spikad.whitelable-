-- EMERGENCY FIX
-- The previous policy caused an infinite recursion loop (checking profiles table inside profiles RLS).
-- This script DROPS that policy to restore access immediately.

DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;

-- Restore standard access (just in case)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- SAFER Admin Policy (No Recursion loop)
-- We check the role WITHOUT triggering a fresh RLS check on the same table context if possible, 
-- or we accept that for now, Admins might need a specific function.
-- A simple way to avoid recursion is to NOT query the table itself if we can avoid it, 
-- but since role is IN the table, we must use a SECURITY DEFINER function to read it cleanly.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- <--- Critical: Bypasses RLS to avoid loop

CREATE POLICY "Super Admins can view all profiles_safe"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
);
