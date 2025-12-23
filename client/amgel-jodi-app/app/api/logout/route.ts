import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'http://localhost:3000'

export async function POST() {
  const cookieStore = await cookies()

  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    })
  } catch (error) {
    console.error('Logout failed:', error)
  }

  // Create response with redirect
  const response = NextResponse.redirect(new URL(HOME_URL))

  // Clear cookies in response
  response.cookies.set('accessToken', '', { maxAge: 0, path: '/' })
  response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' })

  return response
}

