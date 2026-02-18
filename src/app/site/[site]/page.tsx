import { getTenant } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import AddToCartButton from '@/components/storefront/AddToCartButton'
import CartTrigger from '@/components/storefront/CartTrigger'

export default async function TenantPage({
    params,
}: {
    params: Promise<{ site: string }>
}) {
    const { site } = await params
    console.log('[TenantPage] Loading for site:', site) // DEBUG LOG

    // Decode if needed (just in case)
    const decodedSite = decodeURIComponent(site)
    const tenant = await getTenant(decodedSite)

    console.log('[TenantPage] Found tenant:', tenant ? tenant.slug : 'null') // DEBUG LOG

    if (!tenant) return notFound()

    // Fetch Products for this Tenant
    const supabase = await createClient()
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Dynamic Header */}
            <header
                className="bg-white shadow-sm"
                style={{ borderTop: `4px solid ${tenant.primary_color}` }}
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-gray-900">
                        {tenant.name}
                    </Link>
                    <div className="flex items-center space-x-4">
                        <CartTrigger primaryColor={tenant.primary_color} />
                    </div>
                </div>
            </header>

            {/* Hero / Products Grid */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-12 rounded-2xl overflow-hidden relative min-h-[400px] flex items-center justify-center text-center"
                    style={{
                        backgroundColor: tenant.hero_bg_color || '#000000',
                        backgroundImage: tenant.hero_image_url ? `url(${tenant.hero_image_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40" />

                    <div className="relative z-10 max-w-2xl px-6 py-12 text-white">
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-lg">
                            {tenant.hero_title || `Welcome to ${tenant.name}`}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-100 font-medium drop-shadow-md">
                            {tenant.hero_subtitle || 'Browse our latest collection.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products?.map((product) => (
                        <div key={product.id} className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
                            <div className="aspect-square bg-gray-100 relative">
                                {/* Image would go here */}
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-900 mb-1">{product.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900">${product.price}</span>
                                    <AddToCartButton product={product} color={tenant.primary_color} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {(!products || products.length === 0) && (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            <p>No products available yet.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12 py-8">
                <div className="container mx-auto px-4 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} {tenant.name}. Powered by Spikad.
                </div>
            </footer>
        </div>
    )
}
