# Subscriptions & Stripe — removed, kept for reference

> **Status: REMOVED.** The Spark/Flame/Hearth subscription tiers, the Stripe
> integration behind them, and the Substack/Circle benefit provisioning were
> deleted from the codebase on **19 September 2026**. Paid access to Cosmo lives
> in Creative Powerup membership, a separate system on a separate domain.
>
> **This document is history, not instruction.** Nothing described below exists
> in the code any more — not the routes, not `lib/stripe.ts`, not the tier
> definitions. Do not follow it as a guide to how the platform works today. See
> [architecture.md § Subscriptions — removed](../architecture.md) for what
> replaced it, and [ADR 0018](../decisions/0018-the-commons-and-the-applications-live-in-separate-repositories.md)
> for where paid access went.

## Why this was kept

Two reasons, both practical.

**Retracing the Stripe account.** Products, price IDs and webhook endpoints were
created in Stripe on 2026-04-06 and **still exist there** — deleting the code did
not delete them. This is the only written record of what was configured and why.
If that account is ever tidied up, cancelled, or audited, start here.

**Reviving it.** If subscriptions are ever offered again, this is a working
design that was thought through once: the tier economics, the microdollar cost
model, the weekly/monthly budget split, the webhook event set, and the benefit
provisioning into Substack and Circle. Reviving would mean rebuilding the code,
but not re-deciding the shape.

## What was deleted alongside it

- `apps/web/lib/stripe.ts` — Stripe client, `TIERS`, `tierFromPriceId`
- `apps/web/lib/benefits.ts` — Substack + Circle provisioning
- `apps/web/lib/subscription.ts` — subscription records and microdollar budget
  counters. Its BYOK tracking survived as `apps/web/lib/byok.ts`; the rest went.
- `apps/web/app/api/stripe/{checkout,portal}/route.ts`
- `apps/web/app/api/webhooks/stripe/route.ts`
- `apps/web/app/api/subscription/route.ts` — became `/api/byok-status`
- the `stripe` dependency, and the subscriber branch of the chat route

The code is recoverable in full at commit `f7aa807^`.

## One thing to check before assuming nothing is live

The billing portal is gone, which was how a subscriber cancelled from the site.
**Any active subscription still exists in Stripe and will still bill.** Verify in
the Stripe Dashboard directly; the codebase can no longer tell you.

---

## Stripe — Subscriptions & Billing

**Status:** Stripe account created (2026-04-06). Test-mode products and price IDs in configuration.

### Provider & Package

| Item | Detail |
|------|--------|
| Provider | Stripe (separate account from Creative Powerup) |
| Package | `stripe` v22+ (`apps/web`) |
| Stripe API version | `2025-03-31.basil` |

### Subscription Tiers

| Tier | Price | API Budget/mo | Weekly Cap | Notes |
|------|-------|--------------|------------|-------|
| **Spark** | $5/mo | ~$2.28 (~50% of $4.55 net) | ~$0.57 | ~6 hrs/mo at target cost |
| **Flame** | $10/mo | ~$4.70 (~50% of $9.40 net) | ~$1.18 | ~12 hrs/mo |
| **Hearth** | $50/mo | ~$9.55 (~20% of $48.20 net) | ~$2.39 | ~24 hrs/mo + full CP membership (~$49 value). Rest is margin. |

Token cost model: Claude Sonnet 4.6 at $3/M input + $15/M output, with conversation history caching applied for all subscribers. Costs tracked in **microdollars** (integers) in Redis to keep `INCRBY` atomic.

### Token Economics

> **`docs/economics.md` is referenced in places but has never existed.** Margin modelling and feature cost analysis have no home yet; the per-tier framing is also stale, since the subscription tiers were removed from opencosmos.ai in April 2026. This section covers the technical mechanics of how costs are tracked, which is all that is currently written down.

**Microdollar encoding:** `1 µ$ = $0.000001`. Each token's cost is expressed in microdollars as an integer:
- Input token: 3 µ$
- Output token: 15 µ$
- Cached input token: not counted (generous to subscribers — cache reads cost ~0.3 µ$, excluded from tracker)

This encoding allows atomic `INCRBY` operations in Redis without floating-point drift.

**Token budget formula:** `monthlyBudgetMicrodollars / 15` = output-token equivalents. Dividing by the output rate (15 µ$/token) produces a conservative guaranteed floor — actual usage is higher because input tokens cost only 3 µ$ each. The gauge and plan cards display this number directly.

**Caching mechanics:** `cache_control: { type: "ephemeral" }` is applied to the system prompt on every request for all subscribers. On the first exchange in a session, the system prompt is written to cache (`cache_write`). On all subsequent exchanges, it's read from cache at 10% of the uncached input cost. This is the largest cost reduction in the system (~76–90% of input cost eliminated after exchange 1).

**Weekly caps:** Monthly budget ÷ 4. Enforced in Redis alongside the monthly cap to prevent a single week from exhausting the full allotment.

### Required Environment Variables

| Variable | Where to find it | Purpose |
|----------|-----------------|---------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | Server-side API access (`sk_test_...` in test, `sk_live_...` in prod) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → endpoint → Signing secret | Webhook HMAC-SHA256 verification (`whsec_...`) |
| `STRIPE_PRICE_SPARK` | Stripe Dashboard → Products → Spark → Price ID | `price_...` for the $5/mo recurring price |
| `STRIPE_PRICE_FLAME` | Stripe Dashboard → Products → Flame → Price ID | `price_...` for the $10/mo recurring price |
| `STRIPE_PRICE_HEARTH` | Stripe Dashboard → Products → Hearth → Price ID | `price_...` for the $50/mo recurring price |

All five are declared in `turbo.json → globalPassThroughEnv` and must be added to both `.env.local` (dev) and Vercel (prod).

### API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/stripe/checkout` | Creates a Stripe Checkout Session. Body: `{ tier: 'spark' \| 'flame' \| 'hearth' }`. Returns `{ url }` for client redirect. Requires auth — 401 if unauthenticated. Embeds WorkOS `user.id` as `client_reference_id`. |
| `POST /api/stripe/portal` | Creates a Stripe Billing Portal session. Returns `{ url }`. Requires auth + active subscription. |
| `GET /api/subscription` | Returns current subscription status and usage for the authenticated user. Response: `{ subscription: null }` or `{ subscription: { tier, name, status, monthlyUSD, usagePercent, billingCycleAnchor } }`. |
| `POST /api/webhooks/stripe` | Stripe webhook handler (see below). |

### Webhook Handler

**Endpoint:** `POST https://opencosmos.ai/api/webhooks/stripe`

**File:** `apps/web/app/api/webhooks/stripe/route.ts`

**Verification:** `stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)`. Unlike the WorkOS SDK, the Stripe SDK takes the **raw string body** — do not parse it before passing. The `stripe-signature` header provides the timestamp + HMAC hash.

```ts
// ✅ Correct — raw string body passed directly to Stripe
const rawBody = await req.text()
event = getStripe().webhooks.constructEvent(rawBody, sigHeader, process.env.STRIPE_WEBHOOK_SECRET!)

// ❌ Wrong — parsing first breaks Stripe's signature verification
const body = await req.json()
event = getStripe().webhooks.constructEvent(JSON.stringify(body), ...)
```

**Events handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Retrieves full subscription via `session.subscription`, maps price ID → tier, writes `SubscriptionRecord` to Redis under `cosmo_sub:v1:{userId}`. |
| `customer.subscription.updated` | Updates tier/status in Redis. Handles plan upgrades, downgrades, renewals, and `past_due`. |
| `customer.subscription.deleted` | Deletes `SubscriptionRecord` from Redis. User reverts to free-tier access. |

**WorkOS user ID → Stripe customer ID linkage:** The checkout session sets `client_reference_id = workos_user_id`. The webhook handler reads this to write the initial record. Subsequent subscription events use a reverse-lookup key (`cosmo_stripe_cust:v1:{stripeCustomerId}` → `userId`) written on first subscription creation.

**Register these events in Stripe Dashboard:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Redis Data Model

| Key | Value | TTL | Purpose |
|-----|-------|-----|---------|
| `cosmo_sub:v1:{userId}` | `SubscriptionRecord` JSON | 13 months (refreshed on each webhook) | Subscription status, tier, Stripe IDs |
| `cosmo_stripe_cust:v1:{stripeCustomerId}` | WorkOS `userId` string | 13 months | Reverse lookup for webhook handler |
| `cosmo_usage_cost:monthly:v1:{userId}:{YYYY-M}` | integer (microdollars) | 40 days | Monthly token cost accumulator |
| `cosmo_usage_cost:weekly:v1:{userId}:{YYYY-WW}` | integer (microdollars) | 12 days | Weekly token cost accumulator |

**Microdollar encoding:** `1 microdollar = $0.000001`. Input token cost = `tokens × 3`; output token cost = `tokens × 15`. Integer values enable atomic `INCRBY` without floating-point drift.

### Chat Route: Access Priority

The chat handler (`app/api/chat/route.ts`) checks access in this order:

1. **Admin cookie** (`cosmo_admin=1`) → bypass all limits
2. **BYOK** (API key in request body) → use user's key, bypass all limits
3. **Active subscriber** (authenticated + valid `SubscriptionRecord` + within budget) → use shared server key, track usage
4. **Budget exhausted** (subscriber over weekly or monthly cap) → `429` with `period: 'weekly' | 'monthly'`
5. **Free tier** → **Turnstile verification** → monthly cap check → IP rate limit → token budget check

Conversation history caching (adding `cache_control: ephemeral` to the last assistant message) is applied for subscribers only — reduces input token costs ~40–50% on long conversations.

### Cloudflare Turnstile — Bot Prevention

**Status:** Code deployed. Requires Cloudflare setup (site key + secret key) to activate. Inactive in dev when env vars are absent.

**File:** `apps/web/app/api/chat/route.ts` → `verifyTurnstile()`  
**Widget:** `apps/web/app/dialog/CosmoChat.tsx` → `<Turnstile />`  
**Package:** `@marsidev/react-turnstile` v1.5+ (`apps/web`)

#### How It Works

An invisible Cloudflare Turnstile widget renders in the dialog UI on every page load. It runs a silent risk assessment in the browser and calls `onSuccess` with a short-lived challenge token (~300 second TTL). The token is included in the `/api/chat` request body. The server verifies it with Cloudflare's siteverify API before any Redis calls hit the free-tier path.

Real browser users pass silently — the challenge completes in milliseconds, well before they finish typing. Bots and scripts that cannot execute the browser-side challenge have no token and receive a `403`.

#### Access Scope

| Path | Turnstile applied? |
|------|--------------------|
| Admin | No — bypassed entirely |
| BYOK | No — user provides their own key |
| Active subscriber | No — authenticated + subscription verified |
| **Free tier** | **Yes — step 0 before any rate limit or Redis call** |

#### Client-Side (CosmoChat.tsx)

```tsx
// Widget renders as a 0×0 invisible element. Skipped when site key is absent (dev).
{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
  <Turnstile
    ref={turnstileRef}
    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    onSuccess={setTurnstileToken}
    options={{ size: 'invisible' }}
  />
)}
```

Token lifecycle:
- `onSuccess` fires with a fresh token on page load and after each `reset()` call
- Token is included in the POST body: `{ ..., turnstileToken: isFreeTier ? turnstileToken : undefined }`
- After each free-tier send, `turnstileRef.current?.reset()` is called in the `finally` block — tokens are single-use once verified, so the next message needs a fresh one
- Widget only rendered and token only sent when `!apiKey && !pmMode` (free tier)

Error handling: `res.status === 403` from the server displays inline: *"Verification failed — please refresh the page and try again."*

#### Server-Side (chat/route.ts)

```ts
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true   // Not configured — skip (dev or pre-Cloudflare deploy)
  if (!token) return false   // Missing token — reject

  const params = new URLSearchParams({ secret, response: token })
  if (ip !== 'unknown') params.append('remoteip', ip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: params,
  })
  const data = await res.json()
  return data.success
}
```

- **Fail open on CF outage** — a Cloudflare availability event should not take down the free tier; IP rate limit and monthly cap remain as backstops
- **Fail closed on missing/reused/expired tokens** — no token = `403`
- `remoteip` is passed to Cloudflare when available for stronger verification; omitted if IP is `unknown`

#### Environment Variables

| Variable | Side | Where to find it | Purpose |
|----------|------|-----------------|---------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client (build-time) | Cloudflare Dashboard → Turnstile → your site → Site Key | Embedded in the browser bundle; safe to expose |
| `TURNSTILE_SECRET_KEY` | Server only | Cloudflare Dashboard → Turnstile → your site → Secret Key | Used in `siteverify` call; never sent to client |

Both declared in `turbo.json → globalPassThroughEnv`. Add to `.env.local` (dev) and Vercel (prod).

#### Cloudflare Setup (one-time)

1. Cloudflare Dashboard → **Turnstile** → **Add site**
2. Hostname: `opencosmos.ai` · Widget type: **Invisible**
3. Copy Site Key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. Copy Secret Key → `TURNSTILE_SECRET_KEY`

No Cloudflare proxy or DNS changes needed. Turnstile works purely as a browser widget + server-side API call — the site does not need to be on the Cloudflare network.

#### Siteverify Response

```json
// Success
{ "success": true, "challenge_ts": "2026-04-10T...", "hostname": "opencosmos.ai" }

// Failure
{ "success": false, "error-codes": ["invalid-input-response"] }
```

Common error codes: `missing-input-response` (no token), `invalid-input-response` (bad/reused token), `timeout-or-duplicate` (expired or already verified). All non-success results return `403 { error: 'bot_suspected' }` to the client.

### Hard-Won Lessons

#### `proxy.ts` is required for `withAuth()` to function on Next.js 16+

`@workos-inc/authkit-nextjs` v3 requires a `proxy.ts` file at the app root (Next.js 16+) — or `middleware.ts` on Next.js ≤15 — to inject the `x-workos-middleware` request header on every matched route. Without it, `withAuth()` silently returns `{ user: null }` for every request even when a valid session cookie exists.

**Symptom:** User appears logged in (session cookie is set, dialog history is present) but `AuthButton` shows "Log in" and `SidebarAvatar` shows the generic icon on every page load.

**Fix:** `apps/web/proxy.ts` at the repo root of the Next.js app:

```ts
import { authkitProxy } from '@workos-inc/authkit-nextjs'

export default authkitProxy()

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Use the broad matcher with static asset exclusions (not a catch-all `/:path*`) to avoid intercepting Tailwind CSS v4 static assets, which breaks styles.

**Note on naming:** In Next.js 16+, this file is called `proxy.ts`, not `middleware.ts`. Using `middleware.ts` in Next.js 16 is deprecated.

#### Turbo env vars must be declared in `turbo.json`

Vercel env vars are **silently dropped** by Turborepo unless declared in `turbo.json → globalPassThroughEnv`. The build succeeds but the runtime env vars are `undefined`. This caused the WorkOS webhook handler to fail silently — signature verification threw because `WORKOS_WEBHOOK_SECRET` was undefined.

All app env vars must appear in `turbo.json`:

```json
"globalPassThroughEnv": [
  "WORKOS_API_KEY",
  "WORKOS_CLIENT_ID",
  "WORKOS_WEBHOOK_SECRET",
  "WORKOS_COOKIE_PASSWORD",
  "WORKOS_REDIRECT_URI",
  "ANTHROPIC_API_KEY",
  "COSMO_SYSTEM_PROMPT",
  "COSMO_FREE_MONTHLY_CAP",
  "COSMO_ADMIN_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN"
]
```

Use `globalPassThroughEnv` (not `globalEnv`) — secrets should be available to the pipeline without being hashed into the Turbo cache key.

#### WorkOS webhook `constructEvent` — signature verification and payload format

`workos.webhooks.constructEvent()` returns a `Promise`. Always `await` it.

**Payload must be a parsed JSON object, not a raw string.** The SDK's `computeSignature` method calls `JSON.stringify(payload)` internally to reconstruct `timestamp.json_body` before hashing — it needs to re-serialize the object identically to what WorkOS signed. Passing the raw text string causes `JSON.stringify` to double-encode it (`"\"{ \\\"event\\\"...}\""`) which never matches the original signature, producing `HTTP 400 Invalid signature` on every delivery.

```ts
// ✅ Correct — parse first, then pass the object
const rawBody = await req.text()
const parsedPayload = JSON.parse(rawBody)
event = await workos.webhooks.constructEvent({
  payload: parsedPayload,   // SDK will JSON.stringify this internally
  sigHeader,
  secret: process.env.WORKOS_WEBHOOK_SECRET!,
})

// ❌ Wrong — raw string causes JSON.stringify to double-encode
event = await workos.webhooks.constructEvent({
  payload: rawBody as unknown as Record<string, unknown>,
  sigHeader,
  secret: process.env.WORKOS_WEBHOOK_SECRET!,
})
```

The SDK's TypeScript type (`payload: Record<string, unknown>`) is correct — the earlier note in this file claiming it expects a raw string was wrong and has been removed.

> **Note:** This fix was deployed in commit `4ade138` but has not yet been verified against a live WorkOS delivery. Confirm by checking Vercel logs after the next `user.created` event.

---

## Subscription Benefits — Substack & Circle

Flame and Hearth subscribers receive access to external platforms as part of their plan. Provisioning and revocation are triggered automatically by the Stripe webhook.

**File:** `apps/web/lib/benefits.ts`  
**Called from:** `apps/web/app/api/webhooks/stripe/route.ts`

### Tier → Benefit Matrix

| Tier | Substack newsletter | Circle community |
|------|--------------------|--------------------|
| **Spark** | — | — |
| **Flame** | ✓ | — |
| **Hearth** | ✓ | ✓ |

### Trigger Flow

```
Stripe event: checkout.session.completed
  → webhook handler retrieves tier from price ID
  → calls getWorkOSUser(userId) to fetch email + name
  → calls provisionBenefits(tier, email, name)
      → addSubstackSubscriber()   [if flame or hearth]
      → addCircleMember()         [if hearth only]

Stripe event: customer.subscription.deleted
  → calls revokeBenefits(tier, email)
      → removeCircleMember()      [if hearth only]
      → (Substack: intentionally left subscribed — see note below)
```

All benefit calls use `Promise.allSettled()` — a failure in one never blocks the other, and neither blocks the subscription confirmation response to Stripe.

### Substack Integration

**Publication:** `shalomormsby.substack.com`

**Current approach:** Subscribes the user as a **free newsletter subscriber** via the publication's public subscription form endpoint. This is the same mechanism as submitting the "Subscribe" form on the Substack page — no auth credentials required from our side.

> ⚠️ **Limitation — free tier only:** This method adds users as free Substack subscribers. It does **not** grant a paid Substack subscription. Flame and Hearth subscribers receive the newsletter but are not marked as paid Substack members.
>
> **TODO:** Apply for the Substack partner program to enable programmatic paid subscription gifting. This would let Flame/Hearth subscribers receive full paid Substack access. See `docs/pm.md → Phase 1b → Substack partner API`.

**On cancellation:** Substack subscribers are intentionally **not removed**. Revoking newsletter access on plan cancellation is punitive and hurts goodwill. Users can unsubscribe themselves if desired.

**Endpoint:**
```
POST https://shalomormsby.substack.com/api/v1/free
Content-Type: application/json

{ "email": "user@example.com", "first_name": "First" }
```

**Success response:** HTTP 200. No meaningful body — treat any 2xx as success.

**Failure handling:** Non-2xx is logged at `[benefits/substack] subscribe failed {status} {body}` but does not throw. Network errors logged at `[benefits/substack] request error`.

**No env vars required** for the subscribe call — it is a public endpoint.

### Circle Integration

**Community:** Creative Powerup — `community.creativepowerup.com`  
**API base:** `https://app.circle.so/api/v1`  
**Auth:** `Authorization: Token {CIRCLE_API_KEY}` header on every request

**Required env vars:**

| Variable | Where to find it | Purpose |
|----------|-----------------|---------|
| `CIRCLE_API_KEY` | Circle Dashboard → Settings → API | Bearer token for all API calls |
| `CIRCLE_COMMUNITY_ID` | Circle Dashboard → Settings → General → Community ID | Numeric community identifier |

Both are declared in `turbo.json → globalPassThroughEnv`. Add to `.env.local` (dev) and Vercel (prod).

**On subscription (Hearth):**
```
POST https://app.circle.so/api/v1/community_members
Authorization: Token {CIRCLE_API_KEY}
Content-Type: application/json

{
  "community_id": "{CIRCLE_COMMUNITY_ID}",
  "email": "user@example.com",
  "name": "Full Name",
  "skip_invitation": false
}
```
`skip_invitation: false` sends the standard Circle welcome email/invite to the user.

**On cancellation (Hearth):** Two-step process — look up member ID by email, then delete:

```
// Step 1: find member ID
GET https://app.circle.so/api/v1/community_members
  ?community_id={CIRCLE_COMMUNITY_ID}
  &email=user@example.com
Authorization: Token {CIRCLE_API_KEY}

Response: { "community_members": [{ "id": 12345, ... }] }

// Step 2: delete
DELETE https://app.circle.so/api/v1/community_members/12345
  ?community_id={CIRCLE_COMMUNITY_ID}
Authorization: Token {CIRCLE_API_KEY}
```

If the member is not found in Step 1 (e.g. they manually left, or provisioning originally failed), the deletion is skipped cleanly — no error thrown.

**Failure handling:** Non-2xx at either step is logged at `[benefits/circle] add member failed` / `[benefits/circle] member lookup failed` / `[benefits/circle] remove failed`. Network errors logged at `[benefits/circle] request error`. Never throws.

### WorkOS User Lookup

Both integrations need the subscriber's email and display name. These are not stored in Stripe or Redis — they live in WorkOS. The webhook handler resolves them via:

```ts
// apps/web/lib/benefits.ts
const workos = new WorkOS(process.env.WORKOS_API_KEY!)
const user = await workos.userManagement.getUser(userId)
// userId = session.client_reference_id from the Stripe checkout session
```

If the lookup fails (network error, user deleted), `getWorkOSUser()` returns `null` and benefit provisioning is skipped entirely for that event, logged at `[benefits] WorkOS user lookup failed`.

### Error Handling Philosophy

Benefit provisioning is **best-effort and non-blocking**. The Stripe webhook always returns `{ received: true }` with HTTP 200 regardless of whether Substack or Circle calls succeed. This ensures:
- Stripe never retries a webhook due to a benefit provisioning failure
- A Circle API outage never prevents a subscriber from completing checkout
- Failed provisioning is visible in Vercel function logs for manual remediation

Manual remediation: if a benefit provisioning log shows failure, look up the subscriber in the Stripe Dashboard, get their email from WorkOS (or Stripe's `customer.email`), and add them manually in the Substack or Circle dashboard.

---

