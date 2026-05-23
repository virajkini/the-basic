'use client'

import type { DiscoverProfile } from '../../context/DiscoverSearchContext'
import { getDisplayName, PROFILE_SEARCH_MAX_SUGGESTIONS } from '../../lib/profileSearch'

interface ProfileSearchSuggestionsProps {
  results: DiscoverProfile[]
  isEmpty: boolean
  hasQuery: boolean
  onSelect: (profile: DiscoverProfile) => void
  activeIndex?: number
  id?: string
}

export default function ProfileSearchSuggestions({
  results,
  isEmpty,
  hasQuery,
  onSelect,
  activeIndex = -1,
  id = 'profile-search-suggestions',
}: ProfileSearchSuggestionsProps) {
  if (!hasQuery) return null

  if (isEmpty) {
    return (
      <div
        id={id}
        role="listbox"
        className="absolute left-0 right-0 top-full mt-1 z-[60] bg-white rounded-lg shadow-lg border border-myColor-100 py-3 px-4 text-sm text-myColor-600"
      >
        No profiles found
      </div>
    )
  }

  return (
    <ul
      id={id}
      role="listbox"
      className="absolute left-0 right-0 top-full mt-1 z-[60] bg-white rounded-lg shadow-lg border border-myColor-100 overflow-y-auto"
      style={{ maxHeight: `${PROFILE_SEARCH_MAX_SUGGESTIONS * 64}px` }}
    >
      {results.map((profile, index) => {
        const primaryImage = profile.images[0]
        return (
          <li key={profile._id} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(profile)}
              className={`w-full flex items-center gap-3 text-left px-3 py-2.5 transition-colors border-b border-myColor-50 last:border-b-0 ${
                index === activeIndex ? 'bg-myColor-50' : 'hover:bg-myColor-50'
              }`}
            >
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover bg-myColor-100 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-myColor-100 shrink-0" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-myColor-900 truncate">
                  {getDisplayName(profile)}
                </div>
                <div className="text-xs mt-0.5 text-myColor-700 truncate">
                  from <span className="text-myColor-500">{profile.nativePlace}</span>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
