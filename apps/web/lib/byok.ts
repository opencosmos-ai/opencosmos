import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// BYOK tracking
//
// Records server-side that an authenticated user has used a BYOK key. The key
// itself is never stored — only the fact that they have one — so the account
// page can show "API connection" regardless of which browser or device they
// are viewing it on.
//
// This file is what remains of lib/subscription.ts after the Spark/Flame/Hearth
// tiers were removed (19 September 2026). Everything else in it — the
// subscription record, the Stripe customer reverse-lookup, and the microdollar
// month/week budget counters — existed only to serve those tiers. Free-tier
// usage is counted separately, in the chat route's own token counters.
// ---------------------------------------------------------------------------

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const BYOK_TTL = 60 * 60 * 24 * 90 // 90 days — refreshes on each BYOK chat

function byokKey(userId: string) {
  return `cosmo_byok:v1:${userId}`
}

// Fire-and-forget from the chat route after a successful BYOK request.
export async function markByok(userId: string): Promise<void> {
  await redis.set(byokKey(userId), '1', { ex: BYOK_TTL })
}

export async function getByokFlag(userId: string): Promise<boolean> {
  try {
    const val = await redis.get<string>(byokKey(userId))
    return val === '1'
  } catch {
    return false
  }
}

export async function clearByok(userId: string): Promise<void> {
  try {
    await redis.del(byokKey(userId))
  } catch {
    // fail silently
  }
}
