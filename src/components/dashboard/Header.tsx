'use client'

import { Bell, User } from 'lucide-react'

export default function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
            <div className="flex items-center">
                {/* Breadcrumbs or Title could go here */}
                <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
            </div>

            <div className="flex items-center space-x-4">
                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                    <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">
                        JD
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">John Doe</span>
                </div>
            </div>
        </header>
    )
}
