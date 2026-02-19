import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import { Button } from '@/components/ui/button'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*, tenants(*)').eq('id', user.id).single()
    if (!profile?.tenants) redirect('/onboarding')

    const tenant = profile.tenants

    // Fetch Deep Analytics Data
    const today = new Date()
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30))

    const [
        { data: dailyRevenue },
        { data: topProducts },
        { count: ordersCount },
        { count: productsCount },
        { count: customersCount } // Assuming we have customers/profiles linked
    ] = await Promise.all([
        supabase.rpc('get_daily_revenue', {
            p_tenant_id: tenant.id,
            p_start_date: thirtyDaysAgo.toISOString(),
            p_end_date: today.toISOString()
        }),
        supabase.rpc('get_top_products', { p_tenant_id: tenant.id }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true }) // Placeholder for now
    ])

    const totalRevenue = dailyRevenue?.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0) || 0

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/app">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>
                    <p className="text-gray-500">Deep dive into your store's performance.</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">+20.1% from last month</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-gray-500">Orders</p>
                        <ShoppingBag className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">+{ordersCount}</div>
                    <p className="text-xs text-gray-500">+180.1% from last month</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-gray-500">Products</p>
                        <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">{productsCount}</div>
                    <p className="text-xs text-gray-500">+19% from last month</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-gray-500">Active Now</p>
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-gray-500">+201 since last hour</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-medium mb-4">Revenue Overview</h3>
                    <DashboardCharts revenueData={dailyRevenue || []} topProducts={[]} />
                </div>
                <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-medium mb-4">Top Products</h3>
                    <div className="space-y-4">
                        {topProducts?.map((product: any) => (
                            <div key={product.id} className="flex items-center">
                                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                    {product.title.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{product.title}</p>
                                    <p className="text-xs text-gray-500">{product.sold_count || 0} sold</p>
                                </div>
                                <div className="ml-auto font-medium">+${product.revenue || 0}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
