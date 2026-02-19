import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageEditor from '@/components/dashboard/PageEditor'

export default async function PagesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) redirect('/onboarding')

    return (
        <div className="h-[calc(100vh-theme(spacing.32))]">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Storefront Pages</h1>
                <p className="text-gray-500">Create and manage your specific landing pages and content.</p>
            </div>
            <PageEditor tenantId={profile.tenant_id} />
        </div>
    )
}
