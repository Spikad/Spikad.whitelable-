import { createClient } from '@/lib/supabase/server'
import { Users, Store, Activity, Database } from 'lucide-react'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Fetch Stats
    const { count: tenantCount } = await supabase.from('tenants').select('*', { count: 'exact', head: true })

    // Simulated stats for now as we don't have orders/users heavily populated
    const userCount = 12 // Placeholder
    const revenue = "$1,203.00" // Placeholder

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Platform Overview</h1>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Tenants" value={tenantCount?.toString() || "0"} icon={Store} trend="+1 this week" />
                <StatCard title="Total Users" value={userCount.toString()} icon={Users} trend="+3 this week" />
                <StatCard title="Platform Revenue" value={revenue} icon={Database} trend="+12% MRR" />
                <StatCard title="System Health" value="100%" icon={Activity} trend="All systems operational" />
            </div>

            <div className="mt-8">
                <h2 className="mb-4 text-lg font-bold text-gray-900">Recent Tenants</h2>
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* We can reuse the tenant list table here or just show top 5 */}
                    <div className="p-4 text-gray-500 text-sm">
                        View the <a href="/admin/tenants" className="text-orange-600 hover:text-orange-700 font-medium">Tenants page</a> for full details.
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
        </div>
    )
}
