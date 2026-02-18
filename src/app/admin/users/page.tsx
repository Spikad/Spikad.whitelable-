import { createClient } from '@/lib/supabase/server'
import { Check, X } from 'lucide-react'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // Fetch all profiles (requires RLS policy for Super Admin)
    const { data: users } = await supabase
        .from('profiles')
        .select(`
            *,
            tenants (
                name,
                slug
            )
        `)
        .order('created_at', { ascending: false })

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Platform Users</h1>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {(!users || users.length === 0) ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No users found (or RLS Restricted).
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                {user.email?.[0].toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'tenant_owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.tenants ? (
                                            <span className="text-gray-900 font-medium">{user.tenants.name}</span>
                                        ) : (
                                            <span className="text-gray-400 italic">None</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
