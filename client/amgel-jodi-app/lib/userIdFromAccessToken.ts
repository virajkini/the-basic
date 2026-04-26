/**
 * Read userId from our access JWT (payload only). Used where we already have
 * the cookie but must not add an extra /auth/me round trip (e.g. logout analytics).
 * Not a signature check — the API still validates the token on logout.
 */
export function getUserIdFromAccessToken(
  accessToken: string | undefined | null
): string | undefined {
  if (!accessToken || typeof accessToken !== 'string') return undefined
  const parts = accessToken.split('.')
  if (parts.length !== 3) return undefined
  try {
    const json = Buffer.from(parts[1]!, 'base64url').toString('utf8')
    const payload = JSON.parse(json) as { userId?: unknown; type?: unknown }
    if (payload.type !== 'access') return undefined
    const id = payload.userId
    return typeof id === 'string' && id.length > 0 ? id : undefined
  } catch {
    return undefined
  }
}
