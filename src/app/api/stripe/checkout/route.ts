import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia', // Use latest API version available or from package
});

export async function POST(req: Request) {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Get Tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

    if (!profile?.tenant_id) {
        return new NextResponse('No Tenant Found', { status: 400 });
    }

    // 3. Create Checkout Session
    try {
        const { priceId } = await req.json();

        // Check if tenant already has a stripe_customer_id
        const { data: tenant } = await supabase
            .from('tenants')
            .select('stripe_customer_id, email, name') // Assuming email might be on tenant or we use user email? Tenant table doesn't have email in init_schema.
            // Actually, we should probably use the user's email for the customer if tenant doesn't have one.
            .eq('id', profile.tenant_id)
            .single();

        let customerId = tenant?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: tenant?.name,
                metadata: {
                    tenantId: profile.tenant_id,
                }
            });
            customerId = customer.id;

            // Save customer ID to tenant
            await supabase
                .from('tenants')
                .update({ stripe_customer_id: customerId })
                .eq('id', profile.tenant_id);
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.get('origin')}/app/settings?success=true`,
            cancel_url: `${req.headers.get('origin')}/app/settings?canceled=true`,
            metadata: {
                tenantId: profile.tenant_id,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error(err);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
