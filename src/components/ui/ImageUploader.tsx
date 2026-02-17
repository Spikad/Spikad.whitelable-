'use client'

import { useState } from 'react'

export default function ImageUploader({
    onUploadComplete,
    defaultValue = '',
    path
}: {
    onUploadComplete: (url: string) => void;
    defaultValue?: string;
    path: string;
}) {
    const [value, setValue] = useState(defaultValue)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setValue(val)
        onUploadComplete(val)
    }

    // Placeholder implementation
    return (
        <div className="border border-dashed p-4 rounded text-center">
            <p className="text-sm text-gray-500 mb-2">Image Uploader ({path})</p>
            <input
                type="text"
                placeholder="Paste image URL here"
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-rose-500 focus:ring-rose-500"
                value={value}
                onChange={handleChange}
            />
            {value && (
                <div className="mt-2 text-xs text-gray-500">
                    Preview: <img src={value} alt="Preview" className="h-10 w-10 object-cover inline-block ml-2 rounded" />
                </div>
            )}
        </div>
    )
}
