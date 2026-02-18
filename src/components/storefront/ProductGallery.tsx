'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
    images: string[]
}

export default function ProductGallery({ images }: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    if (!images || images.length === 0) {
        return (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                No Image
            </div>
        )
    }

    return (
        <div className="flex flex-col-reverse gap-4 md:flex-row">
            {/* Thumbnails (Left side on desktop, bottom on mobile) */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:w-24 min-w-[6rem] px-1 pb-1 md:px-0">
                {images.map((image, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedIndex(idx)}
                        className={cn(
                            "relative aspect-square w-20 md:w-full flex-shrink-0 rounded-md overflow-hidden border-2 transition-all",
                            selectedIndex === idx ? "border-black shadow-md ring-1 ring-black/5" : "border-transparent hover:border-gray-300"
                        )}
                    >
                        <img
                            src={image}
                            alt={`Product thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 aspect-square relative bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                <img
                    src={images[selectedIndex]}
                    alt="Product main image"
                    className="w-full h-full object-cover object-center"
                />
            </div>
        </div>
    )
}
