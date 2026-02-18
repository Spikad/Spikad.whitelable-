import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Globe, Package, Trash2, ArrowLeft } from 'lucide-react'

export default async function ShippingSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) redirect('/onboarding')

    // Fetch Zones
    const { data: zones } = await supabase
        .from('shipping_zones')
        .select(`
            *,
            shipping_rates (*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: true })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/app/settings" className="p-2 rounded-full hover:bg-gray-100 transition">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Shipping & Delivery</h1>
                        <p className="text-gray-500">Manage how you ship your products to customers.</p>
                    </div>
                </div>
                <Link
                    href="/app/settings/shipping/new"
                    className="flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Shipping Zone
                </Link>
            </div>

            <div className="bg-white shadow rounded-xl divide-y divide-gray-200 overflow-hidden">
                {(!zones || zones.length === 0) ? (
                    <div className="p-12 text-center">
                        <Globe className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No shipping zones</h3>
                        <p className="mt-1 text-sm text-gray-500">Start by creating a zone (e.g. "Domestic" or "Europe").</p>
                        <div className="mt-6">
                            <Link
                                href="/app/settings/shipping/new"
                                className="inline-flex items-center rounded-md border border-transparent bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700"
                            >
                                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                Create Zone
                            </Link>
                        </div>
                    </div>
                ) : (
                    zones.map((zone) => (
                        <div key={zone.id} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Globe className="h-5 w-5 text-gray-400 mr-2" />
                                    <h3 className="text-lg font-medium text-gray-900">{zone.name}</h3>
                                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {zone.countries?.length || 0} Countries
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Link
                                        href={`/app/settings/shipping/${zone.id}`}
                                        className="text-sm text-rose-600 hover:text-rose-900 font-medium"
                                    >
                                        Edit Zone
                                    </Link>
                                </div>
                            </div>

                            {/* Rates List */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                {zone.shipping_rates?.length === 0 ? (
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>No rates added yet. Customers in this zone will not be able to checkout!</span>
                                        <Link href={`/app/settings/shipping/${zone.id}`} className="text-rose-600 hover:text-rose-800">Add Rate</Link>
                                    </div>
                                ) : (
                                    zone.shipping_rates?.map((rate: any) => (
                                        <div key={rate.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                                            <div className="flex items-center">
                                                <Package className="h-4 w-4 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{rate.name}</div>
                                                    {rate.min_order_price > 0 && (
                                                        <div className="text-xs text-gray-500">Free over ${rate.min_order_price}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">
                                                ${rate.price}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
