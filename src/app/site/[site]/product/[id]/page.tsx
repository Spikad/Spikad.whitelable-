import { getTenant } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ProductGallery from '@/components/storefront/ProductGallery'
import VariantSelector, { VariantOption } from '@/components/storefront/VariantSelector'
import AddToCartButton from '@/components/storefront/AddToCartButton'
import RelatedProducts from '@/components/storefront/RelatedProducts'
import CartTrigger from '@/components/storefront/CartTrigger'
import ProductClientWrapper from '@/components/storefront/ProductClientWrapper'

export default async function ProductPage({
    params,
}: {
    params: Promise<{ site: string; id: string }>
}) {
    const { site, id } = await params
    const decodedSite = decodeURIComponent(site)
    const tenant = await getTenant(decodedSite)

    if (!tenant) return notFound()

    const supabase = await createClient()

    // Fetch Product
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single()

    if (!product) return notFound()

    // Fetch Related Products (Same category, exclude current)
    let relatedProducts: any[] = []
    if (product.category) {
        const { data: related } = await supabase
            .from('products')
            .select('id, title, price, image_url, description')
            .eq('tenant_id', tenant.id)
            .eq('category', product.category)
            .neq('id', product.id)
            .limit(4)

        if (related) relatedProducts = related
    }

    // Determine images for gallery
    // Fallback: use product.image_url if images array is empty
    const galleryImages = product.images && Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : product.image_url ? [product.image_url] : []

    // Parse options
    const options: VariantOption[] = Array.isArray(product.options) ? product.options : []

    return (
        <div className="min-h-screen bg-gray-50">
            <header
                className="bg-white shadow-sm sticky top-0 z-40"
                style={{ borderTop: `4px solid ${tenant.primary_color}` }}
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
                        {tenant.logo_url ? (
                            <img
                                src={tenant.logo_url}
                                alt={tenant.name}
                                className="h-8 w-auto object-contain"
                            />
                        ) : (
                            <span>{tenant.name}</span>
                        )}
                    </Link>
                    <div className="flex items-center space-x-4">
                        <CartTrigger primaryColor={tenant.primary_color} tenantId={tenant.id} />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Breadcrumb / Back */}
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to store
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                        {/* Left: Gallery */}
                        <div>
                            <ProductGallery images={galleryImages} />
                        </div>

                        {/* Right: Details */}
                        <div>
                            {product.category && (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded uppercase tracking-wide mb-3">
                                    {product.category}
                                </span>
                            )}

                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>

                            <div className="text-2xl font-medium text-gray-900 mb-6">
                                ${product.price}
                            </div>

                            <div className="prose prose-sm text-gray-500 mb-8 max-w-none">
                                <p>{product.description}</p>
                            </div>

                            {/* Variant Selector & Add to Cart Logic */}
                            {/* We use a Client Wrapper to handle state (selected variants) */}
                            <ProductClientWrapper
                                product={product}
                                options={options}
                                primaryColor={tenant.primary_color}
                            />

                        </div>
                    </div>

                    {/* Related Products */}
                    <RelatedProducts products={relatedProducts} siteId={site} />
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 mt-12 py-8">
                <div className="container mx-auto px-4 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} {tenant.name}. Powered by Spikad.
                </div>
            </footer>
        </div>
    )
}
