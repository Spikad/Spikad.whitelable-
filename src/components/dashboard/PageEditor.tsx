'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Eye, Save, ChevronUp, ChevronDown, Code } from 'lucide-react'

interface Page {
  id: string
  slug: string
  title: string
  is_published: boolean
}

interface PageSection {
  id: string
  section_type: string
  config_json: Record<string, any>
  sort_order: number
}

const SECTION_TYPES = ['Hero', 'Features', 'Text', 'Contact', 'Gallery', 'CTA']

const SECTION_TEMPLATES: Record<string, Record<string, any>> = {
  Hero: { title: 'Welcome', subtitle: 'Your tagline here', backgroundImage: '' },
  Features: { items: [{ icon: '✨', title: 'Feature 1', description: 'Description' }] },
  Text: { heading: 'Section Title', content: 'Your content goes here' },
  Contact: { email: 'contact@example.com', phone: '' },
  Gallery: { images: [{ url: '', alt: 'Image 1' }] },
  CTA: { title: 'Call to Action', buttonText: 'Click Here', buttonLink: '/' }
}

function SectionPreview({ section }: { section: PageSection }) {
  switch (section.section_type) {
    case 'Hero':
      return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-12 rounded text-center">
          <h1 className="text-4xl font-bold mb-2">{section.config_json.title || 'Welcome'}</h1>
          <p className="text-xl">{section.config_json.subtitle || 'Your tagline'}</p>
        </div>
      )
    case 'Features':
      return (
        <div className="bg-white p-8 rounded border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <div className="grid grid-cols-2 gap-4">
            {section.config_json.items?.map((item: any, i: number) => (
              <div key={i} className="p-4 border border-gray-200 rounded">
                <span className="text-2xl mb-2">{item.icon || '✨'}</span>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'Text':
      return (
        <div className="bg-white p-8 rounded border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">{section.config_json.heading}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{section.config_json.content}</p>
        </div>
      )
    case 'Contact':
      return (
        <div className="bg-white p-8 rounded border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p>Email: {section.config_json.email}</p>
          {section.config_json.phone && <p>Phone: {section.config_json.phone}</p>}
        </div>
      )
    case 'CTA':
      return (
        <div className="bg-gray-100 p-8 rounded text-center">
          <h2 className="text-2xl font-bold mb-4">{section.config_json.title}</h2>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            {section.config_json.buttonText}
          </button>
        </div>
      )
    default:
      return <div className="bg-gray-50 p-4 rounded text-gray-600">Preview not available</div>
  }
}

export default function PageEditor({ tenantId }: { tenantId: string }) {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [editingSection, setEditingSection] = useState<PageSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPageSlug, setNewPageSlug] = useState('')
  const [newPageTitle, setNewPageTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [showConfigEditor, setShowConfigEditor] = useState(false)

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('pages')
          .select('id, slug, title, is_published')
          .eq('tenant_id', tenantId)

        if (error) throw error
        setPages(data || [])
      } catch (err) {
        console.error('Failed to load pages:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPages()
  }, [tenantId])

  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedPage) return

      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('page_sections')
          .select('id, section_type, config_json, sort_order')
          .eq('page_id', selectedPage.id)
          .order('sort_order')

        if (error) throw error
        setSections(data || [])
      } catch (err) {
        console.error('Failed to load sections:', err)
      }
    }

    fetchSections()
  }, [selectedPage])

  const createPage = async () => {
    if (!newPageSlug || !newPageTitle) {
      alert('Please fill in slug and title')
      return
    }

    setSaving(true)
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('pages')
        .insert({ tenant_id: tenantId, slug: newPageSlug, title: newPageTitle, is_published: false })
        .select()

      if (error) throw error
      if (data) {
        setPages([...pages, data[0]])
        setSelectedPage(data[0])
        setNewPageSlug('')
        setNewPageTitle('')
      }
    } catch (err) {
      console.error('Failed to create page:', err)
      alert('Failed to create page')
    } finally {
      setSaving(false)
    }
  }

  const addSection = async (type: string) => {
    if (!selectedPage) return

    setSaving(true)
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('page_sections')
        .insert({
          page_id: selectedPage.id,
          section_type: type,
          config_json: SECTION_TEMPLATES[type] || {},
          sort_order: sections.length
        })
        .select()

      if (error) throw error
      if (data) {
        setSections([...sections, data[0]])
      }
    } catch (err) {
      console.error('Failed to add section:', err)
      alert('Failed to add section')
    } finally {
      setSaving(false)
    }
  }

  const updateSectionConfig = async (sectionId: string, newConfig: Record<string, any>) => {
    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('page_sections')
        .update({ config_json: newConfig })
        .eq('id', sectionId)

      if (error) throw error
      setSections(sections.map(s => s.id === sectionId ? { ...s, config_json: newConfig } : s))
      if (editingSection?.id === sectionId) {
        setEditingSection({ ...editingSection, config_json: newConfig })
      }
    } catch (err) {
      console.error('Failed to update section:', err)
      alert('Failed to update section')
    } finally {
      setSaving(false)
    }
  }

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const sourceIndex = sections.findIndex(s => s.id === sectionId)
    if ((direction === 'up' && sourceIndex === 0) || (direction === 'down' && sourceIndex === sections.length - 1)) return

    const newSections = [...sections]
    const destIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;
    [newSections[sourceIndex], newSections[destIndex]] = [newSections[destIndex], newSections[sourceIndex]]

    setSaving(true)
    try {
      const supabase = await createClient()

      const updates = newSections.map((s, i) => ({
        id: s.id,
        sort_order: i
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('page_sections')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
        if (error) throw error
      }

      setSections(newSections)
    } catch (err) {
      console.error('Failed to reorder:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async (sectionId: string) => {
    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('page_sections').delete().eq('id', sectionId)

      if (error) throw error
      setSections(sections.filter(s => s.id !== sectionId))
      setEditingSection(null)
    } catch (err) {
      console.error('Failed to delete section:', err)
    } finally {
      setSaving(false)
    }
  }

  const publishPage = async () => {
    if (!selectedPage) return

    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('pages')
        .update({ is_published: true })
        .eq('id', selectedPage.id)

      if (error) throw error
      setSelectedPage({ ...selectedPage, is_published: true })
      setPages(pages.map(p => p.id === selectedPage.id ? { ...p, is_published: true } : p))
      alert('Page published!')
    } catch (err) {
      console.error('Failed to publish:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-4 gap-6 h-full">
      {/* Pages List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
        <h3 className="font-semibold text-gray-900 mb-4">Pages</h3>
        <div className="space-y-2 mb-4">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => {
                setSelectedPage(page)
                setEditingSection(null)
              }}
              className={`w-full text-left p-3 rounded-lg border transition ${selectedPage?.id === page.id
                ? 'bg-blue-50 border-blue-300'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{page.title}</p>
                  <p className="text-xs text-gray-500">/{page.slug}</p>
                </div>
                {page.is_published && <Eye className="h-4 w-4 text-green-600" />}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t border-gray-200">
          <input
            type="text"
            placeholder="Slug"
            value={newPageSlug}
            onChange={(e) => setNewPageSlug(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Title"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={createPage}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Page
          </button>
        </div>
      </div>

      {/* Sections List */}
      {selectedPage && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Sections</h3>
            <button
              onClick={publishPage}
              disabled={saving || selectedPage.is_published}
              className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Publish
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                onClick={() => setEditingSection(section)}
                className={`p-3 rounded-lg border cursor-pointer transition ${editingSection?.id === section.id
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm text-gray-900">{section.section_type}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSection(section.id, 'up')
                      }}
                      disabled={idx === 0}
                      className="p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-30 rounded"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSection(section.id, 'down')
                      }}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-30 rounded"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSection(section.id)
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Add Section</p>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  disabled={saving}
                  className="bg-blue-50 text-blue-600 py-2 px-2 rounded text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition"
                >
                  + {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Config Editor */}
      {editingSection && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Config: {editingSection.section_type}</h3>
            <button
              onClick={() => setShowConfigEditor(!showConfigEditor)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>

          {showConfigEditor ? (
            <textarea
              value={JSON.stringify(editingSection.config_json, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value)
                  updateSectionConfig(editingSection.id, config)
                } catch {
                  // Invalid JSON
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs h-64"
            />
          ) : (
            <div className="space-y-3">
              {editingSection.section_type === 'Hero' && (
                <>
                  <input
                    type="text"
                    placeholder="Title"
                    value={editingSection.config_json.title || ''}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        title: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle"
                    value={editingSection.config_json.subtitle || ''}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        subtitle: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </>
              )}

              {editingSection.section_type === 'Text' && (
                <>
                  <input
                    type="text"
                    placeholder="Heading"
                    value={editingSection.config_json.heading || ''}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        heading: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <textarea
                    placeholder="Content"
                    value={editingSection.config_json.content || ''}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        content: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded h-32"
                  />
                </>
              )}

              {editingSection.section_type === 'CTA' && (
                <>
                  <input
                    type="text"
                    placeholder="Title"
                    value={editingSection.config_json.title || ''}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        title: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Button Text"
                    value={editingSection.config_json.buttonText || ''}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        buttonText: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Button Link"
                    value={editingSection.config_json.buttonLink || '/'}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        buttonLink: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </>
              )}

              {editingSection.section_type === 'Contact' && (
                <>
                  <input
                    type="email"
                    placeholder="Email"
                    value={editingSection.config_json.email || ''}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        email: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={editingSection.config_json.phone || ''}
                    onChange={(e) =>
                      updateSectionConfig(editingSection.id, {
                        ...editingSection.config_json,
                        phone: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </>
              )}

              <p className="text-xs text-gray-500">
                Click <Code className="h-3 w-3 inline" /> to edit raw JSON
              </p>
            </div>
          )}
        </div>
      )}

      {/* Live Preview */}
      {editingSection && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </h3>
          <div className="overflow-y-auto max-h-96">
            <SectionPreview section={editingSection} />
          </div>
        </div>
      )}
    </div>
  )
}
