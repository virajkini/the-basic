'use client'

import type { RefObject } from 'react'
import type { DiscoverProfile } from '../../context/DiscoverSearchContext'
import ProfileSearchSuggestions from './ProfileSearchSuggestions'
import { SearchIcon } from './SearchIcons'

interface ProfileSearchDesktopProps {
  query: string
  onQueryChange: (value: string) => void
  onSubmit: () => void
  results: DiscoverProfile[]
  hasQuery: boolean
  isEmpty: boolean
  showDropdown: boolean
  onSelect: (profile: DiscoverProfile) => void
  activeIndex: number
  containerRef: RefObject<HTMLDivElement>
  inputRef: RefObject<HTMLInputElement>
}

export default function ProfileSearchDesktop({
  query,
  onQueryChange,
  onSubmit,
  results,
  hasQuery,
  isEmpty,
  showDropdown,
  onSelect,
  activeIndex,
  containerRef,
  inputRef,
}: ProfileSearchDesktopProps) {
  return (
    <div ref={containerRef} className="hidden md:flex flex-1 max-w-xl mx-4 relative">
      <form
        className="flex w-full"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => onQueryChange(query)}
          placeholder="Search profiles by name"
          autoComplete="off"
          aria-label="Search profiles by name"
          aria-expanded={showDropdown}
          aria-controls="profile-search-suggestions-desktop"
          className="flex-1 min-w-0 h-10 px-4 text-sm text-myColor-900 bg-white border border-myColor-200 border-r-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-myColor-400 focus:border-myColor-400 placeholder:text-myColor-400"
        />
        <button
          type="submit"
          aria-label="Search"
          className="h-10 px-4 flex items-center justify-center bg-myColor-500 hover:bg-myColor-600 text-white rounded-r-lg border border-myColor-500 transition-colors shrink-0"
        >
          <SearchIcon className="w-5 h-5" />
        </button>
      </form>
      {showDropdown && (
        <ProfileSearchSuggestions
          id="profile-search-suggestions-desktop"
          results={results}
          hasQuery={hasQuery}
          isEmpty={isEmpty}
          onSelect={onSelect}
          activeIndex={activeIndex}
        />
      )}
    </div>
  )
}
