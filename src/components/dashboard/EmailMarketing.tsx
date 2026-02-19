'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Plus, Trash2, Send } from 'lucide-react'
import { format } from 'date-fns'

interface EmailCampaign {
  id: string
  name: string
  subject: string | null
  template: string | null
  is_active: boolean
  created_at: string
  sent_at?: string | null
  recipient_audience?: 'all' | 'buyers' | 'subscribers'
}

export default function EmailMarketing({ tenantId }: { tenantId: string }) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newTemplate, setNewTemplate] = useState('')
  const [audience, setAudience] = useState<'all' | 'buyers' | 'subscribers'>('all')
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('email_campaigns')
          .select('id, name, subject, template, is_active, created_at, sent_at, recipient_audience')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setCampaigns(data || [])
      } catch (err) {
        console.error('Failed to load campaigns:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [tenantId])

  const createCampaign = async () => {
    if (!newName) {
      alert('Campaign name is required')
      return
    }

    setSaving(true)
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          tenant_id: tenantId,
          name: newName,
          subject: newSubject || null,
          template: newTemplate || null,
          recipient_audience: audience,
          is_active: true
        })
        .select()

      if (error) throw error
      if (data) {
        setCampaigns([data[0], ...campaigns])
        setNewName('')
        setNewSubject('')
        setNewTemplate('')
        setAudience('all')
      }
    } catch (err) {
      console.error('Failed to create campaign:', err)
      alert('Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  const updateCampaign = async () => {
    if (!selectedCampaign) return

    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('email_campaigns')
        .update({
          name: newName,
          subject: newSubject,
          template: newTemplate,
          recipient_audience: audience
        })
        .eq('id', selectedCampaign.id)

      if (error) throw error

      setCampaigns(campaigns.map(c =>
        c.id === selectedCampaign.id
          ? { ...c, name: newName, subject: newSubject, template: newTemplate, recipient_audience: audience }
          : c
      ))
      setSelectedCampaign({
        ...selectedCampaign,
        name: newName,
        subject: newSubject,
        template: newTemplate,
        recipient_audience: audience
      })
    } catch (err) {
      console.error('Failed to update campaign:', err)
      alert('Failed to update campaign')
    } finally {
      setSaving(false)
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Delete this campaign?')) return

    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('email_campaigns').delete().eq('id', campaignId)

      if (error) throw error

      setCampaigns(campaigns.filter(c => c.id !== campaignId))
      if (selectedCampaign?.id === campaignId) setSelectedCampaign(null)
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setSaving(false)
    }
  }

  const sendCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return

    setSendingCampaignId(campaignId)
    try {
      const supabase = await createClient()
      
      // Update sent_at timestamp
      const { error } = await supabase
        .from('email_campaigns')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', campaignId)

      if (error) throw error

      // Update campaigns list
      setCampaigns(campaigns.map(c =>
        c.id === campaignId
          ? { ...c, sent_at: new Date().toISOString() }
          : c
      ))
      
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign({
          ...selectedCampaign,
          sent_at: new Date().toISOString()
        })
      }

      alert(`Campaign sent to ${campaign.recipient_audience} recipients!`)
    } catch (err) {
      console.error('Failed to send campaign:', err)
      alert('Failed to send campaign')
    } finally {
      setSendingCampaignId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaigns Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Campaigns
            </h3>
            <button
              onClick={() => {
                setSelectedCampaign(null)
                setNewName('')
                setNewSubject('')
                setNewTemplate('')
                setAudience('all')
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No campaigns yet. Create one to get started.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Audience</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map(campaign => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{campaign.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{campaign.subject || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {campaign.recipient_audience || 'all'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {campaign.sent_at ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Sent
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(campaign.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setNewName(campaign.name)
                        setNewSubject(campaign.subject || '')
                        setNewTemplate(campaign.template || '')
                        setAudience(campaign.recipient_audience || 'all')
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    {!campaign.sent_at && (
                      <button
                        onClick={() => sendCampaign(campaign.id)}
                        disabled={sendingCampaignId === campaign.id}
                        className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                      >
                        Send
                      </button>
                    )}
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor Panel */}
      {selectedCampaign || (newName || newSubject || newTemplate) ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {selectedCampaign ? 'Edit Campaign' : 'Create Campaign'}
          </h3>

          <input
            type="text"
            placeholder="Campaign name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />

          <input
            type="text"
            placeholder="Email subject"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as 'all' | 'buyers' | 'subscribers')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Customers</option>
              <option value="buyers">Buyers Only</option>
              <option value="subscribers">Subscribers Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
            <textarea
              placeholder="Email template (HTML)"
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-40 font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            {selectedCampaign ? (
              <>
                <button
                  onClick={updateCampaign}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {!selectedCampaign.sent_at && (
                  <button
                    onClick={() => sendCampaign(selectedCampaign.id)}
                    disabled={sendingCampaignId === selectedCampaign.id}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendingCampaignId === selectedCampaign.id ? 'Sending...' : 'Send Now'}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={createCampaign}
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
