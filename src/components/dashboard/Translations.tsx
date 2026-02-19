'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Globe } from 'lucide-react'

interface Translation {
  id: string
  key: string
  language_code: string
  value: string
}

const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'sv', 'nl']

export default function TranslationsManager({ tenantId }: { tenantId: string }) {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [selectedLang, setSelectedLang] = useState('en')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('translations')
          .select('id, key, language_code, value')
          .eq('tenant_id', tenantId)

        if (error) throw error
        setTranslations(data || [])
      } catch (err) {
        console.error('Failed to load translations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTranslations()
  }, [tenantId])

  const uniqueKeys = Array.from(new Set(translations.map(t => t.key))).sort()

  const getTranslationValue = (key: string, lang: string): string => {
    const trans = translations.find(t => t.key === key && t.language_code === lang)
    return trans?.value || ''
  }

  const getTranslationId = (key: string, lang: string): string | undefined => {
    const trans = translations.find(t => t.key === key && t.language_code === lang)
    return trans?.id
  }

  const addTranslation = async () => {
    if (!newKey) {
      alert('Key is required')
      return
    }

    // Check if key already exists
    if (uniqueKeys.includes(newKey)) {
      alert('This key already exists')
      return
    }

    setSaving(true)
    try {
      const supabase = await createClient()
      
      // Create entry for each language
      const inserts = LANGUAGES.map(lang => ({
        tenant_id: tenantId,
        key: newKey,
        language_code: lang,
        value: lang === selectedLang ? newValue : ''
      }))

      const { data, error } = await supabase
        .from('translations')
        .insert(inserts)
        .select()

      if (error) throw error
      if (data) {
        setTranslations([...translations, ...data])
        setNewKey('')
        setNewValue('')
      }
    } catch (err) {
      console.error('Failed to add translation:', err)
      alert('Failed to add translation')
    } finally {
      setSaving(false)
    }
  }

  const deleteKey = async (key: string) => {
    if (!confirm(`Delete all translations for key "${key}"?`)) return

    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('key', key)

      if (error) throw error
      setTranslations(translations.filter(t => t.key !== key))
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setSaving(false)
    }
  }

  const updateTranslation = async (transId: string, newVal: string) => {
    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('translations')
        .update({ value: newVal })
        .eq('id', transId)

      if (error) throw error
      setTranslations(translations.map(t => t.id === transId ? { ...t, value: newVal } : t))
    } catch (err) {
      console.error('Failed to update:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteTranslation = async (transId: string) => {
    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('translations').delete().eq('id', transId)

      if (error) throw error
      setTranslations(translations.filter(t => t.id !== transId))
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Globe className="h-6 w-6 text-blue-600" />
          Multi-Language Translations
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Add New Key */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">Add New Translation Key</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Key (e.g., home.title)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            />
            <textarea
              placeholder="Translation value for primary language"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
            <button
              onClick={addTranslation}
              disabled={saving}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Key
            </button>
          </div>
        </div>

        {/* Translations Grid */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading translations...</div>
        ) : uniqueKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No translations yet. Add a key to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 sticky left-0 bg-gray-50 w-40">
                    Key
                  </th>
                  {LANGUAGES.map(lang => (
                    <th key={lang} className="px-4 py-3 text-left text-xs font-semibold text-gray-900 min-w-48">
                      {new Intl.DisplayNames(['en'], { type: 'language' }).of(lang)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {uniqueKeys.map(key => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 sticky left-0 bg-white hover:bg-gray-50 w-40">
                      {key}
                    </td>
                    {LANGUAGES.map(lang => {
                      const value = getTranslationValue(key, lang)
                      const transId = getTranslationId(key, lang)

                      return (
                        <td key={`${key}-${lang}`} className="px-4 py-3">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                              if (transId) {
                                updateTranslation(transId, e.target.value)
                              }
                            }}
                            placeholder="—"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteKey(key)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
