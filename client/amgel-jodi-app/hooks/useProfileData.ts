'use client'

import { useEffect, useState, useRef } from 'react'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

export interface FullProfile {
  _id: string
  firstName: string
  lastName: string | null  // Only shown when connected
  phone: string | null  // Only shown when connected
  dob?: string
  age: number
  nativePlace: string
  height: string
  workingStatus: 'employed' | 'self-employed' | 'not-working' | boolean  // Support legacy boolean
  company: string | null
  designation: string | null
  workLocation: string | null
  salaryRange: string | null
  education: string | null
  aboutMe: string | null
  verified: boolean
  updatedAt?: string
  // Jatak/Kundali fields (optional)
  placeOfBirth?: string | null
  birthTiming?: string | null
  gothra?: string | null
  nakshatra?: string | null
}

// Module-level cache - persists across component lifecycle
interface CachedProfileData {
  profile: FullProfile
  isConnected: boolean
}
const profileCache = new Map<string, CachedProfileData>()

export function useProfileData(profileId: string) {
  const cachedData = profileCache.get(profileId)
  const [profile, setProfile] = useState<FullProfile | null>(() => cachedData?.profile || null)
  const [isConnected, setIsConnected] = useState<boolean>(() => cachedData?.isConnected || false)
  const [loading, setLoading] = useState(() => !profileCache.has(profileId))
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    // Already fetched in this component instance
    if (fetchedRef.current) return

    // Already have cached data
    if (profileCache.has(profileId)) {
      const cached = profileCache.get(profileId)!
      setProfile(cached.profile)
      setIsConnected(cached.isConnected)
      setLoading(false)
      return
    }

    // Mark as fetched immediately
    fetchedRef.current = true

    const fetchProfile = async () => {
      try {
        const response = await authFetch(`${API_BASE}/profiles/view/${profileId}`)
        if (!response.ok) throw new Error('Failed to load profile')
        const data = await response.json()
        profileCache.set(profileId, { profile: data.profile, isConnected: data.isConnected })
        setProfile(data.profile)
        setIsConnected(data.isConnected)
      } catch (err) {
        if (err instanceof Error && err.message !== 'Session expired') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [profileId])

  return { profile, loading, error, isConnected }
}
