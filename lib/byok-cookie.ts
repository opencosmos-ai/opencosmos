import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'

// Where a BYOK key lives: in the visitor's browser, in a cookie no script can read.
//
// It used to sit in localStorage, where every script running on opencosmos.ai
// could read it, so one injected script or compromised dependency would have
// been enough to take it. Now it is a cookie that is:
//   - HttpOnly, so page scripts cannot read it at all;
//   - Secure and SameSite=Strict, so it travels only to this site, over HTTPS;
//   - scoped to /api, so it rides only on the requests that use it;
//   - sealed with AES-256-GCM under a key derived from WORKOS_COOKIE_PASSWORD,
//     so the browser's cookie store holds ciphertext, not the key.
//
// OpenCosmos still stores nothing. The chat routes open the cookie, use the key
// for that one request, and forget it. A second, readable cookie holds only the
// key's last four characters, so the page can show "connected" without ever
// holding the key. If the secret rotates, the sealed cookie stops opening and
// the visitor is simply asked for their key again.

export const BYOK_KEY_COOKIE = 'cosmo_byok_key'
export const BYOK_HINT_COOKIE = 'cosmo_byok_hint'

const LABEL = 'cosmo_byok_key:v1'
const MAX_AGE = 60 * 60 * 24 * 400 // browsers cap a cookie's lifetime at 400 days

// Anthropic keys and tokens: sk-ant-<kind>-<base64url>. Rejects anything that
// could not be a key before it is sealed into a cookie.
const KEY_SHAPE = /^sk-ant-[A-Za-z0-9_-]{20,250}$/

export function isPlausibleKey(key: string): boolean {
  return KEY_SHAPE.test(key)
}

function sealingKey(): Buffer | null {
  const secret = process.env.WORKOS_COOKIE_PASSWORD
  if (!secret) return null
  return Buffer.from(hkdfSync('sha256', secret, '', LABEL, 32))
}

function seal(key: string, k: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', k, iv)
  const sealed = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), sealed]).toString('base64url')
}

function open(value: string, k: Buffer): string | undefined {
  try {
    const raw = Buffer.from(value, 'base64url')
    const decipher = createDecipheriv('aes-256-gcm', k, raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    const key = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
    return isPlausibleKey(key) ? key : undefined
  } catch {
    return undefined
  }
}

/** The visitor's own key from the sealed cookie, or undefined when there is none or it will not open. */
export function readByokKey(req: NextRequest): string | undefined {
  const value = req.cookies.get(BYOK_KEY_COOKIE)?.value
  const k = sealingKey()
  return value && k ? open(value, k) : undefined
}

/** Seals the key into the response's cookies. Returns the hint, or null when no secret is configured. */
export function setByokCookies(res: NextResponse, key: string): string | null {
  const k = sealingKey()
  if (!k) return null
  const hint = key.slice(-4)
  res.cookies.set(BYOK_KEY_COOKIE, seal(key, k), {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/api', maxAge: MAX_AGE,
  })
  res.cookies.set(BYOK_HINT_COOKIE, hint, {
    httpOnly: false, secure: true, sameSite: 'strict', path: '/', maxAge: MAX_AGE,
  })
  return hint
}

export function clearByokCookies(res: NextResponse): void {
  res.cookies.set(BYOK_KEY_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/api', maxAge: 0 })
  res.cookies.set(BYOK_HINT_COOKIE, '', { httpOnly: false, secure: true, sameSite: 'strict', path: '/', maxAge: 0 })
}
