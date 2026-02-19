'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, Check, MessageCircle, BarChart3, Shield, Mail, Zap, Eye } from 'lucide-react'

interface Addon {
  id: string
  name: string
  price_monthly: number
  description?: string
  icon?: React.ReactNode
}

interface TenantAddon {
  addon_id: string
  active_since: string
}

// Hardcoded addon catalog
const ADDON_CATALOG: Addon[] = [
  {
    id: 'sms-notifications',
    name: 'SMS Notifications',
    price_monthly: 29,
    description: 'Send SMS order updates and reminders to customers',
    icon: <MessageCircle className="h-6 w-6" />
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    price_monthly: 49,
    description: 'Deep insights into customer behavior and sales trends',
    icon: <BarChart3 className="h-6 w-6" />
  },
  {
    id: 'fraud-detection',
    name: 'Fraud Detection',
    price_monthly: 39,
    description: 'AI-powered fraud prevention and risk assessment',
    icon: <Shield className="h-6 w-6" />
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing Pro',
    price_monthly: 24,
    description: 'Advanced segmentation and automation workflows',
    icon: <Mail className="h-6 w-6" />
  },
  {
    id: 'dynamic-pricing',
    name: 'Dynamic Pricing',
    price_monthly: 59,
    description: 'Automatically optimize prices based on demand',
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'white-label',
    name: 'White Label',
    price_monthly: 99,
    description: 'Remove all branding and customize completely',
    icon: <Eye className="h-6 w-6" />
  }
]

export default function Addons({ tenantId }: { tenantId: string }) {
  const [allAddons, setAllAddons] = useState<Addon[]>(ADDON_CATALOG)
  const [activeAddons, setActiveAddons] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const supabase = await createClient()

        // Fetch from database (falls back to empty if none exist)
        const { data: addonsData, error: addonsErr } = await supabase
          .from('addons')
          .select('id, name, price_monthly')

        if (addonsErr && addonsErr.code !== 'PGRST116') throw addonsErr

        // Merge database addons with catalog
        const dbAddonIds = new Set(addonsData?.map(a => a.id) || [])
        const mergedAddons = [
          ...ADDON_CATALOG,
          ...(addonsData?.filter(a => !ADDON_CATALOG.find(c => c.id === a.id)) || [])
        ]
        
        setAllAddons(mergedAddons)

        // Fetch active addons for this tenant
        const { data: tenantAddonsData, error: tenantAddonsErr } = await supabase
          .from('tenant_addons')
          .select('addon_id')
          .eq('tenant_id', tenantId)

        if (tenantAddonsErr && tenantAddonsErr.code !== 'PGRST116') throw tenantAddonsErr

        setActiveAddons(new Set(tenantAddonsData?.map(a => a.addon_id) || []))
      } catch (err) {
        console.error('Failed to load addons:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAddons()
  }, [tenantId])

  const toggleAddon = async (addonId: string) => {
    setInstalling(true)
    try {
      const supabase = await createClient()
      const isActive = activeAddons.has(addonId)

      if (isActive) {
        // Uninstall
        await supabase
          .from('tenant_addons')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('addon_id', addonId)

        const newActive = new Set(activeAddons)
        newActive.delete(addonId)
        setActiveAddons(newActive)
      } else {
        // Install
        const { error } = await supabase.from('tenant_addons').insert({
          tenant_id: tenantId,
          addon_id: addonId
        })

        if (error) throw error

        const newActive = new Set(activeAddons)
        newActive.add(addonId)
        setActiveAddons(newActive)
      }
    } catch (err) {
      console.error('Failed to toggle addon:', err)
      alert('Failed to update addon')
    } finally {
      setInstalling(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading addons...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Add-on Marketplace</h1>
        <p className="text-blue-100">Extend your store with premium features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allAddons.map(addon => {
          const isActive = activeAddons.has(addon.id)
          return (
            <div key={addon.id} className={`rounded-lg border-2 p-6 flex flex-col transition ${
              isActive 
                ? 'bg-blue-50 border-blue-300 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex-1 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {addon.icon && (
                      <div className="text-blue-600">
                        {addon.icon}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{addon.name}</h3>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-green-600 flex-shrink-0" />}
                </div>
                
                {addon.description && (
                  <p className="text-sm text-gray-600 mb-3">{addon.description}</p>
                )}
                
                <p className="text-3xl font-bold text-gray-900 mt-4">
                  ${addon.price_monthly.toFixed(2)}
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </p>
              </div>

              <button
                onClick={() => toggleAddon(addon.id)}
                disabled={installing}
                className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                  isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {installing ? 'Processing...' : isActive ? 'Uninstall' : 'Install'}
              </button>
            </div>
          )
        })}
      </div>

      {allAddons.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No addons available yet</p>
        </div>
      )}
    </div>
  )
}
