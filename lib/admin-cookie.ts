import { createHmac, timingSafeEqual } from 'node:crypto'

// The admin cookie proves the holder once knew COSMO_ADMIN_SECRET.
//
// It used to hold the literal value "1", which anyone could send — and the
// chat route treated that as Shalom: no Turnstile, no rate limits or budgets,
// and his private context and creative archive in the system prompt. Now it
// holds an HMAC of a fixed label under the secret, so it can only have come
// from POST /api/admin/auth, and it stops working whenever the secret rotates.

const LABEL = 'cosmo_admin:v2'

export const ADMIN_COOKIE_NAME = 'cosmo_admin'

/** The cookie value to set after a correct secret; null when no secret is configured. */
export function adminCookieValue(): string | null {
  const secret = process.env.COSMO_ADMIN_SECRET
  if (!secret) return null
  return createHmac('sha256', secret).update(LABEL).digest('hex')
}

/** True only for a cookie value minted by adminCookieValue() under the current secret. */
export function isAdminCookie(value: string | undefined): boolean {
  const expected = adminCookieValue()
  if (!expected || !value) return false
  const a = Buffer.from(value)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
