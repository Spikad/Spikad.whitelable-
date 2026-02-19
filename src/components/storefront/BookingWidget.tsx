'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, Check, X, AlertCircle } from 'lucide-react'
import { format, addDays, startOfDay, eachDayOfInterval, isBefore } from 'date-fns'

interface ServiceProduct {
  id: string
  title: string
  duration_minutes?: number
  price?: number
}

interface TimeSlot {
  time: string
  available: boolean
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
}

export default function BookingWidget({ productId, tenantId, minDaysAhead = 1, maxDaysAhead = 60 }: { productId: string; tenantId: string; minDaysAhead?: number; maxDaysAhead?: number }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<ServiceProduct | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', email: '', phone: '' })
  const [formErrors, setFormErrors] = useState<Partial<CustomerInfo>>({})

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('products')
          .select('id, title, product_type, price')
          .eq('id', productId)
          .single()

        if (error) throw error

        if (data?.product_type === 'service') {
          const { data: serviceData, error: serviceErr } = await supabase
            .from('service_settings')
            .select('duration_minutes')
            .eq('product_id', productId)
            .single()

          if (!serviceErr) {
            setProduct({ ...data, duration_minutes: serviceData?.duration_minutes })
          } else {
            setProduct(data)
          }
        } else {
          setProduct(data)
        }
        
        // Set default date to minimum booking window
        setSelectedDate(addDays(new Date(), minDaysAhead))
      } catch (err) {
        console.error('Failed to load product:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [productId, minDaysAhead])

  useEffect(() => {
    const generateTimeSlots = async () => {
      if (!selectedDate) return
      
      try {
        const dayOfWeek = selectedDate.getDay()
        const supabase = await createClient()

        // Get availability for this day
        const { data: availability } = await supabase
          .from('availability_slots')
          .select('open_time, close_time')
          .eq('tenant_id', tenantId)
          .eq('day_of_week', dayOfWeek)
          .single()

        if (!availability) {
          setTimeSlots([])
          return
        }

        // Generate 30-minute slots
        const duration = product?.duration_minutes || 60
        const slots: TimeSlot[] = []
        const [openHour, openMin] = availability.open_time.split(':').map(Number)
        const [closeHour, closeMin] = availability.close_time.split(':').map(Number)

        let current = new Date(selectedDate)
        current.setHours(openHour, openMin, 0)
        const closeTime = new Date(selectedDate)
        closeTime.setHours(closeHour, closeMin, 0)

        // Disable slots in the past if booking is for today
        const now = new Date()
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')

        while (current < closeTime) {
          const time = format(current, 'HH:mm')
          
          // Check if slot is in the past
          if (isToday && current <= now) {
            current = new Date(current.getTime() + 30 * 60000)
            continue
          }

          // Check if slot is available (not booked)
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('product_id', productId)
            .gte('start_time', current.toISOString())
            .lt('start_time', new Date(current.getTime() + duration * 60000).toISOString())
            .neq('status', 'cancelled')

          slots.push({ time, available: !count || count === 0 })
          current = new Date(current.getTime() + 30 * 60000) // 30-minute intervals
        }

        setTimeSlots(slots)
      } catch (err) {
        console.error('Failed to generate time slots:', err)
      }
    }

    if (product && selectedDate) {
      generateTimeSlots()
    }
  }, [selectedDate, product, productId, tenantId])

  const validateCustomerInfo = () => {
    const errors: Partial<CustomerInfo> = {}
    
    if (!customerInfo.name.trim()) {
      errors.name = 'Name is required'
    }
    if (!customerInfo.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Valid email is required'
    }
    if (!customerInfo.phone.match(/^[\d\s\-\+\(\)]+$/)) {
      errors.phone = 'Valid phone number is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBooking = async () => {
    if (!validateCustomerInfo()) {
      return
    }

    if (!selectedSlot || !selectedDate) {
      alert('Please select a time slot')
      return
    }

    setSubmitting(true)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Please sign in to book')
        return
      }

      const [hour, min] = selectedSlot.split(':').map(Number)
      const startTime = new Date(selectedDate)
      startTime.setHours(hour, min, 0)
      const endTime = new Date(startTime.getTime() + (product?.duration_minutes || 60) * 60000)

      // Store customer info in profiles
      await supabase
        .from('profiles')
        .update({
          full_name: customerInfo.name,
          phone: customerInfo.phone
        })
        .eq('id', user.id)

      const { error } = await supabase.from('bookings').insert({
        tenant_id: tenantId,
        product_id: productId,
        customer_id: user.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        metadata: { customer_phone: customerInfo.phone }
      })

      if (error) throw error

      alert('Booking created! Awaiting confirmation.')
      setSelectedSlot(null)
      setSelectedDate(addDays(new Date(), minDaysAhead))
      setCustomerInfo({ name: '', email: '', phone: '' })
      setShowConfirmation(false)
    } catch (err) {
      console.error('Booking failed:', err)
      alert('Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!selectedDate) {
    return <div className="p-4 text-center">Initializing...</div>
  }

  const minDate = addDays(new Date(), minDaysAhead)
  const maxDate = addDays(new Date(), maxDaysAhead)
  const nextDays = eachDayOfInterval({
    start: startOfDay(minDate),
    end: maxDate
  })

  const availableSlots = timeSlots.filter(s => s.available).length

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Book {product?.title}
        </h3>
        {product?.duration_minutes && (
          <p className="text-sm text-gray-600">Duration: {product.duration_minutes} minutes</p>
        )}
        {product?.price && (
          <p className="text-sm font-medium text-blue-600">${product.price.toFixed(2)}</p>
        )}
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
        <p className="text-xs text-gray-500 mb-2">Available from {format(minDate, 'MMM d')} to {format(maxDate, 'MMM d')}</p>
        <div className="grid grid-cols-5 gap-2 md:grid-cols-6 lg:grid-cols-7">
          {nextDays.map(date => {
            const isSelected = selectedDate && format(date, 'MMM d') === format(selectedDate, 'MMM d')
            const isDisabled = isBefore(date, minDate) || isBefore(maxDate, date)
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => {
                  setSelectedDate(date)
                  setSelectedSlot(null)
                }}
                disabled={isDisabled}
                className={`p-2 rounded text-sm font-medium transition ${
                  isDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div>{format(date, 'd')}</div>
                <div className="text-xs opacity-70">{format(date, 'EEE').substring(0, 1)}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          Select Time ({availableSlots} available)
        </label>
        {timeSlots.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">No available slots</p>
              <p className="text-sm text-yellow-700">Please select a different date</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 md:grid-cols-6 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
            {timeSlots.map(slot => (
              <button
                key={slot.time}
                onClick={() => slot.available && setSelectedSlot(slot.time)}
                disabled={!slot.available}
                className={`p-2 text-sm font-medium rounded border transition ${
                  selectedSlot === slot.time
                    ? 'bg-blue-600 text-white border-blue-600'
                    : slot.available
                    ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Information Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Information</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              placeholder="John Doe"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                formErrors.name
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              placeholder="john@example.com"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                formErrors.email
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                formErrors.phone
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
          </div>
        </div>
      </div>

      {/* Booking Button */}
      <button
        onClick={() => {
          if (selectedSlot && customerInfo.name && customerInfo.email) {
            setShowConfirmation(true)
          } else {
            alert('Please select a time and fill in your information')
          }
        }}
        disabled={!selectedSlot || submitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        <Check className="h-4 w-4" />
        {submitting ? 'Booking...' : 'Continue to Confirmation'}
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && selectedDate && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Your Booking</h2>
            
            <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-semibold text-gray-900">{product?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-semibold text-gray-900">{format(selectedDate, 'MMMM d, yyyy')} at {selectedSlot}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold text-gray-900">{product?.duration_minutes} minutes</p>
              </div>
              {product?.price && (
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-semibold text-gray-900">${product.price.toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">{customerInfo.name}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                {submitting ? 'Booking...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
