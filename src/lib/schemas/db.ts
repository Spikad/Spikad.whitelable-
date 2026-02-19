import { z } from 'zod'

export const PlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  price_monthly: z.number().optional(),
  created_at: z.string().optional()
})

export const FeatureSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional()
})

export const PlanFeatureSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  feature_id: z.string().uuid(),
  enabled: z.boolean(),
  created_at: z.string().optional()
})

export const TenantFeatureSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  feature_id: z.string().uuid(),
  enabled: z.boolean().nullable(),
  created_at: z.string().optional()
})

export const CustomDomainSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  domain: z.string(),
  status: z.enum(['pending', 'verified', 'failed']),
  dns_record: z.record(z.string(), z.any()).nullable().optional(),
  created_at: z.string().optional()
})

export const CronJobSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  schedule: z.string(),
  last_run: z.string().nullable().optional(),
  status: z.enum(['idle', 'running', 'failed']),
  created_at: z.string().optional()
})

export const ServiceSettingsSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  duration_minutes: z.number().int(),
  buffer_time_minutes: z.number().int(),
  created_at: z.string().optional()
})

export const BookingSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  product_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  created_at: z.string().optional()
})

export const AvailabilitySlotSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  day_of_week: z.number().int(),
  open_time: z.string(),
  close_time: z.string(),
  created_at: z.string().optional()
})

export const InventoryAdjustmentSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity_change: z.number().int(),
  reason: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().optional()
})

export const InstalledThemeSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  theme_name: z.string(),
  config: z.record(z.string(), z.any()).nullable().optional(),
  created_at: z.string().optional()
})

export const PageSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  slug: z.string(),
  title: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  created_at: z.string().optional()
})

export const PageSectionSchema = z.object({
  id: z.string().uuid(),
  page_id: z.string().uuid(),
  section_type: z.string(),
  config_json: z.record(z.string(), z.any()).nullable().optional(),
  sort_order: z.number().int().optional(),
  created_at: z.string().optional()
})

export const BlogCategorySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string().optional()
})

export const BlogPostSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  content: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  created_at: z.string().optional()
})

export const AffiliateSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  code: z.string(),
  commission_rate: z.number(),
  created_at: z.string().optional()
})

export const ReferralSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  affiliate_id: z.string().uuid(),
  amount: z.number(),
  created_at: z.string().optional()
})

export const TranslationSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  key: z.string(),
  language_code: z.string(),
  value: z.string(),
  created_at: z.string().optional()
})

export const ShipmentSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  tracking_number: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  created_at: z.string().optional()
})

export const ReturnSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  reason: z.string().nullable().optional(),
  status: z.enum(['requested', 'approved', 'received', 'rejected']),
  created_at: z.string().optional()
})

export const WebhookLogSchema = z.object({
  id: z.string().uuid(),
  source: z.string().nullable().optional(),
  payload: z.record(z.string(), z.any()).nullable().optional(),
  status: z.enum(['received', 'processed', 'failed']),
  created_at: z.string().optional()
})

export const AddonSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price_monthly: z.number(),
  created_at: z.string().optional()
})

export const TenantAddonSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  addon_id: z.string().uuid(),
  active_since: z.string().optional()
})

export const EmailCampaignSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  subject: z.string().nullable().optional(),
  template: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().optional()
})

export const AutomationTriggerSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  event_type: z.string(),
  action_config: z.record(z.string(), z.any()).nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().optional()
})

// Export types
export type Plan = z.infer<typeof PlanSchema>
export type Feature = z.infer<typeof FeatureSchema>
export type PlanFeature = z.infer<typeof PlanFeatureSchema>
export type TenantFeature = z.infer<typeof TenantFeatureSchema>
export type CustomDomain = z.infer<typeof CustomDomainSchema>
export type CronJob = z.infer<typeof CronJobSchema>
export type ServiceSettings = z.infer<typeof ServiceSettingsSchema>
export type Booking = z.infer<typeof BookingSchema>
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>
export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>
export type InstalledTheme = z.infer<typeof InstalledThemeSchema>
export type Page = z.infer<typeof PageSchema>
export type PageSection = z.infer<typeof PageSectionSchema>
export type BlogCategory = z.infer<typeof BlogCategorySchema>
export type BlogPost = z.infer<typeof BlogPostSchema>
export type Affiliate = z.infer<typeof AffiliateSchema>
export type Referral = z.infer<typeof ReferralSchema>
export type Translation = z.infer<typeof TranslationSchema>
export type Shipment = z.infer<typeof ShipmentSchema>
export type ReturnRecord = z.infer<typeof ReturnSchema>
export type WebhookLog = z.infer<typeof WebhookLogSchema>
export type Addon = z.infer<typeof AddonSchema>
export type TenantAddon = z.infer<typeof TenantAddonSchema>
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>
export type AutomationTrigger = z.infer<typeof AutomationTriggerSchema>
