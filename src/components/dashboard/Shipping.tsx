'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, Truck, Plus, X } from 'lucide-react'
import { format } from 'date-fns'

interface Order {
  id: string
  customer_id: string
  total_amount: number
  status: string
  created_at: string
}

interface Shipment {
  id: string
  order_id: string
  tracking_number: string | null
  carrier: string | null
  created_at: string
}

export default function Shipping({ tenantId }: { tenantId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [shipments, setShipments] = useState<Record<string, Shipment>>({})
  const [loading, setLoading] = useState(true)
  const [newTracking, setNewTracking] = useState<Record<string, string>>({})
  const [newCarrier, setNewCarrier] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [labelModalOrder, setLabelModalOrder] = useState<string | null>(null)
  const [labelWeight, setLabelWeight] = useState('')
  const [labelLength, setLabelLength] = useState('')
  const [labelWidth, setLabelWidth] = useState('')
  const [labelHeight, setLabelHeight] = useState('')
  const [labelCarrier, setLabelCarrier] = useState('ups')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const supabase = await createClient()

        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('id, customer_id, total_amount, status, created_at')
          .eq('tenant_id', tenantId)
          .in('status', ['paid', 'processing'])
          .order('created_at', { ascending: false })

        if (ordersErr) throw ordersErr

        const { data: shipmentsData, error: shipmentsErr } = await supabase
          .from('shipments')
          .select('id, order_id, tracking_number, carrier, created_at')

        if (shipmentsErr) throw shipmentsErr

        setOrders(ordersData || [])

        const shipmentMap: Record<string, Shipment> = {}
        shipmentsData?.forEach((shipment: Shipment) => {
          shipmentMap[shipment.order_id] = shipment
        })
        setShipments(shipmentMap)
      } catch (err) {
        console.error('Failed to load orders:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [tenantId])

  const generateLabel = async () => {
    if (!labelModalOrder || !labelWeight || !labelLength || !labelWidth || !labelHeight) {
      alert('All dimensions are required')
      return
    }

    setSaving(true)
    try {
      const supabase = await createClient()

      // Mock external API call (would use Shippo, EasyPost, etc)
      const mockTrackingNumber = `MOCK-${Date.now()}`

      const { data, error } = await supabase
        .from('shipments')
        .insert({
          order_id: labelModalOrder,
          tracking_number: mockTrackingNumber,
          carrier: labelCarrier,
          metadata: {
            weight: labelWeight,
            dimensions: {
              length: labelLength,
              width: labelWidth,
              height: labelHeight
            }
          }
        })
        .select()

      if (error) throw error

      if (data) {
        setShipments({ ...shipments, [labelModalOrder]: data[0] })
        setNewTracking({ ...newTracking, [labelModalOrder]: '' })
        setNewCarrier({ ...newCarrier, [labelModalOrder]: '' })
        setLabelModalOrder(null)
        setLabelWeight('')
        setLabelLength('')
        setLabelWidth('')
        setLabelHeight('')
        alert('Shipping label generated successfully!')
      }
    } catch (err) {
      console.error('Failed to generate label:', err)
      alert('Failed to generate label')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const readyToShip = orders.filter(o => !shipments[o.id])

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-gray-600">Orders Ready to Ship</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{readyToShip.length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="h-5 w-5 text-green-600" />
            <p className="text-sm text-gray-600">Shipped Orders</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{Object.keys(shipments).length}</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Orders to Ship</h3>
        </div>

        {readyToShip.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No orders ready to ship</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {readyToShip.map(order => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Order Total: ${order.total_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Tracking number"
                      value={newTracking[order.id] || ''}
                      onChange={(e) => setNewTracking({ ...newTracking, [order.id]: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Carrier (e.g., FedEx, UPS)"
                      value={newCarrier[order.id] || ''}
                      onChange={(e) => setNewCarrier({ ...newCarrier, [order.id]: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newTracking[order.id] || !newCarrier[order.id]) {
                          alert('Please enter tracking number and carrier')
                          return
                        }
                      }}
                      disabled={saving}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      Create Shipment
                    </button>
                    <button
                      onClick={() => {
                        setLabelModalOrder(order.id)
                        setLabelCarrier('ups')
                        setLabelWeight('')
                        setLabelLength('')
                        setLabelWidth('')
                        setLabelHeight('')
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Generate Label
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shipped Orders */}
      {Object.keys(shipments).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recently Shipped</h3>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {Object.entries(shipments).map(([orderId, shipment]) => (
              <div key={shipment.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900">{orderId}</p>
                    <p className="text-sm text-gray-600">
                      {shipment.carrier} • Tracking: {shipment.tracking_number}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(shipment.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Label Modal */}
      {labelModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Generate Shipping Label</h3>
              <button
                onClick={() => setLabelModalOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                <select
                  value={labelCarrier}
                  onChange={(e) => setLabelCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="ups">UPS</option>
                  <option value="fedex">FedEx</option>
                  <option value="usps">USPS</option>
                  <option value="dhl">DHL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={labelWeight}
                  onChange={(e) => setLabelWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Length (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={labelLength}
                    onChange={(e) => setLabelLength(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Width (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={labelWidth}
                    onChange={(e) => setLabelWidth(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Height (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={labelHeight}
                    onChange={(e) => setLabelHeight(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setLabelModalOrder(null)}
                  className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={generateLabel}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
