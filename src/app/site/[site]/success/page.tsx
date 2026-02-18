import { getTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default async function SuccessPage({
    params,
    searchParams,
}: {
    params: Promise<{ site: string }>
    searchParams: Promise<{ session_id?: string }>
}) {
    const { site } = await params
    const decodedSite = decodeURIComponent(site)
    const tenant = await getTenant(decodedSite)

    if (!tenant) return notFound()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header
                className="bg-white shadow-sm"
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
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-600 mb-8">
                        Thank you for your purchase. You will receive an email confirmation shortly.
                    </p>

                    <Link
                        href="/"
                        className="inline-block w-full py-3 px-6 rounded-lg font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: tenant.primary_color || '#000' }}
                    >
                        Continue Shopping
                    </Link>
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
