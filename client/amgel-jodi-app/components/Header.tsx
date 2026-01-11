'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  userPhone?: string
}

export default function Header({ userPhone }: HeaderProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-myColor-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-xl flex items-center justify-center shadow-lg shadow-myColor-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl md:text-2xl font-heading font-bold text-myColor-900">
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
              Dashboard
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
            <Link
              href="/profile"
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                isActive('/profile')
                  ? 'text-myColor-900 bg-myColor-50'
                  : 'text-myColor-700 hover:text-myColor-900 hover:bg-myColor-50'
              }`}
            >
              My Profile
            </Link>
            <div className="w-px h-6 bg-myColor-200 mx-2" />
            <NotificationBell />
            <span className="text-myColor-600 text-sm ml-2">{userPhone || 'User'}</span>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="ml-2 px-4 py-2 text-myColor-600 hover:text-myColor-800 hover:bg-myColor-50 rounded-lg transition-all text-sm font-medium"
              >
                Logout
              </button>
            </form>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/connections"
              className={`p-2 rounded-lg transition-colors ${
                isActive('/connections')
                  ? 'text-myColor-900 bg-myColor-50'
                  : 'text-myColor-600 hover:bg-myColor-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link
              href="/profile"
              className={`p-2 rounded-lg transition-colors ${
                isActive('/profile')
                  ? 'text-myColor-900 bg-myColor-50'
                  : 'text-myColor-600 hover:bg-myColor-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm text-myColor-600 hover:text-myColor-800 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
