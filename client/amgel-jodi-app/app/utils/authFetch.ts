const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'http://localhost:3000'

// Singleton refresh promise to prevent multiple simultaneous refresh calls
let refreshPromise: Promise<boolean> | null = null

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false

// Track last successful refresh time to prevent rapid refresh loops
let lastRefreshTime = 0
const MIN_REFRESH_INTERVAL = 5000 // 5 seconds minimum between refresh attempts

/**
 * Centralized API client wrapper that handles:
 * 1. Authentication via cookies (credentials: 'include')
 * 2. Automatic token refresh on 401 errors
 * 3. Retry of original request after successful refresh
 * 4. Redirect to home page if refresh fails
 * 5. Prevention of redirect loops and rapid refresh attempts
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // If already redirecting, don't make more API calls
  if (isRedirecting) {
    throw new Error('Session expired')
  }

  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
  }

  let response = await fetch(url, fetchOptions)

  // If 401, try to refresh token
  if (response.status === 401) {
    const refreshed = await tryRefreshToken()

    if (refreshed) {
      // Retry the original request with fresh token
      response = await fetch(url, fetchOptions)

      // If still 401 after refresh, something is wrong - redirect
      if (response.status === 401) {
        handleAuthFailure()
        throw new Error('Session expired')
      }
    } else {
      // Refresh failed, redirect to home
      handleAuthFailure()
      throw new Error('Session expired')
    }
  }

  return response
}

/**
 * Try to refresh the access token
 * - Singleton pattern: only one refresh at a time
 * - Rate limiting: prevents rapid refresh attempts after success
 * - Exported for use by SSE connections that can't use authFetch
 */
export async function tryRefreshToken(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (refreshPromise) {
    return refreshPromise
  }

  // Prevent rapid refresh attempts only after a recent successful refresh
  // This allows retries on failure but prevents unnecessary refreshes
  const now = Date.now()
  if (lastRefreshTime > 0 && now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
    // Recent successful refresh - token should still be valid
    return true
  }

  // Start new refresh
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        lastRefreshTime = Date.now()
        return true
      }

      // Log failure reason in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[authFetch] Token refresh failed:', response.status)
      }
      return false
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[authFetch] Token refresh error:', error)
      }
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
 * Handle authentication failure - redirect to home page
 */
function handleAuthFailure() {
  if (typeof window === 'undefined' || isRedirecting) {
    return
  }

  isRedirecting = true

  // Small delay to allow any pending state updates
  setTimeout(() => {
    window.location.href = HOME_URL
  }, 100)
}

/**
 * Reset auth state - useful for testing or manual logout
 */
export function resetAuthState() {
  isRedirecting = false
  refreshPromise = null
  lastRefreshTime = 0
}
