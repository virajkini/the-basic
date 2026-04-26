/**
 * Where the dashboard is running. WebView is detected via the Android app
 * user-agent suffix (see AmgelJodiWebView.kt: `AmgelJodiApp/...`).
 */
export type ClientSurface = 'webview' | 'mweb' | 'desktop'

const WEBVIEW_UA = /AmgelJodiApp/i

/** Mobile / tablet browser UA heuristics (excludes in-app WebView; check webview first). */
const MOBILE_UA =
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|CriOS|FxiOS/i

export function getClientSurfaceFromUserAgent(
  userAgent: string | null | undefined
): ClientSurface {
  if (!userAgent) return 'desktop'
  if (WEBVIEW_UA.test(userAgent)) return 'webview'
  if (MOBILE_UA.test(userAgent)) return 'mweb'
  return 'desktop'
}

export function getBrowserClientSurface(): ClientSurface {
  if (typeof navigator === 'undefined') return 'desktop'
  return getClientSurfaceFromUserAgent(navigator.userAgent)
}
