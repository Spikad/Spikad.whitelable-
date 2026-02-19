'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RotateCcw, CheckCircle, XCircle, X } from 'lucide-react'
import { format } from 'date-fns'

interface Return {
  id: string
  order_id: string
  reason: string | null
  status: 'requested' | 'approved' | 'received' | 'rejected'
  created_at: string
}

interface Order {
  id: string
  customer_id: string
  total_amount: number
}

export default function Returns() {
  const [returns, setReturns] = useState<(Return & { order?: Order })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [rejectModalId, setRejectModalId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id)
          .single()

        setIsAdmin(profile?.role === 'tenant_owner' || profile?.role === 'staff')
      } catch {
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [])

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('returns')
          .select('id, order_id, reason, status, created_at, orders (id, customer_id, total_amount)')
          .order('created_at', { ascending: false })

        if (error) throw error
        setReturns(data || [])
      } catch (err) {
        console.error('Failed to load returns:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReturns()
  }, [])

  const updateReturnStatus = async (returnId: string, newStatus: string, reason?: string) => {
    setSaving(true)
    try {
      const supabase = await createClient()
      
      const update: any = { status: newStatus }
      if (reason) {
        update.reason = reason
      }

      const { error } = await supabase
        .from('returns')
        .update(update)
        .eq('id', returnId)

      if (error) throw error
      
      setReturns(returns.map(r => r.id === returnId ? { ...r, status: newStatus as any } : r))
      
      // Mock email notification
      if (newStatus === 'approved') {
        console.log(`[EMAIL] Return approved notification sent for return ${returnId}`)
      } else if (newStatus === 'rejected') {
        console.log(`[EMAIL] Return rejected notification sent for return ${returnId} with reason: ${reason}`)
      } else if (newStatus === 'received') {
        console.log(`[EMAIL] Return received confirmation sent for return ${returnId}`)
      }
    } catch (err) {
      console.error('Failed to update return:', err)
      alert('Failed to update return')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    await updateReturnStatus(rejectModalId || '', 'rejected', rejectReason)
    setRejectModalId(null)
    setRejectReason('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'received':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'requested':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-orange-600" />
          Return Requests
        </h2>
      </div>

      {returns.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No returns yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {returns.map(ret => (
            <div key={ret.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold text-gray-900">Return #{ret.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600 mt-1">Order: {ret.order_id}</p>
                  {ret.reason && <p className="text-sm text-gray-600">Reason: {ret.reason}</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(ret.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ret.status)}`}>
                  {ret.status}
                </span>
              </div>

              {isAdmin && ret.status === 'requested' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateReturnStatus(ret.id, 'approved')}
                    disabled={saving}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectModalId(ret.id)
                      setRejectReason('')
                    }}
                    disabled={saving}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}

              {isAdmin && ret.status === 'approved' && (
                <button
                  onClick={() => updateReturnStatus(ret.id, 'received')}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  Mark as Received
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Reject Return</h3>
              <button
                onClick={() => {
                  setRejectModalId(null)
                  setRejectReason('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please provide a reason for rejecting this return request. The customer will be notified.
              </p>

              <textarea
                placeholder="Rejection reason (e.g., Item not eligible for return, policy violation, etc.)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setRejectModalId(null)
                    setRejectReason('')
                  }}
                  className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={saving || !rejectReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
