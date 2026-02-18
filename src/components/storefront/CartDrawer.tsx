'use client'

import { useCart } from '@/context/CartContext'
import { X, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ShippingProfile {
    id: string
    name: string
    price: number
    free_over_amount: number | null
}

export default function CartDrawer({ tenantId }: { tenantId: string }) {
    const { items, removeItem, updateQuantity, isCartOpen, closeCart } = useCart()
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [shippingProfiles, setShippingProfiles] = useState<ShippingProfile[]>([])
    const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)

    // Filter items for this tenant only
    const tenantItems = useMemo(() => {
        return items.filter(item => item.tenant_id === tenantId)
    }, [items, tenantId])

    // Calculate total for this tenant
    const cartTotal = useMemo(() => {
        return tenantItems.reduce((total, item) => total + item.price * item.quantity, 0)
    }, [tenantItems])

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
                    items: tenantItems, // Only send items for this tenant
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

        } catch (error: any) {
            console.error(error)
            alert(`Checkout failed: ${error.message}`)
            setIsCheckingOut(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"
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
                    <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {tenantItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
                            <p>Your cart is empty.</p>
                        </div>
                    ) : (
                        tenantItems.map((item) => (
                            <div key={item.cartItemId} className="flex gap-4 group">
                                <div className="h-24 w-24 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden relative border border-gray-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-gray-300">
                                            <ShoppingBag className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-gray-900 line-clamp-1">{item.title}</h3>
                                            <button
                                                onClick={() => removeItem(item.cartItemId)}
                                                className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Variant Display */}
                                        {item.variants && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {Object.entries(item.variants).map(([key, val]) => (
                                                    <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {key}: {val}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-gray-900 font-medium text-sm mt-1">${item.price}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center border rounded-md">
                                            <button
                                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                                className="p-1 hover:bg-gray-50 text-gray-500"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="px-3 text-sm font-medium w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                                className="p-1 hover:bg-gray-50 text-gray-500"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout */}
                {tenantItems.length > 0 && (
                    <div className="border-t p-4 bg-gray-50">
                        {/* Shipping Selection */}
                        {shippingProfiles.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <Truck className="w-4 h-4 mr-1" /> Shipping Method
                                </p>
                                <div className="space-y-2">
                                    {shippingProfiles.map(profile => (
                                        <label key={profile.id} className={cn(
                                            "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                                            selectedShippingId === profile.id ? "border-black bg-white ring-1 ring-black" : "border-gray-200 bg-white hover:bg-gray-50"
                                        )}>
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="shipping"
                                                    checked={selectedShippingId === profile.id}
                                                    onChange={() => setSelectedShippingId(profile.id)}
                                                    className="mr-3 h-4 w-4 text-black border-gray-300 focus:ring-black"
                                                />
                                                <span className="text-sm font-medium">{profile.name}</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {profile.free_over_amount && cartTotal >= profile.free_over_amount
                                                    ? <span className="text-green-600">FREE</span>
                                                    : `$${profile.price}`
                                                }
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-gray-900">
                                <span>Total</span>
                                <span>${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <form onSubmit={handleCheckout} className="space-y-3">
                            <input
                                name="name"
                                required
                                placeholder="Full Name"
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-shadow"
                            />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="Email Address"
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-shadow"
                            />
                            <button
                                type="submit"
                                disabled={isCheckingOut}
                                className="w-full bg-black text-white py-3.5 rounded-lg font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-black/10"
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
