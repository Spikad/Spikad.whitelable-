'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { TrendingUp, Users, DollarSign } from 'lucide-react'

interface MetricsData {
  monthlyRevenue: number
  activeTenantsCount: number
  totalSignups: number
  revenueData: Array<{ day: string; revenue: number }>
  conversionRate: number
}

export default function AnalyticsPanel() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const supabase = await createClient()

        // Get current month revenue
        const now = new Date()
        const { data: monthlyData, error: monthlyErr } = await supabase.rpc('get_monthly_revenue', {
          p_tenant: 'ALL', // Would need to aggregate across all tenants
          p_year: now.getFullYear(),
          p_month: now.getMonth() + 1
        })

        if (monthlyErr) throw monthlyErr

        // Get total tenants
        const { count: tenantCount, error: tenantErr } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })

        if (tenantErr) throw tenantErr

        // Get total profiles (signups)
        const { count: profileCount, error: profileErr } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (profileErr) throw profileErr

        // Get revenue trend (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const { data: orders, error: ordersErr } = await supabase
          .from('orders')
          .select('created_at, total_amount')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .in('status', ['paid', 'processing', 'shipped', 'delivered', 'completed'])

        if (ordersErr) throw ordersErr

        // Aggregate revenue by day
        const revenueByDay: Record<string, number> = {}
        orders?.forEach((order: any) => {
          const day = new Date(order.created_at).toLocaleDateString()
          revenueByDay[day] = (revenueByDay[day] || 0) + (order.total_amount || 0)
        })

        const revenueData = Object.entries(revenueByDay).map(([day, revenue]) => ({
          day,
          revenue
        }))

        // Calculate conversion rate (orders / all profiles)
        const conversionRate = profileCount ? ((orders?.length || 0) / profileCount) * 100 : 0

        setMetrics({
          monthlyRevenue: monthlyData || 0,
          activeTenantsCount: tenantCount || 0,
          totalSignups: profileCount || 0,
          revenueData: revenueData.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()),
          conversionRate
        })
      } catch (err) {
        console.error('Failed to fetch metrics:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue (This Month)</p>
              <p className="text-3xl font-bold text-gray-900">
                ${(metrics?.monthlyRevenue || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Tenants</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.activeTenantsCount || 0}</p>
            </div>
            <Users className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Signups</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.totalSignups || 0}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          <div className="h-64">
            {metrics?.revenueData && metrics.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-gray-900">{metrics?.conversionRate.toFixed(2) || 0}%</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Avg Order Value</span>
              <span className="font-semibold text-gray-900">
                ${metrics && metrics.monthlyRevenue && metrics.revenueData.length
                  ? (metrics.monthlyRevenue / metrics.revenueData.length).toFixed(2)
                  : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Orders</span>
              <span className="font-semibold text-gray-900">{metrics?.revenueData.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Storefronts</span>
              <span className="font-semibold text-gray-900">{metrics?.activeTenantsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
