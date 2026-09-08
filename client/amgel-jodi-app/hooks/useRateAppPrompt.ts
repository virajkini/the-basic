'use client'

import { useEffect, useRef, useState } from 'react'
import { getBrowserClientSurface } from '../lib/clientSurface'

/** How long the user must be on the dashboard before we prompt. */
const SHOW_DELAY_MS = 10_000
const MAX_SHOWN_COUNT = 3
const MIN_ACCOUNT_AGE_DAYS = 7

const RATED_KEY = 'amgel-rate-app-rated'
const SHOWN_COUNT_KEY = 'amgel-rate-app-shown-count'
const LAST_SHOWN_DATE_KEY = 'amgel-rate-app-last-shown-date'

/** Local dev always shows the prompt (after the delay) so it's easy to test. */
const ALWAYS_SHOW = process.env.NODE_ENV !== 'production'

function localCalendarYmd(): string {
  return new Date().toLocaleDateString('en-CA')
}

function readShownCount(): number {
  try {
    const n = parseInt(localStorage.getItem(SHOWN_COUNT_KEY) || '0', 10)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function hasBeenRated(): boolean {
  try {
    return localStorage.getItem(RATED_KEY) === '1'
  } catch {
    return false
  }
}

function shownToday(): boolean {
  try {
    return localStorage.getItem(LAST_SHOWN_DATE_KEY) === localCalendarYmd()
  } catch {
    return false
  }
}

function isAccountOldEnough(createdAt: string): boolean {
  const createdMs = new Date(createdAt).getTime()
  if (!Number.isFinite(createdMs)) return false
  const ageDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24)
  return ageDays > MIN_ACCOUNT_AGE_DAYS
}

function isEligible(createdAt: string | null | undefined): boolean {
  if (typeof window === 'undefined') return false
  if (ALWAYS_SHOW) return true
  if (getBrowserClientSurface() === 'desktop') return false
  if (!createdAt) return false
  if (hasBeenRated()) return false
  if (readShownCount() >= MAX_SHOWN_COUNT) return false
  if (shownToday()) return false
  return isAccountOldEnough(createdAt)
}

function recordShown() {
  try {
    localStorage.setItem(SHOWN_COUNT_KEY, String(readShownCount() + 1))
    localStorage.setItem(LAST_SHOWN_DATE_KEY, localCalendarYmd())
  } catch {}
}

/**
 * Prompts the user to rate the app on the Play Store shortly after landing on
 * the dashboard — only on mobile/app surfaces, only for accounts older than a
 * week, capped at 3 dismissable showings (never more than once a day), and
 * never again once they've rated. In local dev it always shows after the
 * delay so the sheet is easy to test.
 */
export function useRateAppPrompt(profileCreatedAt: string | null | undefined) {
  const [isOpen, setIsOpen] = useState(false)
  const triggeredRef = useRef(false)

  useEffect(() => {
    if (triggeredRef.current) return
    if (!isEligible(profileCreatedAt)) return

    const timer = setTimeout(() => {
      if (!isEligible(profileCreatedAt)) return
      triggeredRef.current = true
      recordShown()
      setIsOpen(true)
    }, SHOW_DELAY_MS)

    return () => clearTimeout(timer)
  }, [profileCreatedAt])

  const dismiss = () => setIsOpen(false)

  const markRated = () => {
    try {
      localStorage.setItem(RATED_KEY, '1')
    } catch {}
    setIsOpen(false)
  }

  return { isOpen, dismiss, markRated }
}
