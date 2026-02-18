-- Create a function to filter and sort products efficiently
CREATE OR REPLACE FUNCTION get_storefront_products(
    p_tenant_id UUID,
    p_search_query TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'newest',
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 12
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price NUMERIC,
    image_url TEXT,
    category TEXT,
    images JSONB,
    options JSONB,
    created_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
DECLARE
    v_offset INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_page_size;

    RETURN QUERY
    WITH filtered_products AS (
        SELECT 
            p.*
        FROM products p
        WHERE 
            p.tenant_id = p_tenant_id
            AND p.is_active = true
            AND (
                p_search_query IS NULL 
                OR p_search_query = '' 
                OR p.title ILIKE '%' || p_search_query || '%' 
                OR p.description ILIKE '%' || p_search_query || '%'
            )
            AND (
                p_category IS NULL 
                OR p_category = '' 
                OR p_category = 'all'
                OR p.category = p_category
            )
            AND (p_min_price IS NULL OR p.price >= p_min_price)
            AND (p_max_price IS NULL OR p.price <= p_max_price)
    ),
    total_matches AS (
        SELECT COUNT(*) AS count FROM filtered_products
    )
    SELECT 
        fp.id,
        fp.title,
        fp.description,
        fp.price,
        fp.image_url,
        fp.category,
        fp.images,
        fp.options,
        fp.created_at,
        tm.count AS total_count
    FROM filtered_products fp
    CROSS JOIN total_matches tm
    ORDER BY
        CASE WHEN p_sort_by = 'price_asc' THEN fp.price END ASC,
        CASE WHEN p_sort_by = 'price_desc' THEN fp.price END DESC,
        CASE WHEN p_sort_by = 'newest' THEN fp.created_at END DESC,
        fp.created_at DESC -- Default tie-breaker
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;
