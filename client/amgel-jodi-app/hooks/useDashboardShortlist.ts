'use client'

import { useState, useRef, useCallback } from 'react'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

/**
 * Shortlist / favorites for discover: local ids, filter toggle, PUT sync, discover query flag.
 */
export function useDashboardShortlist(userId: string | undefined) {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favoriteUserIds, setFavoriteUserIds] = useState<string[]>([])
  const [favoriteSavingId, setFavoriteSavingId] = useState<string | null>(null)

  const favoriteUserIdsRef = useRef<string[]>([])
  favoriteUserIdsRef.current = favoriteUserIds

  const favoriteSaveLockRef = useRef(false)

  const syncFavoriteIdsFromProfile = useCallback((raw: unknown) => {
    const list = Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === 'string')
      : []
    favoriteUserIdsRef.current = list
    setFavoriteUserIds(list)
  }, [])

  const appendShortlistDiscoverParams = useCallback(
    (params: URLSearchParams) => {
      if (showFavoritesOnly) params.set('favoritesOnly', '1')
    },
    [showFavoritesOnly]
  )

  const toggleFavorite = useCallback(
    async (targetUserId: string) => {
      if (!userId || favoriteSaveLockRef.current) return

      const prev = favoriteUserIdsRef.current
      const isFav = prev.includes(targetUserId)
      const next = isFav ? prev.filter((id) => id !== targetUserId) : [...prev, targetUserId]
      favoriteUserIdsRef.current = next
      setFavoriteUserIds(next)
      favoriteSaveLockRef.current = true
      setFavoriteSavingId(targetUserId)

      try {
        const res = await authFetch(`${API_BASE}/profiles/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favoriteUserIds: next }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to update favorites')
        }
        const data = await res.json()
        if (data.success && Array.isArray(data.profile?.favoriteUserIds)) {
          favoriteUserIdsRef.current = data.profile.favoriteUserIds
          setFavoriteUserIds(data.profile.favoriteUserIds)
        }
      } catch {
        favoriteUserIdsRef.current = prev
        setFavoriteUserIds(prev)
      } finally {
        favoriteSaveLockRef.current = false
        setFavoriteSavingId(null)
      }
    },
    [userId]
  )

  const handleToggleFavorite = useCallback(
    (targetUserId: string) => {
      void toggleFavorite(targetUserId)
    },
    [toggleFavorite]
  )

  return {
    showFavoritesOnly,
    setShowFavoritesOnly,
    favoriteUserIds,
    favoriteSavingId,
    handleToggleFavorite,
    syncFavoriteIdsFromProfile,
    appendShortlistDiscoverParams,
  }
}
