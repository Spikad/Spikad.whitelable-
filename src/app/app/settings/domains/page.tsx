'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Globe, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DomainSettingsPage() {
    const [domain, setDomain] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [currentDomain, setCurrentDomain] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        // Fetch current setting
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
            if (profile) {
                const { data: tenant } = await supabase.from('tenants').select('custom_domain, domain_verified').eq('id', profile.tenant_id).single()
                setCurrentDomain(tenant)
                if (tenant?.custom_domain) setDomain(tenant.custom_domain)
            }
        }
        fetchSettings()
    }, [supabase])

    const handleVerify = async () => {
        setStatus('loading')
        try {
            const res = await fetch('/api/domains/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
            })
            const data = await res.json()

            if (data.verified) {
                setStatus('success')
                setCurrentDomain({ custom_domain: domain, domain_verified: true })
            } else {
                setStatus('error')
            }
        } catch (e) {
            setStatus('error')
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <Link href="/app/settings" className="p-2 rounded-full hover:bg-gray-100 transition">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Custom Domain</h1>
                    <p className="text-gray-500">Connect your own domain (e.g. mystore.com).</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                {currentDomain?.domain_verified ? (
                    <div className="text-center space-y-4">
                        <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Your domain is active!</h3>
                        <p className="text-gray-500">
                            Your store is live at <a href={`https://${currentDomain.custom_domain}`} target="_blank" className="text-rose-600 font-medium underline">{currentDomain.custom_domain}</a>
                        </p>
                        <button
                            onClick={() => {
                                if (confirm('Remove domain?')) {
                                    // Logic to remove...
                                    alert('To remove, please contact support or update DB manually for now.')
                                }
                            }}
                            className="text-sm text-gray-400 hover:text-gray-600 underline"
                        >
                            Disconnect Domain
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                            <h4 className="font-bold mb-2 flex items-center"><Globe className="h-4 w-4 mr-2" /> DNS Configuration</h4>
                            <p className="mb-2">To connect your domain, log in to your domain provider (GoDaddy, Namecheap, etc.) and add the following record:</p>
                            <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
                                <li><strong>Type:</strong> CNAME</li>
                                <li><strong>Name:</strong> @ (or www)</li>
                                <li><strong>Value:</strong> cname.vercel-dns.com</li>
                            </ul>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Domain</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="mystore.com"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                />
                                <button
                                    onClick={handleVerify}
                                    disabled={status === 'loading' || !domain}
                                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 min-w-[120px]"
                                >
                                    {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                                </button>
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className="flex items-center text-red-600 text-sm mt-2">
                                <XCircle className="h-4 w-4 mr-1" />
                                Could not verify DNS configuration. Please check your provider settings and try again (propagation can take up to 24h).
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
