'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Bold, Italic, Heading2, Link2, List, Eye, Edit3 } from 'lucide-react'
import { format } from 'date-fns'

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string | null
  published_at: string | null
  category_id: string | null
}

interface BlogCategory {
  id: string
  name: string
  slug: string
}

function MarkdownPreview({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/^### (.*?)$/gm, '<h3 className="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 className="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 className="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" className="text-blue-600 underline">$1</a>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*<\/li>)/, '<ul className="list-disc ml-4">$1</ul>')

    return html
  }

  return (
    <div className="prose prose-sm max-w-none">
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content).replace(/\n/g, '<br/>') }} />
    </div>
  )
}

export default function BlogManager({ tenantId }: { tenantId: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newContent, setNewContent] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = await createClient()

        const { data: postsData, error: postsErr } = await supabase
          .from('blog_posts')
          .select('id, slug, title, content, published_at, category_id')
          .eq('tenant_id', tenantId)
          .order('published_at', { ascending: false })

        const { data: categoriesData, error: categoriesErr } = await supabase
          .from('blog_categories')
          .select('id, name, slug')
          .eq('tenant_id', tenantId)

        if (postsErr) throw postsErr
        if (categoriesErr) throw categoriesErr

        setPosts(postsData || [])
        setCategories(categoriesData || [])
      } catch (err) {
        console.error('Failed to load blog data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenantId])

  const createPost = async () => {
    if (!newTitle || !newSlug) {
      alert('Title and slug are required')
      return
    }

    setSaving(true)
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          tenant_id: tenantId,
          title: newTitle,
          slug: newSlug,
          content: newContent || null,
          category_id: selectedCategoryId || null
        })
        .select()

      if (error) throw error
      if (data) {
        setPosts([data[0], ...posts])
        setNewTitle('')
        setNewSlug('')
        setNewContent('')
        setSelectedCategoryId('')
      }
    } catch (err) {
      console.error('Failed to create post:', err)
      alert('Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  const updatePost = async () => {
    if (!selectedPost) return

    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: newTitle,
          slug: newSlug,
          content: newContent,
          category_id: selectedCategoryId || null
        })
        .eq('id', selectedPost.id)

      if (error) throw error
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, title: newTitle, slug: newSlug, content: newContent, category_id: selectedCategoryId || null } : p))
      alert('Post updated!')
    } catch (err) {
      console.error('Failed to update post:', err)
      alert('Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return

    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('blog_posts').delete().eq('id', postId)

      if (error) throw error
      setPosts(posts.filter(p => p.id !== postId))
      if (selectedPost?.id === postId) setSelectedPost(null)
    } catch (err) {
      console.error('Failed to delete post:', err)
    } finally {
      setSaving(false)
    }
  }

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = newContent.substring(start, end)

    const newVal = newContent.substring(0, start) + before + selected + after + newContent.substring(end)
    setNewContent(newVal)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  const publishPost = async () => {
    if (!selectedPost) return

    const newPublishedAt = selectedPost.published_at ? null : new Date().toISOString()
    setSaving(true)
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('blog_posts')
        .update({ published_at: newPublishedAt })
        .eq('id', selectedPost.id)

      if (error) throw error
      setSelectedPost({ ...selectedPost, published_at: newPublishedAt })
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, published_at: newPublishedAt } : p))
    } catch (err) {
      console.error('Failed to publish:', err)
      alert('Failed to update post status')
    } finally {
      setSaving(false)
    }
  }

  const addCategory = async () => {
    if (!newCategoryName) {
      alert('Category name required')
      return
    }

    setSaving(true)
    try {
      const supabase = await createClient()
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-')
      const { data, error } = await supabase
        .from('blog_categories')
        .insert({
          tenant_id: tenantId,
          name: newCategoryName,
          slug
        })
        .select()

      if (error) throw error
      if (data) {
        setCategories([...categories, data[0]])
        setNewCategoryName('')
      }
    } catch (err) {
      console.error('Failed to add category:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Posts List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Blog Posts</h3>
        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {posts.map(post => (
            <button
              key={post.id}
              onClick={() => {
                setSelectedPost(post)
                setNewTitle(post.title)
                setNewSlug(post.slug)
                setNewContent(post.content || '')
                setSelectedCategoryId(post.category_id || '')
              }}
              className={`w-full text-left p-3 rounded-lg border transition ${selectedPost?.id === post.id
                ? 'bg-blue-50 border-blue-300'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
            >
              <p className="font-medium text-gray-900 text-sm truncate">{post.title}</p>
              {post.published_at && (
                <p className="text-xs text-gray-500">{format(new Date(post.published_at), 'MMM dd, yyyy')}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="col-span-2 space-y-4">
        {selectedPost ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Edit Post</h3>
              <div className="flex gap-2">
                <button
                  onClick={publishPost}
                  disabled={saving}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${selectedPost.published_at
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {selectedPost.published_at ? '✓ Published' : 'Draft'}
                </button>
                <button
                  onClick={() => deletePost(selectedPost.id)}
                  disabled={saving}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                >
                  Delete
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              placeholder="Slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />

            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">No Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Editor Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setEditMode('edit')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${editMode === 'edit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Edit3 className="h-4 w-4 inline mr-1" />
                Edit
              </button>
              <button
                onClick={() => setEditMode('preview')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${editMode === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Eye className="h-4 w-4 inline mr-1" />
                Preview
              </button>
            </div>

            {editMode === 'edit' ? (
              <div className="space-y-2">
                <div className="flex gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <button
                    onClick={() => insertMarkdown('**', '**')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('*', '*')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('## ')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="Heading"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('[Link](https://example.com)')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="Link"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('- ')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  id="content-editor"
                  placeholder="Write your post in Markdown. Use **bold**, *italic*, ## headings, [links](url), and - for lists"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-64 font-mono text-sm"
                />
                <p className="text-xs text-gray-500">Supports: **bold**, *italic*, ## headings, [links](url), - lists</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-64">
                {newContent ? (
                  <MarkdownPreview content={newContent} />
                ) : (
                  <p className="text-gray-500 text-sm">No content yet. Start writing in the Edit tab.</p>
                )}
              </div>
            )}

            <button
              onClick={updatePost}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">New Post</h3>
            <input
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              placeholder="Slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />

            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">No Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Editor Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setEditMode('edit')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${editMode === 'edit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Edit3 className="h-4 w-4 inline mr-1" />
                Edit
              </button>
              <button
                onClick={() => setEditMode('preview')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${editMode === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Eye className="h-4 w-4 inline mr-1" />
                Preview
              </button>
            </div>

            {editMode === 'edit' ? (
              <div className="space-y-2">
                <div className="flex gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <button
                    onClick={() => insertMarkdown('**', '**')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('*', '*')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('## ')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="Heading"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('[Link](https://example.com)')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="Link"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('- ')}
                    className="p-2 text-gray-600 hover:bg-white rounded"
                    title="List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  id="content-editor"
                  placeholder="Write your post in Markdown. Use **bold**, *italic*, ## headings, [links](url), and - for lists"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-64 font-mono text-sm"
                />
                <p className="text-xs text-gray-500">Supports: **bold**, *italic*, ## headings, [links](url), - lists</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-64">
                {newContent ? (
                  <MarkdownPreview content={newContent} />
                ) : (
                  <p className="text-gray-500 text-sm">No content yet. Start writing in the Edit tab.</p>
                )}
              </div>
            )}

            <button
              onClick={createPost}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </button>
          </div>
        )}

        {/* Categories */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Categories</h4>
          <div className="space-y-2 mb-4">
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-900">{cat.name}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={addCategory}
              disabled={saving}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
