import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProductForm from '@/components/dashboard/ProductForm'
import { revalidatePath } from 'next/cache'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Auth & Tenant Security Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) redirect('/onboarding')

    // Fetch Product ensuring it belongs to tenant
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!product) notFound()

    async function updateProduct(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const price = parseFloat(formData.get('price') as string)
        const stock_quantity = parseInt(formData.get('stock_quantity') as string)
        const image_url = formData.get('image_url') as string
        const category = formData.get('category') as string

        let images = []
        try {
            images = JSON.parse(formData.get('images') as string || '[]')
        } catch (e) {
            console.error('Failed to parse images', e)
        }

        let options = []
        try {
            options = JSON.parse(formData.get('options') as string || '[]')
        } catch (e) {
            console.error('Failed to parse options', e)
        }

        if (!profile?.tenant_id) {
            throw new Error('Unauthorized')
        }

        const { error } = await supabase
            .from('products')
            .update({
                title,
                description,
                price,
                stock_quantity,
                image_url,
                images,
                category,
                options
            })
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id) // Extra safety

        if (error) {
            throw new Error('Failed to update product')
        }

        revalidatePath('/app/products')
        redirect('/app/products')
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <ProductForm product={product} action={updateProduct} />
            </div>
        </div>
    )
}
