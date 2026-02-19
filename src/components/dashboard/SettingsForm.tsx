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
        hero_title?: string | null
        hero_subtitle?: string | null
        hero_image_url?: string | null
        hero_bg_color?: string | null
        font_family?: string | null
        button_radius?: string | null
        about_page_content?: string | null
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

                    {/* 1. General Info */}
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
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Store Name</label>
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
                            </div>
                        </div>
                    </div>

                    {/* 2. Visual Theme Editor */}
                    <div className="pt-8">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Visual Theme</h3>
                            <p className="mt-1 text-sm text-gray-500">Customize the look and feel of your store.</p>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                            <div className="sm:col-span-3">
                                <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">Primary Color</label>
                                <div className="mt-1 flex items-center">
                                    <input
                                        type="color"
                                        name="primary_color"
                                        id="primary_color"
                                        defaultValue={tenant.primary_color}
                                        className="h-9 w-14 rounded-md border border-gray-300 p-1 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="secondary_color" className="block text-sm font-medium text-gray-700">Secondary Color</label>
                                <div className="mt-1 flex items-center">
                                    <input
                                        type="color"
                                        name="secondary_color"
                                        id="secondary_color"
                                        defaultValue={tenant.secondary_color}
                                        className="h-9 w-14 rounded-md border border-gray-300 p-1 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="font_family" className="block text-sm font-medium text-gray-700">Font Family</label>
                                <select
                                    id="font_family"
                                    name="font_family"
                                    defaultValue={tenant.font_family || 'Inter'}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                >
                                    <option value="Inter">Modern (Inter)</option>
                                    <option value="Playfair Display">Luxury (Playfair)</option>
                                    <option value="Montserrat">Bold (Montserrat)</option>
                                    <option value="Lato">Friendly (Lato)</option>
                                </select>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="button_radius" className="block text-sm font-medium text-gray-700">Button Style</label>
                                <select
                                    id="button_radius"
                                    name="button_radius"
                                    defaultValue={tenant.button_radius || 'rounded-md'}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                >
                                    <option value="rounded-none">Sharp (Square)</option>
                                    <option value="rounded-md">Soft (Rounded)</option>
                                    <option value="rounded-full">Playful (Pill)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Hero Section Editor */}
                    <div className="pt-8">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Hero Section</h3>
                            <p className="mt-1 text-sm text-gray-500">The first thing customers see on your home page.</p>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Hero Image</label>
                                <div className="mt-1">
                                    <ImageUploader
                                        onUploadComplete={(url) => {
                                            const input = document.getElementById('hero_image_url_input') as HTMLInputElement
                                            if (input) input.value = url
                                        }}
                                        defaultValue={tenant.hero_image_url || ''}
                                        path="banners"
                                    />
                                    <input type="hidden" name="hero_image_url" id="hero_image_url_input" defaultValue={tenant.hero_image_url || ''} />
                                </div>
                            </div>

                            <div className="sm:col-span-4">
                                <label htmlFor="hero_title" className="block text-sm font-medium text-gray-700">Headline</label>
                                <input
                                    type="text"
                                    name="hero_title"
                                    id="hero_title"
                                    defaultValue={tenant.hero_title || `Welcome to ${tenant.name}`}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <label htmlFor="hero_subtitle" className="block text-sm font-medium text-gray-700">Subtitle</label>
                                <input
                                    type="text"
                                    name="hero_subtitle"
                                    id="hero_subtitle"
                                    defaultValue={tenant.hero_subtitle || 'Browse our latest collection.'}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="hero_bg_color" className="block text-sm font-medium text-gray-700">Background Color</label>
                                <div className="mt-1 flex items-center">
                                    <input
                                        type="color"
                                        name="hero_bg_color"
                                        id="hero_bg_color"
                                        defaultValue={tenant.hero_bg_color || '#000000'}
                                        className="h-9 w-14 rounded-md border border-gray-300 p-1 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. About Page */}
                    <div className="pt-8">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">About Page</h3>
                            <p className="mt-1 text-sm text-gray-500">Tell your story.</p>
                        </div>
                        <div className="mt-6">
                            <label htmlFor="about_page_content" className="block text-sm font-medium text-gray-700">Content</label>
                            <div className="mt-1">
                                <textarea
                                    id="about_page_content"
                                    name="about_page_content"
                                    rows={6}
                                    defaultValue={tenant.about_page_content || ''}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                    placeholder="Write your brand story here..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Payments & Subscription (Existing Code) */}
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
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
