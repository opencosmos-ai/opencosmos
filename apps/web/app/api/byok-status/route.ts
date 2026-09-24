import { withAuth } from '@workos-inc/authkit-nextjs'
import { NextResponse } from 'next/server'
import { getByokFlag } from '@/lib/byok'

// GET /api/byok-status
//
// Returns whether the authenticated user has connected their own API key.
// The account page and the sidebar meter use it to decide between "unlimited"
// and the free-tier quota display.
//
// Replaces GET /api/subscription, which returned tier and billing state for the
// Spark/Flame/Hearth plans removed on 19 September 2026. It had already stopped
// describing anything real; the name outlived the feature.
//
// Response shape: { hasByok: boolean }

export async function GET() {
  const { user } = await withAuth({ ensureSignedIn: false })
  if (!user) {
    return NextResponse.json({ hasByok: false }, { status: 401 })
  }
  return NextResponse.json({ hasByok: await getByokFlag(user.id) })
}
