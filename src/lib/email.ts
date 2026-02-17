
export async function sendEmail({ to, subject, html, react }: { to: string; subject: string; html?: string; react?: any }) {
    console.log(`Sending email to ${to}: ${subject}`)
    // Placeholder: Implement actual email sending (Resend/SendGrid) later
    return { success: true }
}
