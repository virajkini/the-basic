const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'http://localhost:3000'

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false

/**
 * Centralized API client wrapper that handles:
 * 1. Authentication via cookies (credentials: 'include')
 * 2. Redirect to home page on 401 (session expired)
 *
 * Token refresh is handled automatically by the server via sliding expiration.
 * Active users get their tokens extended automatically on each request.
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

  const response = await fetch(url, fetchOptions)

  // If 401, session expired - redirect to home
  if (response.status === 401) {
    handleAuthFailure()
    throw new Error('Session expired')
  }

  return response
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
 * Reset auth state - useful for testing or after successful login
 */
export function resetAuthState() {
  isRedirecting = false
}
