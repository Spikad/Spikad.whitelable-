-- Add plan_type column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'growth', 'pro'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_plan_type ON public.tenants(plan_type);
