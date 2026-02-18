import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const getTenant = cache(async (rawDomain: string) => {
    const supabase = await createClient()
    const domain = rawDomain.toLowerCase() // Enforce lowercase

    console.log('[getTenant] Lookup:', domain)

    // 1. Exact Match (Custom Domain)
    const { data: customDomainTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('custom_domain', domain)
        .single()

    if (customDomainTenant) return customDomainTenant

    // 2. Subdomain Logic (Standard)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase()

    if (rootDomain && domain.endsWith(`.${rootDomain}`)) {
        const slug = domain.replace(`.${rootDomain}`, '').replace('www.', '')
        const { data: slugTenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single()

        if (slugTenant) return slugTenant
    }

    // 3. Fallback: Split domain and try *every* part as a slug
    // e.g. "www.skarpast.spikad.ai" -> ["www", "skarpast", "spikad", "ai"]
    // We try to find a tenant with slug "skarpast"
    const parts = domain.split('.')
    for (const part of parts) {
        if (part === 'www' || part === 'com' || part === 'ai' || part === 'spikad') continue; // Skip common noise

        const { data: fallbackTenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', part)
            .single()

        if (fallbackTenant) {
            console.log('[getTenant] Found via part-match:', part)
            return fallbackTenant
        }
    }

    return null
})
