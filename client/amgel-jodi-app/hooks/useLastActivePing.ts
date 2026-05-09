import { useEffect, useRef } from 'react'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

const LAST_ACTIVE_PING_LS_KEY = 'amgel-last-active-ping'
const THROTTLE_MS = 30 * 60 * 1000

function readLastPingMs(): number | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_PING_LS_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeLastPingMs(ms: number) {
  try {
    localStorage.setItem(LAST_ACTIVE_PING_LS_KEY, String(ms))
  } catch {
    // ignore (storage may be unavailable)
  }
}

export function useLastActivePing(userId?: string | null) {
  const didPingRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    if (didPingRef.current) return

    const now = Date.now()
    const last = readLastPingMs()
    if (last && now - last < THROTTLE_MS) {
      didPingRef.current = true
      return
    }

    didPingRef.current = true
    writeLastPingMs(now)

    ;(async () => {
      try {
        const res = await authFetch(`${API_BASE}/profiles/last-active`, { method: 'POST' })
        if (!res.ok) {
          // If it failed, allow retry on next mount
          didPingRef.current = false
          return
        }
      } catch {
        // Session expired is handled by authFetch; on network errors allow retry later
        didPingRef.current = false
      }
    })()
  }, [userId])
}

