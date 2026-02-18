import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShippingZoneForm from '@/components/settings/ShippingZoneForm'

export default async function NewShippingZonePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) redirect('/onboarding')

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Add Shipping Zone</h1>
                <p className="text-gray-500">Create a new shipping region.</p>
            </div>
            <ShippingZoneForm tenantId={profile.tenant_id} />
        </div>
    )
}
