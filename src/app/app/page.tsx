import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react'

export default function DashboardPage() {
    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value="$45,231.89" icon={DollarSign} trend="+20.1% from last month" />
                <StatCard title="Orders" value="+2350" icon={ShoppingBag} trend="+180.1% from last month" />
                <StatCard title="Products" value="12" icon={Activity} trend="+19% from last month" />
                <StatCard title="Active Now" value="+573" icon={Users} trend="+201 since last hour" />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900">Recent Sales</h3>
                    <p className="text-sm text-gray-500">You made 265 sales this month.</p>
                    <div className="mt-4 h-64 bg-gray-50 flex items-center justify-center text-gray-400">
                        [Chart Placeholder]
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                    <p className="text-sm text-gray-500">Latest transactions.</p>
                    <div className="mt-4 space-y-4">
                        <OrderItem name="Olivia Martin" email="olivia.martin@email.com" amount="$1,999.00" />
                        <OrderItem name="Jackson Lee" email="jackson.lee@email.com" amount="$39.00" />
                        <OrderItem name="Isabella Nguyen" email="isabella.nguyen@email.com" amount="$299.00" />
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

function OrderItem({ name, email, amount }: { name: string, email: string, amount: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="h-9 w-9 rounded-full bg-gray-100" />
                <div>
                    <p className="text-sm font-medium leading-none">{name}</p>
                    <p className="text-xs text-gray-500">{email}</p>
                </div>
            </div>
            <div className="font-medium">{amount}</div>
        </div>
    )
}
