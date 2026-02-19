import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AffiliateDashboard from '@/components/affiliates/AffiliateDashboard'

export default async function AffiliatesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) redirect('/onboarding')

    return (
        <div className="h-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Affiliate Program</h1>
            <AffiliateDashboard tenantId={profile.tenant_id} />
        </div>
    )
}
