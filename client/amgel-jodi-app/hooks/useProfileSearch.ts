'use client'

import { useMemo } from 'react'
import { useDiscoverSearch } from '../context/DiscoverSearchContext'
import { filterProfilesByName } from '../lib/profileSearch'

export function useProfileSearch(debouncedQuery: string) {
  const { profiles } = useDiscoverSearch()

  const trimmed = debouncedQuery.trim()

  const results = useMemo(
    () => filterProfilesByName(profiles, trimmed),
    [profiles, trimmed]
  )

  const hasQuery = trimmed.length > 0
  const isEmpty = hasQuery && results.length === 0

  return { results, hasQuery, isEmpty }
}
