'use client'

import { useState } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'

// Defined types for our Variant structure
export interface VariantOption {
    id: string
    name: string // e.g. "Size", "Color"
    values: string[] // e.g. ["S", "M", "L"]
}

interface VariantEditorProps {
    defaultOptions?: VariantOption[]
    onOptionsChange: (options: VariantOption[]) => void
}

export default function VariantEditor({ defaultOptions = [], onOptionsChange }: VariantEditorProps) {
    const [options, setOptions] = useState<VariantOption[]>(defaultOptions)

    const addOption = () => {
        const newOption: VariantOption = {
            id: crypto.randomUUID(),
            name: '',
            values: []
        }
        const updated = [...options, newOption]
        setOptions(updated)
        onOptionsChange(updated)
    }

    const removeOption = (id: string) => {
        const updated = options.filter(o => o.id !== id)
        setOptions(updated)
        onOptionsChange(updated)
    }

    const updateOptionName = (id: string, name: string) => {
        const updated = options.map(o => o.id === id ? { ...o, name } : o)
        setOptions(updated)
        onOptionsChange(updated)
    }

    const addValueToOption = (optionId: string, value: string) => {
        if (!value.trim()) return
        const updated = options.map(o => {
            if (o.id === optionId && !o.values.includes(value)) {
                return { ...o, values: [...o.values, value] }
            }
            return o
        })
        setOptions(updated)
        onOptionsChange(updated)
    }

    const removeValueFromOption = (optionId: string, valueToRemove: string) => {
        const updated = options.map(o => {
            if (o.id === optionId) {
                return { ...o, values: o.values.filter(v => v !== valueToRemove) }
            }
            return o
        })
        setOptions(updated)
        onOptionsChange(updated)
    }

    return (
        <div className="space-y-4">
            {options.map((option, index) => (
                <div key={option.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                    <button
                        type="button"
                        onClick={() => removeOption(option.id)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid gap-4 mb-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Option Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Size, Color, Material"
                                value={option.name}
                                onChange={(e) => updateOptionName(option.id, e.target.value)}
                                className="block w-full max-w-sm rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm px-3 py-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Option Values
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {option.values.map(val => (
                                    <span key={val} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-white border border-gray-300 text-gray-800">
                                        {val}
                                        <button
                                            type="button"
                                            onClick={() => removeValueFromOption(option.id, val)}
                                            className="ml-1.5 inline-flex flex-shrink-0 h-4 w-4 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500 focus:outline-none"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center max-w-sm">
                                <input
                                    type="text"
                                    placeholder="Add value (e.g. Small)"
                                    className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm px-3 py-2 border"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            addValueToOption(option.id, e.currentTarget.value)
                                            e.currentTarget.value = ''
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm hover:bg-gray-100"
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                        addValueToOption(option.id, input.value)
                                        input.value = ''
                                    }}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Product Option
            </button>
        </div>
    )
}
