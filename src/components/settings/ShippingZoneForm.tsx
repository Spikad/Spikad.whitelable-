'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Simplified list of countries for MVP
const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'SE', name: 'Sweden' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
]

export default function ShippingZoneForm({ tenantId, initialData }: { tenantId: string, initialData?: any }) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(initialData?.name || '')
    const [selectedCountries, setSelectedCountries] = useState<string[]>(initialData?.countries || [])

    // Rates State (Local only until saved? Or separate endpoints? 
    // To keep it simple, we will save the Zone first, then redirect to a rates editor? 
    // Actually, let's just handle Zone details here first.)

    // NOTE: For MVP, we will only edit the Zone details (Name + Countries) here.
    // Rates management might be better done directly on the main page or a separate section?
    // Let's stick to Name + Countries for now to get it working.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (initialData) {
                // Update
                const { error } = await supabase
                    .from('shipping_zones')
                    .update({ name, countries: selectedCountries })
                    .eq('id', initialData.id)

                if (error) throw error
            } else {
                // Create
                const { error } = await supabase
                    .from('shipping_zones')
                    .insert({
                        tenant_id: tenantId,
                        name,
                        countries: selectedCountries
                    })

                if (error) throw error
            }

            router.push('/app/settings/shipping')
            router.refresh()
        } catch (error) {
            alert('Error saving zone')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure? This will delete all rates in this zone too.')) return

        const { error } = await supabase
            .from('shipping_zones')
            .delete()
            .eq('id', initialData.id)

        if (!error) {
            router.push('/app/settings/shipping')
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow border border-gray-200">
            {/* Zone Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Zone Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. North America, Europe"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                />
            </div>

            {/* Country Selector (Multi-Select) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Countries</label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                    {COUNTRIES.map((country) => (
                        <label key={country.code} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                                type="checkbox"
                                value={country.code}
                                checked={selectedCountries.includes(country.code)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedCountries([...selectedCountries, country.code])
                                    } else {
                                        setSelectedCountries(selectedCountries.filter(c => c !== country.code))
                                    }
                                }}
                                className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-900">{country.name}</span>
                        </label>
                    ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">Selected: {selectedCountries.join(', ')}</p>
            </div>

            {/* Rates Section (Only visible if Zone exists) */}
            {initialData && (
                <div className="pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Shipping Rates</h3>
                        <button
                            type="button"
                            onClick={() => {
                                // Simple prompt for now, can be a modal later
                                const rateName = prompt('Enter Rate Name (e.g. Standard):')
                                if (!rateName) return
                                const ratePrice = prompt('Enter Price (e.g. 10):')
                                if (!ratePrice) return

                                // Optimistic update or direct server call? Direct call is safer.
                                supabase.from('shipping_rates').insert({
                                    zone_id: initialData.id,
                                    name: rateName,
                                    price: parseFloat(ratePrice),
                                    min_order_price: 0
                                }).then(({ error }) => {
                                    if (error) alert(error.message)
                                    else router.refresh()
                                })
                            }}
                            className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Rate
                        </button>
                    </div>

                    <div className="space-y-3">
                        {initialData.shipping_rates?.map((rate: any) => (
                            <div key={rate.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
                                <div>
                                    <div className="font-medium text-gray-900">{rate.name}</div>
                                    <div className="text-xs text-gray-500">${rate.price}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!confirm('Delete this rate?')) return;
                                        supabase.from('shipping_rates').delete().eq('id', rate.id).then(() => router.refresh())
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {(!initialData.shipping_rates || initialData.shipping_rates.length === 0) && (
                            <p className="text-sm text-gray-500 italic">No rates added yet.</p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {initialData && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Zone
                    </button>
                )}

                <div className="flex space-x-3 ml-auto">
                    <Link
                        href="/app/settings/shipping"
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Zone'}
                    </button>
                </div>
            </div>
        </form>
    )
}
