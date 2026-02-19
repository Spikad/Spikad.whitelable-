import { getTenant } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ site: string; slug: string }>
}) {
    const { site, slug } = await params
    const tenant = await getTenant(site)

    if (!tenant) return notFound()

    const supabase = await createClient()

    // Fetch the post
    const { data: post } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(name)')
        .eq('tenant_id', tenant.id)
        .eq('slug', slug)
        .single()

    if (!post || !post.published_at) {
        return notFound()
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header Image */}
            <div className="w-full h-64 md:h-96 bg-gray-100 relative overflow-hidden">
                {post.image_url ? (
                    <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-10" />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 text-white container mx-auto">
                    {post.blog_categories?.name && (
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                            {post.blog_categories.name}
                        </span>
                    )}
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">{post.title}</h1>
                    <div className="flex items-center text-white/80 gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(post.published_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl py-12">
                <Link href="/blog" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Blog
                </Link>

                <article className="prose prose-lg prose-blue max-w-none">
                    {/* 
                      Start with naive HTML rendering. 
                      Ideally we sanitize this or use a proper parser if it's complex 
                    */}
                    <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                </article>
            </div>
        </div>
    )
}
