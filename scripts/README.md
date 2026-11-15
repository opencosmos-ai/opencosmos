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

### `pnpm check:tao-te-ching`

Checks the Tao Te Ching reader ([ADR 0020](../docs/decisions/0020-the-tao-te-ching-is-read-in-the-library-a-chapter-to-a-page.md)).
It proves that every stored citation form, `#one` … `#eighty-one` and
`#chapter-1` … `#chapter-81` and `#notes-on-chapter-N`, lands on its chapter through the chat renderer
and the constellation. It also checks that `Ch 1` never collects `Ch 12`'s
discussion, and, once `pnpm content` has run, that lines are linked only in
chapters whose alignment is exact. CI runs it after the build. It also warns
when the export holds a rare character the Library's font lacks (below).

### `scripts/rare-han-font.py`

Cuts the Library's rare-character font, "OpenCosmos Rare Han", to exactly the
rare characters in the Tao Te Ching export: CJK Extension A and B and the
Radicals Supplement, which no system font carries. Python, with
`fonttools` and `brotli`, and HanaMin's two source files from
[glyphwiki.org/hanazono](https://glyphwiki.org/hanazono/) (`hanazono-20170904.zip`):

```bash
pnpm content
python3 scripts/rare-han-font.py --source <dir holding HanaMinA.ttf and HanaMinB.ttf>
```

It writes `public/fonts/rare-han-a.woff2`, `rare-han-b.woff2` and `rare-han.txt`.
Run it when `pnpm check:tao-te-ching` warns. See
[`docs/architecture.md`](../docs/architecture.md) → *The Library*.

### `pnpm xenso:check-iching`

Checks the I Ching cast engine — coin arithmetic, the non-uniform odds,
moving-line resolution, and the founding cast run end to end. It tests the
*application*, so it stays with `lib/iching.ts`. The script is
`scripts/iching-check.ts`; the `xenso:` prefix on the command is kept
because the iching repository's README names it.

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
pnpm content                       # fetch the prompt first
pnpm tsx scripts/test-cosmo-voice.ts "your question"
```

It reads `.content/cosmo/COSMO_SYSTEM_PROMPT.md`, so the fetch is a
prerequisite; it exits with that instruction rather than a stack trace if the
prompt is missing.

> This covers the base voice only. The admin-session context and the kaizen
> retrieval path both need a real browser session — `/api/chat` is behind
> Turnstile and answers `bot_suspected` to a scripted client.
