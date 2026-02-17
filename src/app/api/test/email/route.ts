import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import WelcomeEmail from '@/emails/WelcomeEmail'
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail'

export async function POST(req: Request) {
    try {
        const { type, email } = await req.json()

        if (!email) return new NextResponse('Missing email', { status: 400 })

        let result;

        if (type === 'welcome') {
            result = await sendEmail({
                to: email,
                subject: 'Welcome to Spikad!',
                react: WelcomeEmail({ name: 'Tester', loginUrl: 'https://app.spikad.ai' }),
                templateName: 'WelcomeEmail'
            })
        } else if (type === 'order') {
            result = await sendEmail({
                to: email,
                subject: 'Order Confirmation #1234',
                react: OrderConfirmationEmail({
                    orderId: '1234',
                    totalAmount: 49.99,
                    customerName: 'Tester',
                    items: [{ title: 'Cool T-Shirt', quantity: 1, price: 29.99 }, { title: 'Cap', quantity: 1, price: 20.00 }]
                }),
                templateName: 'OrderConfirmationEmail'
            })
        } else {
            return new NextResponse('Invalid type', { status: 400 })
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('Email test error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
