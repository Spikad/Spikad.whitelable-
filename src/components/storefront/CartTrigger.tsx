'use client'

import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function CartTrigger({ primaryColor, tenantId }: { primaryColor: string, tenantId: string }) {
    const { items, openCart } = useCart()

    const itemCount = items
        .filter(item => item.tenant_id === tenantId)
        .reduce((total, item) => total + item.quantity, 0)

    return (
        <button
            onClick={openCart}
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
        >
            <ShoppingBag className="h-6 w-6 text-gray-700" />
            {itemCount > 0 && (
                <span
                    className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: primaryColor || '#000' }}
                >
                    {itemCount}
                </span>
            )}
        </button>
    )
}
