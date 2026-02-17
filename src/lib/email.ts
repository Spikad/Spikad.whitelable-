
export async function sendEmail({
    to,
    subject,
    html,
    react,
    templateName,
    tenantId
}: {
    to: string;
    subject: string;
    html?: string;
    react?: any;
    templateName?: string;
    tenantId?: string;
}) {
    console.log(`Sending email to ${to}: ${subject}`)
    // Placeholder: Implement actual email sending (Resend/SendGrid) later
    return { success: true }
}
