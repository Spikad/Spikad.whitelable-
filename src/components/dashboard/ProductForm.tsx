'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MultiImageUploader from '@/components/ui/MultiImageUploader'
import VariantEditor, { VariantOption } from '@/components/dashboard/VariantEditor'

interface ProductFormProps {
    product?: {
        id: string
        title: string
        description: string | null
        price: number
        // Legacy support and new schema
        image_url?: string | null
        images?: any
        stock_quantity: number
        is_active: boolean
        category?: string | null
        options?: any
    }
    action: (formData: FormData) => Promise<any>
}

export default function ProductForm({ product, action }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Initialize Images: Use 'images' array if available, fallback to legacy 'image_url', or empty
    const initialImages = product?.images && Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : product?.image_url ? [product.image_url] : []

    const [images, setImages] = useState<string[]>(initialImages)

    // Initialize Options/Variants
    const initialOptions = product?.options && Array.isArray(product.options)
        ? product.options as VariantOption[]
        : []

    const [options, setOptions] = useState<VariantOption[]>(initialOptions)


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)

        // Append complex data as JSON strings
        formData.append('images', JSON.stringify(images))
        formData.append('options', JSON.stringify(options))

        // Fallback for legacy systems: use the first image as the main image_url
        if (images.length > 0) {
            formData.append('image_url', images[0])
        }

        try {
            const result = await action(formData)
            if (result && !result.success && result.error) {
                alert(result.error)
                console.error(result.error)
            }
        } catch (error) {
            console.error(error)
            alert('An unexpected error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
            <div className="space-y-8 divide-y divide-gray-200">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Product Details</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        This information will be displayed publicly on your store.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 pl-4">

                        {/* Image Gallery */}
                        <div className="sm:col-span-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (Gallery)</label>
                            <MultiImageUploader
                                onImagesChange={setImages}
                                defaultImages={images}
                                path="products"
                            />
                            <p className="mt-2 text-xs text-gray-500">The first image will be the main cover.</p>
                        </div>

                        {/* Title */}
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

                        {/* Category */}
                        <div className="sm:col-span-2">
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                Category
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="category"
                                    id="category"
                                    placeholder="e.g. Mens, Shoes, Sale"
                                    defaultValue={product?.category || ''}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        {/* Description */}
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

                        {/* Price */}
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

                        {/* Stock */}
                        <div className="sm:col-span-2">
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                                Total Stock
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

                <div className="pt-8">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Options & Variants</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Add options like Size or Color.
                    </p>
                    <div className="mt-6">
                        <VariantEditor
                            defaultOptions={options}
                            onOptionsChange={setOptions}
                        />
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
                        {loading ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </div>
        </form>
    )
}
