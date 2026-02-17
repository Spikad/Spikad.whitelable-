'use client'

import { useCart } from '@/context/CartContext'
import { X, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShippingProfile {
    id: string
    name: string
    price: number
    free_over_amount: number | null
}

export default function CartDrawer({ tenantId }: { tenantId: string }) {
    const { items, removeItem, updateQuantity, cartTotal, isCartOpen, closeCart, clearCart } = useCart()
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [shippingProfiles, setShippingProfiles] = useState<ShippingProfile[]>([])
    const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)

    // Fetch shipping profiles when cart opens
    useEffect(() => {
        if (isCartOpen && tenantId) {
            const fetchShipping = async () => {
                const supabase = createClient()
                const { data } = await supabase.from('shipping_profiles').select('*').eq('tenant_id', tenantId).order('price')
                if (data) {
                    setShippingProfiles(data)
                    if (data.length > 0) setSelectedShippingId(data[0].id)
                }
            }
            fetchShipping()
        }
    }, [isCartOpen, tenantId])

    if (!isCartOpen) return null

    // Calculate Shipping Cost
    const selectedProfile = shippingProfiles.find(p => p.id === selectedShippingId)
    let shippingCost = 0
    if (selectedProfile) {
        if (selectedProfile.free_over_amount && cartTotal >= selectedProfile.free_over_amount) {
            shippingCost = 0
        } else {
            shippingCost = selectedProfile.price
        }
    }

    const finalTotal = cartTotal + shippingCost

    const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsCheckingOut(true)

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const email = formData.get('email') as string

        try {
            const res = await fetch('/api/stripe/connect/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items,
                    tenantId,
                    customerDetails: { name, email },
                    successUrl: window.location.origin + '/success',
                    cancelUrl: window.location.href,
                    shippingProfileId: selectedShippingId
                }),
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg)
            }

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            }

        } catch (error) {
            console.error(error)
            alert('Checkout failed. Please try again.')
            setIsCheckingOut(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white shadow-xl h-full flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold flex items-center">
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Your Cart
                    </h2>
                    <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
                            <p>Your cart is empty.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="h-20 w-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {item.image_url && <img src={item.image_url} alt={item.title} className="object-cover w-full h-full" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                                    <p className="text-gray-500 text-sm">${item.price}</p>

                                    <div className="flex items-center mt-2 gap-3">
                                        <div className="flex items-center border rounded-md">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-1 hover:bg-gray-50"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="px-2 text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-1 hover:bg-gray-50"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 p-1 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout */}
                {items.length > 0 && (
                    <div className="border-t p-4 bg-gray-50">
                        {/* Shipping Selection */}
                        {shippingProfiles.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <Truck className="w-4 h-4 mr-1" /> Shipping Method
                                </p>
                                <div className="space-y-2">
                                    {shippingProfiles.map(profile => (
                                        <label key={profile.id} className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="shipping"
                                                    checked={selectedShippingId === profile.id}
                                                    onChange={() => setSelectedShippingId(profile.id)}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm font-medium">{profile.name}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {profile.free_over_amount && cartTotal >= profile.free_over_amount
                                                    ? <span className="text-green-600 font-bold">FREE</span>
                                                    : `$${profile.price}`
                                                }
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mb-2 text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-4 font-semibold text-lg">
                            <span>Total</span>
                            <span>${finalTotal.toFixed(2)}</span>
                        </div>

                        <form onSubmit={handleCheckout} className="space-y-3">
                            <input
                                name="name"
                                required
                                placeholder="Full Name"
                                className="w-full p-2 border rounded text-sm"
                            />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="Email Address"
                                className="w-full p-2 border rounded text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isCheckingOut}
                                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
                            >
                                {isCheckingOut ? 'Processing...' : 'Checkout Now'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
