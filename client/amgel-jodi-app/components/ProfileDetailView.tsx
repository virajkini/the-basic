'use client'

import { useEffect, useState, memo, useCallback } from 'react'
import { useProfileData } from '../hooks/useProfileData'
import ImageCarousel from './ImageCarousel'
import ProfileHeaderOverlay from './ProfileHeaderOverlay'
import ProfileDetails from './ProfileDetails'
import DetailsSkeleton from './DetailsSkeleton'

const MOBILE_BREAKPOINT = 768

interface ProfileDetailViewProps {
  profileId: string
  images: string[]
  onClose: () => void
}

function ProfileDetailView({ profileId, images, onClose }: ProfileDetailViewProps) {
  const { profile, loading, error } = useProfileData(profileId)
  const [isMobile, setIsMobile] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  // Check screen size
  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  // Prevent body scroll
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

  const content = (
    <div className={`flex-1 overflow-y-auto ${!isMobile ? 'flex' : ''}`}>
      {/* Image Section */}
      <div className={`relative bg-gray-100 flex-shrink-0 ${isMobile ? 'aspect-[4/5]' : 'w-[380px] min-h-[500px]'}`}>
        <ImageCarousel images={images} />
        <ProfileHeaderOverlay profile={profile} loading={loading} />
      </div>

      {/* Details Section */}
      {error ? (
        <div className="flex items-center justify-center p-8 text-red-500 text-center">{error}</div>
      ) : loading ? (
        <DetailsSkeleton isMobile={isMobile} />
      ) : profile ? (
        <ProfileDetails profile={profile} isMobile={isMobile} />
      ) : null}
    </div>
  )

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/60" />

      {isMobile ? (
        <div className={`absolute inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[95vh] overflow-hidden flex flex-col transition-transform duration-200 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          <button onClick={handleClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {content}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div
            className={`relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-[800px] w-full max-h-[85vh] flex flex-col transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleClose} className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(ProfileDetailView)
