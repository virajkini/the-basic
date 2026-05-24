'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../app/context/AuthContext'
import type { DiscoverProfile } from '../../context/DiscoverSearchContext'
import { useDiscoverSearch } from '../../context/DiscoverSearchContext'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useProfileSearch } from '../../hooks/useProfileSearch'

export function useProfileSearchState(onMobileExpandChange?: (expanded: boolean) => void) {
  const { user } = useAuth()
  const pathname = usePathname()
  const { openDiscoverProfile, profileDetailOpen } = useDiscoverSearch()
  const wasProfileDetailOpenRef = useRef(false)

  const [query, setQuery] = useState('')
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const debouncedQuery = useDebouncedValue(query, 100)
  const { results, hasQuery, isEmpty } = useProfileSearch(debouncedQuery)

  const desktopContainerRef = useRef<HTMLDivElement>(null)
  const mobileContainerRef = useRef<HTMLDivElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const isDashboard = pathname === '/dashboard'
  const isVerified = user?.verified === true
  const isVisible = isVerified && isDashboard
  const showDropdown = isDropdownOpen && hasQuery

  const releaseMobileSearchFocus = useCallback(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement && mobileContainerRef.current?.contains(active)) {
      active.blur()
    }
    mobileTriggerRef.current?.focus({ preventScroll: true })
  }, [])

  const setMobileExpanded = useCallback(
    (expanded: boolean) => {
      if (!expanded) {
        releaseMobileSearchFocus()
        setIsDropdownOpen(false)
        setActiveIndex(-1)
      }
      setIsMobileExpanded(expanded)
      onMobileExpandChange?.(expanded)
    },
    [onMobileExpandChange, releaseMobileSearchFocus]
  )

  const dismissSearchKeyboard = useCallback(() => {
    mobileInputRef.current?.blur()
    desktopInputRef.current?.blur()
    const active = document.activeElement
    if (active instanceof HTMLElement && mobileContainerRef.current?.contains(active)) {
      active.blur()
    }
  }, [])

  const handleSelect = useCallback(
    (profile: DiscoverProfile) => {
      dismissSearchKeyboard()
      openDiscoverProfile(profile)
      setIsDropdownOpen(true)
      setActiveIndex(-1)
    },
    [openDiscoverProfile, dismissSearchKeyboard]
  )

  const handleMobileExpand = useCallback(() => {
    setMobileExpanded(true)
    setIsDropdownOpen(true)
  }, [setMobileExpanded])

  const handleMobileCollapse = useCallback(() => {
    setMobileExpanded(false)
    setQuery('')
    setActiveIndex(-1)
  }, [setMobileExpanded])

  useEffect(() => {
    if (!isDashboard) {
      setMobileExpanded(false)
      setQuery('')
      setIsDropdownOpen(false)
    }
  }, [isDashboard, setMobileExpanded])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDetailOpen) return

      const target = e.target as HTMLElement
      if (target.closest('[data-profile-detail-view]')) return

      const inDesktop = desktopContainerRef.current?.contains(target)
      const inMobile = mobileContainerRef.current?.contains(target)
      if (!inDesktop && !inMobile) {
        setIsDropdownOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileDetailOpen])

  useEffect(() => {
    if (wasProfileDetailOpenRef.current && !profileDetailOpen && query.trim()) {
      setIsDropdownOpen(true)
    }
    wasProfileDetailOpenRef.current = profileDetailOpen
  }, [profileDetailOpen, query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileExpanded) {
          handleMobileCollapse()
        } else {
          setIsDropdownOpen(false)
          setActiveIndex(-1)
          desktopInputRef.current?.blur()
        }
        return
      }

      if (!showDropdown || results.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showDropdown, results, activeIndex, handleSelect, isMobileExpanded, handleMobileCollapse])

  useEffect(() => {
    setActiveIndex(-1)
  }, [debouncedQuery])

  return {
    isVisible,
    query,
    setQuery: (v: string) => {
      setQuery(v)
      setIsDropdownOpen(true)
    },
    isMobileExpanded,
    handleMobileExpand,
    handleMobileCollapse,
    results,
    hasQuery,
    isEmpty,
    showDropdown,
    handleSelect,
    activeIndex,
    desktopContainerRef,
    mobileContainerRef,
    mobileTriggerRef,
    desktopInputRef,
    mobileInputRef,
    onDesktopSubmit: () => {
      if (results.length > 0) handleSelect(results[0])
    },
  }
}
