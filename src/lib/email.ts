
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    console.log(`Sending email to ${to}: ${subject}`)
    // Placeholder: Implement actual email sending (Resend/SendGrid) later
    return { success: true }
}
