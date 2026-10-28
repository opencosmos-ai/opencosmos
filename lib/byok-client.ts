// The browser's side of BYOK. The key itself lives in an HttpOnly cookie that
// no script here can read (lib/byok-cookie.ts). What the page can see is the
// hint cookie: the key's last four characters, enough to say "connected".

const HINT_COOKIE = 'cosmo_byok_hint'
// Where keys lived until 28 October 2026. Read once, moved into the sealed
// cookie, and deleted.
const LEGACY_KEY = 'cosmo_api_key'

/** The key's last four characters when a key is connected in this browser, else ''. */
export function readByokHint(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${HINT_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

/** Hands the key to the server to seal into this browser's cookie. Returns the hint, or null if it was refused. */
export async function saveByokKey(key: string): Promise<string | null> {
  try {
    const res = await fetch('/api/byok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { hint?: string }
    return data.hint ?? readByokHint()
  } catch {
    return null
  }
}

export async function clearByokKey(): Promise<void> {
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* ignore */
  }
  await fetch('/api/byok', { method: 'DELETE' }).catch(() => {})
}

let migration: Promise<string> | null = null

/**
 * Moves a key saved before the sealed cookie out of localStorage. Runs once per
 * page load however many components ask, and resolves to the current hint.
 */
export function migrateLegacyByokKey(): Promise<string> {
  migration ??= (async () => {
    let legacy: string | null = null
    try {
      legacy = localStorage.getItem(LEGACY_KEY)
    } catch {
      return readByokHint()
    }
    if (!legacy) return readByokHint()
    const res = await fetch('/api/byok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: legacy }),
    }).catch(() => null)
    // A refused key (400) could never have worked, so it goes too. Any other
    // failure keeps it for the next load to try again.
    if (res && (res.ok || res.status === 400)) {
      try {
        localStorage.removeItem(LEGACY_KEY)
      } catch {
        /* ignore */
      }
    }
    return readByokHint()
  })()
  return migration
}
