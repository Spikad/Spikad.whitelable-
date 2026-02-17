-- Add tenant_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Add role column to profiles if missing (it seems to be used in actions.ts but not in initial schema)
-- Initial schema uses user_type enum ('client', 'company'...), but actions.ts tries to set role: 'tenant_owner'
-- We should probably add a text role column or update user_type.
-- For now, let's add 'role' as text to match the code.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
