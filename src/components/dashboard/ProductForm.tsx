'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/ui/ImageUploader'

interface ProductFormProps {
    product?: {
        id: string
        title: string
        description: string | null
        price: number
        image_url: string | null
        stock_quantity: number
        is_active: boolean
    }
    action: (formData: FormData) => Promise<void>
}

export default function ProductForm({ product, action }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [imageUrl, setImageUrl] = useState(product?.image_url || '')

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        if (imageUrl) {
            formData.append('image_url', imageUrl)
        }

        try {
            await action(formData)
            // Router refresh handled by server action revalidatePath, but we might redirect client side too
        } catch (error) {
            console.error(error)
            alert('Failed to save product')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
            <div className="space-y-8 divide-y divide-gray-200">
                <div>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 pl-4">

                        <div className="sm:col-span-6">
                            <label className="block text-sm font-medium text-gray-700">Product Image</label>
                            <div className="mt-1">
                                <ImageUploader
                                    onUploadComplete={setImageUrl}
                                    defaultValue={imageUrl}
                                    path="products"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Title
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    defaultValue={product?.title}
                                    required
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    defaultValue={product?.description || ''}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                Price
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    name="price"
                                    id="price"
                                    min="0"
                                    step="0.01"
                                    defaultValue={product?.price}
                                    required
                                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                                Stock
                            </label>
                            <div className="mt-1">
                                <input
                                    type="number"
                                    name="stock_quantity"
                                    id="stock"
                                    min="0"
                                    defaultValue={product?.stock_quantity || 0}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-5">
                <div className="flex justify-end pr-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-rose-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </form>
    )
}
