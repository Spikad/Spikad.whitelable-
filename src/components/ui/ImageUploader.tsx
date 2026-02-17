'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ImageUploaderProps {
    bucket?: string
    path?: string // e.g. 'products' or 'logos'
    onUploadComplete: (url: string) => void
    defaultValue?: string
    className?: string
}

export default function ImageUploader({
    bucket = 'tenant-assets',
    path = 'uploads',
    onUploadComplete,
    defaultValue = '',
    className = '',
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string>(defaultValue)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            const supabase = createClient()

            const fileExt = file.name.split('.').pop()
            const fileName = `${path}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file)

            if (uploadError) {
                throw uploadError
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName)

            setPreview(publicUrl)
            onUploadComplete(publicUrl)
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error uploading image')
        } finally {
            setUploading(false)
        }
    }

    const handleRemove = () => {
        setPreview('')
        onUploadComplete('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className={className}>
            <input
                type="file"
                id="image-upload"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
                disabled={uploading}
            />

            {preview ? (
                <div className="relative aspect-square w-32 overflow-hidden rounded-lg border border-gray-200">
                    <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-gray-500 hover:bg-white hover:text-red-500"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex aspect-square w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                    {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    ) : (
                        <>
                            <Upload className="mb-2 h-6 w-6 text-gray-400" />
                            <span className="text-xs font-medium">Upload</span>
                        </>
                    )}
                </button>
            )}
        </div>
    )
}
