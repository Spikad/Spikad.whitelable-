-- DEBUG: Check User <-> Tenant Mapping
SELECT 
    p.id as user_id, 
    p.email, 
    p.role, 
    p.tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug
FROM public.profiles p
LEFT JOIN public.tenants t ON p.tenant_id = t.id
WHERE email IN ('flashzook@gmail.com', 'omar@lynkrr.se', 'm.omar.alzokani@gmail.com');

-- DEBUG: Check RLS Policies on Products
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'products';
