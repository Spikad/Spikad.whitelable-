import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Package, DollarSign, ShoppingBag } from 'lucide-react'
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
                </div >

        {/* Revenue Card (Placeholder) */ }
        < div className = "bg-white overflow-hidden shadow rounded-lg" >
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
                </div >
            </div >

        {/* Quick Actions / Recent Activity Placeholder */ }
        < div className = "mt-8" >
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
            </div >
        </div >
    )
}
