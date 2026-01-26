'use client'

import { useEffect, useState, memo, useCallback, useRef } from 'react'
import { useProfileData } from '../hooks/useProfileData'
import ProfileImageHeader from './ProfileImageHeader'
import ConnectionButton from './ConnectionButton'
import Shimmer from './Shimmer'

const MOBILE_BREAKPOINT = 768

interface ProfileDetailViewProps {
  profileId: string
  images: string[]
  onClose: () => void
  isOwnProfile?: boolean
}

const formatLastUpdated = (dateString?: string) => {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Active today'
  if (diffDays === 1) return 'Active yesterday'
  if (diffDays < 7) return `Active ${diffDays}d ago`
  if (diffDays < 30) return `Active ${Math.floor(diffDays / 7)}w ago`
  return `Active ${date.toLocaleDateString('en-IN', { month: 'short' })}`
}

const formatBirthTime = (time?: string) => {
  if (!time) return null
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function ProfileDetailView({ profileId, images, onClose, isOwnProfile = false }: ProfileDetailViewProps) {
  const { profile, loading, error, isConnected } = useProfileData(profileId)
  const [isMobile, setIsMobile] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [showKundali, setShowKundali] = useState(false)

  const historyPushedRef = useRef(false)
  const closingViaUIRef = useRef(false)

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

  useEffect(() => {
    history.pushState({ profileDetailOpen: true, profileId }, '')
    historyPushedRef.current = true

    const handlePopState = () => {
      if (closingViaUIRef.current) {
        closingViaUIRef.current = false
        return
      }
      if (historyPushedRef.current) {
        historyPushedRef.current = false
        setIsVisible(false)
        setTimeout(onClose, 200)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose, profileId])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    if (historyPushedRef.current) {
      closingViaUIRef.current = true
      historyPushedRef.current = false
      history.back()
    }
    setTimeout(onClose, 200)
  }, [onClose])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }, [handleClose])

  const hasKundaliInfo = profile?.placeOfBirth || profile?.birthTiming || profile?.gothra || profile?.nakshatra
  const isWorking = profile?.workingStatus === 'employed' || profile?.workingStatus === 'self-employed' || profile?.workingStatus === true

  // ===== MOBILE VIEW =====
  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-50 bg-white transition-transform duration-300 ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Floating Back Button */}
        <button
          onClick={handleClose}
          className="fixed top-4 left-4 z-20 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto">
          {/* Hero Image Section */}
          <ProfileImageHeader
            images={images}
            loading={loading}
            profile={profile}
            variant="mobile"
          />

          {/* Content Section */}
          <div className="bg-white pt-5">
            {error ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-myColor-700">{error}</p>
              </div>
            ) : loading ? (
              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  <Shimmer className="h-8 w-24 rounded-full" />
                  <Shimmer className="h-8 w-32 rounded-full" />
                </div>
                <Shimmer className="h-24 w-full rounded-2xl" />
                <Shimmer className="h-20 w-full rounded-2xl" />
              </div>
            ) : profile ? (
              <div className="px-5 pb-32 space-y-5">
                {/* Quick Info Pills */}
                <div className="flex flex-wrap gap-2">
                  {profile.dob && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-myColor-50 rounded-full text-sm font-medium text-myColor-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(profile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-myColor-50 rounded-full text-sm font-medium text-myColor-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 2a1 1 0 00-1 1v18a1 1 0 001 1h2a1 1 0 001-1v-1h2v1a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1H6zm1 2h6v3h-2V6H9v1H7V4zm0 5h2v1h2V9h2v3h-2v-1H9v1H7V9zm0 5h2v1h2v-1h2v3h-2v-1H9v1H7v-3z"/>
                    </svg>
                    {profile.height?.split('(')[0].trim()}
                  </span>

                  {isWorking && profile.designation && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-myColor-50 rounded-full text-sm font-medium text-myColor-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate max-w-[160px]">{profile.designation}</span>
                    </span>
                  )}

                  {profile.updatedAt && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 rounded-full text-sm text-green-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {formatLastUpdated(profile.updatedAt)}
                    </span>
                  )}
                </div>

                {/* About Section */}
                {profile.aboutMe && (
                  <div className="bg-gradient-to-br from-myColor-50 to-white p-5 rounded-2xl border border-myColor-100">
                    <h3 className="text-sm font-medium text-myColor-500 uppercase tracking-wider mb-2">About</h3>
                    <p className="text-myColor-800 leading-relaxed">{profile.aboutMe}</p>
                  </div>
                )}

                {/* Career Section */}
                {isWorking && (profile.company || profile.workLocation || profile.salaryRange) && (
                  <div className="bg-white border border-myColor-100 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 bg-myColor-50 border-b border-myColor-100">
                      <h3 className="text-sm font-medium text-myColor-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Career
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      {profile.company && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-myColor-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-myColor-400 font-medium">Company</p>
                            <p className="text-myColor-900">{profile.company}</p>
                          </div>
                        </div>
                      )}
                      {profile.workLocation && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-myColor-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-myColor-400 font-medium">Work Location</p>
                            <p className="text-myColor-900">{profile.workLocation}</p>
                          </div>
                        </div>
                      )}
                      {profile.salaryRange && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-myColor-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-myColor-400 font-medium">Annual Income</p>
                            <p className="text-myColor-900">{profile.salaryRange}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Not Working */}
                {!isWorking && profile.workingStatus !== undefined && (
                  <div className="flex items-center gap-3 p-4 bg-myColor-50 rounded-2xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-myColor-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-myColor-600">Currently not working</p>
                  </div>
                )}

                {/* Kundali Section - Collapsible */}
                {hasKundaliInfo && (
                  <div className="bg-white border border-myColor-100 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setShowKundali(!showKundali)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-myColor-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-myColor-900">Jatak / Kundali</p>
                          <p className="text-xs text-myColor-400">Birth details & horoscope info</p>
                        </div>
                      </div>
                      <svg className={`w-5 h-5 text-myColor-400 transition-transform duration-200 ${showKundali ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showKundali && (
                      <div className="px-5 pb-5 grid grid-cols-2 gap-3 animate-fade-in">
                        {profile.placeOfBirth && (
                          <div className="bg-amber-50/50 rounded-xl p-3">
                            <p className="text-xs text-amber-600 font-medium mb-1">Place of Birth</p>
                            <p className="text-myColor-800">{profile.placeOfBirth}</p>
                          </div>
                        )}
                        {profile.birthTiming && (
                          <div className="bg-amber-50/50 rounded-xl p-3">
                            <p className="text-xs text-amber-600 font-medium mb-1">Birth Time</p>
                            <p className="text-myColor-800">{formatBirthTime(profile.birthTiming)}</p>
                          </div>
                        )}
                        {profile.gothra && (
                          <div className="bg-amber-50/50 rounded-xl p-3">
                            <p className="text-xs text-amber-600 font-medium mb-1">Gothra</p>
                            <p className="text-myColor-800">{profile.gothra}</p>
                          </div>
                        )}
                        {profile.nakshatra && (
                          <div className="bg-amber-50/50 rounded-xl p-3">
                            <p className="text-xs text-amber-600 font-medium mb-1">Nakshatra</p>
                            <p className="text-myColor-800">{profile.nakshatra}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Education */}
                {profile.education && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-blue-500 font-medium">Education</p>
                      <p className="text-blue-900">{profile.education}</p>
                    </div>
                  </div>
                )}

                {/* Contact Details - Only shown when connected */}
                {isConnected && !isOwnProfile && profile.phone && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">You&apos;re Connected!</p>
                          <p className="text-xs text-green-600">Contact details are now visible</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <a
                        href={`tel:${profile.phone}`}
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-green-100 hover:border-green-300 hover:shadow-md transition-all group"
                      >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-green-600 font-medium mb-1">Phone Number</p>
                          <p className="text-lg font-semibold text-gray-900">{profile.phone}</p>
                        </div>
                        <svg className="w-5 h-5 text-green-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>

                      {/* Trust & Safety Notice */}
                      <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex gap-3">
                          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p className="text-sm text-amber-800 font-medium">Please be respectful</p>
                            <p className="text-xs text-amber-700 mt-1">
                              Contact details are shared in trust. Misuse may lead to account suspension.
                              If you experience any inappropriate behavior, please report to us immediately.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Fixed Bottom Action */}
        {!isOwnProfile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-myColor-100 safe-area-pb z-10">
            <ConnectionButton targetUserId={profileId} />
          </div>
        )}
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
          className={`relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-[900px] w-full max-h-[85vh] flex transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Section */}
          <ProfileImageHeader
            images={images}
            loading={loading}
            profile={profile}
            variant="desktop"
          />

          {/* Details Section */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-white to-myColor-50/30">
            {error ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-myColor-700">{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex gap-2">
                  <Shimmer className="h-9 w-24 rounded-full" />
                  <Shimmer className="h-9 w-36 rounded-full" />
                </div>
                <Shimmer className="h-24 w-full rounded-2xl" />
                <Shimmer className="h-32 w-full rounded-2xl" />
              </div>
            ) : profile ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Quick Info Pills */}
                <div className="flex flex-wrap gap-2">
                  {profile.dob && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-myColor-100 rounded-full text-sm font-medium text-myColor-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(profile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-myColor-100 rounded-full text-sm font-medium text-myColor-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 2a1 1 0 00-1 1v18a1 1 0 001 1h2a1 1 0 001-1v-1h2v1a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1H6zm1 2h6v3h-2V6H9v1H7V4zm0 5h2v1h2V9h2v3h-2v-1H9v1H7V9zm0 5h2v1h2v-1h2v3h-2v-1H9v1H7v-3z"/>
                    </svg>
                    {profile.height?.split('(')[0].trim()}
                  </span>

                  {isWorking && profile.designation && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-myColor-100 rounded-full text-sm font-medium text-myColor-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {profile.designation}
                    </span>
                  )}

                  {profile.updatedAt && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-100 rounded-full text-sm text-green-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {formatLastUpdated(profile.updatedAt)}
                    </span>
                  )}
                </div>

                {/* About */}
                {profile.aboutMe && (
                  <div className="bg-white p-5 rounded-2xl border border-myColor-100 shadow-sm">
                    <h3 className="text-xs font-medium text-myColor-500 uppercase tracking-wider mb-2">About</h3>
                    <p className="text-myColor-800 leading-relaxed">{profile.aboutMe}</p>
                  </div>
                )}

                {/* Career */}
                {isWorking && (profile.company || profile.workLocation || profile.salaryRange) && (
                  <div className="bg-white rounded-2xl border border-myColor-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-myColor-50 border-b border-myColor-100">
                      <h3 className="text-xs font-medium text-myColor-600 uppercase tracking-wider">Career</h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-4">
                      {profile.company && (
                        <div>
                          <p className="text-xs text-myColor-400 mb-1">Company</p>
                          <p className="text-myColor-900 font-medium">{profile.company}</p>
                        </div>
                      )}
                      {profile.workLocation && (
                        <div>
                          <p className="text-xs text-myColor-400 mb-1">Location</p>
                          <p className="text-myColor-900 font-medium">{profile.workLocation}</p>
                        </div>
                      )}
                      {profile.salaryRange && (
                        <div>
                          <p className="text-xs text-myColor-400 mb-1">Income</p>
                          <p className="text-myColor-900 font-medium">{profile.salaryRange}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Education */}
                {profile.education && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <div>
                      <p className="text-xs text-blue-500 font-medium">Education</p>
                      <p className="text-blue-900">{profile.education}</p>
                    </div>
                  </div>
                )}

                {/* Contact Details - Only shown when connected (Desktop) */}
                {isConnected && !isOwnProfile && profile.phone && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-semibold text-green-800">Connected - Contact Details</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <a
                        href={`tel:${profile.phone}`}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-100 hover:border-green-300 hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-green-600 font-medium">Phone</p>
                          <p className="font-semibold text-gray-900">{profile.phone}</p>
                        </div>
                      </a>

                      <p className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <span className="font-medium">Trust & Safety:</span> Contact details are shared in trust. Misuse may lead to account suspension.
                      </p>
                    </div>
                  </div>
                )}

                {/* Kundali */}
                {hasKundaliInfo && (
                  <div className="bg-white rounded-2xl border border-myColor-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowKundali(!showKundali)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-myColor-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="font-medium text-myColor-900">Jatak / Kundali</span>
                      </div>
                      <svg className={`w-5 h-5 text-myColor-400 transition-transform ${showKundali ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showKundali && (
                      <div className="px-5 pb-5 grid grid-cols-2 gap-3 animate-fade-in">
                        {profile.placeOfBirth && (
                          <div className="bg-amber-50/50 rounded-xl p-3">
                            <p className="text-xs text-amber-600 mb-1">Place of Birth</p>
                            <p className="text-myColor-800">{profile.placeOfBirth}</p>
                          </div>
                        )}
                        {profile.birthTiming && (
                          <div className="bg-amber-50/50 rounded-xl p-3">
                            <p className="text-xs text-amber-600 mb-1">Birth Time</p>
                            <p className="text-myColor-800">{formatBirthTime(profile.birthTiming)}</p>
                          </div>
                        )}
                        {profile.gothra && (
                          <div className="bg-amber-50/50 rounded-xl p-3">
                            <p className="text-xs text-amber-600 mb-1">Gothra</p>
                            <p className="text-myColor-800">{profile.gothra}</p>
                          </div>
                        )}
                        {profile.nakshatra && (
                          <div className="bg-amber-50/50 rounded-xl p-3">
                            <p className="text-xs text-amber-600 mb-1">Nakshatra</p>
                            <p className="text-myColor-800">{profile.nakshatra}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Connection Button */}
            {!isOwnProfile && (
              <div className="flex-shrink-0 border-t border-myColor-100 bg-white">
                <ConnectionButton targetUserId={profileId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ProfileDetailView)
