'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Store, Settings, LogOut } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Tenants', href: '/admin/tenants', icon: Store },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
    const pathname = usePathname()

    // Helper to check active state more accurately for nested routes
    const isActiveLink = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    }

    return (
        <div className="flex h-screen w-64 flex-col justify-between border-r border-zinc-800 bg-zinc-900 p-4 text-white">
            <div>
                <div className="mb-8 flex items-center px-2">
                    <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
                        <span className="font-bold text-white">A</span>
                    </div>
                    <span className="text-xl font-bold">Spikad Admin</span>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = isActiveLink(item.href)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-orange-500 text-white'
                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                )}
                            >
                                <item.icon className={clsx('mr-3 h-5 w-5 flex-shrink-0', isActive ? 'text-white' : 'text-zinc-500')} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t border-zinc-800 pt-4">
                <button className="flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
                    <LogOut className="mr-3 h-5 w-5 text-zinc-500" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
