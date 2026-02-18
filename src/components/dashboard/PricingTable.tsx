'use client'

import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PricingTable({
    currentStatus
}: {
    currentStatus?: string
}) {
    // Shared plan structure (keep in sync with plans/page.tsx)
    const plans = [
        {
            name: 'Free',
            price: '0',
            frequency: '/month',
            description: 'Perfect for getting started.',
            features: [
                'Unlimited Products',
                'Platform Subdomain',
                '5-7% Transaction Fee',
                'Basic Analytics',
            ],
            cta: 'Current Plan',
            primary: false,
            disabled: true, // Cannot downgrade easily here yet, or already on it
        },
        {
            name: 'Growth',
            price: '29',
            frequency: '/month',
            description: 'For growing brands.',
            features: [
                'Custom Domain',
                '3% Transaction Fee',
                'Advanced Analytics',
                'Priority Support',
            ],
            cta: 'Upgrade to Growth',
            primary: true,
            action: async () => {
                alert('Stripe Subscription Integration Pending')
                // Call server action to create Checkout Session
            }
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
            action: async () => {
                alert('Stripe Subscription Integration Pending')
            }
        }
    ]

    return (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                        <button
                            onClick={plan.action}
                            disabled={plan.disabled}
                            className={`block w-full border border-transparent rounded-md py-2 text-sm font-semibold text-center 
                                ${plan.disabled ? 'bg-gray-100 text-gray-400 cursor-default' :
                                    plan.primary ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-gray-800 text-white hover:bg-gray-900'}`}
                        >
                            {plan.cta}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
