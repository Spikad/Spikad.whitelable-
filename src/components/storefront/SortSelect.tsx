'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function SortSelect() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentSort = searchParams.get('sort') || 'newest'

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sort = e.target.value
        const params = new URLSearchParams(searchParams.toString())
        params.set('sort', sort)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-500 whitespace-nowrap">Sort by:</label>
            <select
                id="sort"
                value={currentSort}
                onChange={handleSortChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-200 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-lg bg-transparent"
            >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
            </select>
        </div>
    )
}
