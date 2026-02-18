-- Add Storefront Customization Fields to Tenants Table

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS hero_title text,
ADD COLUMN IF NOT EXISTS hero_subtitle text,
ADD COLUMN IF NOT EXISTS hero_image_url text,
ADD COLUMN IF NOT EXISTS hero_bg_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS button_radius text DEFAULT 'rounded-md',
ADD COLUMN IF NOT EXISTS about_page_content text;
