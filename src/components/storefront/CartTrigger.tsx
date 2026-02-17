'use client'

import { ShoppingBag } from 'lucide-react'

export default function CartTrigger({ primaryColor }: { primaryColor: string }) {
    return (
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
            <ShoppingBag className="h-6 w-6 text-gray-700" />
            <span
                className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: primaryColor || '#000' }}
            >
                0
            </span>
        </button>
    )
}
