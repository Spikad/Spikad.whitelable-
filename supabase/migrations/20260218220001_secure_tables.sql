-- 11. SECURITY (Separated to debug RLS issues)
-- Enable RLS on all new tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installed_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;

-- UNIVERSAL TENANT POLICY (Write Once, Use Everywhere)
-- Pattern: "Users can view/edit rows if they belong to the tenant_id column"
CREATE POLICY "Tenant Isolation Policy" ON public.bookings
  FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid()
    )
  );

-- Repeat for critical tables
CREATE POLICY "Tenant Isolation Policy (Service Settings)" ON public.service_settings
  FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = service_settings.product_id
        AND products.tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Tenant Isolation Policy" ON public.availability_slots
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Policy" ON public.installed_themes
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Policy" ON public.pages
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Policy" ON public.blog_posts
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Fixed Policies (Using specialized queries for tables without direct tenant_id)
CREATE POLICY "Tenant Isolation Policy (Shipments)" ON public.shipments
  FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = shipments.order_id
        AND orders.tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Tenant Isolation Policy (Returns)" ON public.returns
  FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = returns.order_id
        AND orders.tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    )
  );

-- Public Read Policies (for Storefronts)
CREATE POLICY "Public Read for Published Pages" ON public.pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public Read for Blog Posts" ON public.blog_posts
  FOR SELECT USING (published_at IS NOT NULL);

CREATE POLICY "Public Read for Availability" ON public.availability_slots
  FOR SELECT USING (true); -- Customers need to see open slots
