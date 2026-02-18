'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function ImageUploader({
    onUploadComplete,
    defaultValue = '',
    path
}: {
    onUploadComplete: (url: string) => void;
    defaultValue?: string;
    path: string; // e.g. "products"
}) {
    const [imageUrl, setImageUrl] = useState(defaultValue)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            // Upload to Supabase Storage
            const { error: uploadError, data } = await supabase.storage
                .from('tenant-assets')
                .upload(fileName, file)

            if (uploadError) {
                throw uploadError
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('tenant-assets')
                .getPublicUrl(fileName)

            setImageUrl(publicUrl)
            onUploadComplete(publicUrl)

        } catch (err: any) {
            console.error('Upload failed:', err)
            setError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }, [path, onUploadComplete])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        multiple: false
    })

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent dropzone click
        setImageUrl('')
        onUploadComplete('')
    }

    // Determine preview to show
    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors
                    ${isDragActive ? 'border-rose-500 bg-rose-50' : 'border-gray-300'}
                    ${error ? 'border-red-500 bg-red-50' : ''}
                `}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="w-8 h-8 mb-2 animate-spin text-rose-500" />
                        <p className="text-sm">Uploading...</p>
                    </div>
                ) : imageUrl ? (
                    <div className="relative w-full h-full p-2 group">
                        <div className="relative w-full h-full overflow-hidden rounded-md">
                            <img
                                src={imageUrl}
                                alt="Uploaded preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={removeImage}
                            type="button"
                            className="absolute top-3 right-3 p-1 bg-white rounded-full shadow-md text-gray-500 hover:text-red-500 hover:bg-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                        <Upload className={`w-8 h-8 mb-3 ${isDragActive ? 'text-rose-500' : 'text-gray-400'}`} />
                        <p className="mb-2 text-sm">
                            <span className="font-semibold text-rose-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG, WEBP (MAX. 5MB)</p>
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    )
}
