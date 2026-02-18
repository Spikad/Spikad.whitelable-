import React, { createContext, useContext, useEffect, useState } from 'react'
// import { toast } from 'sonner' 

export interface CartItem {
    cartItemId: string // Unique ID for this specific line item (includes variants)
    productId: string // Original Product ID
    title: string
    price: number
    image_url: string | null
    quantity: number
    tenant_id: string
    variants?: Record<string, string> // e.g. { Size: "L", Color: "Red" }
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId'> & { variants?: Record<string, string> }) => void
    removeItem: (cartItemId: string) => void
    updateQuantity: (cartItemId: string, quantity: number) => void
    clearCart: () => void
    cartTotal: number
    totalItems: number
    isCartOpen: boolean
    openCart: () => void
    closeCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('spikad_cart')
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart)
                // Migration: Ensure old items have cartItemId & productId
                const migrated = parsed.map((item: any) => ({
                    ...item,
                    cartItemId: item.cartItemId || item.id,
                    productId: item.productId || item.id,
                    variants: item.variants || undefined
                }))
                setItems(migrated)
            } catch (e) {
                console.error('Failed to parse cart', e)
                // Fallback to empty if corrupt
                setItems([])
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to local storage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('spikad_cart', JSON.stringify(items))
        }
    }, [items, isLoaded])

    const addItem = (newItem: Omit<CartItem, 'quantity' | 'cartItemId'> & { variants?: Record<string, string> }) => {
        // Generate a deterministic ID based on Product ID + Variants
        const variantString = newItem.variants
            ? Object.entries(newItem.variants).sort().map(([k, v]) => `${k}:${v}`).join('|')
            : ''

        const generatedCartItemId = `${newItem.productId}-${variantString || 'base'}`

        setItems((prev) => {
            const existingIndex = prev.findIndex((item) => item.cartItemId === generatedCartItemId)

            if (existingIndex > -1) {
                // Update quantity of existing line item
                const newItems = [...prev]
                newItems[existingIndex].quantity += 1
                return newItems
            }

            // Add new line item
            return [...prev, {
                ...newItem,
                cartItemId: generatedCartItemId,
                quantity: 1
            }]
        })
        setIsCartOpen(true)
        // toast.success('Added to cart')
    }

    const removeItem = (cartItemId: string) => {
        setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId))
    }

    const updateQuantity = (cartItemId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(cartItemId)
            return
        }
        setItems((prev) =>
            prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
        )
    }

    const clearCart = () => {
        setItems([])
    }

    const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
    const totalItems = items.reduce((total, item) => total + item.quantity, 0)

    const openCart = () => setIsCartOpen(true)
    const closeCart = () => setIsCartOpen(false)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                cartTotal,
                totalItems,
                isCartOpen,
                openCart,
                closeCart,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
