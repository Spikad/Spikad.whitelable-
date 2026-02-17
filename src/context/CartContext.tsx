import React, { createContext, useContext, useEffect, useState } from 'react'
// import { toast } from 'sonner' 

export interface CartItem {
    id: string
    title: string
    price: number
    image_url: string | null
    quantity: number
    tenant_id: string
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
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
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error('Failed to parse cart', e)
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

    const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === newItem.id)
            if (existing) {
                return prev.map((item) =>
                    item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...prev, { ...newItem, quantity: 1 }]
        })
        setIsCartOpen(true)
        // toast.success('Added to cart')
    }

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id))
    }

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id)
            return
        }
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
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
