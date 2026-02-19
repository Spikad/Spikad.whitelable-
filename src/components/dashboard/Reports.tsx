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
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, Download } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

interface MerchantMetrics {
  monthlyRevenue: number
  orderCount: number
  avgOrderValue: number
  customerLTV: number
  revenueData: Array<{ day: string; revenue: number }>
  topProducts: Array<{ product_name: string; total_sold: number; total_revenue: number }>
}

export default function Reports({ tenantId }: { tenantId: string }) {
  const [metrics, setMetrics] = useState<MerchantMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [dateEnd, setDateEnd] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [chartType, setChartType] = useState<'day' | 'week'>('day')
  const [viewType, setViewType] = useState<'revenue' | 'topProducts'>('revenue')

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const supabase = await createClient()

        const startDate = new Date(dateStart)
        const endDate = new Date(dateEnd)
        endDate.setHours(23, 59, 59, 999)

        // Monthly revenue (overall)
        const now = new Date()
        const { data: monthlyRevenue } = await supabase.rpc('get_monthly_revenue', {
          p_tenant: tenantId,
          p_year: now.getFullYear(),
          p_month: now.getMonth() + 1
        })

        // Customer LTV
        const { data: ltv } = await supabase.rpc('get_customer_ltv', {
          p_tenant: tenantId
        })

        // Orders in date range
        const { data: orders, error: ordersErr } = await supabase
          .from('orders')
          .select('created_at, total_amount')
          .eq('tenant_id', tenantId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .in('status', ['paid', 'processing', 'completed'])

        if (ordersErr) throw ordersErr

        // Revenue aggregation by day or week
        const revenueByPeriod: Record<string, number> = {}
        orders?.forEach((order: any) => {
          const orderDate = new Date(order.created_at)
          let key: string
          if (chartType === 'week') {
            const weekStart = new Date(orderDate)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay())
            key = format(weekStart, 'MMM dd')
          } else {
            key = format(orderDate, 'MMM dd')
          }
          revenueByPeriod[key] = (revenueByPeriod[key] || 0) + (order.total_amount || 0)
        })

        const revenueData = Object.entries(revenueByPeriod)
          .map(([period, revenue]) => ({ day: period, revenue }))
          .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())

        // Top products
        const { data: topProducts, error: tpErr } = await supabase.rpc('get_top_products', {
          p_tenant: tenantId,
          p_limit: 5
        })

        if (tpErr) throw tpErr

        const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0

        setMetrics({
          monthlyRevenue: monthlyRevenue || 0,
          orderCount: orders?.length || 0,
          avgOrderValue: orders && orders.length > 0 ? totalRevenue / orders.length : 0,
          customerLTV: ltv || 0,
          revenueData,
          topProducts: topProducts || []
        })
      } catch (err) {
        console.error('Failed to fetch metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [tenantId, dateStart, dateEnd, chartType])

  const exportCSV = () => {
    if (!metrics) return

    let csv = 'Report Export\n\n'
    csv += `Generated: ${new Date().toLocaleString()}\n`
    csv += `Date Range: ${dateStart} to ${dateEnd}\n\n`

    // KPIs
    csv += 'Key Metrics\n'
    csv += `Monthly Revenue,${metrics.monthlyRevenue.toFixed(2)}\n`
    csv += `Order Count,${metrics.orderCount}\n`
    csv += `Average Order Value,${metrics.avgOrderValue.toFixed(2)}\n`
    csv += `Customer LTV,${metrics.customerLTV.toFixed(2)}\n\n`

    // Revenue data
    csv += 'Revenue by Period\n'
    csv += 'Date,Revenue\n'
    metrics.revenueData.forEach(row => {
      csv += `${row.day},${row.revenue.toFixed(2)}\n`
    })

    csv += '\nTop Products\n'
    csv += 'Product,Quantity Sold,Total Revenue\n'
    metrics.topProducts.forEach(p => {
      csv += `${p.product_name},${p.total_sold},${p.total_revenue?.toFixed(2)}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${dateStart}_to_${dateEnd}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as 'day' | 'week')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">Loading reports...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                ${metrics?.monthlyRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 }) || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Total Orders (Period)</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.orderCount || 0}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ${metrics?.avgOrderValue.toFixed(2) || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Customer LTV</p>
              <p className="text-3xl font-bold text-gray-900">
                ${metrics?.customerLTV.toFixed(2) || 0}
              </p>
            </div>
          </div>

          {/* Charts and Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewType('revenue')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewType === 'revenue'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setViewType('revenue')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewType === 'revenue'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>
              <div className="h-64">
                {metrics?.revenueData && metrics.revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.revenueData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip formatter={(v: any) => `$${v.toFixed(2)}`} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No data for selected period
                  </div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
              <div className="space-y-3">
                {metrics?.topProducts && metrics.topProducts.length > 0 ? (
                  metrics.topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{p.product_name}</p>
                        <p className="text-xs text-gray-500">{p.total_sold} sold</p>
                      </div>
                      <p className="font-bold text-gray-900">${p.total_revenue?.toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No product data for selected period</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
