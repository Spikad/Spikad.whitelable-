import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const report: any = {
        checks: {
            has_supabase_url: !!supabaseUrl,
            has_service_role_key: !!serviceRoleKey,
        },
        env: {
            url_prefix: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'missing',
            key_prefix: serviceRoleKey ? serviceRoleKey.substring(0, 5) + '...' : 'missing'
        }
    }

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({
            status: 'error',
            message: 'Missing Environment Variables',
            report
        }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    try {
        const { error } = await supabaseAdmin.from('webhook_logs').insert({
            event_type: 'manual_test',
            status: 'success',
            payload: { message: 'Connectivity verification' } as any,
            error_message: 'None'
        })

        if (error) {
            report.db_error = error
            return NextResponse.json({
                status: 'error',
                message: 'Database Write Failed',
                report
            }, { status: 500 })
        }

        return NextResponse.json({
            status: 'success',
            message: 'Successfully wrote to webhook_logs',
            report
        }, { status: 200 })

    } catch (err: any) {
        report.exception = err.message
        return NextResponse.json({
            status: 'error',
            message: 'Unexpected Exception',
            report
        }, { status: 500 })
    }
}
