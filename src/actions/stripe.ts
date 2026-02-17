'use server'

import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { redirect } from 'next/navigation'

// Force cast validity to avoid lint errors with mismatching local types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
})

export async function createCustomerPortalSession() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) throw new Error('No tenant found')

    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

    if (!tenant?.stripe_customer_id) {
        throw new Error('No Stripe customer found for this tenant')
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_ROOT_DOMAIN ? 'https://' + process.env.NEXT_PUBLIC_ROOT_DOMAIN : 'http://localhost:3000'}/app/settings`,
    })

    redirect(session.url)
}
