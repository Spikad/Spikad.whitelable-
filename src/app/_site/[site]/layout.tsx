import { getTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import StorefrontLayoutWrapper from '@/components/storefront/StorefrontLayoutWrapper'
import SubscriptionGate from '@/components/storefront/SubscriptionGate'

export default async function SiteLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ site: string }>
}) {
    const { site } = await params
    const tenant = await getTenant(site)

    if (!tenant) {
        notFound()
    }

    return (
        <div
            className="min-h-screen font-sans antialiased"
            style={{
                // @ts-ignore
                '--primary': tenant.primary_color || '#e11d48', // rose-600
                '--secondary': tenant.secondary_color || '#000000',
            }}
        >
            <SubscriptionGate status={tenant.subscription_status}>
                <StorefrontLayoutWrapper tenantId={tenant.id}>
                    {children}
                </StorefrontLayoutWrapper>
            </SubscriptionGate>
        </div>
    )
}
