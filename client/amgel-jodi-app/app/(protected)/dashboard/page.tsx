'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { authFetch } from '../../utils/authFetch'
import ProfileDetailView from '../../../components/ProfileDetailView'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

interface Profile {
  _id: string
  firstName: string
  lastName: string
  name: string
  gender: string
  age: number
  nativePlace: string
  height: string
  workingStatus: boolean
  designation?: string
  verified: boolean
}

interface DiscoverProfile {
  _id: string
  firstName: string
  age: number
  nativePlace: string
  height: string
  designation: string | null
  verified: boolean
  images: string[]
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
  const [discoverProfiles, setDiscoverProfiles] = useState<DiscoverProfile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<DiscoverProfile | null>(null)
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

      // Fetch own profile, own images, and discover profiles (with images) in parallel
      const [profileRes, imagesRes, discoverRes] = await Promise.all([
        authFetch(`${API_BASE}/profiles/${user.userId}`),
        authFetch(`${API_BASE}/files`),
        authFetch(`${API_BASE}/profiles/discover`),
      ])

      // Handle profile response
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success && profileData.profile) {
          setProfile(profileData.profile)
        }
      }

      // Handle images response
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json()
        if (imagesData.success && imagesData.files) {
          setImages(imagesData.files)
        }
      }

      // Handle discover profiles response (already includes images)
      if (discoverRes.ok) {
        const discoverData = await discoverRes.json()
        if (discoverData.success && discoverData.profiles) {
          setDiscoverProfiles(discoverData.profiles)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

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

            <h1 className="text-3xl md:text-4xl font-heading font-bold text-myColor-900 mb-4">
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

  // Has profile - Show Welcome Back + Other Profiles
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
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-8 animate-fade-in-up">
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
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-myColor-900 mb-2">
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

        {/* Discover Profiles Section */}
        <div className="animate-fade-in-up delay-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-myColor-900">
              Discover Profiles
            </h2>
            <span className="text-sm text-myColor-500">
              {discoverProfiles.length} profiles found
            </span>
          </div>

          {discoverProfiles.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-myColor-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-myColor-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-myColor-600">No profiles to show yet</p>
              <p className="text-sm text-myColor-400 mt-1">Check back soon for new members</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoverProfiles.map((discoverProfile) => (
                <ProfileCard
                  key={discoverProfile._id}
                  profile={discoverProfile}
                  onSelect={setSelectedProfile}
                />
              ))}
            </div>
          )}
        </div>

        {/* Profile Detail View Modal */}
        {selectedProfile && (
          <ProfileDetailView
            profileId={selectedProfile._id}
            images={selectedProfile.images}
            onClose={() => setSelectedProfile(null)}
          />
        )}
      </div>
    </div>
  )
}

// Profile Card Component with Image Carousel
const ProfileCard = memo(function ProfileCard({
  profile,
  onSelect
}: {
  profile: DiscoverProfile
  onSelect: (profile: DiscoverProfile) => void
}) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]))

  const handleSelect = useCallback(() => {
    onSelect(profile)
  }, [onSelect, profile])

  // Observe when card enters viewport
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(card)
    return () => observer.disconnect()
  }, [])

  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return
    const scrollLeft = carouselRef.current.scrollLeft
    const width = carouselRef.current.offsetWidth
    const newIndex = Math.round(scrollLeft / width)
    setActiveIndex(newIndex)

    // Mark current and adjacent images for loading
    setLoadedImages(prev => {
      const next = new Set(prev)
      next.add(newIndex)
      if (newIndex > 0) next.add(newIndex - 1)
      if (newIndex < profile.images.length - 1) next.add(newIndex + 1)
      return next
    })
  }, [profile.images.length])


  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return
    const width = carouselRef.current.offsetWidth
    carouselRef.current.scrollTo({
      left: index * width,
      behavior: 'smooth'
    })
    // Preload target image
    setLoadedImages(prev => new Set(prev).add(index))
  }

  const hasImages = profile.images.length > 0
  const shouldLoadImage = (idx: number) => isInView && loadedImages.has(idx)

  return (
    <div
      ref={cardRef}
      onClick={handleSelect}
      className="group relative bg-white rounded-3xl overflow-hidden shadow-lg shadow-myColor-900/10 hover:shadow-2xl hover:shadow-myColor-900/20 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
    >
      {/* Image Carousel */}
      <div className="relative aspect-[4/5] bg-gradient-to-br from-myColor-100 to-myColor-200">
        {hasImages ? (
          <>
            {/* Carousel Container */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {profile.images.map((url, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-full h-full snap-center"
                >
                  {shouldLoadImage(idx) ? (
                    <img
                      src={url}
                      alt={`${profile.firstName} photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-myColor-100 to-myColor-200" />
                  )}
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            {profile.images.length > 1 && (
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {profile.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      scrollToIndex(idx)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === activeIndex
                        ? 'bg-white w-4 shadow-md'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // Placeholder when no images
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 text-myColor-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        {/* Gradient Overlay at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

        {/* Verified Badge */}
        {profile.verified && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Profile Info on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-semibold tracking-wide">
            {profile.firstName}, {profile.age}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-white/90 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{profile.nativePlace}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-myColor-600">
            {profile.designation ? (
              <>
                <svg className="w-4 h-4 text-myColor-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate max-w-[150px]">{profile.designation}</span>
              </>
            ) : (
              <span className="text-myColor-400">Not working</span>
            )}
          </div>
          <div className="text-sm text-myColor-500">{profile.height}</div>
        </div>
      </div>

      {/* Hover Effect Glow */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5 group-hover:ring-myColor-500/20 transition-all duration-500 pointer-events-none" />
    </div>
  )
})
