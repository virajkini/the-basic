'use client'

import { useEffect, useState, useRef } from 'react'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

export interface FullProfile {
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
  updatedAt?: string
}

// Module-level cache - persists across component lifecycle
const profileCache = new Map<string, FullProfile>()

export function useProfileData(profileId: string) {
  const [profile, setProfile] = useState<FullProfile | null>(() => profileCache.get(profileId) || null)
  const [loading, setLoading] = useState(() => !profileCache.has(profileId))
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    // Already fetched in this component instance
    if (fetchedRef.current) return

    // Already have cached data
    if (profileCache.has(profileId)) {
      setProfile(profileCache.get(profileId)!)
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
        profileCache.set(profileId, data.profile)
        setProfile(data.profile)
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

  return { profile, loading, error }
}
