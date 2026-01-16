'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => pathname === path

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-myColor-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-xl flex items-center justify-center shadow-lg shadow-myColor-500/30">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-lg md:text-xl font-heading font-bold text-myColor-900">
              Amgel Jodi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
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
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="ml-1 px-4 py-2 text-myColor-600 hover:text-myColor-800 hover:bg-myColor-50 rounded-lg transition-all text-sm font-medium"
              >
                Logout
              </button>
            </form>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-1">
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

              {/* Dropdown Menu */}
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
      </div>
    </header>
  )
}
