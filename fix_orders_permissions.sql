-- FIX ORDERS RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public can create orders" ON public.orders; -- Old/Wrong?
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Tenant owners can view tenant orders" ON public.orders;
DROP POLICY IF EXISTS "Service role full access" ON public.orders;

-- 2. Tenant Owners (View All in Tenant)
CREATE POLICY "Tenant owners can view tenant orders"
ON public.orders
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE tenant_id = orders.tenant_id 
    AND role IN ('tenant_owner', 'staff')
  )
);

-- 3. Customers (View Own)
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
USING (
  auth.uid() = customer_id
);

-- 4. Service Role (Full Access - Critical for Checkout API)
CREATE POLICY "Service role full access"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Debugging: Allow authenticated users to view all orders (Temporary, remove later)
-- Uncomment the below lines if you still can't see orders, to verify if it's an RLS issue.
-- CREATE POLICY "Debug: Auth users view all" ON public.orders FOR SELECT TO authenticated USING (true);
