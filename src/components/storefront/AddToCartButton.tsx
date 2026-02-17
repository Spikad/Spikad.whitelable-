'use client'

import { ShoppingBag } from 'lucide-react'

export default function AddToCartButton({
    product,
    color
}: {
    product: any;
    color: string
}) {
    return (
        <button
            onClick={() => alert(`Added ${product.title} to cart!`)}
            className="flex items-center justify-center rounded-lg px-4 py-2 font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: color || '#000' }}
        >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Add
        </button>
    )
}
