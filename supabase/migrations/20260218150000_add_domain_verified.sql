-- ADD DOMAIN VERIFICATION COLUMN
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS domain_verified boolean DEFAULT false;

-- Add index for potential lookups (though custom_domain should be unique)
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);
