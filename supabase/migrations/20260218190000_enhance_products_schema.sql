-- Enhance products table for Storefront 2.0 functionality
-- This migration is designed to be safe and backward compatible

-- 1. Multiple Images (Gallery)
-- We use JSONB to store an array of image URLs
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- DATA MIGRATION:
-- Automatically copy the old single 'image_url' into the new 'images' array
-- This ensures existing products instantly have a "gallery" of 1 image.
UPDATE public.products 
SET images = jsonb_build_array(image_url) 
WHERE image_url IS NOT NULL 
  AND (images IS NULL OR jsonb_array_length(images) = 0);

-- 2. Category & Discovery
-- 'category' is for the main grouping (e.g. "Shoes")
-- 'tags' allows for flexible filtering (e.g. ["Summer", "Running", "Sale"])
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 3. Product Options (The "Variant Picker")
-- Stores the definitions. Example:
-- [
--   { "id": "opt_size", "name": "Size", "values": ["S", "M", "L"] },
--   { "id": "opt_color", "name": "Color", "values": ["Red", "Navy"] }
-- ]
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]'::jsonb;

-- 4. SEO & Polish (World Class Standard)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text;

-- 5. Indexes for Performance
-- Essential for the fast filtering/search we plan to build
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_products_options ON public.products USING gin(options);
