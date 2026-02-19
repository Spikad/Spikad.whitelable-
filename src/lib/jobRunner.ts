import { createClient } from '@/lib/supabase/server'

export async function runCronJob(name: string, handler: () => Promise<void>) {
  const supabase = await createClient()

  // Mark job running
  await supabase.from('cron_jobs').update({ status: 'running' }).eq('name', name)

  try {
    await handler()

    // Update last_run and status
    await supabase.from('cron_jobs').update({ last_run: new Date().toISOString(), status: 'idle' }).eq('name', name)
  } catch (err) {
    console.error('cron job failed', name, err)
    await supabase.from('cron_jobs').update({ status: 'failed' }).eq('name', name)
    throw err
  }
}
