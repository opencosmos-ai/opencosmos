import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { ADMIN_COOKIE_NAME, adminCookieValue, isAdminCookie } from '@/lib/admin-cookie'

const ADMIN_SECRET = process.env.COSMO_ADMIN_SECRET!
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const CLEAR_COOKIE = 'cosmo_admin=; HttpOnly; SameSite=Strict; Secure; Max-Age=0; Path=/'

export async function GET(req: NextRequest) {
  if (isAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ active: true })
  }
  if (ADMIN_EMAIL) {
    const user = await withAuth({ ensureSignedIn: false }).then(a => a.user).catch(() => null)
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ active: true })
    }
  }
  return NextResponse.json({ active: false })
}

export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  const value = adminCookieValue()
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET || !value) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', `${ADMIN_COOKIE_NAME}=${value}; HttpOnly; SameSite=Strict; Secure; Max-Age=604800; Path=/`)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', CLEAR_COOKIE)
  return res
}
