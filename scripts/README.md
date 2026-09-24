# Scripts

Programs you run, from the repo root via `pnpm`. For procedures an agent
follows, see [`.claude/skills/`](../.claude/skills/README.md) — the distinction
is worth keeping: scripts are run, skills are followed.

---

## The corpus toolchain is not here any more

It moved with the corpus to
[opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge) in
September 2026 — `publish-knowledge`, `knowledge-health`, the graph generators,
the whole `normalize-quotes` pipeline, and the corpus embedder. This repository
no longer writes to the shared Upstash index at all.

Run them from a sibling checkout, with `npm`:

```bash
cd ../knowledge
npm install                  # first run only
npm run publish-doc          # was pnpm knowledge:publish
npm run health               # was pnpm knowledge:health
npm run graph                # wiki graph → Redis
npm run graph:constellation  # constellation → Redis
npm run embed                # corpus → Upstash Vector
npm run embed:dry            # …plan only, no writes
npm run quotes:add           # and the rest of the quotes:* pipeline
```

Cosmo's kaizen practice embeds itself from
[opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo) the same way.

---

## What is here

### `pnpm adr:index`

Regenerates the index of architecture decision records from
[`docs/decisions/`](../docs/decisions/). Run after adding an ADR.

### `pnpm xenso:check-iching`

Checks the I Ching cast engine — coin arithmetic, the non-uniform odds,
moving-line resolution, and the founding cast run end to end. It tests the
*application*, so it stays with `apps/web/lib/iching.ts`.

The hexagram table itself — bijection, the King Wen pairs, trigram agreement —
is checked where it is decided, by `npm run check` in
[opencosmos-ai/iching](https://github.com/opencosmos-ai/iching), which also
fails if the generated file the app copies has drifted from the frontmatter.

### `check-byok-flags.ts`

Audits bring-your-own-key feature flags for consistency across routes.

```bash
pnpm tsx scripts/check-byok-flags.ts
```

### `test-cosmo-voice.ts`

Sends one message to Cosmo with the production system prompt and prints the
reply — a quick check that the voice is intact without opening a browser.

```bash
pnpm --filter web content                       # fetch the prompt first
pnpm tsx scripts/test-cosmo-voice.ts "your question"
```

It reads `apps/web/.content/cosmo/COSMO_SYSTEM_PROMPT.md`, so the fetch is a
prerequisite; it exits with that instruction rather than a stack trace if the
prompt is missing.

> This covers the base voice only. The admin-session context and the kaizen
> retrieval path both need a real browser session — `/api/chat` is behind
> Turnstile and answers `bot_suspected` to a scripted client.
