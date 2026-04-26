'use client'

import posthog from 'posthog-js'
import { getBrowserClientSurface } from './clientSurface'

/** Super property included on every client-side PostHog event (autocapture, exceptions, capture()). */
export function registerPosthogClientSurface() {
  if (typeof window === 'undefined') return
  posthog.register({ client_surface: getBrowserClientSurface() })
}
