'use client'

import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

interface FileWithPreview extends File {
  preview?: string
}

export default function Profile() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Allowed image types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxFiles = 5

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError(null)
    setSuccess(false)

    // Validate file count
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed. You selected ${files.length} but can only add ${maxFiles - selectedFiles.length} more.`)
      return
    }

    // Validate file types
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s). Only JPEG, PNG, and WebP images are allowed.`)
      return
    }

    // Create preview URLs and add to selected files
    const filesWithPreview = files.map(file => {
      const fileWithPreview: FileWithPreview = file
      fileWithPreview.preview = URL.createObjectURL(file)
      return fileWithPreview
    })

    setSelectedFiles(prev => [...prev, ...filesWithPreview])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Revoke preview URL to free memory
      if (prev[index].preview) {
        URL.revokeObjectURL(prev[index].preview)
      }
      return newFiles
    })
    setError(null)
  }

  const getFileType = (file: File): string => {
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') return 'jpeg'
    if (file.type === 'image/png') return 'png'
    if (file.type === 'image/webp') return 'webp'
    return 'jpeg'
  }

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image to upload')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      // Compress images before uploading
      const compressedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const compressionOptions = {
            maxSizeMB: 1.5, // Maximum file size in MB
            maxWidthOrHeight: 1200, // Maximum width or height
            useWebWorker: true, // Use web worker for better performance
            fileType: file.type, // Preserve original file type
          }
          
          const compressedFile = await imageCompression(file, compressionOptions)
          
          // Create a new File object with the compressed blob, preserving the original name and type
          return new File([compressedFile], file.name, {
            type: file.type,
            lastModified: Date.now(),
          })
        })
      )

      // Get presigned URLs from API using compressed file types
      const fileTypes = compressedFiles.map(file => getFileType(file))
      const typesParam = fileTypes.join(',')
      
      const presignResponse = await fetch(
        `${API_BASE}/files/presign?count=${compressedFiles.length}&types=${typesParam}`,
        {
          credentials: 'include',
        }
      )

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json()
        throw new Error(errorData.error || 'Failed to get upload URLs')
      }

      const { urls } = await presignResponse.json()

      // Upload each compressed file to S3 using presigned URLs
      const uploadPromises = compressedFiles.map(async (file, index) => {
        const { url, key } = urls[index]
        
        const uploadResponse = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return key
      })

      await Promise.all(uploadPromises)

      // Clear selected files
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
      setSelectedFiles([])
      setSuccess(true)
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-myColor-900 mb-6">Profile Photos</h1>
      
      <div className="bg-white p-6 rounded-lg shadow max-w-4xl">
        <div className="mb-6">
          <p className="text-myColor-600 mb-4">
            Upload up to {maxFiles} photos. Allowed formats: JPEG, PNG, WebP
          </p>
          
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || selectedFiles.length >= maxFiles}
          />

          {/* Select Files Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || selectedFiles.length >= maxFiles}
            className="px-6 py-2 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedFiles.length >= maxFiles ? 'Maximum files selected' : 'Select Images'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            Images uploaded successfully! Redirecting to dashboard...
          </div>
        )}

        {/* Image Previews */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-myColor-900 mb-4">
              Selected Images ({selectedFiles.length}/{maxFiles})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-myColor-200">
                    <img
                      src={file.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="mt-1 text-xs text-myColor-600 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={uploadImages}
              disabled={uploading}
              className="px-8 py-3 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? 'Uploading...' : 'Upload Images'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
