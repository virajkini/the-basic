'use client'

import { useEffect, useState, useRef } from 'react'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const MOBILE_BREAKPOINT = 768

interface FullProfile {
  _id: string
  firstName: string
  lastName: string
  age: number
  nativePlace: string
  height: string
  workingStatus: boolean
  company: string | null
  designation: string | null
  workLocation: string | null
  salaryRange: string | null
  aboutMe: string | null
  verified: boolean
  images: string[]
}

interface ProfileDetailViewProps {
  profileId: string
  images: string[]
  onClose: () => void
}

// In-memory cache for profile data
const profileCache = new Map<string, FullProfile>()

export default function ProfileDetailView({ profileId, images, onClose }: ProfileDetailViewProps) {
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const imageScrollRef = useRef<HTMLDivElement>(null)

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  // Fetch full profile data (with caching)
  useEffect(() => {
    const fetchProfile = async () => {
      // Check cache first
      const cached = profileCache.get(profileId)
      if (cached) {
        setProfile({ ...cached, images })
        setLoading(false)
        return
      }

      try {
        const response = await authFetch(`${API_BASE}/profiles/view/${profileId}`)

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json()
        profileCache.set(profileId, data.profile)
        setProfile({ ...data.profile, images })
      } catch (err) {
        if (err instanceof Error && err.message !== 'Session expired') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [profileId, images])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Handle image scroll
  const handleImageScroll = () => {
    if (imageScrollRef.current) {
      const scrollLeft = imageScrollRef.current.scrollLeft
      const width = imageScrollRef.current.offsetWidth
      const newIndex = Math.round(scrollLeft / width)
      setCurrentImageIndex(Math.min(newIndex, images.length - 1))
    }
  }

  // Scroll to specific image
  const scrollToImage = (index: number) => {
    if (imageScrollRef.current) {
      const width = imageScrollRef.current.offsetWidth
      imageScrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      })
    }
  }

  // Shimmer skeleton component
  const Shimmer = ({ className }: { className: string }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  )

  // Render shimmer skeleton for profile details
  const renderDetailsSkeleton = () => (
    <div className={`p-5 space-y-4 ${!isMobile ? 'flex-1 overflow-y-auto' : ''}`}>
      {/* Basic Info Row Skeleton */}
      <div className="flex flex-wrap gap-3">
        <Shimmer className="h-9 w-20 rounded-xl" />
        <Shimmer className="h-9 w-32 rounded-xl" />
      </div>

      {/* Work Details Skeleton */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Shimmer className="w-5 h-5 rounded" />
          <div className="flex-1">
            <Shimmer className="h-3 w-16 mb-2" />
            <Shimmer className="h-4 w-40" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Shimmer className="w-5 h-5 rounded" />
          <div className="flex-1">
            <Shimmer className="h-3 w-20 mb-2" />
            <Shimmer className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Shimmer className="w-5 h-5 rounded" />
          <div className="flex-1">
            <Shimmer className="h-3 w-24 mb-2" />
            <Shimmer className="h-4 w-28" />
          </div>
        </div>
      </div>

      {/* About Skeleton */}
      <div className="pt-3 border-t border-gray-100">
        <Shimmer className="h-3 w-12 mb-3" />
        <Shimmer className="h-4 w-full mb-2" />
        <Shimmer className="h-4 w-3/4" />
      </div>
    </div>
  )

  // Render content (shared between mobile and desktop)
  const renderContent = () => {
    return (
      <div className={`flex-1 overflow-y-auto ${!isMobile ? 'flex' : ''}`}>
        {/* Image Carousel - Always shown immediately */}
        <div className={`relative bg-gray-100 flex-shrink-0 ${isMobile ? 'aspect-[4/5]' : 'w-[380px] min-h-[500px]'}`}>
          {images.length > 0 ? (
            <>
              <div
                ref={imageScrollRef}
                onScroll={handleImageScroll}
                className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((url, idx) => (
                  <div key={idx} className="flex-shrink-0 w-full h-full snap-center">
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Carousel Indicators */}
              {images.length > 1 && (
                <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToImage(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentImageIndex
                          ? 'bg-white w-6 shadow'
                          : 'bg-white/50 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

              {/* Name overlay on image - show skeleton while loading */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                {loading ? (
                  <>
                    <Shimmer className="h-7 w-48 mb-2 bg-white/30" />
                    <Shimmer className="h-4 w-32 bg-white/30" />
                  </>
                ) : profile ? (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">
                        {profile.firstName} {profile.lastName}, {profile.age}
                      </h2>
                      {profile.verified && (
                        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-white/90 text-sm mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{profile.nativePlace}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Profile Details - Show skeleton while loading, error, or actual content */}
        {error ? (
          <div className="flex items-center justify-center p-8 text-red-500 text-center">
            {error}
          </div>
        ) : loading ? (
          renderDetailsSkeleton()
        ) : profile ? (
          <div className={`p-5 space-y-4 ${!isMobile ? 'flex-1 overflow-y-auto' : ''}`}>
            {/* Basic Info Row */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="text-gray-700">{profile.height}</span>
              </div>

              {profile.workingStatus && profile.designation && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">{profile.designation}</span>
                </div>
              )}
            </div>

            {/* Work Details */}
            {profile.workingStatus && (
              <div className="space-y-3">
                {profile.company && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-gray-800">{profile.company}</p>
                    </div>
                  </div>
                )}

                {profile.workLocation && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Work Location</p>
                      <p className="text-gray-800">{profile.workLocation}</p>
                    </div>
                  </div>
                )}

                {profile.salaryRange && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Salary Range</p>
                      <p className="text-gray-800">{profile.salaryRange}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!profile.workingStatus && (
              <p className="text-gray-500 text-sm">Not currently working</p>
            )}

            {/* About Me */}
            {profile.aboutMe && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">About</p>
                <p className="text-gray-700 leading-relaxed">{profile.aboutMe}</p>
              </div>
            )}

            <div className="h-6" />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {isMobile ? (
        /* Mobile: Bottom Sheet */
        <div
          className={`absolute inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[95vh] overflow-hidden flex flex-col transition-transform duration-200 ${
            isVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {renderContent()}
        </div>
      ) : (
        /* Desktop: Centered Modal */
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div
            className={`relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-[800px] w-full max-h-[85vh] flex flex-col transition-all duration-200 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {renderContent()}
          </div>
        </div>
      )}
    </div>
  )
}
