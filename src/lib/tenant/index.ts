import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const getTenant = cache(async (slug: string) => {
    const supabase = await createClient()
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

    return tenant
})
