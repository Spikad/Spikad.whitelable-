-- Add shipping address and customer details to orders table if they don't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_address jsonb,
ADD COLUMN IF NOT EXISTS customer_details jsonb;

-- Ensure service role can access these columns (usually automatic, but good to be safe)
GRANT ALL ON public.orders TO service_role;
