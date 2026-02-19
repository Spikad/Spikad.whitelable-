'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Plus, Trash2, Copy, AlertCircle } from 'lucide-react'

interface AvailabilitySlot {
  dayOfWeek: number
  openTime: string
  closeTime: string
  pattern?: 'weekly' | 'biweekly' | 'monthly'
}

interface ExceptionDate {
  date: string
  reason: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIMEZONES = [
  'UTC', 'EST', 'CST', 'MST', 'PST',
  'GMT', 'CET', 'IST', 'JST', 'AEST'
]

export default function AvailabilitySettings({ tenantId }: { tenantId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set())
  const [bulkOpenTime, setBulkOpenTime] = useState('09:00')
  const [bulkCloseTime, setBulkCloseTime] = useState('17:00')
  const [timezone, setTimezone] = useState('UTC')
  const [exceptions, setExceptions] = useState<ExceptionDate[]>([])
  const [exceptionDate, setExceptionDate] = useState('')
  const [exceptionReason, setExceptionReason] = useState('')
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showExceptions, setShowExceptions] = useState(false)

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('availability_slots')
          .select('day_of_week, open_time, close_time, pattern, timezone')
          .eq('tenant_id', tenantId)

        if (error) throw error

        setSlots(
          data?.map(d => ({
            dayOfWeek: d.day_of_week,
            openTime: d.open_time,
            closeTime: d.close_time,
            pattern: d.pattern
          })) || []
        )

        // Load timezone if exists
        if (data?.length > 0 && data[0].timezone) {
          setTimezone(data[0].timezone)
        }

        // Load exceptions
        const { data: exceptionData } = await supabase
          .from('availability_exceptions')
          .select('date, reason')
          .eq('tenant_id', tenantId)

        setExceptions(exceptionData || [])
      } catch (err) {
        console.error('Failed to load availability slots:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [tenantId])

  const addSlot = (day: number) => {
    const exists = slots.some(s => s.dayOfWeek === day)
    if (!exists) {
      setSlots([...slots, { dayOfWeek: day, openTime: '09:00', closeTime: '17:00', pattern: 'weekly' }])
    }
  }

  const removeSlot = (day: number) => {
    setSlots(slots.filter(s => s.dayOfWeek !== day))
  }

  const updateSlot = (day: number, field: 'openTime' | 'closeTime' | 'pattern', value: string) => {
    setSlots(slots.map(s => s.dayOfWeek === day ? { ...s, [field]: value } : s))
  }

  const toggleDaySelection = (day: number) => {
    const newSelected = new Set(selectedDays)
    if (newSelected.has(day)) {
      newSelected.delete(day)
    } else {
      newSelected.add(day)
    }
    setSelectedDays(newSelected)
  }

  const applyBulkEdit = () => {
    selectedDays.forEach(day => {
      addSlot(day)
      updateSlot(day, 'openTime', bulkOpenTime)
      updateSlot(day, 'closeTime', bulkCloseTime)
    })
    setSelectedDays(new Set())
    setShowBulkEdit(false)
  }

  const addException = () => {
    if (exceptionDate && exceptionReason) {
      setExceptions([...exceptions, { date: exceptionDate, reason: exceptionReason }])
      setExceptionDate('')
      setExceptionReason('')
    }
  }

  const removeException = (date: string) => {
    setExceptions(exceptions.filter(e => e.date !== date))
  }

  const saveSlots = async () => {
    setSaving(true)
    try {
      const supabase = await createClient()

      // Delete existing
      await supabase.from('availability_slots').delete().eq('tenant_id', tenantId)

      // Insert new slots
      if (slots.length > 0) {
        const { error } = await supabase.from('availability_slots').insert(
          slots.map(s => ({
            tenant_id: tenantId,
            day_of_week: s.dayOfWeek,
            open_time: s.openTime,
            close_time: s.closeTime,
            pattern: s.pattern || 'weekly',
            timezone: timezone
          }))
        )
        if (error) throw error
      }

      // Delete existing exceptions
      await supabase.from('availability_exceptions').delete().eq('tenant_id', tenantId)

      // Insert new exceptions
      if (exceptions.length > 0) {
        const { error } = await supabase.from('availability_exceptions').insert(
          exceptions.map(e => ({
            tenant_id: tenantId,
            date: e.date,
            reason: e.reason
          }))
        )
        if (error) throw error
      }

      alert('Availability saved!')
    } catch (err) {
      console.error('Failed to save availability:', err)
      alert('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Availability Schedule</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkEdit(!showBulkEdit)}
            className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition flex items-center gap-2 text-sm"
          >
            <Copy className="h-4 w-4" />
            Bulk Edit
          </button>
          <button
            onClick={() => setShowExceptions(!showExceptions)}
            className="px-4 py-2 bg-orange-50 text-orange-700 font-medium rounded-lg hover:bg-orange-100 transition flex items-center gap-2 text-sm"
          >
            <AlertCircle className="h-4 w-4" />
            Exceptions
          </button>
        </div>
      </div>

      {/* Timezone Settings */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="block text-sm font-medium text-gray-900 mb-2">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {/* Bulk Edit Panel */}
      {showBulkEdit && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Apply to Multiple Days</h4>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DAYS.map((day, idx) => (
              <button
                key={idx}
                onClick={() => toggleDaySelection(idx)}
                className={`p-2 rounded text-sm font-medium transition ${selectedDays.has(idx)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-blue-200 hover:bg-blue-50'
                  }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Open Time</label>
              <input
                type="time"
                value={bulkOpenTime}
                onChange={(e) => setBulkOpenTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Close Time</label>
              <input
                type="time"
                value={bulkCloseTime}
                onChange={(e) => setBulkCloseTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <button
            onClick={applyBulkEdit}
            disabled={selectedDays.size === 0}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Apply to {selectedDays.size} Day{selectedDays.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Exception Dates Panel */}
      {showExceptions && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Closed Days & Exceptions</h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={exceptionDate}
                onChange={(e) => setExceptionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                placeholder="Holiday, Maintenance, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <button
            onClick={addException}
            disabled={!exceptionDate || !exceptionReason}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition mb-3"
          >
            Add Exception
          </button>
          {exceptions.length > 0 && (
            <div className="space-y-2">
              {exceptions.map((exc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{exc.date}</p>
                    <p className="text-sm text-gray-600">{exc.reason}</p>
                  </div>
                  <button
                    onClick={() => removeException(exc.date)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Day Schedule */}
      <div className="space-y-2 mb-6">
        {DAYS.map((day, idx) => {
          const slot = slots.find(s => s.dayOfWeek === idx)
          return (
            <div key={idx} className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
              <div className="w-24 font-medium text-gray-900">{day}</div>

              {slot ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.openTime}
                      onChange={(e) => updateSlot(idx, 'openTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={slot.closeTime}
                      onChange={(e) => updateSlot(idx, 'closeTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <select
                    value={slot.pattern || 'weekly'}
                    onChange={(e) => updateSlot(idx, 'pattern', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="weekly">Every Week</option>
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <button
                    onClick={() => removeSlot(idx)}
                    className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-gray-500">Not available</span>
                  <button
                    onClick={() => addSlot(idx)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={saveSlots}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Saving...' : 'Save Schedule'}
      </button>
    </div>
  )
}
