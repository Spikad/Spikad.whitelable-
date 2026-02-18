import { getTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CartTrigger from '@/components/storefront/CartTrigger'

export default async function AboutPage({
    params,
}: {
    params: Promise<{ site: string }>
}) {
    const { site } = await params
    const decodedSite = decodeURIComponent(site)
    const tenant = await getTenant(decodedSite)

    if (!tenant) return notFound()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header (Duplicate of Home for consistency - normally would extract to Layout or Component) */}
            <header
                className="bg-white shadow-sm"
                style={{ borderTop: `4px solid ${tenant.primary_color}` }}
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-gray-900">
                        {tenant.name}
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            About
                        </Link>
                        <CartTrigger primaryColor={tenant.primary_color} />
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">About Us</h1>

                    <div className="prose prose-lg text-gray-600 whitespace-pre-line">
                        {tenant.about_page_content ? (
                            tenant.about_page_content
                        ) : (
                            <p className="italic text-gray-400">
                                This store hasn't written their story yet.
                            </p>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t">
                        <Link href="/" className="text-rose-600 font-medium hover:text-rose-700 transition">
                            &larr; Back to Store
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
                <div className="container mx-auto px-4 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} {tenant.name}. Powered by Spikad.
                </div>
            </footer>
        </div>
    )
}
