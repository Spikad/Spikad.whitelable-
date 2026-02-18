import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Package, DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*, tenants(*)').eq('id', user.id).single()
    if (!profile?.tenants) redirect('/onboarding')

    const tenant = profile.tenants

    // Fetch Analytics Data (Parallel)
    const today = new Date()
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30))

    const [
        { data: dailyRevenue },
        { data: topProducts },
        { count: ordersCount },
        { count: productsCount }
    ] = await Promise.all([
        supabase.rpc('get_daily_revenue', {
            p_tenant_id: tenant.id,
            p_start_date: thirtyDaysAgo.toISOString(),
            p_end_date: today.toISOString()
        }),
        supabase.rpc('get_top_products', { p_tenant_id: tenant.id }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id)
    ])

    // Calculate Total Revenue (Simple sum of the daily revenue)
    const totalRevenue = dailyRevenue?.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0) || 0

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile.full_name?.split(' ')[0]} 👋</h1>
                    <p className="text-gray-500">Here's what's happening with <span className="font-semibold text-gray-700">{tenant.name}</span> today.</p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        href={`https://${tenant.custom_domain || tenant.slug + '.' + process.env.NEXT_PUBLIC_ROOT_DOMAIN}`}
                        target="_blank"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        View Store
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="/app/products/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                    >
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Revenue (30d)</p>
                        <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <ShoppingBag className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{ordersCount || 0}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Active Products</p>
                        <p className="text-2xl font-bold text-gray-900">{productsCount || 0}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <DashboardCharts
                revenueData={dailyRevenue || []}
                topProducts={topProducts || []}
            />

            {/* Recent Activity / Steps check */}
            {!tenant.domain_verified && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <ArrowRight className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-blue-900">Next Step: Connect your domain</h3>
                            <p className="mt-1 text-sm text-blue-700 max-w-2xl">
                                Your store is currently live on a subdomain. Connect your own custom domain (e.g. mystore.com) to look professional.
                            </p>
                            <div className="mt-4">
                                <Link href="/app/settings/domains" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                    Connect Domain &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
