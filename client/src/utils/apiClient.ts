const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Helper to refresh token
async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Important: include cookies
      });

      if (response.ok) {
        return true;
      } else {
        // Refresh failed, user needs to login again
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Main API client function
export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // If endpoint is a full URL, use it as-is
  // If it starts with /, prepend API_BASE
  // Otherwise, treat it as a full URL (for backward compatibility)
  let url: string;
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else if (endpoint.startsWith('/')) {
    url = `${API_BASE}${endpoint}`;
  } else {
    // Extract path from full URL if apiBase was passed
    const urlObj = new URL(endpoint, window.location.origin);
    const path = urlObj.pathname;
    url = `${API_BASE}${path}${urlObj.search}`;
  }

  // Make initial request
  let response = await fetch(url, {
    ...options,
    credentials: 'include', // Important: include cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // If we get a 401, try to refresh the token
  if (response.status === 401 && !endpoint.includes('/auth/')) {
    const refreshed = await refreshToken();

    if (refreshed) {
      // Retry the original request
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } else {
      // Refresh failed, return the 401 response
      // The caller can handle this (e.g., redirect to login)
    }
  }

  return response;
}

// Convenience methods
export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    apiClient(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body?: any, options?: RequestInit) =>
    apiClient(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (endpoint: string, body?: any, options?: RequestInit) =>
    apiClient(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (endpoint: string, body?: any, options?: RequestInit) =>
    apiClient(endpoint, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
