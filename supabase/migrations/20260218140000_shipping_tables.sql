-- SHIPPPING SCHEMA
-- Create tables for Shipping Zones and Rates

-- 1. Shipping Zones
-- A zone represents a region (e.g. "Europe") where specific rates apply.
CREATE TABLE public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  countries text[] DEFAULT '{}', -- Array of country codes e.g. ['US', 'CA', 'SE']
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Shipping Rates
-- A rate belongs to a zone (e.g. "Standard Shipping - $10")
CREATE TABLE public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id uuid REFERENCES public.shipping_zones(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- e.g. "Standard", "Express"
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  min_order_price numeric(10, 2) DEFAULT 0 CHECK (min_order_price >= 0), -- Setup for "Free shipping over $X"
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Zones: Tenant Owners can view/edit their own zones
CREATE POLICY "Tenant owners can manage shipping zones" ON public.shipping_zones
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

-- Rates: Tenant Owners can view/edit rates if they own the parent zone
CREATE POLICY "Tenant owners can manage shipping rates" ON public.shipping_rates
  FOR ALL
  TO authenticated
  USING (
    zone_id IN (
      SELECT id FROM public.shipping_zones
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('tenant_owner', 'staff', 'super_admin')
      )
    )
  )
  WITH CHECK (
    zone_id IN (
      SELECT id FROM public.shipping_zones
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('tenant_owner', 'staff', 'super_admin')
      )
    )
  );

-- Service Role (Checkout API) bypasses RLS, so no extra policy needed for that.
