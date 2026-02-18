'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface VariantOption {
    id: string
    name: string
    values: string[]
}

interface VariantSelectorProps {
    options: VariantOption[]
    onSelectionChange: (selection: Record<string, string>) => void
}

export default function VariantSelector({ options, onSelectionChange }: VariantSelectorProps) {
    const [selected, setSelected] = useState<Record<string, string>>({})

    // Initialize defaults (select the first value for each option)
    useEffect(() => {
        if (!options || options.length === 0) return

        const defaults: Record<string, string> = {}
        options.forEach(opt => {
            if (opt.values.length > 0) {
                defaults[opt.name] = opt.values[0]
            }
        })
        setSelected(defaults)
        onSelectionChange(defaults)
    }, [options, onSelectionChange])

    const handleSelect = (optionName: string, value: string) => {
        const newSelection = { ...selected, [optionName]: value }
        setSelected(newSelection)
        onSelectionChange(newSelection)
    }

    if (!options || options.length === 0) return null

    return (
        <div className="space-y-4 my-6">
            {options.map((option) => (
                <div key={option.id}>
                    <h3 className="text-sm font-medium text-gray-900 mb-2 uppercase tracking-wide">
                        {option.name} : <span className="text-gray-500 normal-case">{selected[option.name]}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => (
                            <button
                                key={value}
                                onClick={() => handleSelect(option.name, value)}
                                className={cn(
                                    "px-4 py-2 text-sm border rounded-full transition-all min-w-[3rem]",
                                    selected[option.name] === value
                                        ? "border-black bg-black text-white shadow-md transform scale-105"
                                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                                )}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
