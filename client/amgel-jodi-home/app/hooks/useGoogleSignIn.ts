'use client'

import { useCallback, useRef } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

// GIS must only be initialized once per page load
let _gisInitialized = false

async function loadGIS(): Promise<void> {
  if ((window as any).google?.accounts?.id) return
  await new Promise<void>((resolve, reject) => {
    if (document.getElementById('gsi-script')) {
      const poll = setInterval(() => {
        if ((window as any).google?.accounts?.id) { clearInterval(poll); resolve() }
      }, 50)
      return
    }
    const s = document.createElement('script')
    s.id = 'gsi-script'
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(s)
  })
}

interface UseGoogleSignInOptions {
  onSuccess: () => void
  onError: (message: string) => void
  setLoading: (loading: boolean) => void
}

export function useGoogleSignIn({ onSuccess, onError, setLoading }: UseGoogleSignInOptions) {
  // Ref so the GIS callback (registered once) always calls the latest onSuccess
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const signIn = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) return
    setLoading(true)
    onError('')
    try {
      await loadGIS()

      if (!_gisInitialized) {
        _gisInitialized = true
        ;(window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async ({ credential }: { credential: string }) => {
            try {
              const res = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ idToken: credential }),
              })
              const data = await res.json()
              if (res.ok) {
                onSuccessRef.current()
                window.dispatchEvent(new Event('loginSuccess'))
              } else {
                onError(data.error || 'Google login failed')
              }
            } catch {
              onError('Google login failed. Please try again.')
            } finally {
              setLoading(false)
            }
          },
        })
      }

      // Fallback: clear loading if the prompt is dismissed without completing sign-in
      const loadingTimeout = setTimeout(() => setLoading(false), 30_000)
      ;(window as any).google.accounts.id.prompt(() => clearTimeout(loadingTimeout))
    } catch {
      onError('Could not load Google Sign-In. Please try again.')
      setLoading(false)
    }
  }, [onError, setLoading])

  return { signIn, enabled: !!GOOGLE_CLIENT_ID }
}
