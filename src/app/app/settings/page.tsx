import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/dashboard/SettingsForm'
import ShippingSettings from '@/components/dashboard/ShippingSettings'
import AuditLogViewer from '@/components/dashboard/AuditLogViewer'
import { getShippingProfiles } from '@/actions/shipping'
import { getAuditLogs } from '@/actions/security'
import { revalidatePath } from 'next/cache'

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile?.tenant_id) {
        redirect('/onboarding')
    }

    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', profile.tenant_id).single()

    async function updateSettings(formData: FormData) {
        'use server'

        const supabase = await createClient()
        const name = formData.get('name') as string
        const primaryColor = formData.get('primary_color') as string
        const secondaryColor = formData.get('secondary_color') as string
        const logoUrl = formData.get('logo_url') as string
        const heroTitle = formData.get('hero_title') as string
        const heroSubtitle = formData.get('hero_subtitle') as string
        const heroImageUrl = formData.get('hero_image_url') as string
        const heroBgColor = formData.get('hero_bg_color') as string
        const fontFamily = formData.get('font_family') as string
        const buttonRadius = formData.get('button_radius') as string
        const aboutPageContent = formData.get('about_page_content') as string

        const { data: updatedTenant } = await supabase.from('tenants').update({
            name,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            logo_url: logoUrl,
            hero_title: heroTitle,
            hero_subtitle: heroSubtitle,
            hero_image_url: heroImageUrl,
            hero_bg_color: heroBgColor,
            font_family: fontFamily,
            button_radius: buttonRadius,
            about_page_content: aboutPageContent,
        })
            .eq('id', profile.tenant_id)
            .select('slug, custom_domain')
            .single()

        revalidatePath('/app/settings')

        // Revalidate Storefront Paths
        if (updatedTenant) {
            // Revalidate the generic site path
            revalidatePath(`/site/${updatedTenant.slug}`)
            revalidatePath(`/site/${updatedTenant.slug}/about`)

            // If custom domain exists
            if (updatedTenant.custom_domain) {
                revalidatePath(`/site/${updatedTenant.custom_domain}`)
                revalidatePath(`/site/${updatedTenant.custom_domain}/about`)
            }

            // Also revalidate the root layout where variables are injected
            revalidatePath(`/site/${updatedTenant.slug}`, 'layout')
        }
    }

    const shippingProfiles = await getShippingProfiles(tenant.id)

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Store Settings</h1>
            <div className="space-y-8">
                <SettingsForm tenant={tenant} updateAction={updateSettings} />
                <ShippingSettings profiles={shippingProfiles} />
                <AuditLogViewer logs={await getAuditLogs(tenant.id)} />
            </div>
        </div>
    )
}
