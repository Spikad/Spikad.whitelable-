import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductForm from '@/components/dashboard/ProductForm'
import { revalidatePath } from 'next/cache'

export default async function NewProductPage() {

    async function createProduct(formData: FormData) {
        'use server'

        const supabase = await createClient()

        // Get Current User Tenant
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error('Unauthorized')
        }

        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
        if (!profile?.tenant_id) {
            throw new Error('No Tenant Found')
        }

        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const price = parseFloat(formData.get('price') as string)
        const stock_quantity = parseInt(formData.get('stock_quantity') as string)
        const image_url = formData.get('image_url') as string

        const { error } = await supabase.from('products').insert({
            tenant_id: profile.tenant_id,
            title,
            description,
            price,
            stock_quantity,
            image_url,
            is_active: true
        })

        if (error) {
            throw new Error('Failed to create product')
        }

        revalidatePath('/app/products')
        redirect('/app/products')
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <ProductForm action={createProduct} />
            </div>
        </div>
    )
}
