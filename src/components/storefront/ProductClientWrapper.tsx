'use client'

import { useState } from 'react'
import VariantSelector, { VariantOption } from '@/components/storefront/VariantSelector'
import AddToCartButton from '@/components/storefront/AddToCartButton'

interface ProductClientWrapperProps {
    product: any
    options: VariantOption[]
    primaryColor: string
}

export default function ProductClientWrapper({ product, options, primaryColor }: ProductClientWrapperProps) {
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

    return (
        <div>
            <VariantSelector
                options={options}
                onSelectionChange={setSelectedVariants}
            />

            <div className="mt-8">
                <AddToCartButton
                    product={product}
                    color={primaryColor}
                    selectedVariants={selectedVariants}
                    // Disable if options exist but nothing selected (VariantSelector handles init, so theoretically safe, but good fallback)
                    disabled={options.length > 0 && Object.keys(selectedVariants).length === 0}
                />
            </div>
        </div>
    )
}
