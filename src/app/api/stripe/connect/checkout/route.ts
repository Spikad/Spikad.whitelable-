import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Force cast validity to avoid lint errors with mismatching local types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
})

export async function POST(req: Request) {
    try {
        const { items, tenantId, customerDetails, successUrl, cancelUrl, shippingProfileId } = await req.json()

        if (!items || !tenantId || !items.length) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const supabase = await createServerClient()

        // 1. Get Tenant (and verify Connect Status - Fix #3)
        const { data: tenant } = await supabase
            .from('tenants')
            .select('stripe_connect_id, charges_enabled, name, plan_type')
            .eq('id', tenantId)
            .single()

        if (!tenant?.stripe_connect_id) {
            return new NextResponse('Store is not connected to payments', { status: 400 })
        }
        if (!tenant.charges_enabled) {
            return new NextResponse('Store is not ready to accept payments (Charges Disabled)', { status: 400 })
        }

        // 2. Fetch Products & Calculate Trusted Context (Fix #4)
        const productIds = items.map((i: any) => i.id)
        const { data: products } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds)
            .eq('tenant_id', tenantId) // Ensure products belong to this tenant

        if (!products || products.length !== items.length) {
            // Some items might be invalid or from another tenant
            return new NextResponse('Invalid products in cart', { status: 400 })
        }

        let itemsTotal = 0
        const line_items = []

        for (const itemRequest of items) {
            const product = products.find(p => p.id === itemRequest.id)
            if (!product) continue
            if (!product.is_active) {
                return new NextResponse(`Product ${product.title} is unavailable`, { status: 400 })
            }

            const quantity = itemRequest.quantity
            const unitAmount = Math.round(product.price * 100)

            itemsTotal += (product.price * quantity)

            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.title,
                        images: product.image_url ? [product.image_url] : [],
                    },
                    unit_amount: unitAmount,
                },
                quantity: quantity,
            })
        }

        // 3. Handle Shipping (Server-Side Calc - Fix #4)
        let shippingLineItem = null
        let shippingCost = 0
        let shippingName = 'Default Shipping'

        if (shippingProfileId) {
            const { data: profile } = await supabase
                .from('shipping_profiles')
                .select('*')
                .eq('id', shippingProfileId)
                .eq('tenant_id', tenantId)
                .single()

            if (profile) {
                shippingName = profile.name
                shippingCost = profile.price
                if (profile.free_over_amount && itemsTotal >= profile.free_over_amount) {
                    shippingCost = 0
                }

                shippingLineItem = {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            // 4. Create Pending Order (Fix #2)
                            // CRITICAL: Use Service Role to bypass RLS for order creation (Guest Checkout)
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

        const { data: order, error: orderError } = await supabaseAdmin
                                .from('orders')
                                .insert({
                                    tenant_id: tenantId,
                                    total_amount: itemsTotal, // Total amount will be updated after shipping is selected
                                    status: 'pending',
                                    items: items.map((i: any) => ({ ...i, price: products.find(p => p.id === i.id)?.price })), // Store snapshot
                                })
                                .select()
                                .single()

        if(orderError || !order) {
                    console.error('Order creation failed:', orderError)
                    const errorMessage = orderError?.message || 'Unknown error'
                    return new NextResponse(`Failed to initialize order: ${errorMessage}`, { status: 500 })
                        .from('orders')
                        .insert({
                            tenant_id: tenantId,
                            total_amount: itemsTotal, // Total amount will be updated after shipping is selected
                            status: 'pending',
                            items: items.map((i: any) => ({ ...i, price: products.find(p => p.id === i.id)?.price })), // Store snapshot
                        })
                        .select()
                        .single()

                    if (orderError || !order) {
                        console.error('Order creation failed:', orderError)
                        const errorMessage = orderError?.message || 'Unknown error'
                        return new NextResponse(`Failed to initialize order: ${errorMessage}`, { status: 500 })
                    }

                    // 5. Calculate Application Fee
                    // Free: 5%, Growth: 3%, Pro: 1%
                    let feePercent = 0.05
                    if (tenant.plan_type === 'growth') feePercent = 0.03
                    if (tenant.plan_type === 'pro') feePercent = 0.01

                    // 3. Calculate Shipping (Dynamic)
                    // Fetch Tenant's Shipping Rates
                    // Using Type Assertion for supabaseAdmin because it's derived from generic createClient
                    const { data: zones } = await (supabaseAdmin as any)
                        .from('shipping_zones')
                        .select('*, shipping_rates(*)')
                        .eq('tenant_id', tenantId)

                    const stripeShippingOptions = []
                    const allowedCountries = new Set()

                    if (zones && zones.length > 0) {
                        for (const zone of zones) {
                            // Add countries to allowed list
                            if (zone.countries) {
                                zone.countries.forEach((c: string) => allowedCountries.add(c))
                            }

                            if (zone.shipping_rates) {
                                for (const rate of zone.shipping_rates) {
                                    // Check min order price
                                    if (rate.min_order_price > 0 && itemsTotal < rate.min_order_price) continue;

                                    stripeShippingOptions.push({
                                        shipping_rate_data: {
                                            type: 'fixed_amount',
                                            fixed_amount: {
                                                amount: Math.round(rate.price * 100),
                                                currency: 'usd', // currency should match tenant
                                            },
                                            display_name: `${rate.name} (${zone.name})`,
                                            delivery_estimate: {
                                                minimum: { unit: 'business_day', value: 3 },
                                                maximum: { unit: 'business_day', value: 7 },
                                            },
                                        },
                                    })
                                }
                            }
                        }
                    }

                    // Fallback if no rates defined?
                    if (stripeShippingOptions.length === 0) {
                        // Fallback to legacy $10 flat rate if no zones setup
                        stripeShippingOptions.push({
                            shipping_rate_data: {
                                type: 'fixed_amount',
                                fixed_amount: { amount: 1000, currency: 'usd' },
                                display_name: 'Standard Shipping',
                            }
                        })
                        allowedCountries.add('US'); // Default
                    }

                    // 6. Create Stripe Session
                    const session = await stripe.checkout.sessions.create({
                        payment_method_types: ['card'],
                        line_items: line_items, // Use the proper line_items array constructed earlier
                        mode: 'payment',
                        // Fix: Use correct URL construction with fallbacks
                        success_url: successUrl || `https://${tenant.custom_domain || (tenant.slug ? tenant.slug + '.' + process.env.NEXT_PUBLIC_ROOT_DOMAIN : 'localhost:3000')}/success?session_id={CHECKOUT_SESSION_ID}`,
                        cancel_url: cancelUrl || `https://${tenant.custom_domain || (tenant.slug ? tenant.slug + '.' + process.env.NEXT_PUBLIC_ROOT_DOMAIN : 'localhost:3000')}/cart`,
                        customer_email: customerDetails?.email, // Safe access
                        client_reference_id: order.id,
                        shipping_address_collection: {
                            allowed_countries: Array.from(allowedCountries) as any,
                        },
                        shipping_options: stripeShippingOptions as any, // Cast for Stripe Type
                        payment_intent_data: {
                            application_fee_amount: Math.round(itemsTotal * 100 * feePercent), // Application fee based on itemsTotal
                            transfer_data: {
                                destination: tenant.stripe_connect_id,
                            },
                        },
                        metadata: {
                            tenant_id: tenantId,
                            order_id: order.id,
                            customerName: customerDetails?.name
                        },
                    }, {
                        stripeAccount: tenant.stripe_connect_id,
                    })

                    return NextResponse.json({ url: session.url })

                } catch (error: any) {
                    console.error('Stripe Connect Checkout error:', error)
                    return new NextResponse(`Checkout Error: ${error.message}`, { status: 500 })
                }
            }
