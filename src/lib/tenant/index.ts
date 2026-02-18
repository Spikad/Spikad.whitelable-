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
    console.log('[getTenant] Lookup:', { domain, rootDomain }) // DEBUG LOG

    if (rootDomain && domain.endsWith(`.${rootDomain}`)) {
        const slug = domain.replace(`.${rootDomain}`, '').toLowerCase()
        console.log('[getTenant] Extracted slug:', slug) // DEBUG LOG

        const { data: slugTenant, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) console.error('[getTenant] Error:', error) // DEBUG LOG
        return slugTenant
    }

    // Fallback: Try matching slug directly (just in case env var is missing/wrong)
    const { data: directSlugTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', domain)
        .single()

    if (directSlugTenant) {
        console.log('[getTenant] Matched direct slug:', domain)
        return directSlugTenant
    }

    // Fallback 4: Hardcoded Safety Net for spikad.ai
    // This catches cases where NEXT_PUBLIC_ROOT_DOMAIN is misconfigured
    if (domain.includes('spikad.ai')) {
        const parts = domain.split('.')
        // If domain is "skarpast.spikad.ai", parts[0] is "skarpast"
        // If domain is "www.skarpast.spikad.ai", parts[0] is "www" (less ideal but handles the main case)
        if (parts.length >= 2) {
            const fallbackSlug = parts[0].toLowerCase()
            console.log('[getTenant] Hardcoded fallback slug:', fallbackSlug)

            const { data: fallbackTenant } = await supabase
                .from('tenants')
                .select('*')
                .eq('slug', fallbackSlug)
                .single()

            if (fallbackTenant) return fallbackTenant
        }
    }

    return null
})
