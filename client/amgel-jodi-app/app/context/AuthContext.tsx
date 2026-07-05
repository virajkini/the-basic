'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import posthog from 'posthog-js'

interface User {
  phone?: string
  email?: string
  authProvider: 'phone' | 'google'
  userId: string
  verified: boolean
  subscribed: boolean
}

interface AuthContextType {
  user: User | null
}

const AuthContext = createContext<AuthContextType>({ user: null })

export function AuthProvider({
  children,
  user,
}: {
  children: ReactNode
  user: User | null
}) {
  useEffect(() => {
    if (user?.userId) {
      posthog.identify(user.userId, {
        phone: user.phone,
        email: user.email,
        auth_provider: user.authProvider,
        verified: user.verified,
        subscribed: user.subscribed,
      })
    }
  }, [user?.userId])

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
