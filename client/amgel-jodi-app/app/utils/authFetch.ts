const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'http://localhost:3000'

/**
 * Wrapper around fetch that handles 401 errors by:
 * 1. Trying to refresh the token
 * 2. Retrying the original request
 * 3. Redirecting to home if refresh fails
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
  }

  let response = await fetch(url, fetchOptions)

  // If 401, try to refresh token
  if (response.status === 401) {
    const refreshed = await tryRefreshToken()

    if (refreshed) {
      // Retry the original request
      response = await fetch(url, fetchOptions)
    } else {
      // Refresh failed, redirect to home
      redirectToHome()
      throw new Error('Session expired')
    }
  }

  return response
}

/**
 * Try to refresh the access token
 */
async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    return response.ok
  } catch {
    return false
  }
}

/**
 * Redirect to home page
 */
function redirectToHome() {
  if (typeof window !== 'undefined') {
    window.location.href = HOME_URL
  }
}
