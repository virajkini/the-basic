'use client'

import { useState, useRef, useCallback } from 'react'
import imageCompression from 'browser-image-compression'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

interface FileWithPreview {
  file: File
  preview: string
  id: string
}

interface ImageUploadProps {
  maxFiles?: number
  existingCount?: number
  onUploadComplete?: (keys: string[]) => void
  onImagesChange?: (files: FileWithPreview[]) => void
  compact?: boolean
}

export default function ImageUpload({
  maxFiles = 5,
  existingCount = 0,
  onUploadComplete,
  onImagesChange,
  compact = false,
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const remainingSlots = maxFiles - existingCount - selectedFiles.length

  const generateId = () => Math.random().toString(36).substring(2, 15)

  const validateAndAddFiles = useCallback((files: File[]) => {
    setError(null)

    // Check remaining slots
    if (files.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}`)
      return
    }

    // Validate file types
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      setError('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    // Validate file sizes (max 10MB before compression)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError('Each image must be under 10MB')
      return
    }

    // Create preview URLs and add to selected files
    const newFiles: FileWithPreview[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: generateId(),
    }))

    const updatedFiles = [...selectedFiles, ...newFiles]
    setSelectedFiles(updatedFiles)
    onImagesChange?.(updatedFiles)
  }, [remainingSlots, selectedFiles, onImagesChange])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      validateAndAddFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(file =>
      allowedTypes.includes(file.type)
    )
    if (files.length > 0) {
      validateAndAddFiles(files)
    }
  }, [validateAndAddFiles])

  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      const updated = prev.filter(f => f.id !== id)
      onImagesChange?.(updated)
      return updated
    })
    setError(null)
  }

  const getFileType = (file: File): string => {
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') return 'jpeg'
    if (file.type === 'image/png') return 'png'
    if (file.type === 'image/webp') return 'webp'
    return 'jpeg'
  }

  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) {
      throw new Error('Please select at least one image')
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Compress images before uploading
      const compressedFiles = await Promise.all(
        selectedFiles.map(async ({ file }, index) => {
          const compressionOptions = {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: file.type as string,
          }

          const compressedFile = await imageCompression(file, compressionOptions)
          setUploadProgress(Math.round(((index + 1) / selectedFiles.length) * 30))

          return new File([compressedFile], file.name, {
            type: file.type,
            lastModified: Date.now(),
          })
        })
      )

      // Get presigned URLs
      const fileTypes = compressedFiles.map(file => getFileType(file))
      const typesParam = fileTypes.join(',')

      const presignResponse = await fetch(
        `${API_BASE}/files/presign?count=${compressedFiles.length}&types=${typesParam}`,
        { credentials: 'include' }
      )

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json()
        throw new Error(errorData.error || 'Failed to get upload URLs')
      }

      const { urls } = await presignResponse.json()
      setUploadProgress(40)

      // Upload each compressed file to S3
      const uploadedKeys: string[] = []
      for (let i = 0; i < compressedFiles.length; i++) {
        const file = compressedFiles[i]
        const { url, key } = urls[i]

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

        uploadedKeys.push(key)
        setUploadProgress(40 + Math.round(((i + 1) / compressedFiles.length) * 60))
      }

      // Clear selected files
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview))
      setSelectedFiles([])
      onImagesChange?.([])
      onUploadComplete?.(uploadedKeys)

      return uploadedKeys
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload images'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Expose upload function
  const triggerUpload = uploadImages

  return (
    <div className="w-full">
      {/* Drag & Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-myColor-500 bg-myColor-50'
            : remainingSlots > 0
            ? 'border-myColor-200 hover:border-myColor-300 bg-white'
            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={remainingSlots > 0 ? handleDrop : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || remainingSlots <= 0}
        />

        {remainingSlots > 0 ? (
          <>
            <div className="w-16 h-16 bg-myColor-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-myColor-700 font-medium mb-2">
              Drag & drop your photos here
            </p>
            <p className="text-myColor-500 text-sm mb-4">
              or click to browse (JPEG, PNG, WebP)
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-2.5 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-medium shadow-lg shadow-myColor-500/30 hover:shadow-xl hover:shadow-myColor-500/40 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Photos
            </button>
            <p className="text-myColor-400 text-xs mt-4">
              {remainingSlots} of {maxFiles} slots remaining
            </p>
          </>
        ) : (
          <p className="text-gray-500">Maximum {maxFiles} photos allowed</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Image Previews */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-myColor-900">
              Selected Photos ({selectedFiles.length})
            </h3>
            {!compact && (
              <button
                type="button"
                onClick={() => {
                  selectedFiles.forEach(f => URL.revokeObjectURL(f.preview))
                  setSelectedFiles([])
                  onImagesChange?.([])
                }}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {selectedFiles.map((fileData, index) => (
              <div key={fileData.id} className="relative group aspect-square">
                <div className="w-full h-full rounded-xl overflow-hidden border-2 border-myColor-100 bg-myColor-50">
                  <img
                    src={fileData.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(fileData.id)}
                  disabled={uploading}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Primary badge for first image */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-myColor-600 text-white text-xs rounded-md">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-myColor-700 font-medium">Uploading...</span>
            <span className="text-sm text-myColor-600">{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-myColor-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-myColor-500 to-myColor-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button - Only show if not compact mode */}
      {!compact && selectedFiles.length > 0 && !uploading && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={triggerUpload}
            className="px-8 py-3 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-semibold shadow-lg shadow-myColor-500/30 hover:shadow-xl hover:shadow-myColor-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}

// Export the upload function type for external use
export type { FileWithPreview }
