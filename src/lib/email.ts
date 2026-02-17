import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SendEmailParams = {
    to: string
    subject: string
    react: React.ReactElement | null // Allow null for text fallback
    html?: string // Add direct HTML support
    tenantId?: string
    templateName: string
}

export async function sendEmail({ to, subject, react, html, tenantId, templateName }: SendEmailParams) {
    try {
        const payload: any = {
            from: 'Spikad <onboarding@resend.dev>',
            to,
            subject,
        }

        if (react) {
            payload.react = react
        } else if (html) {
            payload.html = html
        } else {
            payload.text = 'Notification from Spikad' // Fallback
        }

        const data = await resend.emails.send(payload)

        if (data.error) {
            console.error('Resend error:', data.error)
            await logEmail(to, subject, templateName, 'failed', data.error.message, tenantId)
            return { success: false, error: data.error }
        }

        await logEmail(to, subject, templateName, 'sent', null, tenantId)
        return { success: true, data }

    } catch (error) {
        console.error('Send email error:', error)
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        await logEmail(to, subject, templateName, 'failed', errorMsg, tenantId)
        return { success: false, error }
    }
}

async function logEmail(
    recipient: string,
    subject: string,
    templateName: string,
    status: 'sent' | 'failed',
    error: string | null,
    tenantId?: string
) {
    try {
        await supabaseAdmin.from('email_logs').insert({
            tenant_id: tenantId,
            recipient,
            subject,
            template_name: templateName,
            status,
            error,
        })
    } catch (logError) {
        console.error('Failed to log email:', logError)
    }
}
