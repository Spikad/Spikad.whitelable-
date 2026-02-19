'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Truck, Settings, LogOut, Store, LineChart, FileText, Newspaper, Users } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
    { name: 'Analytics', href: '/app/analytics', icon: LineChart },
    { name: 'Products', href: '/app/products', icon: ShoppingBag },
    { name: 'Orders', href: '/app/orders', icon: Truck },
    { name: 'Pages', href: '/app/pages', icon: FileText },
    { name: 'Blog', href: '/app/blog', icon: Newspaper },
    { name: 'Affiliates', href: '/app/affiliates', icon: Users },
    { name: 'Settings', href: '/app/settings', icon: Settings },
]

export default function Sidebar({ tenantSlug, userRole }: { tenantSlug?: string, userRole?: string }) {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-64 flex-col justify-between border-r border-gray-200 bg-white p-4">
            <div>
                <div className="mb-8 flex items-center px-2">
                    <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600">
                        <span className="font-bold text-white">S</span>
                    </div>
                    <span className="text-xl font-bold">Spikad</span>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-rose-50 text-rose-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <item.icon className={clsx('mr-3 h-5 w-5 flex-shrink-0', isActive ? 'text-rose-600' : 'text-gray-400')} />
                                {item.name}
                            </Link>
                        )
                    })}
                    {tenantSlug && (
                        <a
                            href={`https://${tenantSlug}.spikad.ai`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <Store className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                            View Shop
                        </a>
                    )}

                    {/* SUPER ADMIN LINK */}
                    {userRole === 'super_admin' && (
                        <Link
                            href="/admin"
                            className="flex items-center rounded-lg px-2 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 hover:text-purple-900 transition-colors mt-2"
                        >
                            <span className="mr-3 flex h-5 w-5 items-center justify-center font-bold">👑</span>
                            Wait, I'm Super Admin
                        </Link>
                    )}
                </nav>
            </div>

            <div className="border-t border-gray-200 pt-4">
                <button className="flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-900 transition-colors">
                    <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
