import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check } from 'lucide-react'

export default async function PlansPage() {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 2. Tenant Check
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) {
        redirect('/onboarding') // Go back if no tenant created yet
    }

    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', profile.tenant_id).single()

    // 3. Plans Definition
    const plans = [
        {
            name: 'Free',
            price: '0',
            frequency: '/month',
            description: 'Perfect for getting started.',
            features: [
                'Unlimited Products',
                'Platform Subdomain (skarpast.spikad.ai)',
                '5-7% Transaction Fee',
                'Basic Analytics',
            ],
            cta: 'Start for Free',
            primary: false,
            action: async () => {
                'use server'
                // Ensure Plan Type is Free (Default)
                // Redirect to Dashboard
                redirect('/app')
            }
        },
        {
            name: 'Growth',
            price: '29',
            frequency: '/month',
            description: 'For growing brands.',
            features: [
                'Custom Domain (mystore.com)',
                '3% Transaction Fee',
                'Advanced Analytics',
                'Priority Support',
            ],
            cta: 'Upgrade to Growth',
            primary: true,
            // Stripe Price ID would be needed here
        },
        {
            name: 'Pro',
            price: '79',
            frequency: '/month',
            description: 'For scaling businesses.',
            features: [
                'Custom Domain',
                '1% Transaction Fee',
                'White-glove Support',
                'API Access',
            ],
            cta: 'Upgrade to Pro',
            primary: false,
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Choose your plan
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Start for free, upgrade when you grow.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative flex flex-col bg-white rounded-2xl shadow-sm border ${plan.primary ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-200'} p-6`}>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                                <p className="mt-4 flex items-baseline text-gray-900">
                                    <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                                    <span className="ml-1 text-xl font-semibold text-gray-500">{plan.frequency}</span>
                                </p>
                                <p className="mt-6 text-gray-500">{plan.description}</p>

                                <ul role="list" className="mt-6 space-y-4">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                                            <span className="ml-3 text-gray-500">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8">
                                {plan.name === 'Free' ? (
                                    <form action={plan.action}>
                                        <button type="submit" className="block w-full bg-gray-800 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900">
                                            {plan.cta}
                                        </button>
                                    </form>
                                ) : (
                                    <button disabled className="block w-full bg-rose-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-rose-700 opacity-50 cursor-not-allowed" title="Integration Pending">
                                        {plan.cta}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 text-center">
                    <Link href="/app" className="text-sm text-gray-500 hover:text-gray-900">
                        Skip for now (Start Free) &rarr;
                    </Link>
                </div>
            </div>
        </div>
    )
}
