'use client'

import { forwardRef, useEffect } from 'react'
import type { RefObject } from 'react'
import type { DiscoverProfile } from '../../context/DiscoverSearchContext'
import ProfileSearchSuggestions from './ProfileSearchSuggestions'
import { CloseIcon, SearchIcon } from './SearchIcons'

export interface ProfileSearchMobileProps {
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
  query: string
  onQueryChange: (value: string) => void
  results: DiscoverProfile[]
  hasQuery: boolean
  isEmpty: boolean
  showDropdown: boolean
  onSelect: (profile: DiscoverProfile) => void
  activeIndex: number
  containerRef: RefObject<HTMLDivElement>
  inputRef: RefObject<HTMLInputElement>
}

const fadeClass = 'transition-opacity duration-500 ease-in-out'

/** In-flow search icon (sits beside notification / menu). */
export const ProfileSearchMobileTrigger = forwardRef<
  HTMLButtonElement,
  Pick<ProfileSearchMobileProps, 'isExpanded' | 'onExpand'>
>(function ProfileSearchMobileTrigger({ isExpanded, onExpand }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onExpand}
      aria-label="Search profiles"
      aria-expanded={isExpanded}
      tabIndex={isExpanded ? -1 : 0}
      className={`md:hidden p-2 text-myColor-600 border border-myColor-200 rounded-lg hover:bg-myColor-50 shrink-0 ${fadeClass} ${
        isExpanded ? 'opacity-0 invisible pointer-events-none' : 'opacity-100'
      }`}
    >
      <SearchIcon />
    </button>
  )
})

/** Full-width search bar overlay — parent row must be `position: relative`. */
export function ProfileSearchMobileBar({
  isExpanded,
  onCollapse,
  query,
  onQueryChange,
  results,
  hasQuery,
  isEmpty,
  showDropdown,
  onSelect,
  activeIndex,
  containerRef,
  inputRef,
}: Omit<ProfileSearchMobileProps, 'onExpand'>) {
  useEffect(() => {
    if (isExpanded) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isExpanded, inputRef])

  return (
    <div
      ref={containerRef}
      aria-hidden={!isExpanded}
      className={`md:hidden absolute inset-0 z-20 flex items-center gap-3 bg-white/95 backdrop-blur-lg ${fadeClass} ${
        isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex-1 min-w-0 relative">
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-myColor-400 pointer-events-none"
            aria-hidden
          >
            <SearchIcon className="w-5 h-5" />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search profiles by name"
            autoComplete="off"
            tabIndex={isExpanded ? 0 : -1}
            aria-label="Search profiles by name"
            aria-expanded={showDropdown}
            aria-controls="profile-search-suggestions-mobile"
            className="w-full h-10 pl-10 pr-3 text-sm text-myColor-900 bg-white border border-myColor-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-myColor-400 placeholder:text-myColor-400"
          />
        </div>
        {showDropdown && isExpanded && (
          <ProfileSearchSuggestions
            id="profile-search-suggestions-mobile"
            results={results}
            hasQuery={hasQuery}
            isEmpty={isEmpty}
            onSelect={onSelect}
            activeIndex={activeIndex}
          />
        )}
      </div>
      <button
        type="button"
        onClick={onCollapse}
        aria-label="Close search"
        tabIndex={isExpanded ? 0 : -1}
        className="h-5 w-5 flex items-center justify-center text-myColor-600 hover:bg-myColor-50 rounded shrink-0"
      >
        <CloseIcon />
      </button>
    </div>
  )
}

/** @deprecated Use ProfileSearchMobileTrigger + ProfileSearchMobileBar in Header */
export default function ProfileSearchMobile(props: ProfileSearchMobileProps) {
  return (
    <>
      <ProfileSearchMobileTrigger isExpanded={props.isExpanded} onExpand={props.onExpand} />
      <ProfileSearchMobileBar {...props} />
    </>
  )
}
