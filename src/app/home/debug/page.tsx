import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/tenant'

export default async function DebugPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams
    const domainToTest = typeof resolvedParams.test === 'string' ? resolvedParams.test : null

    const supabase = await createClient()

    // 1. Fetch all tenants
    const { data: tenants, error } = await supabase.from('tenants').select('*')

    // 2. Test getTenant if requested
    let testResult = null
    if (domainToTest) {
        console.log('[DebugPage] Testing domain:', domainToTest)
        try {
            testResult = await getTenant(domainToTest)
        } catch (e: any) {
            testResult = { error: e.message }
        }
    }

    // 3. Fetch Debug Info
    const envRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN

    return (
        <div className="p-8 font-mono text-sm max-w-4xl mx-auto">
            <h1 className="text-xl font-bold mb-4">Debug Console 🐞</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-gray-100 rounded">
                    <h2 className="font-bold">Environment</h2>
                    <p>NEXT_PUBLIC_ROOT_DOMAIN: <strong>{envRoot}</strong></p>
                </div>

                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <h2 className="font-bold mb-2">Test Tenant Lookup</h2>
                    <form className="flex gap-2">
                        <input
                            name="test"
                            defaultValue={domainToTest || ''}
                            placeholder="e.g. skarpast.spikad.ai"
                            className="flex-1 p-1 border rounded"
                        />
                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Check</button>
                    </form>
                    {domainToTest && (
                        <div className="mt-2 text-xs">
                            <p><strong>Testing:</strong> {domainToTest}</p>
                            <p><strong>Result:</strong> {testResult ? '✅ Found' : '❌ Not Found (Returns Null)'}</p>
                            {testResult && <pre className="mt-1 bg-white p-1 rounded overflow-x-auto">{JSON.stringify(testResult, null, 2)}</pre>}
                        </div>
                    )}
                </div>
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

            <p className="text-gray-500 text-xs">
                To access this page: Visit <code>{envRoot}/debug</code> or <code>www.{envRoot}/debug</code>
            </p>
        </div>
    )
}
