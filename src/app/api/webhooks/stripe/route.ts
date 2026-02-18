import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature') as string

    let event: Stripe.Event

    try {
        if (!signature || !webhookSecret) {
            return new NextResponse('Webhook secret or signature missing', { status: 400 })
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const orderId = session.client_reference_id
                const tenantId = session.metadata?.tenant_id

                // Retrieve shipping details from session if available
                const shippingDetails = session.shipping_details
                const amountTotal = session.amount_total ? session.amount_total / 100 : 0

                console.log(`Processing order completion for Order ID: ${orderId}`)

                if (orderId && tenantId) {
                    const { error } = await supabaseAdmin
                        .from('orders')
                        .update({
                            status: 'paid',
                            payment_status: 'paid',
                            stripe_session_id: session.id,
                            customer_email: session.customer_details?.email,
                            shipping_address: shippingDetails?.address, // Store full address
                            total_amount: amountTotal // Update final amount including shipping
                        })
                        .eq('id', orderId)
                        .eq('tenant_id', tenantId)

                    if (error) {
                        console.error('Failed to update order status:', error)
                        throw error
                    }
                }
                break
            }
            default:
                console.log(`Unhandled event type ${event.type}`)
        }
    } catch (error: any) {
        console.error('Webhook handler failed:', error)
        return new NextResponse('Webhook handler failed', { status: 500 })
    }

    return new NextResponse(null, { status: 200 })
}
