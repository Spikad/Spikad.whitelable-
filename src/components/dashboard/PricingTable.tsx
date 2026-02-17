'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export default function PricingTable({
    currentStatus,
}: {
    currentStatus?: string
}) {
    const [loading, setLoading] = useState(false)

    const handleSubscribe = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_placeholder',
                }),
            })
            const { url } = await res.json()
            if (url) {
                window.location.href = url
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-200 sm:mt-8 lg:mx-0 lg:flex lg:max-w-none">
            <div className="p-8 sm:p-10 lg:flex-auto">
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">Pro Membership</h3>
                <p className="mt-6 text-base leading-7 text-gray-600">
                    Unlock the full power of Spikad. Create unlimited products, customize your storefront, and remove transaction fees.
                </p>
                <div className="mt-10 flex items-center gap-x-4">
                    <h4 className="flex-none text-sm font-semibold leading-6 text-rose-600">What’s included</h4>
                    <div className="h-px flex-auto bg-gray-100" />
                </div>
                <ul role="list" className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6">
                    {[
                        'Unlimited Products',
                        'Custom Domain Support',
                        'Advanced Analytics',
                        'Priority Support',
                    ].map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                            <Check className="h-6 w-5 flex-none text-rose-600" aria-hidden="true" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
                <div className="rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                    <div className="mx-auto max-w-xs px-8">
                        <p className="text-base font-semibold text-gray-600">Monthly Check</p>
                        <p className="mt-6 flex items-baseline justify-center gap-x-2">
                            <span className="text-5xl font-bold tracking-tight text-gray-900">$29</span>
                            <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">USD</span>
                        </p>
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="mt-10 block w-full rounded-md bg-rose-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Subscribe Now'}
                        </button>
                        <p className="mt-6 text-xs leading-5 text-gray-600">
                            Invoices and receipts available for easy company reimbursement
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
