'use client'

import { useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.loggedIn) {
            // User is logged in, redirect to app
            window.location.href = APP_URL
          }
        }
        // If 401, user is not logged in, stay on homepage
      } catch (error) {
        // Network error, stay on page
        console.error('Auth check failed:', error)
      }
    }

    checkAuth()

    // Listen for login events (when login sheet closes after successful login)
    const handleLoginSuccess = () => {
      checkAuth()
    }

    window.addEventListener('loginSuccess', handleLoginSuccess)

    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess)
    }
  }, [])

  return <>{children}</>
}

