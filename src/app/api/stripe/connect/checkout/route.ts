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
        const { items, tenantId, customerDetails, successUrl, cancelUrl } = await req.json()

        if (!items || !tenantId || !items.length) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const supabase = await createServerClient()

        // 1. Get Tenant (and verify Connect Status)
        const { data: tenant } = await supabase
            .from('tenants')
            .select('stripe_connect_id, charges_enabled, name, plan_type, slug, custom_domain')
            .eq('id', tenantId)
            .single()

        if (!tenant?.stripe_connect_id) {
            return new NextResponse('Store is not connected to payments', { status: 400 })
        }
        if (!tenant.charges_enabled) {
            return new NextResponse('Store is not ready to accept payments (Charges Disabled)', { status: 400 })
        }

        // 2. Fetch Products & Calculate Trusted Context
        const productIds = items.map((i: any) => i.id)

        console.log('[Checkout] Verification Start:', {
            tenantId,
            itemCount: items.length,
            productIds
        })

        const { data: products, error: productError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds)
            .eq('tenant_id', tenantId)

        if (productError) {
            console.error('[Checkout] Product Fetch Error:', productError)
        }

        console.log('[Checkout] Products Found:', {
            count: products?.length,
            foundIds: products?.map(p => p.id),
            isActive: products?.map(p => p.is_active)
        })

        if (!products || products.length !== items.length) {
            console.warn('[Checkout] Mismatch detected. Returning 400.')
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

        // 3. Create Service Role Client (for Admin operations)
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

        // 4. Fetch Shipping Rates (Dynamic)
        // Using 'any' cast to avoid TS errors if types aren't perfectly synced yet
        const { data: zones } = await (supabaseAdmin as any)
            .from('shipping_zones')
            .select('*, shipping_rates(*)')
            .eq('tenant_id', tenantId)

        const stripeShippingOptions = []
        const allowedCountries = new Set()

        if (zones && zones.length > 0) {
            for (const zone of zones) {
                // Add countries
                if (zone.countries) {
                    zone.countries.forEach((c: string) => allowedCountries.add(c))
                }
                // Add rates
                if (zone.shipping_rates) {
                    for (const rate of zone.shipping_rates) {
                        if (rate.min_order_price > 0 && itemsTotal < rate.min_order_price) continue;
                        stripeShippingOptions.push({
                            shipping_rate_data: {
                                type: 'fixed_amount',
                                fixed_amount: {
                                    amount: Math.round(rate.price * 100),
                                    currency: 'usd',
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

        // Fallback Shipping
        if (stripeShippingOptions.length === 0) {
            stripeShippingOptions.push({
                shipping_rate_data: {
                    type: 'fixed_amount',
                    fixed_amount: { amount: 1000, currency: 'usd' },
                    display_name: 'Standard Shipping',
                }
            })
            allowedCountries.add('SE'); // Default to Sweden
            allowedCountries.add('US'); // keep US as backup
        }

        // 5. Create Pending Order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                tenant_id: tenantId,
                total_amount: itemsTotal, // Shipping will be added by webhook or final capture
                status: 'pending',
                items: items.map((i: any) => ({ ...i, price: products.find(p => p.id === i.id)?.price })),
            })
            .select()
            .single()

        if (orderError || !order) {
            console.error('Order creation failed:', orderError)
            return new NextResponse('Failed to initialize order', { status: 500 })
        }

        // 6. Calculate Fee
        let feePercent = 0.05
        if (tenant.plan_type === 'growth') feePercent = 0.03
        if (tenant.plan_type === 'pro') feePercent = 0.01

        // 7. Create Stripe Session
        const baseUrl = `https://${tenant.custom_domain || (tenant.slug ? tenant.slug + '.' + process.env.NEXT_PUBLIC_ROOT_DOMAIN : 'localhost:3000')}`

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            success_url: successUrl || `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${baseUrl}/cart`,
            customer_email: customerDetails?.email,
            client_reference_id: order.id,
            shipping_address_collection: {
                allowed_countries: Array.from(allowedCountries) as any,
            },
            shipping_options: stripeShippingOptions as any,
            payment_intent_data: {
                application_fee_amount: Math.round(itemsTotal * 100 * feePercent),
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
