'use client'

import { useCart } from '@/context/CartContext'
import { ShoppingBag } from 'lucide-react'

interface AddToCartButtonProps {
    product: {
        id: string
        title: string
        price: number
        image_url: string | null
        tenant_id: string
    }
    color?: string
}

export default function AddToCartButton({ product, color = '#000000' }: AddToCartButtonProps) {
    const { addItem } = useCart()

    return (
        <button
            onClick={() => addItem(product)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition hover:opacity-90 flex items-center"
            style={{ backgroundColor: color }}
        >
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            Add to Cart
        </button>
    )
}
