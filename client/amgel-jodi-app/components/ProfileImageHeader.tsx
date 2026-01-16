'use client'

import { memo } from 'react'
import ImageCarousel from './ImageCarousel'
import Shimmer from './Shimmer'

interface ProfileImageHeaderProps {
  images: string[]
  loading: boolean
  profile?: {
    firstName: string
    lastName?: string
    age: number
    nativePlace: string
    verified: boolean
  } | null
  variant?: 'mobile' | 'desktop'
}

const ProfileImageHeader = memo(({
  images,
  loading,
  profile,
  variant = 'mobile'
}: ProfileImageHeaderProps) => {
  const isMobile = variant === 'mobile'

  return (
    <div className={`relative bg-gray-100 ${isMobile ? 'w-full aspect-[3/4]' : 'flex-shrink-0 w-[380px] min-h-[500px]'}`}>
      <ImageCarousel images={images} />

      {/* Extra gradient overlay for stronger effect */}
      <div className={`absolute inset-x-0 bottom-0 ${isMobile ? 'h-32' : 'h-24'} bg-gradient-to-t from-black/40 to-transparent pointer-events-none`} />

      {/* Profile Info Overlay */}
      {loading ? (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <Shimmer className={`${isMobile ? 'h-8 w-52' : 'h-7 w-48'} mb-2 bg-white/30`} />
          <Shimmer className={`${isMobile ? 'h-5 w-32' : 'h-4 w-32'} bg-white/30`} />
        </div>
      ) : profile ? (
        <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
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
          <div className={`flex items-center gap-1.5 text-white/90 mt-1 ${isMobile ? '' : 'text-sm'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{profile.nativePlace}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
})

ProfileImageHeader.displayName = 'ProfileImageHeader'

export default ProfileImageHeader
