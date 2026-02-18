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

    const isCustomDomain = !site.endsWith(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'spikad.ai')

    // Font Logic
    const fontMap: Record<string, string> = {
        'Inter': 'Inter',
        'Playfair Display': 'Playfair+Display',
        'Montserrat': 'Montserrat',
        'Lato': 'Lato',
    }

    const fontFamily = tenant.font_family || 'Inter'
    const fontUrlParam = fontMap[fontFamily] || 'Inter'
    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontUrlParam}:wght@400;700&display=swap`

    // Radius Logic
    const radiusMap: Record<string, string> = {
        'rounded-none': '0px',
        'rounded-md': '0.5rem',
        'rounded-full': '9999px',
    }
    const radius = radiusMap[tenant.button_radius || 'rounded-md'] || '0.5rem'

    return (
        <div
            className="min-h-screen font-sans antialiased"
            style={{
                fontFamily: `"${fontFamily}", sans-serif`,
                // @ts-ignore
                '--primary': tenant.primary_color || '#e11d48', // rose-600
                '--secondary': tenant.secondary_color || '#000000',
                '--radius': radius,
            }}
        >
            <link rel="stylesheet" href={googleFontsUrl} />

            <SubscriptionGate
                status={tenant.subscription_status}
                planType={tenant.plan_type}
                isCustomDomain={isCustomDomain}
            >
                <StorefrontLayoutWrapper tenantId={tenant.id}>
                    {children}
                </StorefrontLayoutWrapper>
            </SubscriptionGate>
        </div>
    )
}
