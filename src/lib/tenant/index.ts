import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const getTenant = cache(async (domain: string) => {
    const supabase = await createClient()

    // 1. Try matching custom_domain (e.g. store.com)
    const { data: customDomainTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('custom_domain', domain)
        .single()

    if (customDomainTenant) return customDomainTenant

    // 2. If valid subdomain (e.g. store.spikad.ai), try matching slug
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    if (rootDomain && domain.endsWith(`.${rootDomain}`)) {
        const slug = domain.replace(`.${rootDomain}`, '')
        const { data: slugTenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single()

        return slugTenant
    }

    return null
})
