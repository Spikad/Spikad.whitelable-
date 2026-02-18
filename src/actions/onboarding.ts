'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function createTenant(formData: FormData) {
    const supabase = await createClient()

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const name = formData.get('name') as string
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '')     // Trim hyphens

    // 2. Create Tenant
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
            name,
            slug,
            // Default colors are set in DB
        })
        .select()
        .single()

    if (tenantError) {
        console.error('Tenant Create Error:', tenantError)
        redirect(`/onboarding?error=${encodeURIComponent(tenantError.message)}`)
    }

    // 3. Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            tenant_id: tenant.id,
            role: 'tenant_owner',
        })
        .eq('id', user.id)

    if (profileError) {
        console.error('Profile Update Error:', profileError)
        // Try to rollback tenant? 
        // For now, just error out. User is in a weird state.
        redirect('/onboarding?error=Could not link account to store')
    }

    // 4. Redirect to Plan Selection
    // Instead of going straight to /app, we now ask them to pick a plan.
    redirect('/onboarding/plans')
}
