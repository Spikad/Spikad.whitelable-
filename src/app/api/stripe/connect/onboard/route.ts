import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// ... existing imports ...

// Initialize Stripe
// ...

export async function POST(req: Request) {
    try {
        const supabase = await createClient()

        // ... verify user ...

        // 3. Create or Retrieve Connect Account
        let accountId = tenant.stripe_connect_id

        if (!accountId) {
            const account = await stripe.accounts.create({
                // ... account params ...
                type: 'express',
                country: 'SE',
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'individual',
                business_profile: {
                    url: `https://${tenant.slug}.spikad.ai`,
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
