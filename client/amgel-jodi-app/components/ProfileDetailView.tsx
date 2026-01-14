'use client'

import { useEffect, useState, memo, useCallback, useRef } from 'react'
import { useProfileData } from '../hooks/useProfileData'
import ImageCarousel from './ImageCarousel'
import ConnectionButton from './ConnectionButton'
import Shimmer from './Shimmer'

const MOBILE_BREAKPOINT = 768
const SWIPE_THRESHOLD = 100

interface ProfileDetailViewProps {
  profileId: string
  images: string[]
  onClose: () => void
}

// Format date to relative time
const formatLastUpdated = (dateString?: string) => {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Updated today'
  if (diffDays === 1) return 'Updated yesterday'
  if (diffDays < 7) return `Updated ${diffDays} days ago`
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return `Updated ${date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
}

function ProfileDetailView({ profileId, images, onClose }: ProfileDetailViewProps) {
  const { profile, loading, error } = useProfileData(profileId)
  const [isMobile, setIsMobile] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef<number | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }, [onClose])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }, [handleClose])

  // Touch handlers for swipe-to-close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const sheet = sheetRef.current
    if (sheet && sheet.scrollTop <= 0) {
      dragStartY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    const currentY = e.touches[0].clientY
    const diff = currentY - dragStartY.current
    if (diff > 0) {
      setDragOffset(diff)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > SWIPE_THRESHOLD) {
      handleClose()
    } else {
      setDragOffset(0)
    }
    dragStartY.current = null
  }, [dragOffset, handleClose])

  // ===== MOBILE VIEW =====
  if (isMobile) {
    return (
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleBackdropClick}
      >
        <div className="absolute inset-0 bg-black/60" />

        <div
          ref={sheetRef}
          className={`absolute inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[92vh] flex flex-col ${dragOffset === 0 ? 'transition-transform duration-200' : ''} ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ transform: isVisible ? `translateY(${dragOffset}px)` : undefined }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Image Section - Compact */}
            <div className="relative w-full aspect-[3/4] max-h-[55vh] bg-gray-100">
              <ImageCarousel images={images} />
              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {/* Name overlay on image */}
              {loading ? (
                <div className="absolute bottom-3 left-4 right-4">
                  <Shimmer className="h-7 w-48 mb-1.5 bg-white/30" />
                  <Shimmer className="h-4 w-28 bg-white/30" />
                </div>
              ) : profile ? (
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">
                      {profile.firstName} {profile.lastName}, {profile.age}
                    </h2>
                    {profile.verified && (
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/90 text-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{profile.nativePlace}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Stats Bar - Always visible */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              {loading ? (
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Shimmer className="h-6 w-16 rounded-full" />
                    <Shimmer className="h-6 w-24 rounded-full" />
                  </div>
                  <Shimmer className="h-4 w-28" />
                </div>
              ) : profile ? (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {/* Height */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 2a1 1 0 00-1 1v18a1 1 0 001 1h2a1 1 0 001-1v-1h2v1a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1H6zm1 2h6v3h-2V6H9v1H7V4zm0 5h2v1h2V9h2v3h-2v-1H9v1H7V9zm0 5h2v1h2v-1h2v3h-2v-1H9v1H7v-3z"/>
                      </svg>
                      {profile.height}
                    </span>
                    {/* Designation */}
                    {profile.workingStatus && profile.designation && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate max-w-[120px]">{profile.designation}</span>
                      </span>
                    )}
                    {!profile.workingStatus && (
                      <span className="text-sm text-gray-500">Not working</span>
                    )}
                  </div>
                  {/* Last Updated */}
                  {profile.updatedAt && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatLastUpdated(profile.updatedAt)}
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            {/* Details Section - Scrollable */}
            {error ? (
              <div className="p-6 text-center text-red-500">{error}</div>
            ) : loading ? (
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Shimmer className="w-5 h-5 rounded" />
                      <div className="flex-1">
                        <Shimmer className="h-3 w-16 mb-2" />
                        <Shimmer className="h-4 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <Shimmer className="h-3 w-12 mb-3" />
                  <Shimmer className="h-4 w-full mb-2" />
                  <Shimmer className="h-4 w-3/4" />
                </div>
              </div>
            ) : profile ? (
              <div className="p-4 space-y-4">
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

                {/* About Me */}
                {profile.aboutMe && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">About</p>
                    <p className="text-gray-700 leading-relaxed">{profile.aboutMe}</p>
                  </div>
                )}

                {/* Spacer for fixed button */}
                <div className="h-4" />
              </div>
            ) : null}
          </div>

          {/* Fixed Connection Button at Bottom */}
          <div className="flex-shrink-0 bg-white border-t border-gray-100 safe-area-bottom">
            <ConnectionButton targetUserId={profileId} />
          </div>
        </div>
      </div>
    )
  }

  // ===== DESKTOP VIEW =====
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div
          className={`relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-[800px] w-full max-h-[85vh] flex flex-col transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto flex">
            {/* Image Section */}
            <div className="relative bg-gray-100 flex-shrink-0 w-[380px] min-h-[500px]">
              <ImageCarousel images={images} />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {loading ? (
                <div className="absolute bottom-4 left-4 right-4">
                  <Shimmer className="h-7 w-48 mb-2 bg-white/30" />
                  <Shimmer className="h-4 w-32 bg-white/30" />
                </div>
              ) : profile ? (
                <div className="absolute bottom-4 left-4 right-4 text-white">
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
                </div>
              ) : null}
            </div>

            {/* Details Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {error ? (
                <div className="flex items-center justify-center p-8 text-red-500 text-center flex-1">{error}</div>
              ) : loading ? (
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                  <div className="flex flex-wrap gap-3">
                    <Shimmer className="h-9 w-20 rounded-xl" />
                    <Shimmer className="h-9 w-32 rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Shimmer className="w-5 h-5 rounded" />
                        <div className="flex-1">
                          <Shimmer className="h-3 w-16 mb-2" />
                          <Shimmer className="h-4 w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : profile ? (
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                  {/* Basic Info Row */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 2a1 1 0 00-1 1v18a1 1 0 001 1h2a1 1 0 001-1v-1h2v1a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1H6zm1 2h6v3h-2V6H9v1H7V4zm0 5h2v1h2V9h2v3h-2v-1H9v1H7V9zm0 5h2v1h2v-1h2v3h-2v-1H9v1H7v-3z"/>
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
                  {profile.workingStatus ? (
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
                  ) : (
                    <p className="text-gray-500 text-sm">Not currently working</p>
                  )}

                  {/* About Me */}
                  {profile.aboutMe && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">About</p>
                      <p className="text-gray-700 leading-relaxed">{profile.aboutMe}</p>
                    </div>
                  )}

                  {/* Last Updated */}
                  {profile.updatedAt && (
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatLastUpdated(profile.updatedAt)}</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Connection Button */}
              <div className="flex-shrink-0 border-t border-gray-100">
                <ConnectionButton targetUserId={profileId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ProfileDetailView)
