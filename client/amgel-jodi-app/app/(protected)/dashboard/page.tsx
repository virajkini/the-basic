'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

interface Profile {
  _id: string
  firstName: string
  lastName: string
  name: string
  gender: string
  dob: string
  age: number
  nativePlace: string
  height: string
  workingStatus: boolean
  company?: string
  designation?: string
  verified: boolean
}

interface ImageFile {
  key: string
  url: string
  size?: number
  lastModified?: Date
}

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [images, setImages] = useState<ImageFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fullScreenImage, setFullScreenImage] = useState<ImageFile | null>(null)
  const [thumbnailRect, setThumbnailRect] = useState<DOMRect | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fullScreenImageRef = useRef<HTMLImageElement>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (user?.userId && !hasFetched.current) {
      hasFetched.current = true
      fetchData()
    }
  }, [user?.userId])

  const fetchData = async () => {
    if (!user?.userId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch profile and images in parallel
      const [profileRes, imagesRes] = await Promise.all([
        fetch(`${API_BASE}/profiles/${user.userId}`, {
          credentials: 'include',
        }),
        fetch(`${API_BASE}/files`, {
          credentials: 'include',
        }),
      ])

      // Handle profile response
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success && profileData.profile) {
          setProfile(profileData.profile)
        }
      }
      // 404 means no profile yet, which is fine

      // Handle images response
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json()
        if (imagesData.success && imagesData.files) {
          setImages(imagesData.files)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const deleteImage = async (key: string, e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    try {
      setDeleting(key)
      const encodedKey = encodeURIComponent(key)
      const response = await fetch(`${API_BASE}/files/${encodedKey}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      setImages(prev => prev.filter(img => img.key !== key))
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
    const rect = container.getBoundingClientRect()
    setThumbnailRect(rect)
    setFullScreenImage(image)
  }

  const closeFullScreen = () => {
    setFullScreenImage(null)
    setTimeout(() => setThumbnailRect(null), 400)
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

  // Animate full screen image
  useEffect(() => {
    if (fullScreenImage && thumbnailRect && fullScreenImageRef.current) {
      const img = fullScreenImageRef.current
      img.style.left = `${thumbnailRect.left}px`
      img.style.top = `${thumbnailRect.top}px`
      img.style.width = `${thumbnailRect.width}px`
      img.style.height = `${thumbnailRect.height}px`
      img.style.transform = 'translate(0, 0)'
      img.style.borderRadius = '0.75rem'
      img.style.objectFit = 'cover'
      img.offsetHeight

      requestAnimationFrame(() => {
        const maxWidth = window.innerWidth * 0.9
        const maxHeight = window.innerHeight * 0.9
        img.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        img.style.left = '50%'
        img.style.top = '50%'
        img.style.width = `${Math.min(maxWidth, 800)}px`
        img.style.height = 'auto'
        img.style.maxHeight = `${maxHeight}px`
        img.style.transform = 'translate(-50%, -50%)'
        img.style.borderRadius = '0'
        img.style.objectFit = 'contain'
      })
    }
  }, [fullScreenImage, thumbnailRect])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-4 border-myColor-200 border-t-myColor-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-myColor-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // No profile - Show Register Now
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center animate-fade-in-up">
            {/* Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-myColor-100 to-myColor-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-myColor-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-myColor-900 mb-4">
              Welcome to Amgel Jodi
            </h1>
            <p className="text-lg text-myColor-600 mb-8 max-w-xl mx-auto">
              Your journey to finding your perfect life partner begins here.
              Create your profile to connect with the GSB Konkani community.
            </p>

            <Link
              href="/profile"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-semibold text-lg shadow-xl shadow-myColor-500/30 hover:shadow-2xl hover:shadow-myColor-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Register Now</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-myColor-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-myColor-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6 text-myColor-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-myColor-900 mb-1">Verified Profiles</h3>
                <p className="text-sm text-myColor-500">Authentic community members</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-myColor-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6 text-myColor-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-myColor-900 mb-1">Secure & Private</h3>
                <p className="text-sm text-myColor-500">Your data is protected</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-myColor-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6 text-myColor-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-myColor-900 mb-1">GSB Konkani Focus</h3>
                <p className="text-sm text-myColor-500">Built for our community</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Has profile - Show Welcome Back
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
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

        {/* Welcome Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-6 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Profile Photo or Placeholder */}
            <div className="flex-shrink-0">
              {images.length > 0 ? (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-myColor-200 shadow-lg">
                  <img
                    src={images[0].url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-myColor-100 to-myColor-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Welcome Text */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-myColor-900 mb-2">
                Welcome back, {profile.firstName}!
              </h1>
              <p className="text-myColor-600">
                {profile.age} years old • {profile.nativePlace}
                {profile.workingStatus && profile.designation && (
                  <span> • {profile.designation}</span>
                )}
              </p>
              {!profile.verified && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Profile pending verification
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href="/profile"
                className="px-5 py-2.5 bg-myColor-100 text-myColor-700 rounded-xl font-medium hover:bg-myColor-200 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in-up delay-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-myColor-900">
              Your Photos ({images.length}/5)
            </h2>
            {images.length < 5 && (
              <Link
                href="/profile"
                className="text-myColor-600 hover:text-myColor-800 font-medium text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Photos
              </Link>
            )}
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-myColor-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-myColor-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-myColor-600 mb-4">No photos uploaded yet</p>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-medium shadow-lg shadow-myColor-500/30 hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Photos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <div key={image.key} className="relative group">
                  <div
                    className="aspect-square rounded-xl overflow-hidden border-2 border-myColor-100 cursor-pointer transition-all duration-300 hover:border-myColor-300 hover:shadow-lg hover:scale-105"
                    onClick={(e) => openFullScreen(image, e)}
                  >
                    <img
                      src={image.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => deleteImage(image.key, e)}
                    disabled={deleting === image.key}
                    className="absolute top-2 left-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50 z-10"
                    title="Delete photo"
                  >
                    {deleting === image.key ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                  {/* Primary badge */}
                  {index === 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-myColor-600 text-white text-xs rounded-md shadow">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full Screen Image Viewer */}
        {fullScreenImage && thumbnailRect && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={closeFullScreen}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <button
              onClick={closeFullScreen}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2"
              title="Close (ESC)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteImage(fullScreenImage.key, e)
              }}
              disabled={deleting === fullScreenImage.key}
              className="absolute top-4 left-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors disabled:opacity-50 z-10"
              title="Delete photo"
            >
              {deleting === fullScreenImage.key ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>

            <img
              ref={fullScreenImageRef}
              src={fullScreenImage.url}
              alt="Full size"
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'fixed', zIndex: 60 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
