'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.amgeljodi.app'

function useIsAndroidApp() {
  const [isAndroidApp, setIsAndroidApp] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsAndroidApp(
      (window as Window & { isAndroidApp?: boolean; isAmgelJodiApp?: boolean }).isAndroidApp === true ||
      (window as Window & { isAndroidApp?: boolean; isAmgelJodiApp?: boolean }).isAmgelJodiApp === true ||
      navigator.userAgent.includes('AmgelJodiApp')
    )
  }, [])

  return isAndroidApp
}

export function AndroidAppButton({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-zinc-950/80 px-5 py-4 text-white shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-zinc-900 ${compact ? 'px-4 py-3' : ''} ${className}`}
      aria-label="Download Amgel Jodi on Google Play"
    >
      <span className={`flex items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 ${compact ? 'h-11 w-11' : 'h-12 w-12'}`}>
        <svg viewBox="0 0 24 24" className={`${compact ? 'h-6 w-6' : 'h-7 w-7'}`} aria-hidden="true">
          <path fill="#34A853" d="M4.8 3.8 13.9 13 4.8 20.2c-.5-.3-.8-.9-.8-1.6V5.4c0-.7.3-1.3.8-1.6Z" />
          <path fill="#4285F4" d="m16.8 10.6 2.9 1.7c1 .6 1 1.8 0 2.4l-2.9 1.7-3.2-3.2 3.2-2.6Z" />
          <path fill="#FBBC04" d="m4.8 20.2 9.8-7.7 2.2 2.2-8.9 5.1c-1.1.6-2.3.7-3.1.4Z" />
          <path fill="#EA4335" d="m4.8 3.8 3.1-.4c.8-.1 1.7.1 2.4.5l6.5 3.7-2.2 2.2-9.8-6Z" />
        </svg>
      </span>
      <span className="text-left leading-tight">
        <span className={`block text-white/60 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>Get the app on</span>
        <span className={`block font-semibold tracking-tight ${compact ? 'text-base' : 'text-lg'}`}>Google Play</span>
      </span>
      {!compact && (
        <span className="hidden text-sm text-white/60 transition-transform duration-300 group-hover:translate-x-0.5 md:inline-flex">
          Android
        </span>
      )}
    </a>
  )
}

export function HeroAndroidAppLink() {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 rounded-full border border-white/14 bg-white/6 px-4 py-3 text-white/88 backdrop-blur-sm transition-all duration-300 hover:border-white/24 hover:bg-white/10"
      aria-label="Download Amgel Jodi on Google Play"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 ring-1 ring-white/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#34A853" d="M4.8 3.8 13.9 13 4.8 20.2c-.5-.3-.8-.9-.8-1.6V5.4c0-.7.3-1.3.8-1.6Z" />
          <path fill="#4285F4" d="m16.8 10.6 2.9 1.7c1 .6 1 1.8 0 2.4l-2.9 1.7-3.2-3.2 3.2-2.6Z" />
          <path fill="#FBBC04" d="m4.8 20.2 9.8-7.7 2.2 2.2-8.9 5.1c-1.1.6-2.3.7-3.1.4Z" />
          <path fill="#EA4335" d="m4.8 3.8 3.1-.4c.8-.1 1.7.1 2.4.5l6.5 3.7-2.2 2.2-9.8-6Z" />
        </svg>
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[11px] text-white/50">Download the Android app</span>
        <span className="block text-sm font-semibold tracking-tight text-white">Get it on Google Play</span>
      </span>
      <svg
        className="h-4 w-4 text-white/45 transition-transform duration-300 group-hover:translate-x-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  )
}

export function SubpageAndroidAppStrip() {
  const pathname = usePathname()
  const isAndroidApp = useIsAndroidApp()

  if (pathname === '/' || isAndroidApp) {
    return null
  }

  return (
    <section className="border-t border-myColor-100 bg-[linear-gradient(180deg,#fffdf8_0%,#f7f1ff_100%)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-12 text-center md:px-6">
        <span className="inline-flex rounded-full border border-myColor-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-myColor-500">
          Android App
        </span>
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-myColor-900 md:text-4xl">
            Take Amgel Jodi with you
          </h2>
          <p className="mt-3 text-base leading-7 text-myColor-600 md:text-lg">
            Browse profiles, stay connected, and access Amgel Jodi more smoothly on Android with the official app.
          </p>
        </div>
        <AndroidAppButton />
      </div>
    </section>
  )
}
