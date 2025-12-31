import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AuthProvider } from '../context/AuthContext'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'http://localhost:3000'

async function getUser() {
  const cookieStore = await cookies()

  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    })

    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('Auth check failed:', error)
    return null
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user || !user.loggedIn) {
    redirect(HOME_URL)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
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
              <span className="text-xl md:text-2xl font-serif font-bold text-myColor-900">
                Amgel Jodi
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-myColor-700 hover:text-myColor-900 transition-colors font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-myColor-700 hover:text-myColor-900 transition-colors font-medium"
              >
                My Profile
              </Link>
              <div className="h-6 w-px bg-myColor-200" />
              <span className="text-myColor-600 text-sm">
                {user.user?.phone || 'User'}
              </span>
              <form action="/api/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 text-myColor-600 hover:text-myColor-800 hover:bg-myColor-50 rounded-lg transition-all text-sm font-medium"
                >
                  Logout
                </button>
              </form>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-3">
              <Link
                href="/profile"
                className="p-2 text-myColor-600 hover:bg-myColor-50 rounded-lg transition-colors"
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

      {/* Main Content */}
      <main className="pb-8">
        <AuthProvider user={user.user}>
          {children}
        </AuthProvider>
      </main>
    </div>
  )
}
