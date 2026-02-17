'use client'

import { useState } from 'react'

export default function ImageUploader({
    value,
    onChange,
    disabled
}: {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean
}) {
    // Placeholder implementation
    return (
        <div className="border border-dashed p-4 rounded text-center">
            <p className="text-sm text-gray-500">Image Uploader Placeholder</p>
            {value && <p className="text-xs text-blue-500 mt-2">Current: {value}</p>}
        </div>
    )
}
