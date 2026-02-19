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

    // Fetch Product with Service Settings
    const { data: product } = await supabase
        .from('products')
        .select('*, service_settings(*)')
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
        const product_type = formData.get('product_type') as string || 'physical'

        // Safely parse JSON arrays
        let images = []
        try { images = JSON.parse(formData.get('images') as string || '[]') } catch (e) { }

        let options = []
        try { options = JSON.parse(formData.get('options') as string || '[]') } catch (e) { }

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
                options,
                product_type
            })
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)

        if (error) throw new Error('Failed to update product')

        // SERVICE LOGIC: Upsert settings
        if (product_type === 'service') {
            const duration = parseInt(formData.get('duration_minutes') as string) || 60
            const buffer = parseInt(formData.get('buffer_time_minutes') as string) || 0

            // We use upsert because the row might not exist yet if converted from physical
            const { error: serviceError } = await supabase.from('service_settings').upsert({
                product_id: id,
                duration_minutes: duration,
                buffer_time_minutes: buffer
            }, { onConflict: 'product_id' })

            if (serviceError) console.error('Failed to update service settings', serviceError)
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
