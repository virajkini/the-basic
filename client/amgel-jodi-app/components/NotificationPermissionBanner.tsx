'use client'

import { useEffect, useState } from 'react'

const PROMPT_COUNT_KEY = 'notif_prompt_count'
const MAX_PROMPTS = 3

export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function checkAndMaybeShow() {
      // Only show inside the Android WebView
      if (!window.isAndroidApp || !window.AmgelJodiNative) return

      const count = parseInt(localStorage.getItem(PROMPT_COUNT_KEY) || '0', 10)
      if (count >= MAX_PROMPTS) return

      const status = window.AmgelJodiNative.getNotificationPermissionStatus()
      if (status === 'granted') return

      setShow(true)
      localStorage.setItem(PROMPT_COUNT_KEY, String(count + 1))
    }

    // The bridge injects window.isAndroidApp after page load and fires this event.
    // Listen for it so we don't race with onPageFinished.
    window.addEventListener('amgeljodi:native-context', checkAndMaybeShow)

    // Also run immediately in case the component mounts after the event already fired
    // (e.g. client-side navigation within the app).
    checkAndMaybeShow()

    return () => {
      window.removeEventListener('amgeljodi:native-context', checkAndMaybeShow)
    }
  }, [])

  const handleEnable = () => {
    window.AmgelJodiNative?.requestNotificationPermission()

    const prev = window.onNativeMessage
    window.onNativeMessage = (type, data) => {
      if (type === 'notificationPermissionResult') {
        setShow(false)
      }
      prev?.(type, data)
    }
  }

  if (!show) return null

  return (
    <div className="flex items-center gap-3 bg-myColor-50 border border-myColor-200 rounded-xl px-4 py-3 mx-4 mt-3">
      <svg className="w-5 h-5 text-myColor-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <p className="flex-1 text-sm text-myColor-800">
        Enable notifications to get timely updates on connection requests.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleEnable}
          className="text-xs font-semibold text-myColor-700 bg-myColor-100 hover:bg-myColor-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Enable
        </button>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
