import { withAuth } from '@workos-inc/authkit-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { clearByok, markByok } from '@/lib/byok'
import { clearByokCookies, isPlausibleKey, readByokKey, setByokCookies } from '@/lib/byok-cookie'

// POST /api/byok
//   { key } — seals the visitor's key into this browser's HttpOnly cookie
//   (lib/byok-cookie.ts) and returns its hint. Works signed in or not.
//   {}      — records that a signed-in user has a key, when the cookie holds one.
//             The account page and the dialog call this so the server-side flag
//             is set without waiting for a chat message.
// The key is never stored or logged here. Signed-in users also get the flag
// in lib/byok.ts, which holds only the fact that they have one.
export async function POST(req: NextRequest) {
  const { user } = await withAuth({ ensureSignedIn: false })
  const body = (await req.json().catch(() => ({}))) as { key?: unknown }
  const key = typeof body.key === 'string' ? body.key.trim() : undefined
  console.log(JSON.stringify({ event: 'byok_post', ts: new Date().toISOString(), userId: user?.id ?? null, authed: !!user, saving: key !== undefined }))

  if (key === undefined) {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!readByokKey(req)) return NextResponse.json({ ok: false })
    await markByok(user.id)
    return NextResponse.json({ ok: true })
  }

  if (!isPlausibleKey(key)) {
    return NextResponse.json({ error: 'invalid_key', message: 'That does not look like an Anthropic API key.' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, hint: key.slice(-4) })
  if (!setByokCookies(res, key)) return NextResponse.json({ error: 'byok_unavailable' }, { status: 503 })
  if (user) await markByok(user.id).catch(() => {})
  return res
}

// DELETE /api/byok — forgets the key in this browser, and the signed-in user's flag.
// Called when the user explicitly clears their API key from the account page.
export async function DELETE() {
  const { user } = await withAuth({ ensureSignedIn: false })
  const res = NextResponse.json({ ok: true })
  clearByokCookies(res)
  if (user) await clearByok(user.id)
  return res
}
