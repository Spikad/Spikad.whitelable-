import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BlogManager from '@/components/dashboard/BlogManager'

export default async function BlogPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) redirect('/onboarding')

    return (
        <div className="h-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Blog Manager</h1>
            <BlogManager tenantId={profile.tenant_id} />
        </div>
    )
}
