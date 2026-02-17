'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardSubscriptionGate({
    status,
    children,
}: {
    status: string | null
    children: React.ReactNode
}) {
    // If no status or valid status, let them through (for now)
    // Trialing, active, past_due (allow but warn)

    if (status === 'canceled' || status === 'unpaid') {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-red-100 p-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Subscription Inactive</h2>
                <p className="mt-2 text-gray-600 max-w-md">
                    Your subscription has been canceled or payment failed. Please update your billing information to continue using Spikad.
                </p>
                <Link
                    href="/app/settings"
                    className="mt-6 rounded-lg bg-rose-600 px-6 py-2 text-white font-bold hover:bg-rose-700 transition"
                >
                    Manage Subscription
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {status === 'past_due' && (
                <div className="bg-yellow-50 px-4 py-2 text-sm text-yellow-800 border-b border-yellow-200">
                    <span className="font-bold">Payment Past Due:</span> Please update your payment method to avoid interruption.
                </div>
            )}
            {children}
        </div>
    )
}
