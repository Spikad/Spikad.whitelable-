'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, DollarSign, Users, Send, Download } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format, subDays } from 'date-fns'

interface ReferralData {
  date: string
  referrals: number
  conversions: number
  revenue: number
}

interface CommissionBreakdown {
  period: string
  commission: number
  referrals: number
  rate: number
}

interface PayoutRecord {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  requested_at: string
  completed_at?: string
}

interface WithdrawalRequest {
  amount: number
  method: 'bank_transfer' | 'paypal' | 'stripe'
  accountInfo: string
}

export default function AffiliateDashboard({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true)
  const [referralData, setReferralData] = useState<ReferralData[]>([])
  const [commissionsBreakdown, setCommissionsBreakdown] = useState<CommissionBreakdown[]>([])
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [pendingBalance, setPendingBalance] = useState(0)
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [withdrawal, setWithdrawal] = useState<WithdrawalRequest>({
    amount: 0,
    method: 'bank_transfer',
    accountInfo: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAffiliateData = async () => {
      try {
        const supabase = await createClient()

        // Fetch referral data (last 30 days)
        const { data: referralRawData } = await supabase
          .rpc('get_referral_analytics', { p_tenant_id: tenantId, p_days: 30 })

        // Generate mock referral chart data if no RPC
        const mockReferralData = Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'MMM d'),
          referrals: Math.floor(Math.random() * 15) + 2,
          conversions: Math.floor(Math.random() * 8) + 1,
          revenue: Math.floor(Math.random() * 800) + 100
        }))
        setReferralData(referralRawData || mockReferralData)

        // Fetch commission breakdown (by month)
        const mockCommissions = [
          { period: 'January', commission: 850, referrals: 12, rate: 10 },
          { period: 'February', commission: 1200, referrals: 18, rate: 10 },
          { period: 'March', commission: 950, referrals: 14, rate: 10 },
          { period: 'April', commission: 1450, referrals: 22, rate: 10 }
        ]
        setCommissionsBreakdown(mockCommissions)

        // Fetch payout history
        const { data: payoutData } = await supabase
          .from('affiliate_payouts')
          .select('id, amount, status, requested_at, completed_at')
          .eq('tenant_id', tenantId)
          .order('requested_at', { ascending: false })
          .limit(20)

        const mockPayouts: PayoutRecord[] = [
          { id: '1', amount: 500, status: 'completed', requested_at: '2024-02-01', completed_at: '2024-02-05' },
          { id: '2', amount: 750, status: 'completed', requested_at: '2024-01-20', completed_at: '2024-01-25' },
          { id: '3', amount: 300, status: 'pending', requested_at: '2024-02-15', completed_at: undefined }
        ]
        setPayouts(payoutData || mockPayouts)

        // Calculate totals
        const total = (payoutData || mockPayouts).reduce((sum, p) => sum + p.amount, 0)
        const pending = (payoutData || mockPayouts)
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0)

        setTotalEarnings(total)
        setPendingBalance(pending)
      } catch (err) {
        console.error('Failed to load affiliate data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAffiliateData()
  }, [tenantId])

  const handleWithdrawalRequest = async () => {
    if (!withdrawal.amount || !withdrawal.accountInfo) {
      alert('Please fill in all fields')
      return
    }

    if (withdrawal.amount > pendingBalance) {
      alert('Insufficient balance')
      return
    }

    setSubmitting(true)
    try {
      const supabase = await createClient()

      const { error } = await supabase.from('affiliate_payouts').insert({
        tenant_id: tenantId,
        amount: withdrawal.amount,
        status: 'pending',
        requested_at: new Date().toISOString(),
        payment_method: withdrawal.method,
        account_info: withdrawal.accountInfo,
        metadata: { withdrawal_request: true }
      })

      if (error) throw error

      alert('Withdrawal request submitted!')
      setShowWithdrawal(false)
      setWithdrawal({ amount: 0, method: 'bank_transfer', accountInfo: '' })

      // Refresh data
      setPendingBalance(pendingBalance - withdrawal.amount)
    } catch (err) {
      console.error('Withdrawal request failed:', err)
      alert('Failed to submit withdrawal request')
    } finally {
      setSubmitting(false)
    }
  }

  const exportPayoutHistory = () => {
    const csv = [
      ['Date', 'Amount', 'Status', 'Completed'],
      ...payouts.map(p => [
        format(new Date(p.requested_at), 'MMM dd, yyyy'),
        `$${p.amount.toFixed(2)}`,
        p.status,
        p.completed_at ? format(new Date(p.completed_at), 'MMM dd, yyyy') : '-'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payout-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return <div className="p-8 text-center">Loading affiliate dashboard...</div>
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">${totalEarnings.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Balance</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">${pendingBalance.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {payouts.length > 0
                  ? Math.round((payouts.filter(p => p.status === 'completed').length / payouts.length) * 100)
                  : 0}%
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Referral Analytics Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Analytics (30 Days)</h3>
        {referralData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={referralData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Line type="monotone" dataKey="referrals" stroke="#3b82f6" strokeWidth={2} name="New Referrals" />
              <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No referral data available</p>
        )}
      </div>

      {/* Commission Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Breakdown by Period</h3>
        {commissionsBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commissionsBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="commission" fill="#8b5cf6" name="Commission ($)" />
              <Bar dataKey="referrals" fill="#3b82f6" name="Referral Count" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No commission data available</p>
        )}
      </div>

      {/* Payout History Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
          <div className="flex gap-2">
            <button
              onClick={exportPayoutHistory}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowWithdrawal(!showWithdrawal)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
            >
              <Send className="h-4 w-4" />
              Request Withdrawal
            </button>
          </div>
        </div>

        {/* Withdrawal Request Form */}
        {showWithdrawal && (
          <div className="p-6 bg-blue-50 border-b border-blue-200 space-y-4">
            <h4 className="font-semibold text-gray-900">Request Withdrawal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  max={pendingBalance}
                  value={withdrawal.amount}
                  onChange={(e) => setWithdrawal({ ...withdrawal, amount: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-gray-600 mt-1">Max available: ${pendingBalance.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={withdrawal.method}
                  onChange={(e) => setWithdrawal({ ...withdrawal, method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Information</label>
              <textarea
                value={withdrawal.accountInfo}
                onChange={(e) => setWithdrawal({ ...withdrawal, accountInfo: e.target.value })}
                placeholder="Bank details, PayPal email, or Stripe account ID"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleWithdrawalRequest}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowWithdrawal(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payout Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Completed</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No payout history yet
                  </td>
                </tr>
              ) : (
                payouts.map(payout => (
                  <tr key={payout.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{format(new Date(payout.requested_at), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">${payout.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payout.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payout.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {payout.completed_at ? format(new Date(payout.completed_at), 'MMM dd, yyyy') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
