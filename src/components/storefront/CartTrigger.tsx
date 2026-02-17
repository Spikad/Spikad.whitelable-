'use client'

import { useCart } from '@/context/CartContext'
import { ShoppingBag } from 'lucide-react'

export default function CartTrigger({ primaryColor }: { primaryColor: string }) {
    const { openCart, totalItems } = useCart()

    return (
        <button
            onClick={openCart}
            className="p-2 rounded-full hover:bg-gray-100 relative transition"
        >
            <ShoppingBag className="w-6 h-6 text-gray-600" />
            {totalItems > 0 && (
                <span
                    className="absolute top-0 right-0 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                >
                    {totalItems}
                </span>
            )}
        </button>
    )
}
