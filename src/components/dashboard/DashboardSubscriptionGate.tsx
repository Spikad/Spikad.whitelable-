'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardSubscriptionGate({
    status,
    children
}: {
    status: string | null
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const isActive = status === 'active' || status === 'trialing'
    const isSettingsPage = pathname === '/app/settings'

    useEffect(() => {
        if (!isActive && !isSettingsPage) {
            router.push('/app/settings')
        }
    }, [isActive, isSettingsPage, router])

    if (!isActive && !isSettingsPage) {
        return null // Prevent flash of content
    }

    // Optionally show a banner if inactive (even on settings page)
    return (
        <>
            {!isActive && (
                <div className="bg-red-600 px-4 py-2 text-white text-center text-sm font-medium">
                    Your subscription is inactive. Please update your payment method to restore full access.
                </div>
            )}
            {children}
        </>
    )
}
