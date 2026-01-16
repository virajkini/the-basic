'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16">
        {/* Discover Tab */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/dashboard')
              ? 'text-myColor-600'
              : 'text-gray-500'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${isActive('/dashboard') ? 'bg-myColor-50' : ''}`}>
            <svg
              className="w-6 h-6"
              fill={isActive('/dashboard') ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isActive('/dashboard') ? (
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              )}
            </svg>
          </div>
          <span className={`text-xs mt-0.5 font-medium ${isActive('/dashboard') ? 'text-myColor-600' : 'text-gray-500'}`}>
            Discover
          </span>
        </Link>

        {/* Connections Tab */}
        <Link
          href="/connections"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/connections')
              ? 'text-myColor-600'
              : 'text-gray-500'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${isActive('/connections') ? 'bg-myColor-50' : ''}`}>
            <svg
              className="w-6 h-6"
              fill={isActive('/connections') ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isActive('/connections') ? (
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              )}
            </svg>
          </div>
          <span className={`text-xs mt-0.5 font-medium ${isActive('/connections') ? 'text-myColor-600' : 'text-gray-500'}`}>
            Connections
          </span>
        </Link>
      </div>
    </nav>
  )
}
