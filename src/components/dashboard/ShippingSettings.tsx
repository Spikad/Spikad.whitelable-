'use client'

import { useState } from 'react'
import { createShippingProfile, deleteShippingProfile } from '@/actions/shipping'
import { Trash2, Plus } from 'lucide-react'

interface ShippingProfile {
    id: string
    name: string
    price: number
    free_over_amount: number | null
}

export default function ShippingSettings({ profiles }: { profiles: ShippingProfile[] }) {
    const [isAdding, setIsAdding] = useState(false)

    return (
        <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="font-medium text-gray-900">Shipping Rates</p>
                    <p className="text-sm text-gray-500">Configure delivery options for your customers.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-black hover:bg-gray-800"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Rate
                </button>
            </div>

            <div className="space-y-3">
                {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                        <div>
                            <p className="font-medium text-gray-900">{profile.name}</p>
                            <p className="text-sm text-gray-500">
                                ${profile.price}
                                {profile.free_over_amount && ` (Free over $${profile.free_over_amount})`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => deleteShippingProfile(profile.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {profiles.length === 0 && !isAdding && (
                    <p className="text-sm text-gray-400 italic">No shipping rates configured.</p>
                )}

                {isAdding && (
                    <form action={async (formData) => {
                        await createShippingProfile(null, formData)
                        setIsAdding(false)
                    }} className="bg-white p-4 rounded-md border border-gray-200 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Rate Name</label>
                            <input name="name" required placeholder="e.g. Standard Shipping" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm border p-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Price ($)</label>
                                <input name="price" type="number" step="0.01" required placeholder="0.00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm border p-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Free Over ($) (Optional)</label>
                                <input name="free_over_amount" type="number" step="0.01" placeholder="Optional" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm border p-2" />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 bg-black text-white text-xs rounded-md">Save Rate</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
