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
        product_type?: 'physical' | 'service' | 'digital'
        service_settings?: {
            duration_minutes: number
            buffer_time_minutes: number
        }
        seo_title?: string | null
        seo_description?: string | null
        tags?: string[] | null
    }
    action: (formData: FormData) => Promise<any>
}

export default function ProductForm({ product, action }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [productType, setProductType] = useState<'physical' | 'service' | 'digital'>(product?.product_type || 'physical')

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

        // Parse tags from input string to JSON array
        const tagsInput = formData.get('tags_input') as string
        if (tagsInput) {
            const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
            formData.append('tags', JSON.stringify(tagsArray))
        } else {
            formData.append('tags', '[]')
        }

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

                        {/* Product Type */}
                        <div className="sm:col-span-3">
                            <label htmlFor="product_type" className="block text-sm font-medium text-gray-700">
                                Product Type
                            </label>
                            <div className="mt-1">
                                <select
                                    id="product_type"
                                    name="product_type"
                                    defaultValue={product?.product_type || 'physical'}
                                    onChange={(e) => setProductType(e.target.value as 'physical' | 'service')}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                >
                                    <option value="physical">Physical Product</option>
                                    <option value="service">Service / Booking</option>
                                    <option value="digital">Digital Download</option>
                                </select>
                            </div>
                        </div>

                        {/* Service Settings (Conditional) */}
                        {productType === 'service' && (
                            <>
                                <div className="sm:col-span-3">
                                    <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">
                                        Duration (Minutes)
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="number"
                                            name="duration_minutes"
                                            id="duration_minutes"
                                            min="1"
                                            defaultValue={product?.service_settings?.duration_minutes || 60}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">How long the appointment lasts.</p>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="buffer_time_minutes" className="block text-sm font-medium text-gray-700">
                                        Buffer Time (Minutes)
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="number"
                                            name="buffer_time_minutes"
                                            id="buffer_time_minutes"
                                            min="0"
                                            defaultValue={product?.service_settings?.buffer_time_minutes || 0}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Rest time between appointments.</p>
                                </div>
                            </>
                        )}

                        {/* Image Gallery */}
                        <div className="sm:col-span-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Images
                            </label>
                            <MultiImageUploader
                                path="products"
                                defaultImages={images}
                                onImagesChange={setImages}
                            />
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

                        {/* Tags */}
                        <div className="sm:col-span-6">
                            <label htmlFor="tags_input" className="block text-sm font-medium text-gray-700">
                                Tags
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="tags_input"
                                    id="tags_input"
                                    placeholder="Comma separated tags (e.g. Summer, Sale, New)"
                                    defaultValue={product?.tags?.join(', ') || ''}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        {/* SEO Title */}
                        <div className="sm:col-span-6">
                            <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700">
                                SEO Title
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="seo_title"
                                    id="seo_title"
                                    defaultValue={product?.seo_title || ''}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        {/* SEO Description */}
                        <div className="sm:col-span-6">
                            <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700">
                                SEO Description
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="seo_description"
                                    name="seo_description"
                                    rows={2}
                                    defaultValue={product?.seo_description || ''}
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
                        className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </div>
        </form>
    )
}
