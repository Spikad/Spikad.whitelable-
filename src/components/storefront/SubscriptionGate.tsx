import { AlertTriangle, Globe } from 'lucide-react'

export default function SubscriptionGate({
    status,
    planType = 'free',
    isCustomDomain = false,
    children
}: {
    status: string | null
    planType?: string
    isCustomDomain?: boolean
    children: React.ReactNode
}) {
    // 1. Free Tier Logic
    // If not a custom domain (i.e. it's a platform subdomain like skarpast.spikad.ai), 
    // we ALWAYS allow access, regardless of subscription status.
    if (!isCustomDomain) {
        return <>{children}</>
    }

    // 2. Custom Domain Logic
    // If it IS a custom domain, we need to check the plan and status.

    // A. Free Plan cannot use Custom Domains
    if (planType === 'free') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-6">
                        <Globe className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Use Custom Domain</h2>
                    <p className="text-gray-600 mb-6">
                        This store is on the Free plan, which does not support custom domains.
                        Please upgrade to Growth or Pro to connect <strong>{typeof window !== 'undefined' ? window.location.hostname : 'this domain'}</strong>.
                    </p>
                    <div className="text-sm text-gray-400">
                        Error: PLAN_RESTRICTION
                    </div>
                </div>
            </div>
        )
    }

    // B. Paid Plans must be Active
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
