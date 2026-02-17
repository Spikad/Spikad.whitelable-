'use client'

import { Bell } from 'lucide-react'

export default function AdminHeader() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
            <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-800">Admin Console</h2>
            </div>

            <div className="flex items-center space-x-4">
                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                    <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                        SA
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">Super Admin</span>
                </div>
            </div>
        </header>
    )
}
