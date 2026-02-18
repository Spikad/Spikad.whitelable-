'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

interface Product {
    id: string
    title: string
    price: number
    image_url: string | null
    description: string | null
}

export default function RelatedProducts({ products, siteId }: { products: Product[], siteId: string }) {
    if (!products || products.length === 0) return null

    return (
        <div className="mt-16 border-t border-gray-100 pt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You might also like</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                    <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="group block"
                    >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative border border-gray-100">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ShoppingBag size={32} />
                                </div>
                            )}
                        </div>
                        <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                            {product.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                            ${product.price}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
