import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductForm from '@/components/dashboard/ProductForm'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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

        console.log('Creating product...', { title, price, tenant_id: profile.tenant_id })

        // Use Admin Client to bypass RLS for now (Hotfix)
        const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const { error, data } = await adminClient.from('products').insert({
            tenant_id: profile.tenant_id,
            title,
            description,
            price,
            stock_quantity,
            image_url,
            images,
            category,
            options,
            is_active: true
        }).select()

        if (error) {
            console.error('Failed to create product:', error)
            return { success: false, error: 'Database Error: ' + error.message + ' (Code: ' + error.code + ')' }
        }

        console.log('Product created successfully:', data)

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
