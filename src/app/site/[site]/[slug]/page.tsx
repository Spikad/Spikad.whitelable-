import { getTenant } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageRenderer from '@/components/storefront/PageRenderer'

export default async function DynamicPage({
    params,
}: {
    params: Promise<{ site: string; slug: string }>
}) {
    const { site, slug } = await params
    const tenant = await getTenant(site)

    if (!tenant) return notFound()

    const supabase = await createClient()

    // Fetch the page
    const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

    if (!page) {
        console.log(`Page not found: ${slug} for tenant ${tenant.id}`)
        return notFound()
    }

    // Fetch sections
    const { data: sections } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_id', page.id)
        .order('sort_order')

    return (
        <div className="min-h-screen bg-white">
            {/* Header is handled by layout.tsx */}
            <main>
                <PageRenderer sections={sections || []} primaryColor={tenant.primary_color} />
            </main>
        </div>
    )
}
