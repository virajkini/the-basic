import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthProvider } from '../context/AuthContext'
import Header from '../../components/Header'

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
      <Header userPhone={user.user?.phone} />

      {/* Main Content */}
      <main className="pb-8">
        <AuthProvider user={user.user}>
          {children}
        </AuthProvider>
      </main>
    </div>
  )
}
