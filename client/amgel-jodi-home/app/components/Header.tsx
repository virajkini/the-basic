'use client'

import { useState, useEffect } from 'react'
import LoginSheet from './LoginSheet'

export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Listen for openLoginSheet event from page CTAs
  useEffect(() => {
    const handleOpenLogin = () => setIsLoginOpen(true)
    window.addEventListener('openLoginSheet', handleOpenLogin)
    return () => window.removeEventListener('openLoginSheet', handleOpenLogin)
  }, [])

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Determine if scrolled past threshold for styling
      setIsScrolled(currentScrollY > 50)

      // Hide header on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-lg shadow-lg shadow-myColor-900/5'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isScrolled
                  ? 'bg-myColor-600 shadow-lg shadow-myColor-500/30'
                  : 'bg-white/10 backdrop-blur-sm border border-white/20'
              }`}>
                <svg
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isScrolled ? 'text-white' : 'text-white'
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className={`text-xl md:text-2xl font-heading font-bold transition-colors duration-300 ${
                isScrolled ? 'text-myColor-900' : 'text-white'
              }`}>
                Amgel Jodi
              </span>
            </a>

            {/* Login Button */}
            <button
              onClick={() => setIsLoginOpen(true)}
              className={`group relative px-5 py-2.5 md:px-6 md:py-2.5 rounded-full font-medium text-sm md:text-base transition-all duration-300 overflow-hidden ${
                isScrolled
                  ? 'bg-myColor-600 text-white hover:bg-myColor-700 shadow-lg shadow-myColor-500/30 hover:shadow-xl hover:shadow-myColor-500/40'
                  : 'bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 hover:border-white/50'
              } hover:scale-105 active:scale-95`}
            >
              <span className="relative z-10 flex items-center gap-2">
                Login
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content jump (only visible when header would overlap) */}
      <div className="h-0" />

      <LoginSheet isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}
