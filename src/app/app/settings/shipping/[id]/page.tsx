import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShippingZoneForm from '@/components/settings/ShippingZoneForm'

export default async function EditShippingZonePage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) redirect('/onboarding')

    // Fetch Zone & Rates
    const { data: zone } = await supabase
        .from('shipping_zones')
        .select(`*, shipping_rates(*)`)
        .eq('id', params.id)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!zone) {
        return <div>Zone not found</div>
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Shipping Zone</h1>
                <p className="text-gray-500">Update rates and countries for this region.</p>
            </div>
            <ShippingZoneForm tenantId={profile.tenant_id} initialData={zone} />
        </div>
    )
}
