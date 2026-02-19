'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, BarChart3, Users, DollarSign, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
          const { data: payData } = await supabase
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

    const available = stats.totalCommission - payouts.reduce((sum, p) => sum + (p.status !== 'rejected' ? p.amount : 0), 0)

    if (amount > available) {
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

  const availableBalance = stats.totalCommission - payouts.reduce((sum, p) => sum + (p.status !== 'rejected' ? p.amount : 0), 0)


  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading affiliate data...</div>
  }

  return (
    <div className="space-y-8">
      {!affiliate ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Become an Affiliate</CardTitle>
            <CardDescription>Join our affiliate program and earn commissions on referrals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Affiliate Code</Label>
              <Input
                id="code"
                placeholder="e.g., mycode123"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Commission Rate</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="rate"
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                />
                <span className="text-sm font-medium w-16">{(rate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={createAffiliate}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Affiliate Account'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime referred users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalCommission.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Total lifetime earnings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(affiliate.commission_rate * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Per successful referral
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>Share this link to earn commissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}?ref=${affiliate.code}`}
                  className="font-mono bg-muted"
                />
                <Button
                  variant="outline"
                  onClick={copyReferralLink}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied' : 'Copy Link'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payouts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Request Payout */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Request Payout</CardTitle>
                <CardDescription>Withdraw your earnings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                  <div className="text-2xl font-bold text-green-600">${availableBalance.toFixed(2)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Withdraw Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-7"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={requestPayout}
                  disabled={saving || parseFloat(withdrawAmount) > availableBalance || parseFloat(withdrawAmount) <= 0}
                >
                  {saving ? 'Processing...' : 'Request Payout'}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* History */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>View your past withdrawal requests.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                          No payout history found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payouts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{new Date(p.requested_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">${p.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${p.status === 'paid' ? 'border-transparent bg-green-500 text-white shadow hover:bg-green-600' :
                                p.status === 'rejected' ? 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80' :
                                  'border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600'
                              }`}>
                              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
