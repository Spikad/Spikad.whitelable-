import { getTenant } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function BlogIndexPage({
    params,
}: {
    params: Promise<{ site: string }>
}) {
    const { site } = await params
    const tenant = await getTenant(site)

    if (!tenant) return notFound()

    const supabase = await createClient()

    // Fetch published posts
    const { data: posts } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(name)')
        .eq('tenant_id', tenant.id)
        .not('published_at', 'is', null) // Only published
        .order('published_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h1>
                    <p className="text-lg text-gray-600">Latest news, updates, and stories from {tenant.name}.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts?.map((post) => (
                        <Link href={`/blog/${post.slug}`} key={post.id} className="group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                            {post.image_url ? (
                                <div className="h-48 overflow-hidden bg-gray-100">
                                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                </div>
                            ) : (
                                <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                                    <span className="text-4xl">📝</span>
                                </div>
                            )}
                            <div className="p-6 flex flex-col flex-1">
                                {post.blog_categories?.name && (
                                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
                                        {post.blog_categories.name}
                                    </span>
                                )}
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {post.title}
                                </h3>
                                <div className="mt-auto pt-4 flex items-center text-sm text-gray-500">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {new Date(post.published_at!).toLocaleDateString()}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {(!posts || posts.length === 0) && (
                        <div className="col-span-full text-center py-20 text-gray-500">
                            No posts published yet. Check back soon!
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
