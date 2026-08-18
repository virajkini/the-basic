'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface DiscoverProfile {
  _id: string
  firstName: string
  age: number
  nativePlace: string
  workLocation?: string
  height: string
  designation: string | null
  verified: boolean
  images: string[]
}

type OpenDiscoverProfile = (profile: DiscoverProfile) => void

interface DiscoverSearchContextValue {
  profiles: DiscoverProfile[]
  profileDetailOpen: boolean
  setProfileDetailOpen: (open: boolean) => void
  setSearchableProfiles: (profiles: DiscoverProfile[]) => void
  registerOpenDiscoverProfile: (handler: OpenDiscoverProfile | null) => void
  openDiscoverProfile: OpenDiscoverProfile
}

const DiscoverSearchContext = createContext<DiscoverSearchContextValue | null>(null)

export function DiscoverSearchProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([])
  const [profileDetailOpen, setProfileDetailOpen] = useState(false)
  const openHandlerRef = useRef<OpenDiscoverProfile | null>(null)

  const setSearchableProfiles = useCallback((next: DiscoverProfile[]) => {
    setProfiles(next)
  }, [])

  const registerOpenDiscoverProfile = useCallback((handler: OpenDiscoverProfile | null) => {
    openHandlerRef.current = handler
  }, [])

  const openDiscoverProfile = useCallback((profile: DiscoverProfile) => {
    openHandlerRef.current?.(profile)
  }, [])

  const value = useMemo(
    (): DiscoverSearchContextValue => ({
      profiles,
      profileDetailOpen,
      setProfileDetailOpen,
      setSearchableProfiles,
      registerOpenDiscoverProfile,
      openDiscoverProfile,
    }),
    [
      profiles,
      profileDetailOpen,
      setSearchableProfiles,
      registerOpenDiscoverProfile,
      openDiscoverProfile,
    ]
  )

  return (
    <DiscoverSearchContext.Provider value={value}>
      {children}
    </DiscoverSearchContext.Provider>
  )
}

export function useDiscoverSearch() {
  const ctx = useContext(DiscoverSearchContext)
  if (!ctx) {
    throw new Error('useDiscoverSearch must be used within DiscoverSearchProvider')
  }
  return ctx
}
