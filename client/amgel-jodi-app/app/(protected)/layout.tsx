import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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
    <div className="min-h-screen bg-myColor-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl md:text-2xl font-bold text-myColor-900">
              Amgel Jodi
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-myColor-700 hover:text-myColor-900 transition-colors">
                Dashboard
              </a>
              <a href="/profile" className="text-myColor-700 hover:text-myColor-900 transition-colors">
                Profile
              </a>
              <a href="/settings" className="text-myColor-700 hover:text-myColor-900 transition-colors">
                Settings
              </a>
              <span className="text-myColor-600">|</span>
              <span className="text-myColor-700 text-sm">
                {user.user?.phone || 'User'}
              </span>
              <form action="/api/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 text-myColor-600 hover:text-myColor-800 transition-colors text-sm"
                >
                  Logout
                </button>
              </form>
            </nav>
            <form action="/api/logout" method="post" className="md:hidden">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm text-myColor-600 hover:text-myColor-800 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

