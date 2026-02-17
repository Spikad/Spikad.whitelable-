import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Truck } from 'lucide-react'

export default async function OrdersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    if (!profile?.tenant_id) {
        redirect('/onboarding')
    }

    // Fetch Orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-sm text-gray-500">Manage your customer orders.</p>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {orders?.map((order) => (
                        <li key={order.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-rose-600 truncate">
                                        Order #{order.id.slice(0, 8)}
                                    </p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {order.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                            <Truck className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            {order.customer_email || 'Guest'}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <p>
                                            Total: <span className="font-bold text-gray-900">${order.total_amount}</span>
                                        </p>
                                        <p className="ml-4">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {(!orders || orders.length === 0) && (
                        <li className="px-4 py-12 text-center text-gray-500">
                            No orders yet.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    )
}
