'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
    categories: string[]
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentCategory = searchParams.get('category') || 'all'

    const handleCategoryChange = (category: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (category === 'all') {
            params.delete('category')
        } else {
            params.set('category', category)
        }
        params.delete('page') // Reset pagination
        router.push(`?${params.toString()}`, { scroll: false })
    }

    // Add 'All' to the beginning if not present
    const uniqueCategories = ['all', ...categories.filter(c => c !== 'all')]

    return (
        <div className="flex flex-wrap gap-2">
            {uniqueCategories.map((category) => (
                <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                        currentCategory === category || (category === 'all' && !searchParams.get('category'))
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    )}
                >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
            ))}
        </div>
    )
}
