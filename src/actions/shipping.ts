'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createShippingProfile(prevState: any, formData: FormData) {
    // Placeholder implementation
    return { message: 'Not implemented' }
}

export async function deleteShippingProfile(id: string) {
    // Placeholder implementation
    return { message: 'Not implemented' }
}

export async function getShippingProfiles(tenantId: string) {
    // Placeholder implementation
    return []
}
