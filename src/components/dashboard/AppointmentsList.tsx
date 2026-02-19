'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Edit2, MessageSquare, X } from 'lucide-react'
import { format } from 'date-fns'

interface Booking {
  id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'
  customer_id: string
  product_id: string
  notes?: string
  profiles?: any
  products?: any
}

export default function AppointmentsList({ tenantId }: { tenantId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [showReschedule, setShowReschedule] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            start_time,
            end_time,
            status,
            customer_id,
            product_id,
            notes,
            profiles (full_name, email, phone),
            products (title)
          `)
          .eq('tenant_id', tenantId)
          .order('start_time', { ascending: false })

        if (error) throw error
        setBookings(data || [])
      } catch (err) {
        console.error('Failed to fetch bookings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [tenantId])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId)
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) throw error

      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus as any } : b))

      // Trigger notifications
      if (newStatus === 'confirmed') {
        console.log(`Sending confirmation email to customer for booking ${bookingId}`)
      } else if (newStatus === 'cancelled') {
        console.log(`Sending cancellation email to customer for booking ${bookingId}`)
      }
    } catch (err) {
      console.error('Failed to update booking:', err)
      alert('Failed to update booking')
    } finally {
      setUpdating(null)
    }
  }

  const updateNotes = async (bookingId: string, newNotes: string) => {
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('bookings')
        .update({ notes: newNotes })
        .eq('id', bookingId)

      if (error) throw error

      setBookings(bookings.map(b => b.id === bookingId ? { ...b, notes: newNotes } : b))
      setEditingNotes(null)
    } catch (err) {
      console.error('Failed to update notes:', err)
      alert('Failed to update notes')
    }
  }

  const handleReschedule = async (bookingId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert('Please select date and time')
      return
    }

    setUpdating(bookingId)
    try {
      const supabase = await createClient()
      const [hour, min] = rescheduleTime.split(':').map(Number)
      const newStart = new Date(rescheduleDate)
      newStart.setHours(hour, min, 0)

      // Fetch booking to get duration
      const booking = bookings.find(b => b.id === bookingId)
      if (!booking) throw new Error('Booking not found')

      const duration = new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      const { error } = await supabase
        .from('bookings')
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      setBookings(bookings.map(b =>
        b.id === bookingId
          ? { ...b, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }
          : b
      ))

      alert('Appointment rescheduled successfully!')
      setShowReschedule(null)
      setRescheduleDate('')
      setRescheduleTime('')

      // Send notification
      console.log(`Sending reschedule confirmation email for booking ${bookingId}`)
    } catch (err) {
      console.error('Failed to reschedule:', err)
      alert('Failed to reschedule appointment')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'no-show':
        return <XCircle className="h-5 w-5 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'no-show':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading appointments...</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-blue-600" />
          Appointments
        </h2>
      </div>

      {bookings.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No appointments yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {bookings.map(booking => (
            <div key={booking.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {(booking.products as any)?.title || 'Appointment'}
                    </h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(booking.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Customer: {(booking.profiles as any)?.full_name || 'Unknown'} ({(booking.profiles as any)?.email})
                  </p>
                  {(booking.profiles as any)?.phone && (
                    <p className="text-sm text-gray-600">
                      Phone: {(booking.profiles as any).phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(booking.start_time), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                </div>
              </div>

              {/* Admin Notes Section */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                {editingNotes === booking.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add admin notes about this appointment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateNotes(booking.id, notes)}
                        className="flex-1 bg-blue-600 text-white py-1 rounded text-sm font-medium hover:bg-blue-700 transition"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(null)
                          setNotes('')
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-1 rounded text-sm font-medium hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setEditingNotes(booking.id)
                      setNotes(booking.notes || '')
                    }}
                    className="cursor-pointer flex items-start gap-2 group"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      {booking.notes ? (
                        <p className="text-sm text-gray-700">{booking.notes}</p>
                      ) : (
                        <p className="text-sm text-gray-400 group-hover:text-gray-600">Click to add notes...</p>
                      )}
                    </div>
                    <Edit2 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                )}
              </div>

              {/* Action Buttons - Status Workflow */}
              {booking.status === 'pending' && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                    disabled={updating === booking.id}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                    disabled={updating === booking.id}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {booking.status === 'confirmed' && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'completed')}
                    disabled={updating === booking.id}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => {
                      setShowReschedule(booking.id)
                      setRescheduleDate(format(new Date(booking.start_time), 'yyyy-MM-dd'))
                      setRescheduleTime(format(new Date(booking.start_time), 'HH:mm'))
                    }}
                    disabled={updating === booking.id}
                    className="flex-1 bg-white border border-blue-600 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50 transition"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                    disabled={updating === booking.id}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-400 disabled:opacity-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {booking.status === 'completed' && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'no-show')}
                    disabled={updating === booking.id}
                    className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
                  >
                    Mark as No-Show
                  </button>
                </div>
              )}

              {/* Reschedule Modal */}
              {showReschedule === booking.id && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Reschedule Appointment</h3>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                        <input
                          type="time"
                          value={rescheduleTime}
                          onChange={(e) => setRescheduleTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReschedule(booking.id)}
                        disabled={updating === booking.id}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowReschedule(null)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
