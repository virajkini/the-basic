'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { authFetch } from '../../utils/authFetch'
import ProfileDetailView from '../../../components/ProfileDetailView'
import SortSheet, { SortOption } from '../../../components/SortSheet'
import FilterSheet, { FilterOptions } from '../../../components/FilterSheet'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const LAYOUT_STORAGE_KEY = 'dashboard-layout'

type LayoutType = 'default' | 'compact'

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


export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [discoverProfiles, setDiscoverProfiles] = useState<DiscoverProfile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<DiscoverProfile | null>(null)
  const hasFetched = useRef(false)

  // Sort, Filter, and Layout state
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filters, setFilters] = useState<FilterOptions>({})
  const [showSortSheet, setShowSortSheet] = useState(false)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [layout, setLayout] = useState<LayoutType>('default')

  // Load layout preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (saved === 'default' || saved === 'compact') {
      setLayout(saved)
    }
  }, [])

  const toggleLayout = () => {
    const newLayout = layout === 'default' ? 'compact' : 'default'
    setLayout(newLayout)
    localStorage.setItem(LAYOUT_STORAGE_KEY, newLayout)
  }

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (user?.userId && !hasFetched.current) {
      hasFetched.current = true
      fetchData()
    }
  }, [user?.userId])

  // Refetch when sort or filter changes
  useEffect(() => {
    if (hasFetched.current && user?.userId) {
      fetchDiscoverProfiles()
    }
  }, [sortBy, filters])

  const fetchDiscoverProfiles = async () => {
    if (!user?.userId) return

    try {
      // Build query params
      const params = new URLSearchParams()
      params.set('sort', sortBy)
      if (filters.ageMin) params.set('ageMin', filters.ageMin.toString())
      if (filters.ageMax) params.set('ageMax', filters.ageMax.toString())
      if (filters.name) params.set('name', filters.name)

      const discoverRes = await authFetch(`${API_BASE}/profiles/discover?${params.toString()}`)

      if (discoverRes.ok) {
        const discoverData = await discoverRes.json()
        if (discoverData.success && discoverData.profiles) {
          setDiscoverProfiles(discoverData.profiles)
        }
      }
    } catch (err) {
      console.error('Error fetching profiles:', err)
    }
  }

  const fetchData = async () => {
    if (!user?.userId) return

    try {
      setLoading(true)
      setError(null)

      // Build query params for discover
      const params = new URLSearchParams()
      params.set('sort', sortBy)
      if (filters.ageMin) params.set('ageMin', filters.ageMin.toString())
      if (filters.ageMax) params.set('ageMax', filters.ageMax.toString())
      if (filters.name) params.set('name', filters.name)

      // Fetch own profile and discover profiles in parallel
      const [profileRes, discoverRes] = await Promise.all([
        authFetch(`${API_BASE}/profiles/${user.userId}`),
        authFetch(`${API_BASE}/profiles/discover?${params.toString()}`),
      ])

      // Handle profile response
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success && profileData.profile) {
          setProfile(profileData.profile)
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
      <div className="container mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                <div className="aspect-[4/5] bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-12 bg-gray-200 rounded" />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-gray-100">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // No profile - Show Create Profile
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center animate-fade-in-up">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-myColor-100 to-myColor-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-myColor-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>

            <h1 className="text-2xl md:text-3xl font-heading font-bold text-myColor-900 mb-3">
              Let's Get You Started!
            </h1>
            <p className="text-sm text-myColor-500 mb-8">
              It's quick, simple, and you can always update later.
            </p>

            <Link
              href="/profile"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-semibold text-lg shadow-xl shadow-myColor-500/30 hover:shadow-2xl hover:shadow-myColor-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Create My Profile</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            {/* Quick highlights */}
            <div className="flex flex-wrap justify-center gap-4 mt-8 pt-6 border-t border-myColor-100">
              <div className="flex items-center gap-2 text-sm text-myColor-600">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Takes 2-3 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-myColor-600">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-myColor-600">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>GSB Community Only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Has profile - Show Discover Profiles
  return (
    <div className="container mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
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

        {/* Verification Warning - Compact */}
        {!profile.verified && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Profile pending verification</span>
          </div>
        )}

        {/* Discover Profiles Section */}
        <div className="animate-fade-in-up delay-100">
          {/* Header Row - stacks on mobile, inline on desktop */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-bold text-myColor-900">
                Discover Profiles
              </h2>
              <span className="text-sm text-myColor-500 md:hidden">
                {discoverProfiles.length} profiles
              </span>
            </div>

            {/* Sort, Filter & Layout Bar */}
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 md:bg-transparent md:border-0 md:gap-2">
              {/* Sort Button */}
              <button
                onClick={() => setShowSortSheet(true)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-4 md:py-2 md:px-3 md:bg-gray-50 md:hover:bg-gray-100 md:rounded-lg transition-colors ${
                  sortBy !== 'recent'
                    ? 'text-myColor-700'
                    : 'text-gray-600'
                }`}
              >
                <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="font-medium text-sm">Sort</span>
              </button>

              {/* Divider - mobile only */}
              <div className="w-px h-8 bg-gray-200 md:hidden" />

              {/* Filter Button */}
              {(() => {
                const activeFilterCount = (filters.name ? 1 : 0) + ((filters.ageMin || filters.ageMax) ? 1 : 0)
                return (
                  <button
                    onClick={() => setShowFilterSheet(true)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-4 md:py-2 md:px-3 md:bg-gray-50 md:hover:bg-gray-100 md:rounded-lg transition-colors relative ${
                      activeFilterCount > 0
                        ? 'text-myColor-700'
                        : 'text-gray-600'
                    }`}
                  >
                    <div className="relative">
                      <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 md:w-3.5 md:h-3.5 bg-red-500 text-white text-[10px] md:text-[9px] font-bold rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-sm">Filter</span>
                  </button>
                )
              })()}

              {/* Divider - mobile only */}
              <div className="w-px h-8 bg-gray-200 md:hidden" />

              {/* Layout Toggle Button */}
              <button
                onClick={toggleLayout}
                className={`flex items-center justify-center gap-2 py-3 px-4 md:py-2 md:px-3 md:bg-gray-50 md:hover:bg-gray-100 md:rounded-lg transition-colors ${
                  layout === 'compact'
                    ? 'text-myColor-700'
                    : 'text-gray-600'
                }`}
                title={layout === 'default' ? 'Switch to compact view' : 'Switch to default view'}
              >
                {layout === 'default' ? (
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
              </button>

              {/* Profile count - desktop only */}
              <span className="hidden md:block text-sm text-myColor-500 ml-2">
                {discoverProfiles.length} profiles
              </span>
            </div>
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
            <div className={`grid transition-all duration-300 ease-in-out ${
              layout === 'compact'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            }`}>
              {discoverProfiles.map((discoverProfile, index) => (
                <ProfileCard
                  key={discoverProfile._id}
                  profile={discoverProfile}
                  onSelect={setSelectedProfile}
                  priority={index < (layout === 'compact' ? 8 : 3)}
                  compact={layout === 'compact'}
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

        {/* Sort Sheet */}
        <SortSheet
          isOpen={showSortSheet}
          onClose={() => setShowSortSheet(false)}
          currentSort={sortBy}
          onSortChange={setSortBy}
        />

        {/* Filter Sheet */}
        <FilterSheet
          isOpen={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          currentFilters={filters}
          onApply={setFilters}
        />
      </div>
    </div>
  )
}

// Profile Card Component with Image Carousel
const ProfileCard = memo(function ProfileCard({
  profile,
  onSelect,
  priority = false,
  compact = false
}: {
  profile: DiscoverProfile
  onSelect: (profile: DiscoverProfile) => void
  priority?: boolean
  compact?: boolean
}) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isInView, setIsInView] = useState(priority) // Priority cards are "in view" immediately
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]))

  const handleSelect = useCallback(() => {
    onSelect(profile)
  }, [onSelect, profile])

  // Observe when card enters viewport (skip for priority cards)
  useEffect(() => {
    if (priority) {
      setIsInView(true)
      return
    }

    const card = cardRef.current
    if (!card) return

    // Use IntersectionObserver - it fires immediately if already visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px', threshold: 0 }
    )

    observer.observe(card)

    return () => observer.disconnect()
  }, [priority])

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
      className={`group relative bg-white overflow-hidden shadow-lg shadow-myColor-900/10 hover:shadow-2xl hover:shadow-myColor-900/20 transition-all duration-300 ease-in-out hover:-translate-y-1 cursor-pointer ${
        compact ? 'rounded-2xl' : 'rounded-3xl'
      }`}
    >
      {/* Image Carousel */}
      <div className={`relative bg-gradient-to-br from-myColor-100 to-myColor-200 ${
        compact ? 'aspect-[3/4]' : 'aspect-[4/5]'
      }`}>
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
                      fetchPriority={priority && idx === 0 ? 'high' : 'auto'}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-myColor-100 to-myColor-200" />
                  )}
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            {profile.images.length > 1 && (
              <div className={`absolute left-0 right-0 flex justify-center z-10 ${
                compact ? 'top-2 gap-1' : 'top-3 gap-1.5'
              }`}>
                {profile.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      scrollToIndex(idx)
                    }}
                    className={`rounded-full transition-all duration-300 ${
                      compact ? 'w-1.5 h-1.5' : 'w-2 h-2'
                    } ${
                      idx === activeIndex
                        ? `bg-white shadow-md ${compact ? 'w-3' : 'w-4'}`
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
            <svg className={`text-myColor-300 ${compact ? 'w-12 h-12' : 'w-20 h-20'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        {/* Gradient Overlay at Bottom */}
        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none ${
          compact ? 'h-20' : 'h-32'
        }`} />

        {/* Left/Right Navigation Arrows (Desktop Only, hide in compact) */}
        {!compact && profile.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (activeIndex > 0) scrollToIndex(activeIndex - 1)
              }}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 hidden md:flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full transition-all ${activeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`}
              disabled={activeIndex === 0}
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (activeIndex < profile.images.length - 1) scrollToIndex(activeIndex + 1)
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 hidden md:flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full transition-all ${activeIndex === profile.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`}
              disabled={activeIndex === profile.images.length - 1}
              aria-label="Next image"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Profile Info on Image */}
        <div className={`absolute bottom-0 left-0 right-0 text-white pointer-events-none ${
          compact ? 'p-2.5' : 'p-4'
        }`}>
          <h3 className={`font-semibold tracking-wide flex items-center gap-1 ${
            compact ? 'text-sm' : 'text-xl gap-2'
          }`}>
            {profile.firstName}, {profile.age}
            {profile.verified && (
              <svg className={`text-blue-400 ${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </h3>
          {!compact && (
            <div className="flex items-center gap-1.5 mt-1 text-white/90 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{profile.nativePlace}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer - simplified in compact mode */}
      {compact ? (
        <div className="px-2.5 py-2 bg-white">
          <div className="flex items-center justify-between text-xs text-myColor-600">
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">{profile.nativePlace}</span>
              <span className="text-myColor-400">•</span>
              <span className="text-myColor-500 flex-shrink-0">
                {profile.height.split('(')[0].trim()}
              </span>
            </div>
            <svg className="w-3.5 h-3.5 text-myColor-400 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      ) : (
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
          {/* View Profile Hint */}
          <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-myColor-100 text-myColor-500 group-hover:text-myColor-600 transition-colors">
            <span className="text-xs font-medium">View Full Profile</span>
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Hover Effect Glow */}
      <div className={`absolute inset-0 ring-1 ring-inset ring-black/5 group-hover:ring-myColor-500/20 transition-all duration-500 pointer-events-none ${
        compact ? 'rounded-2xl' : 'rounded-3xl'
      }`} />
    </div>
  )
})
