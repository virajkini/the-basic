'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'
import {
  useProfileSearchState,
  ProfileSearchDesktop,
  ProfileSearchMobileTrigger,
  ProfileSearchMobileBar,
} from './search/ProfileSearch'

// Remove trailing slash to prevent double slashes in URLs
const HOME_URL = (process.env.NEXT_PUBLIC_HOME_URL || 'https://amgeljodi.com').replace(/\/$/, '')
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.amgeljodi.app'

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [isAndroidApp, setIsAndroidApp] = useState(false)
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const desktopMenuRef = useRef<HTMLDivElement>(null)

  const search = useProfileSearchState(setMobileSearchExpanded)

  const isActive = (path: string) => pathname === path

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) {
        setDesktopMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsAndroidApp(
      (window as Window & { isAndroidApp?: boolean; isAmgelJodiApp?: boolean }).isAndroidApp === true ||
      (window as Window & { isAndroidApp?: boolean; isAmgelJodiApp?: boolean }).isAmgelJodiApp === true ||
      navigator.userAgent.includes('AmgelJodiApp')
    )
  }, [])

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-myColor-100">
      <div className="container mx-auto px-4">
        <div className="relative flex justify-between items-center h-14 md:h-16 gap-2 md:gap-4">
          {/* Logo — fades out on mobile when search expands */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 shrink-0 transition-opacity duration-500 ease-in-out ${
              mobileSearchExpanded
                ? 'max-md:opacity-0 max-md:invisible max-md:pointer-events-none'
                : 'max-md:opacity-100'
            }`}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-xl flex items-center justify-center shadow-lg shadow-myColor-500/30">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-lg md:text-xl font-heading font-bold text-myColor-900">
              Amgel Jodi
            </span>
          </Link>

          {/* Desktop search */}
          {search.isVisible && (
            <ProfileSearchDesktop
              query={search.query}
              onQueryChange={search.setQuery}
              onSubmit={search.onDesktopSubmit}
              results={search.results}
              hasQuery={search.hasQuery}
              isEmpty={search.isEmpty}
              showDropdown={search.showDropdown}
              onSelect={search.handleSelect}
              activeIndex={search.activeIndex}
              containerRef={search.desktopContainerRef}
              inputRef={search.desktopInputRef}
            />
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            <Link
              href="/dashboard"
              scroll={false}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                isActive('/dashboard')
                  ? 'text-myColor-900 bg-myColor-50'
                  : 'text-myColor-700 hover:text-myColor-900 hover:bg-myColor-50'
              }`}
            >
              Discover
            </Link>
            <Link
              href="/connections"
              scroll={false}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                isActive('/connections')
                  ? 'text-myColor-900 bg-myColor-50'
                  : 'text-myColor-700 hover:text-myColor-900 hover:bg-myColor-50'
              }`}
            >
              Connections
            </Link>
            <div className="w-px h-6 bg-myColor-200 mx-2" />
            <NotificationBell />
            <Link
              href="/profile"
              className={`ml-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                isActive('/profile')
                  ? 'text-myColor-900 bg-myColor-50'
                  : 'text-myColor-700 hover:text-myColor-900 hover:bg-myColor-50'
              }`}
            >
              My Profile
            </Link>

            {/* Desktop More Menu */}
            <div className="relative" ref={desktopMenuRef}>
              <button
                onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                className="ml-1 p-2 text-myColor-600 hover:text-myColor-800 hover:bg-myColor-50 rounded-lg transition-colors"
                aria-label="More options"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {desktopMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  {!isAndroidApp && (
                    <a
                      href={PLAY_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setDesktopMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#34A853" d="M4.8 3.8 13.9 13 4.8 20.2c-.5-.3-.8-.9-.8-1.6V5.4c0-.7.3-1.3.8-1.6Z" />
                        <path fill="#4285F4" d="m16.8 10.6 2.9 1.7c1 .6 1 1.8 0 2.4l-2.9 1.7-3.2-3.2 3.2-2.6Z" />
                        <path fill="#FBBC04" d="m4.8 20.2 9.8-7.7 2.2 2.2-8.9 5.1c-1.1.6-2.3.7-3.1.4Z" />
                        <path fill="#EA4335" d="m4.8 3.8 3.1-.4c.8-.1 1.7.1 2.4.5l6.5 3.7-2.2 2.2-9.8-6Z" />
                      </svg>
                      <span>Download App</span>
                    </a>
                  )}
                  <a
                    href={`${HOME_URL}/contact`}
                    onClick={() => setDesktopMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Contact Us</span>
                  </a>
                  <a
                    href={`${HOME_URL}/terms`}
                    onClick={() => setDesktopMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Terms of Service</span>
                  </a>
                  <a
                    href={`${HOME_URL}/privacy`}
                    onClick={() => setDesktopMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Privacy Policy</span>
                  </a>
                  <div className="border-t border-gray-100 my-1" />
                  <form action="/api/logout" method="post">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile: search trigger + notification + menu */}
          <div className="md:hidden ml-auto flex items-center gap-2 relative min-h-10">
            {search.isVisible && (
              <ProfileSearchMobileTrigger
                ref={search.mobileTriggerRef}
                isExpanded={mobileSearchExpanded}
                onExpand={search.handleMobileExpand}
              />
            )}
            <div
              className={`flex items-center gap-2 transition-opacity duration-500 ease-in-out ${
                mobileSearchExpanded
                  ? 'opacity-0 invisible pointer-events-none'
                  : 'opacity-100'
              }`}
            >
              <NotificationBell />

              {/* Burger Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 text-myColor-600 hover:bg-myColor-50 rounded-lg transition-colors"
                  aria-label="Menu"
                >
                  {menuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Edit Profile</span>
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    {!isAndroidApp && (
                      <a
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#34A853" d="M4.8 3.8 13.9 13 4.8 20.2c-.5-.3-.8-.9-.8-1.6V5.4c0-.7.3-1.3.8-1.6Z" />
                          <path fill="#4285F4" d="m16.8 10.6 2.9 1.7c1 .6 1 1.8 0 2.4l-2.9 1.7-3.2-3.2 3.2-2.6Z" />
                          <path fill="#FBBC04" d="m4.8 20.2 9.8-7.7 2.2 2.2-8.9 5.1c-1.1.6-2.3.7-3.1.4Z" />
                          <path fill="#EA4335" d="m4.8 3.8 3.1-.4c.8-.1 1.7.1 2.4.5l6.5 3.7-2.2 2.2-9.8-6Z" />
                        </svg>
                        <span>Download App</span>
                      </a>
                    )}
                    <a
                      href={`${HOME_URL}/contact`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Contact Us</span>
                    </a>
                    <a
                      href={`${HOME_URL}/terms`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Terms of Service</span>
                    </a>
                    <a
                      href={`${HOME_URL}/privacy`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-myColor-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Privacy Policy</span>
                    </a>
                    <div className="border-t border-gray-100 my-1" />
                    <form action="/api/logout" method="post">
                      <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile search bar — full header row overlay */}
          {search.isVisible && (
            <ProfileSearchMobileBar
              isExpanded={mobileSearchExpanded}
              onCollapse={search.handleMobileCollapse}
              query={search.query}
              onQueryChange={search.setQuery}
              results={search.results}
              hasQuery={search.hasQuery}
              isEmpty={search.isEmpty}
              showDropdown={search.showDropdown}
              onSelect={search.handleSelect}
              activeIndex={search.activeIndex}
              containerRef={search.mobileContainerRef}
              inputRef={search.mobileInputRef}
            />
          )}
        </div>
      </div>
    </header>
  )
}
