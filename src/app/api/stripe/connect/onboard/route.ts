import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
})

export async function POST(req: Request) {
    try {
        const supabase = await createClient()

        // 1. Authenticate User
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // 2. Get Tenant
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return new NextResponse('No tenant found', { status: 400 })
        }

        const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single()

        if (!tenant) {
            return new NextResponse('Tenant not found', { status: 404 })
        }

        // 3. Create or Retrieve Connect Account
        let accountId = tenant.stripe_connect_id

        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'SE', // Defaulting to Sweden as per context, or make dynamic
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'individual', // Default, can be 'company'
                business_profile: {
                    url: `https://${tenant.slug}.spikad.ai`, // Or custom domain
                    name: tenant.name,
                }
            })
            accountId = account.id

            // USE ADMIN CLIENT FOR UPDATE
            // This bypasses RLS to ensure the ID is always saved.
            const adminClient = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            )

            const { error: updateError } = await adminClient
                .from('tenants')
                .update({ stripe_connect_id: accountId })
                .eq('id', tenant.id)

            if (updateError) {
                console.error('CRITICAL: Failed to save Stripe Connect ID:', updateError)
                return new NextResponse('Database Update Failed', { status: 500 })
            }
        }

        // 4. Create Account Link (Onboarding Flow)
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
        const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
        const origin = `${protocol}://${domain}` // e.g. http://app.localhost:3000

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${origin}/app/settings?connect=refresh`,
            return_url: `${origin}/api/stripe/connect/callback?tenant_id=${tenant.id}`,
            type: 'account_onboarding',
        })

        return NextResponse.json({ url: accountLink.url })
    } catch (error) {
        console.error('Stripe Connect error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
