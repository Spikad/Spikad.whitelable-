'use client'

import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/storefront/CartDrawer'

export default function StorefrontLayoutWrapper({
    children,
    tenantId,
}: {
    children: React.ReactNode
    tenantId: string
}) {
    return (
        <CartProvider>
            {children}
            <CartDrawer tenantId={tenantId} />
        </CartProvider>
    )
}
