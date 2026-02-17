import { AlertTriangle } from 'lucide-react'

export default function SubscriptionGate({
    status,
    children
}: {
    status: string | null
    children: React.ReactNode
}) {
    const isActive = status === 'active' || status === 'trialing'

    if (!isActive) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 mb-6">
                        <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Temporarily Unavailable</h2>
                    <p className="text-gray-600 mb-6">
                        This store is currently inactive. If you are the owner, please update your subscription.
                    </p>
                    <div className="text-sm text-gray-400">
                        Error: SUBSCRIPTION_INACTIVE
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
