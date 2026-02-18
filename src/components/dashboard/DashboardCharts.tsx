'use client'

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'

export default function DashboardCharts({
    revenueData,
    topProducts
}: {
    revenueData: any[],
    topProducts: any[]
}) {
    // Format dates for display
    const formattedRevenue = revenueData.map(item => ({
        ...item,
        date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }))

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue (Last 30 Days)</h3>
                <div className="h-64">
                    {formattedRevenue.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            No revenue data yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formattedRevenue}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
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
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f43f5e"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
                <div className="h-64">
                    {topProducts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            No detailed sales data yet
                        </div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto h-full pr-2">
                            {topProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="w-6 text-sm text-gray-400 font-mono">#{i + 1}</span>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{p.product_name}</p>
                                            <p className="text-xs text-gray-500">{p.total_sold} sold</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">
                                        ${p.total_revenue?.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
