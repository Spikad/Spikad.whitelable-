import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
})

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
        return new NextResponse('Missing tenant_id', { status: 400 })
    }

    const supabase = await createClient()

    // 1. Get Tenant to find Stripe ID
    const { data: tenant } = await supabase
        .from('tenants')
        .select('stripe_connect_id')
        .eq('id', tenantId)
        .single()

    if (!tenant?.stripe_connect_id) {
        return new NextResponse('Tenant has no Stripe ID', { status: 400 })
    }

    try {
        // 2. Fetch Account Status from Stripe
        const account = await stripe.accounts.retrieve(tenant.stripe_connect_id)

        // 3. Update DB based on 'charges_enabled'
        // Use Admin Client to bypass RLS
        const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        await adminClient
            .from('tenants')
            .update({
                charges_enabled: account.charges_enabled,
            })
            .eq('id', tenantId)

    } catch (error) {
        console.error('Error fetching stripe account:', error)
    }

    // 4. Redirect back to Settings
    return redirect('/app/settings?connect=success')
}
