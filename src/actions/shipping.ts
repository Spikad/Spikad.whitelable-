'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createShippingProfile(formData: FormData) {
    const supabase = await createClient()

    // Get current user's tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) throw new Error('No tenant found')

    const name = formData.get('name') as string
    const price = parseFloat(formData.get('price') as string)
    const freeOverRaw = formData.get('free_over_amount') as string
    const free_over_amount = freeOverRaw ? parseFloat(freeOverRaw) : null

    const { error } = await supabase.from('shipping_profiles').insert({
        tenant_id: profile.tenant_id,
        name,
        price,
        free_over_amount,
    })

    if (error) {
        console.error('Create shipping error:', error)
        throw new Error('Failed to create shipping profile')
    }

    revalidatePath('/app/settings')
}

export async function deleteShippingProfile(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('shipping_profiles').delete().eq('id', id)

    if (error) {
        throw new Error('Failed to delete profile')
    }

    revalidatePath('/app/settings')
}

export async function getShippingProfiles(tenantId: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('shipping_profiles').select('*').eq('tenant_id', tenantId).order('price')
    return data || []
}
