'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const hasChecked = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.loggedIn) {
            window.location.href = APP_URL
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }

    // Only redirect from homepage (not from legal pages like /privacy, /terms, /contact)
    const isHomepage = pathname === '/'
    if (isHomepage && !hasChecked.current) {
      hasChecked.current = true
      checkAuthAndRedirect()
    }

    // Listen for login events - redirect after successful login from login sheet
    const handleLoginSuccess = () => {
      window.location.href = APP_URL
    }

    window.addEventListener('loginSuccess', handleLoginSuccess)

    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess)
    }
  }, [pathname])

  return <>{children}</>
}

