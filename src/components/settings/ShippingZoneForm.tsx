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
