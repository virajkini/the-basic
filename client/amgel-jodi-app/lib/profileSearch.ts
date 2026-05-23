import type { DiscoverProfile } from '../context/DiscoverSearchContext'

const MAX_SUGGESTIONS = 5

export function getDisplayName(profile: DiscoverProfile): string {
  return profile.firstName.trim()
}

export function filterProfilesByName(
  profiles: DiscoverProfile[],
  query: string
): DiscoverProfile[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const matches = profiles.filter((p) =>
    p.firstName.trim().toLowerCase().includes(q)
  )
  return matches.slice(0, MAX_SUGGESTIONS)
}

export const PROFILE_SEARCH_MAX_SUGGESTIONS = MAX_SUGGESTIONS
