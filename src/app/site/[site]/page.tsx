import { getTenant } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import AddToCartButton from '@/components/storefront/AddToCartButton'
import CartTrigger from '@/components/storefront/CartTrigger'
import SearchInput from '@/components/storefront/SearchInput'
import CategoryFilter from '@/components/storefront/CategoryFilter'
import SortSelect from '@/components/storefront/SortSelect'

export default async function TenantPage({
    params,
    searchParams,
}: {
    params: Promise<{ site: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { site } = await params
    const resolvedSearchParams = await searchParams

    // Parse Search Params
    const q = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
    const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : ''
    const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'newest'

    const decodedSite = decodeURIComponent(site)
    const tenant = await getTenant(decodedSite)

    if (!tenant) return notFound()

    const supabase = await createClient()

    // Fetch Products via RPC
    const { data: products, error } = await supabase
        .rpc('get_storefront_products', {
            p_tenant_id: tenant.id,
            p_search_query: q || null,
            p_category: category === 'all' ? null : category || null,
            p_min_price: null,
            p_max_price: null,
            p_sort_by: sort,
            p_page: 1,
            p_page_size: 100 // Fetch plenty for now
        })

    if (error) {
        console.error('Error fetching products:', error)
    }

    // Fetch Unique Categories (for the filter)
    // We can do a separate query to get all categories for this tenant
    const { data: categoriesData } = await supabase
        .from('products')
        .select('category')
        .eq('tenant_id', tenant.id)
        .not('category', 'is', null)

    // Extract unique categories
    const categories = Array.from(new Set(categoriesData?.map(p => p.category).filter(Boolean) as string[])) || []

    return (
        <div className="min-h-screen bg-gray-50">
            <header
                className="bg-white shadow-sm sticky top-0 z-30"
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
                        <CartTrigger primaryColor={tenant.primary_color} />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            {!q && !category && (
                <div className="bg-gray-900 border-b border-gray-200">
                    <div className="container mx-auto px-4 py-16 md:py-24 text-center relative overflow-hidden">
                        {tenant.hero_image_url && (
                            <div
                                className="absolute inset-0 opacity-40 mix-blend-overlay"
                                style={{
                                    backgroundImage: `url(${tenant.hero_image_url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                        )}
                        <div className="relative z-10">
                            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
                                {tenant.hero_title || `Welcome to ${tenant.name}`}
                            </h1>
                            <p className="text-lg md:text-xl text-gray-200 font-medium max-w-2xl mx-auto drop-shadow-sm">
                                {tenant.hero_subtitle || 'Discover our latest collection designed just for you.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-4 py-8">

                {/* Search & Discovery Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <SearchInput />
                    <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                        <CategoryFilter categories={categories} />
                        <div className="hidden md:block w-px h-8 bg-gray-200"></div>
                        <SortSelect />
                    </div>
                </div>

                {/* Results Count */}
                {(q || category) && (
                    <div className="mb-6 text-gray-500">
                        Found {products?.length || 0} results
                        {q && <span> for "<span className="text-black font-semibold">{q}</span>"</span>}
                        {category && <span> in <span className="text-black font-semibold">{category}</span></span>}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products?.map((product) => (
                        <div key={product.id} className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition duration-200 flex flex-col">
                            <Link href={`/product/${product.id}`} className="block relative aspect-square bg-gray-100 overflow-hidden">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ShoppingBag size={48} />
                                    </div>
                                )}
                                {/* Quick add overlay could go here */}
                            </Link>

                            <div className="p-4 flex flex-col flex-grow">
                                <Link href={`/product/${product.id}`} className="block">
                                    <h3 className="font-semibold text-gray-900 mb-1 leading-snug group-hover:text-blue-600 transition-colors">
                                        {product.title}
                                    </h3>
                                </Link>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{product.description}</p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                    <span className="font-bold text-lg text-gray-900">${product.price}</span>
                                    <AddToCartButton product={product} color={tenant.primary_color} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {(!products || products.length === 0) && (
                        <div className="col-span-full py-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 mt-12 py-12">
                <div className="container mx-auto px-4 flex flex-col items-center">
                    {tenant.logo_url && (
                        <img src={tenant.logo_url} alt={tenant.name} className="h-8 opacity-50 mb-4 grayscale" />
                    )}
                    <div className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} {tenant.name}. Powered by <a href="https://spikad.ai" className="hover:text-gray-600 transition-colors">Spikad</a>.
                    </div>
                </div>
            </footer>
        </div>
    )
}
