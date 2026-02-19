import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

import { stripe } from '@/lib/stripe'


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature') as string

    let event: Stripe.Event

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
        if (!signature || !webhookSecret) {
            await supabaseAdmin.from('webhook_logs').insert({
                event_type: 'unknown',
                status: 'error',
                error_message: 'Missing secret or signature'
            })
            return new NextResponse('Webhook secret or signature missing', { status: 400 })
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        await supabaseAdmin.from('webhook_logs').insert({
            event_type: 'unknown',
            status: 'signature_error',
            error_message: err.message
        })
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Log the raw event for debugging
    await supabaseAdmin.from('webhook_logs').insert({
        event_type: event.type,
        payload: event as any,
        status: 'received'
    })

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const orderId = session.client_reference_id
                const tenantId = session.metadata?.tenant_id

                // Retrieve shipping details from session if available
                // Cast to any to avoid TS error if types are outdated
                const shippingDetails = (session as any).shipping_details
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
                        await supabaseAdmin.from('webhook_logs').insert({
                            event_type: event.type,
                            status: 'update_error',
                            error_message: error.message,
                            payload: { orderId, tenantId } as any
                        })
                        throw error
                    }

                    // Log success
                    await supabaseAdmin.from('webhook_logs').insert({
                        event_type: event.type,
                        status: 'processed',
                        payload: { orderId, tenantId, amountTotal } as any
                    })
                } else {
                    await supabaseAdmin.from('webhook_logs').insert({
                        event_type: event.type,
                        status: 'skipped',
                        error_message: 'Missing orderId or tenantId',
                        payload: { orderId, tenantId, metadata: session.metadata } as any
                    })
                }
                break
            }
            default:
                console.log(`Unhandled event type ${event.type}`)
            // Optional: Log unhandled events or filtered out
        }
    } catch (error: any) {
        console.error('Webhook handler failed:', error)
        await supabaseAdmin.from('webhook_logs').insert({
            event_type: event.type,
            status: 'handler_failed',
            error_message: error.message
        })
        return new NextResponse('Webhook handler failed', { status: 500 })
    }

    return new NextResponse(null, { status: 200 })
}
