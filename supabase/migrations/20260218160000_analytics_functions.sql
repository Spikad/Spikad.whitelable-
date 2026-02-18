-- ANALYTICS FUNCTIONS
-- Efficient server-side aggregation for dashboard charts

-- 1. Get Daily Revenue for a Tenant (Last 30 days mainly)
CREATE OR REPLACE FUNCTION public.get_daily_revenue(
  p_tenant_id uuid,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS TABLE (
  day date,
  revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('day', created_at)::date as day,
    SUM(total_amount)::numeric as revenue
  FROM public.orders
  WHERE tenant_id = p_tenant_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND status IN ('paid', 'processing', 'shipped', 'delivered', 'completed') -- Exclude cancelled/pending
  GROUP BY 1
  ORDER BY 1;
END;
$$;

-- 2. Get Top Products (by quantity sold)
CREATE OR REPLACE FUNCTION public.get_top_products(
  p_tenant_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  product_name text,
  total_sold bigint,
  total_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This requires parsing the 'items' JSONB array in orders
  -- Structure: items = [{ id, title, quantity, price }]
  RETURN QUERY
  SELECT
    item->>'title' as product_name,
    SUM((item->>'quantity')::int)::bigint as total_sold,
    SUM((item->>'quantity')::int * (item->>'price')::numeric)::numeric as total_revenue
  FROM public.orders,
       jsonb_array_elements(items) as item
  WHERE tenant_id = p_tenant_id
    AND status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT p_limit;
END;
$$;
