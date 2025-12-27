'use client'

import { useState, useEffect, useRef } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

interface ImageFile {
  key: string
  url: string
  size?: number
  lastModified?: Date
}

export default function Dashboard() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fullScreenImage, setFullScreenImage] = useState<ImageFile | null>(null)
  const [thumbnailRect, setThumbnailRect] = useState<DOMRect | null>(null)
  const [clickedImageElement, setClickedImageElement] = useState<HTMLImageElement | null>(null)
  const fullScreenImageRef = useRef<HTMLImageElement>(null)
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    fetchImages()
  }, [])

  // Preload all images when they're loaded
  useEffect(() => {
    images.forEach((image) => {
      const img = new Image()
      img.src = image.url
    })
  }, [images])

  const fetchImages = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE}/files`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }

      const data = await response.json()
      if (data.success && data.files) {
        setImages(data.files)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  const deleteImage = async (key: string, e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent opening full screen when deleting
    
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      setDeleting(key)
      setError(null)

      const encodedKey = encodeURIComponent(key)
      const response = await fetch(`${API_BASE}/files/${encodedKey}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete image')
      }

      // Remove image from state
      setImages(prev => prev.filter(img => img.key !== key))
      
      // Close full screen if this image was open
      if (fullScreenImage?.key === key) {
        setFullScreenImage(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setDeleting(null)
    }
  }

  const openFullScreen = (image: ImageFile, event: React.MouseEvent<HTMLDivElement>) => {
    const container = event.currentTarget
    const imgElement = container.querySelector('img') as HTMLImageElement
    
    if (imgElement) {
      const rect = container.getBoundingClientRect()
      setThumbnailRect(rect)
      setClickedImageElement(imgElement)
      setFullScreenImage(image)
    }
  }

  const closeFullScreen = () => {
    setFullScreenImage(null)
    // Clear thumbnail rect and image element after animation completes
    setTimeout(() => {
      setThumbnailRect(null)
      setClickedImageElement(null)
    }, 400)
  }

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullScreenImage) {
        closeFullScreen()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [fullScreenImage])

  // Animate image expansion when full screen opens
  useEffect(() => {
    if (fullScreenImage && thumbnailRect && fullScreenImageRef.current && clickedImageElement) {
      const img = fullScreenImageRef.current
      const sourceImg = clickedImageElement
      
      // Use the same image source that's already loaded
      // Reset to thumbnail position first (matching the source image)
      img.style.left = `${thumbnailRect.left}px`
      img.style.top = `${thumbnailRect.top}px`
      img.style.width = `${thumbnailRect.width}px`
      img.style.height = `${thumbnailRect.height}px`
      img.style.transform = 'translate(0, 0)'
      img.style.borderRadius = '0.5rem'
      img.style.objectFit = 'cover'
      
      // Copy the exact visual state from source image
      if (sourceImg.complete) {
        // Force reflow to ensure initial state is rendered
        img.offsetHeight
        
        // Calculate final position and size
        requestAnimationFrame(() => {
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          const maxWidth = viewportWidth * 0.9
          const maxHeight = viewportHeight * 0.9
          
          // Get natural aspect ratio from source image
          const naturalAspectRatio = sourceImg.naturalWidth / sourceImg.naturalHeight
          const thumbnailAspectRatio = thumbnailRect.width / thumbnailRect.height
          
          // Calculate final size maintaining aspect ratio
          let finalWidth = maxWidth
          let finalHeight = finalWidth / naturalAspectRatio
          
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight
            finalWidth = finalHeight * naturalAspectRatio
          }
          
          // Calculate center position
          const centerX = viewportWidth / 2
          const centerY = viewportHeight / 2
          
          // Animate to final position
          img.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          img.style.left = `${centerX}px`
          img.style.top = `${centerY}px`
          img.style.width = `${finalWidth}px`
          img.style.height = `${finalHeight}px`
          img.style.transform = 'translate(-50%, -50%)'
          img.style.borderRadius = '0'
          img.style.objectFit = 'contain'
        })
      }
    }
  }, [fullScreenImage, thumbnailRect, clickedImageElement])

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-myColor-900">
            Dashboard
          </h1>
          <a
            href="/profile"
            className="px-6 py-2 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 transition-colors text-sm md:text-base font-medium"
          >
            Upload Photos
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-myColor-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-myColor-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-myColor-900 mb-2">
              Welcome to Amgel Jodi
            </h2>
            <p className="text-myColor-600 text-sm md:text-base">
              {images.length === 0 
                ? 'Upload photos to create your profile'
                : `You have ${images.length} photo${images.length !== 1 ? 's' : ''} in your profile`
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <a
              href="/profile"
              className="flex-1 px-6 py-3 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 transition-colors text-center font-medium text-sm md:text-base"
            >
              {images.length === 0 ? 'Upload Photos' : 'Manage Photos'}
            </a>
            <form action="/api/logout" method="post" className="flex-1">
              <button
                type="submit"
                className="w-full px-6 py-3 border-2 border-myColor-300 text-myColor-700 rounded-lg hover:border-myColor-400 hover:text-myColor-900 transition-colors font-medium text-sm md:text-base"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* Images Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-myColor-600">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg className="w-16 h-16 text-myColor-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-myColor-600 mb-4">No photos uploaded yet</p>
            <a
              href="/profile"
              className="inline-block px-6 py-2 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 transition-colors"
            >
              Upload Your First Photo
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-myColor-900 mb-4">
              Your Photos ({images.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div key={image.key} className="relative">
                  <div
                    className="aspect-square rounded-lg overflow-hidden border-2 border-myColor-200 cursor-pointer transition-transform hover:scale-105"
                    onClick={(e) => openFullScreen(image, e)}
                  >
                    <img
                      ref={(el) => {
                        if (el) {
                          imageRefs.current.set(image.key, el)
                        }
                      }}
                      src={image.url}
                      alt="Profile photo"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      // Preload on hover for instant expansion
                      onMouseEnter={(e) => {
                        const img = e.currentTarget
                        if (!img.complete) {
                          const preload = new Image()
                          preload.src = img.src
                        }
                      }}
                    />
                  </div>
                  {/* Delete Button - Always Visible */}
                  <button
                    type="button"
                    onClick={(e) => deleteImage(image.key, e)}
                    disabled={deleting === image.key}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:bg-red-600 transition-colors z-10"
                    title="Delete image"
                  >
                    {deleting === image.key ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Screen Image Viewer */}
        {fullScreenImage && thumbnailRect && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
            onClick={closeFullScreen}
            style={{
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeFullScreen}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
              title="Close (ESC)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Delete Button in Full Screen */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteImage(fullScreenImage.key, e)
              }}
              disabled={deleting === fullScreenImage.key}
              className="absolute top-4 left-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
              title="Delete image"
            >
              {deleting === fullScreenImage.key ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>

            {/* Full Screen Image - Animated from thumbnail position */}
            <img
              ref={fullScreenImageRef}
              src={fullScreenImage.url}
              alt="Profile photo"
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                objectFit: 'contain',
                zIndex: 60,
                pointerEvents: 'auto',
              }}
              // Ensure image is loaded before showing (use same src as thumbnail)
              onLoad={() => {
                // Image is loaded, animation will trigger via useEffect
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
