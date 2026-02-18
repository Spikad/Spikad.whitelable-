-- FIX PRODUCTS ISOLATION
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. Drop the dangerous "Public" policy
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

-- 2. Create a SAFER Public policy
-- Only allow access if the user is anonymous (storefront visitor) OR if we are explicitly filtering by tenant_id in the application (hard to enforce in SQL).
-- BETTER: Only allow SELECT if the query is public.
-- Actually, for Storefront, we usually use `anon` key.
CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);

-- 3. Authenticated Users (Dashboard)
-- They should ONLY see products for their OWN tenant.
DROP POLICY IF EXISTS "Tenant owners can manage their own products" ON public.products;

CREATE POLICY "Tenant owners can manage their own products"
ON public.products
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('tenant_owner', 'staff', 'super_admin')
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('tenant_owner', 'staff', 'super_admin')
    )
);

-- 4. Super Admin Override (Optional, but good for Flashzook)
CREATE POLICY "Super Admins can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);
