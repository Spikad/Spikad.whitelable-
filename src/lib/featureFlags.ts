import { createClient } from '@/lib/supabase/server'

export async function checkFeature(tenantId: string, featureKey: string): Promise<boolean> {
  const supabase = await createClient()

  // 1) Check tenant override
  const { data: tenantFeature, error: tfErr } = await supabase
    .from('tenant_features')
    .select('enabled, features(key)')
    .eq('tenant_id', tenantId)
    .eq('features.key', featureKey)
    .maybeSingle()

  if (tfErr) {
    console.error('tenant_features lookup error', tfErr)
  }

  if (tenantFeature && (tenantFeature as any).enabled !== null && (tenantFeature as any).enabled !== undefined) {
    return Boolean((tenantFeature as any).enabled)
  }

  // 2) Check plan features (if tenant has plan_id)
  const { data: tenant, error: tErr } = await supabase.from('tenants').select('plan_id').eq('id', tenantId).maybeSingle()
  if (tErr) console.error('tenant lookup error', tErr)

  const planId = (tenant as any)?.plan_id
  if (planId) {
    const { data: planFeature, error: pfErr } = await supabase
      .from('plan_features')
      .select('enabled, features(key)')
      .eq('plan_id', planId)
      .eq('features.key', featureKey)
      .maybeSingle()

    if (pfErr) console.error('plan_features lookup error', pfErr)
    if (planFeature && (planFeature as any).enabled !== undefined) {
      return Boolean((planFeature as any).enabled)
    }
  }

  // 3) Default: feature disabled unless explicitly enabled
  return false
}
