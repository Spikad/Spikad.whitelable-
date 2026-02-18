'use client'

import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function AddToCartButton({
    product,
    color,
    selectedVariants,
    disabled = false
}: {
    product: any;
    color: string;
    selectedVariants?: Record<string, string>;
    disabled?: boolean;
}) {
    const { addItem } = useCart()

    const handleAddToCart = () => {
        console.log('[AddToCart] Adding item:', {
            productId: product.id,
            title: product.title,
            tenant_id: product.tenant_id,
            variants: selectedVariants
        })
        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            image_url: product.image_url,
            tenant_id: product.tenant_id,
            variants: selectedVariants
        })
    }

    return (
        <button
            onClick={handleAddToCart}
            disabled={disabled}
            className="flex items-center justify-center rounded-lg px-6 py-3 font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
            style={{ backgroundColor: color || '#000' }}
        >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Add to Cart
        </button>
    )
}
