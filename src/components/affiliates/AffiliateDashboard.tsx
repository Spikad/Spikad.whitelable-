'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, BarChart3, Users } from 'lucide-react'

interface Affiliate {
  id: string
  code: string
  commission_rate: number
  created_at: string
}

interface ReferralStats {
  totalReferrals: number
  totalCommission: number
  lastReferral?: string
}

interface PayoutRecord {
  id: string
  amount: number
  status: 'pending' | 'paid' | 'rejected'
  requested_at: string
}

export default function AffiliateDashboard({ tenantId }: { tenantId: string }) {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, totalCommission: 0 })
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [rate, setRate] = useState(0.05)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  useEffect(() => {
    const fetchAffiliate = async () => {
      try {
        const supabase = await createClient()
        const { data: userId } = await supabase.auth.getUser()

        const { data: affData, error: affErr } = await supabase
          .from('affiliates')
          .select('id, code, commission_rate, created_at')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (affErr && affErr.code !== 'PGRST116') throw affErr

        if (affData) {
          setAffiliate(affData)

          const { data: refData, error: refErr } = await supabase
            .from('referrals')
            .select('amount, created_at')
            .eq('affiliate_id', affData.id)

          if (!refErr && refData) {
            setStats({
              totalReferrals: refData.length,
              totalCommission: refData.reduce((sum, r) => sum + (r.amount || 0), 0),
              lastReferral: refData[0]?.created_at
            })
          }

          // Fetch Payouts
          const { data: payData, error: payErr } = await supabase
            .from('affiliate_payouts')
            .select('*')
            .eq('affiliate_id', affData.id)
            .order('requested_at', { ascending: false })

          if (payData) setPayouts(payData)
        }
      } catch (err) {
        console.error('Failed to load affiliate data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAffiliate()
  }, [tenantId])

  const createAffiliate = async () => {
    if (!code) {
      alert('Please enter an affiliate code')
      return
    }

    setSaving(true)
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('affiliates')
        .insert({ tenant_id: tenantId, code, commission_rate: rate })
        .select()

      if (error) throw error
      if (data) {
        setAffiliate(data[0])
        setCode('')
        setRate(0.05)
      }
    } catch (err) {
      console.error('Failed to create affiliate:', err)
      alert('Failed to create affiliate account')
    } finally {
      setSaving(false)
    }
  }

  const copyReferralLink = () => {
    if (!affiliate) return
    const link = `${window.location.origin}?ref=${affiliate.code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const requestPayout = async () => {
    if (!affiliate || !withdrawAmount) return
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount')
      return
    }

    if (amount > (stats.totalCommission - payouts.reduce((sum, p) => sum + (p.status !== 'rejected' ? p.amount : 0), 0))) {
      alert('Insufficient balance')
      return
    }

    setSaving(true)
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('affiliate_payouts')
        .insert({
          affiliate_id: affiliate.id,
          tenant_id: tenantId,
          amount,
          status: 'pending'
        })
        .select()

      if (error) throw error
      if (data) {
        setPayouts([data[0], ...payouts])
        setShowPayoutModal(false)
        setWithdrawAmount('')
        alert('Withdrawal requested!')
      }
    } catch (err) {
      console.error('Failed to update payouts:', err)
      alert('Failed to request payout')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {!affiliate ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Become an Affiliate</h2>
          <p className="text-gray-600 mb-6">Join our affiliate program and earn commissions on referrals.</p>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Code</label>
              <input
                type="text"
                placeholder="e.g., mycode123"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-600 font-medium">{(rate * 100).toFixed(1)}%</span>
              </div>
            </div>

            <button
              onClick={createAffiliate}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Creating...' : 'Create Affiliate Account'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-600">Total Referrals</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-green-600" />
                <p className="text-sm text-gray-600">Commission Earned</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">${stats.totalCommission.toFixed(2)}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Commission Rate</p>
              <p className="text-3xl font-bold text-gray-900">{(affiliate.commission_rate * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Referral Link</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}?ref=${affiliate.code}`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyReferralLink}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Payouts Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Payout History</h3>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                Request Withdrawal
              </button>
            </div>

            {showPayoutModal && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Request Payout</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount ($)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={requestPayout}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Processing...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowPayoutModal(false)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Available: ${(stats.totalCommission - payouts.reduce((sum, p) => sum + (p.status !== 'rejected' ? p.amount : 0), 0)).toFixed(2)}
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No payouts yet</td>
                    </tr>
                  ) : (
                    payouts.map(p => (
                      <tr key={p.id}>
                        <td className="px-4 py-2">{new Date(p.requested_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2 font-medium">${p.amount.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' :
                              p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
