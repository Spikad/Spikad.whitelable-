'use client'

import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function AddToCartButton({
    product,
    color
}: {
    product: any;
    color: string
}) {
    const { addItem } = useCart()

    const handleAddToCart = () => {
        addItem({
            id: product.id,
            title: product.title,
            price: product.price,
            image_url: product.image_url,
            tenant_id: product.tenant_id
        })
    }

    return (
        <button
            onClick={handleAddToCart}
            className="flex items-center justify-center rounded-lg px-4 py-2 font-bold text-white transition hover:opacity-90 active:scale-95"
            style={{ backgroundColor: color || '#000' }}
        >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Add
        </button>
    )
}
