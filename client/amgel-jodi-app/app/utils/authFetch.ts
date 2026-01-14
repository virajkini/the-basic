const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'http://localhost:3000'

// Singleton refresh promise to prevent multiple simultaneous refresh calls
let refreshPromise: Promise<boolean> | null = null

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
 * Try to refresh the access token (singleton - only one refresh at a time)
 * Exported for use by SSE connections that can't use authFetch
 */
export async function tryRefreshToken(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (refreshPromise) {
    return refreshPromise
  }

  // Start new refresh
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      return response.ok
    } catch {
      return false
    } finally {
      // Clear the promise after a short delay to allow batched requests
      setTimeout(() => {
        refreshPromise = null
      }, 100)
    }
  })()

  return refreshPromise
}

/**
 * Redirect to home page
 */
function redirectToHome() {
  if (typeof window !== 'undefined') {
    window.location.href = HOME_URL
  }
}
