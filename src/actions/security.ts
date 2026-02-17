'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAuditLogs(tenantId: string) {
    const supabase = await createClient()

    // RLS Policy "Tenant owners can view audit logs" will handle security
    // We just need to filter by tenant_id explicitly to be safe and rigorous
    const { data } = await supabase
        .from('audit_logs')
        .select('*, actor:actor_id(email)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50)

    return data || []
}
