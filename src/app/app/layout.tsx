import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSubscriptionGate from '@/components/dashboard/DashboardSubscriptionGate'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    if (!profile?.tenant_id) {
        redirect('/onboarding')
    }

    const { data: tenant } = await supabase.from('tenants').select('subscription_status').eq('id', profile.tenant_id).single()

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <DashboardSubscriptionGate status={tenant?.subscription_status || null}>
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </DashboardSubscriptionGate>
            </div>
        </div>
    )
}
