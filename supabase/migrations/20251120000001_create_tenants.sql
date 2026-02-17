-- Create tenants table if moving from manual setup
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    custom_domain text UNIQUE,
    config jsonb DEFAULT '{"primary_color": "#e11d48", "secondary_color": "#f97316"}'::jsonb,
    stripe_connect_id text,
    charges_enabled boolean DEFAULT false,
    subscription_status text DEFAULT 'trialing',
    stripe_customer_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policies for Tenants

-- 1. Public Read (Needed for identifying the shop from the domain)
CREATE POLICY "Public can read tenants"
    ON public.tenants
    FOR SELECT
    USING (true);

-- 2. Authenticated Insert (Needed for onboarding!)
CREATE POLICY "Authenticated users can create a tenant"
    ON public.tenants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Owner Update (Users can only update their own shop)
CREATE POLICY "Owners can update their tenant"
    ON public.tenants
    FOR UPDATE
    USING (
        id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- 4. Service Role Full Access
CREATE POLICY "Service role full access tenants"
    ON public.tenants
    USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);
