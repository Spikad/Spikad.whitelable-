import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Truck, DollarSign, ExternalLink } from 'lucide-react'

export default async function DashboardOverview() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    if (!profile?.tenant_id) {
        redirect('/onboarding')
    }

    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', profile.tenant_id).single()

    // Fetch Stats
    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

    const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <a
                    href={`https://${tenant.slug}.spikad.ai`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-rose-600 hover:text-rose-700 font-medium"
                >
                    Visit Store <ExternalLink className="ml-1 h-4 w-4" />
                </a>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* Products Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShoppingBag className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">{productCount || 0}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <Link href="/app/products" className="font-medium text-rose-600 hover:text-rose-500">
                                View all
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Truck className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">{orderCount || 0}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <Link href="/app/orders" className="font-medium text-rose-600 hover:text-rose-500">
                                View all
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Revenue Card (Placeholder) */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">$0.00</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="text-gray-500">Coming soon</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                        href="/app/products/new"
                        className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                    >
                        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                        <span className="mt-2 block text-sm font-medium text-gray-900">Add a new product</span>
                    </Link>
                    <Link
                        href="/app/settings"
                        className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                    >
                        <span className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center text-2xl font-bold">⚙️</span>
                        <span className="mt-2 block text-sm font-medium text-gray-900">Configure Store Settings</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
