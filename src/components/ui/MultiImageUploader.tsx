'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Plus } from 'lucide-react'

interface MultiImageUploaderProps {
    onImagesChange: (urls: string[]) => void
    defaultImages?: string[]
    path: string
}

export default function MultiImageUploader({
    onImagesChange,
    defaultImages = [],
    path
}: MultiImageUploaderProps) {
    const [images, setImages] = useState<string[]>(defaultImages)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        setUploading(true)
        setError(null)
        const newUrls: string[] = []

        try {
            const supabase = createClient()

            // Upload all files in parallel
            const uploadPromises = acceptedFiles.map(async (file) => {
                const fileExt = file.name.split('.').pop()
                const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                console.log('Uploading:', fileName)

                const { error: uploadError } = await supabase.storage
                    .from('tenant-assets')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('tenant-assets')
                    .getPublicUrl(fileName)

                return publicUrl
            })

            const uploadedUrls = await Promise.all(uploadPromises)

            // Update state
            const updatedImages = [...images, ...uploadedUrls]
            setImages(updatedImages)
            onImagesChange(updatedImages)

        } catch (err: any) {
            console.error('Upload failed:', err)
            setError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }, [path, images, onImagesChange])

    const removeImage = (indexToRemove: number) => {
        const updatedImages = images.filter((_, index) => index !== indexToRemove)
        setImages(updatedImages)
        onImagesChange(updatedImages)
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        multiple: true
    })

    return (
        <div className="w-full space-y-4">
            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {images.map((url, index) => (
                        <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={url}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`
                    relative flex flex-col items-center justify-center w-full h-32 
                    border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${isDragActive ? 'border-rose-500 bg-rose-50' : 'border-gray-300 hover:bg-gray-50'}
                    ${error ? 'border-red-500 bg-red-50' : ''}
                `}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="w-6 h-6 mb-2 animate-spin text-rose-500" />
                        <p className="text-sm">Uploading...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                        <Plus className={`w-8 h-8 mb-2 ${isDragActive ? 'text-rose-500' : 'text-gray-400'}`} />
                        <p className="text-sm">
                            <span className="font-semibold text-rose-600">Click to upload</span> or drag images
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}
