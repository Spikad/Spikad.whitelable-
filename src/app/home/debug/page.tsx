import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
    const supabase = await createClient()

    // 1. Fetch all tenants
    const { data: tenants, error } = await supabase.from('tenants').select('*')

    // 2. Fetch Debug Info
    const envRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Debug Console 🐞</h1>

            <div className="mb-8 p-4 bg-gray-100 rounded">
                <h2 className="font-bold">Environment</h2>
                <p>NEXT_PUBLIC_ROOT_DOMAIN: <strong>{envRoot}</strong></p>
            </div>

            <div className="mb-8">
                <h2 className="font-bold mb-2">Tenants in DB ({tenants?.length || 0})</h2>
                {error && <p className="text-red-500">Error: {error.message}</p>}

                <table className="min-w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border p-2">ID</th>
                            <th className="border p-2">Name</th>
                            <th className="border p-2">Slug (Exact)</th>
                            <th className="border p-2">Slug Length</th>
                            <th className="border p-2">Custom Domain</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants?.map(t => (
                            <tr key={t.id}>
                                <td className="border p-2">{t.id}</td>
                                <td className="border p-2 flex items-center">
                                    {t.name}
                                    <span className="ml-2 w-3 h-3 rounded-full" style={{ background: t.primary_color }}></span>
                                </td>
                                <td className="border p-2 bg-yellow-50">"{t.slug}"</td>
                                <td className="border p-2">{t.slug.length}</td>
                                <td className="border p-2">{t.custom_domain || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-gray-500">
                Visit <a href={`https://skarpast.${envRoot}`} className="text-blue-600 underline">https://skarpast.{envRoot}</a> to test.
            </p>
        </div>
    )
}
