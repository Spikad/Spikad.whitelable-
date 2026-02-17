'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/ui/ImageUploader'
import PricingTable from '@/components/dashboard/PricingTable'

interface SettingsFormProps {
    tenant: {
        id: string
        name: string
        primary_color: string
        secondary_color: string
        logo_url: string | null
        subscription_status: string | null
        stripe_connect_id?: string | null
        charges_enabled?: boolean | null
    }
    updateAction: (formData: FormData) => Promise<void>
}

export default function SettingsForm({ tenant, updateAction }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [logoUrl, setLogoUrl] = useState(tenant.logo_url || '')

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        if (logoUrl) {
            formData.append('logo_url', logoUrl)
        }

        try {
            await updateAction(formData)
            alert('Settings saved successfully!')
        } catch (error) {
            console.error(error)
            alert('Failed to save settings')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
                    <div className="space-y-8 divide-y divide-gray-200">
                        <div>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                                <div className="sm:col-span-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">General Information</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        This information will be displayed publicly on your storefront.
                                    </p>
                                </div>

                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Store Logo</label>
                                    <div className="mt-1">
                                        <ImageUploader
                                            onUploadComplete={setLogoUrl}
                                            defaultValue={logoUrl}
                                            path="logos"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Store Name
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            defaultValue={tenant.name}
                                            required
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">
                                        Primary Brand Color
                                    </label>
                                    <div className="mt-1 flex items-center">
                                        <input
                                            type="color"
                                            name="primary_color"
                                            id="primary_color"
                                            defaultValue={tenant.primary_color}
                                            className="h-9 w-14 rounded-md border border-gray-300 p-1 bg-white"
                                        />
                                        <span className="ml-2 text-sm text-gray-500">{tenant.primary_color}</span>
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="secondary_color" className="block text-sm font-medium text-gray-700">
                                        Secondary Brand Color
                                    </label>
                                    <div className="mt-1 flex items-center">
                                        <input
                                            type="color"
                                            name="secondary_color"
                                            id="secondary_color"
                                            defaultValue={tenant.secondary_color}
                                            className="h-9 w-14 rounded-md border border-gray-300 p-1 bg-white"
                                        />
                                        <span className="ml-2 text-sm text-gray-500">{tenant.secondary_color}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Payouts & Payments</h2>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-medium text-gray-900">Stripe Connection</p>
                                    <p className="text-sm text-gray-500">Connect your bank account to receive payments.</p>
                                </div>
                                {tenant.charges_enabled ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Connected
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Not Connected
                                    </span>
                                )}
                            </div>

                            {!tenant.charges_enabled && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
                                            if (!res.ok) throw new Error('Failed to start onboarding')
                                            const data = await res.json()
                                            if (data.url) window.location.href = data.url
                                        } catch (e) {
                                            console.error(e)
                                            alert('Failed to start onboarding')
                                        }
                                    }}
                                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Connect Stripe
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="pt-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription</h2>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-medium text-gray-900">Current Plan</p>
                                    <p className="text-sm text-gray-500 capitalize">{tenant.subscription_status || 'Free Trial'}</p>
                                </div>
                                {tenant.subscription_status === 'active' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {tenant.subscription_status ? tenant.subscription_status : 'No Plan'}
                                    </span>
                                )}
                            </div>

                            {tenant.subscription_status !== 'active' ? (
                                <PricingTable currentStatus={tenant.subscription_status || undefined} />
                            ) : (
                                <div className="mt-4">
                                    <p className="text-gray-600 mb-4">You are currently on the Pro Plan. Thank you for your support!</p>
                                    <form action={async () => {
                                        const { createCustomerPortalSession } = await import('@/actions/stripe')
                                        await createCustomerPortalSession()
                                    }}>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                                        >
                                            Manage Subscription
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6">
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-rose-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
