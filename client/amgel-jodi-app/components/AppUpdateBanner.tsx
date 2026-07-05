'use client'

import { useEffect, useState } from 'react'
import { authFetch } from '../app/utils/authFetch'

const DISMISSED_KEY = 'update_banner_dismissed'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

// Minimum versionCode that has FCM support
const FCM_MIN_VERSION_CODE = 8

export default function AppUpdateBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function checkAndMaybeShow() {
      if (!(window as any).isAndroidApp || !(window as any).AmgelJodiNative) return
      if (localStorage.getItem(DISMISSED_KEY)) return

      const appInfo = JSON.parse((window as any).AmgelJodiNative?.getAppInfo?.() || '{}')
      const versionCode = appInfo?.versionCode ?? 0

      // Only show for old app versions that don't have FCM
      if (versionCode >= FCM_MIN_VERSION_CODE) return

      // Double-check server-side token status
      authFetch(`${API_BASE}/notifications/fcm-token-status`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.hasToken) setShow(true)
        })
        .catch(() => {})
    }

    window.addEventListener('amgeljodi:native-context', checkAndMaybeShow)
    checkAndMaybeShow()

    return () => {
      window.removeEventListener('amgeljodi:native-context', checkAndMaybeShow)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mx-4 mt-3">
      <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-800 font-medium">Update available</p>
        <p className="text-xs text-amber-700 mt-0.5">Update the app to get timely push notifications.</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-amber-400 hover:text-amber-600 shrink-0"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
