'use client'

import { createContext, useContext, ReactNode } from 'react'

interface User {
  phone: string
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
