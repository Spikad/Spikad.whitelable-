import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail'

import { stripe } from '@/lib/stripe'


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const headerPayload = (await headers()).get('stripe-signature')

    if (!headerPayload) {
        return new NextResponse('No signature', { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, headerPayload, webhookSecret)
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err)
        return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Idempotency Check
    const { data: existingEvent } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('event_id', event.id)
        .single()

    if (existingEvent) {
        return new NextResponse('Event already processed', { status: 200 })
    }

    try {
        switch (event.type) {
            // --- ORDER FULFILLMENT (Fix #2 & #4) ---
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const orderId = session.metadata?.orderId
                const customerEmail = session.customer_details?.email
                const customerName = session.customer_details?.name

                if (orderId) {
                    // Update Order Status
                    const { error: updateError } = await supabase
                        .from('orders')
                        .update({
                            status: 'paid',
                            customer_email: customerEmail,
                            customer_name: customerName,
                        })
                        .eq('id', orderId)

                    if (updateError) {
                        throw updateError
                    }

                    // Send Confirmation Email
                    if (customerEmail) {
                        const { data: order } = await supabase.from('orders').select('items, total_amount').eq('id', orderId).single()

                        if (order) {
                            try {
                                await sendEmail({
                                    to: customerEmail,
                                    subject: `Order Confirmation #${orderId.slice(0, 8)}`,
                                    react: OrderConfirmationEmail({
                                        orderId: orderId,
                                        totalAmount: order.total_amount,
                                        items: order.items || [],
                                        customerName: customerName || 'Customer'
                                    }),
                                    templateName: 'OrderConfirmationEmail',
                                    tenantId: session.metadata?.tenantId
                                })
                            } catch (emailErr) {
                                console.error('Failed to send confirmation email', emailErr)
                            }
                        }
                    }
                    console.log(`Order ${orderId} marked as paid.`)
                } else {
                    console.warn('Checkout session missing orderId metadata')
                }
                break
            }

            // --- SUBSCRIPTION EVENTS ---
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                const tenantId = subscription.metadata.tenant_id

                if (tenantId) {
                    await supabase
                        .from('tenants')
                        .update({ subscription_status: subscription.status })
                        .eq('id', tenantId)
                }
                break
            }

            // --- CONNECT EVENTS ---
            case 'account.updated': {
                const account = event.data.object as Stripe.Account
                await supabase
                    .from('tenants')
                    .update({
                        charges_enabled: account.charges_enabled,
                        payouts_enabled: account.payouts_enabled,
                    })
                    .eq('stripe_connect_id', account.id)
                break
            }
        }

        // 2. Record Event as Processed
        await supabase.from('webhook_events').insert({
            event_id: event.id,
            type: event.type,
            status: 'processed'
        })

    } catch (error) {
        console.error('Webhook handler failed:', error)

        // Alert Admin with Rate Limiting (Fix A)
        try {
            // Check if we already sent an alert in the last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
            const { count } = await supabase
                .from('email_logs')
                .select('*', { count: 'exact', head: true })
                .eq('template_name', 'WebhookAlert')
                .eq('status', 'sent')
                .gt('created_at', oneHourAgo)

            if (!count || count === 0) {
                await sendEmail({
                    to: 'support@spikad.ai',
                    subject: '🚨 CRITICAL: Webhook Handler Failed',
                    react: null,
                    html: `<p>Webhook handler failed for event ${event?.type} (${event?.id}). Error: ${error}</p>`,
                    tenantId: undefined,
                    templateName: 'WebhookAlert'
                })
            } else {
                console.log('Skipping webhook alert due to rate limiting.')
            }
        } catch (alertError) {
            console.error('Failed to send alert:', alertError)
        }

        return new NextResponse('Webhook handler failed', { status: 500 })
    }

    return new NextResponse('Received', { status: 200 })
}
