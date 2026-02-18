'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce' // We might need to create this hook if it doesn't exist, or just inline it

export default function SearchInput() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initial state from URL
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

    // Debounce the search term to avoid hitting the server on every keystroke
    // If useDebounce doesn't exist, I'll implement a simple useEffect version here

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (searchTerm) {
                params.set('q', searchTerm)
            } else {
                params.delete('q')
            }
            // Reset page to 1 when searching
            params.delete('page')

            router.push(`?${params.toString()}`, { scroll: false })
        }, 500) // 500ms delay

        return () => clearTimeout(timer)
    }, [searchTerm, searchParams, router])

    return (
        <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-black focus:border-black sm:text-sm transition duration-150 ease-in-out"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    )
}
