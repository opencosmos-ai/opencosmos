# AGENTS.md

> **For AI coding agents working on this platform. Read [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md) first — it's the North Star. This file tells you how to build in alignment with it.**

Last updated: 2026-09-24

---

## Quick Orientation

This repository is **the site that serves the commons** — [opencosmos.ai](https://opencosmos.ai/): the Library, the graph, Cosmo. It holds one application, installs `@opencosmos/ui` from npm, and builds the corpus and Cosmo in at build time rather than containing them. Why the organization is split this way: [ADR 0018](docs/decisions/0018-the-commons-and-the-applications-live-in-separate-repositories.md).

```
opencosmos/
├── apps/web/                # opencosmos.ai
│   └── scripts/fetch-content.mjs   # pulls knowledge + cosmo into apps/web/.content/
├── docs/                    # Architecture, ADRs, chronicle, PM
├── scripts/                 # Programs you run — see scripts/README.md
├── .claude/skills/          # Procedures an agent follows
├── WELCOME.md               # The front door — OpenCosmos vision and philosophy
├── DESIGN-PHILOSOPHY.md     # The North Star — four principles
├── CHANGELOG.md             # Work history
└── README.md                # Overview
```

### What Lives Where

| What | Repository | License |
|------|-----------|---------|
| opencosmos.ai (this site) | **This repo** | MIT |
| The corpus — sources, quotes, wiki, and its toolchain | [knowledge](https://github.com/opencosmos-ai/knowledge) | CC0 |
| Cosmo's constitution — system prompt, triad, Xensō, kaizen | [cosmo](https://github.com/opencosmos-ai/cosmo) | CC BY-SA 4.0 |
| Tao Te Ching translation | [taoteching](https://github.com/opencosmos-ai/taoteching) | CC0 |
| I Ching translation (the app copies its generated hexagram table) | [iching](https://github.com/opencosmos-ai/iching) | CC0 |
| `@opencosmos/ui`, `/tokens`, `/mcp`, Studio docs site | [opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui) | MIT |
| Org profile | [.github](https://github.com/opencosmos-ai/.github) | — |

**Key rule:** To modify a component, hook, or utility from `@opencosmos/ui` — work in [opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui), not here. This repo consumes published packages.

---

## If This Is Your First Time

1. **Read [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md)** — The four principles govern every decision.

2. **Verify your setup:**
   ```bash
   pnpm install
   pnpm build
   pnpm dev --filter web
   ```
   The site runs at **http://localhost:3000**.

3. **Check current state:**
   ```bash
   git status
   git log -5 --oneline
   ```

4. **If working on Cosmo AI:** the constitutional layer lives in [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo) now. Read [COSMO_SYSTEM_PROMPT.md](https://github.com/opencosmos-ai/cosmo/blob/main/COSMO_SYSTEM_PROMPT.md) for the voice and values, and [INCEPTION.md](docs/archive-and-deprecated/INCEPTION.md) for historical technical context. `pnpm --filter web content` fetches it into `apps/web/.content/cosmo`.

---

## Skills

Before writing a procedure from scratch, check whether one already exists.
Five live in [`.claude/skills/`](.claude/skills/README.md) — that directory is
where Claude Code discovers them, so a skill is invoked by typing `/<name>`.

| | |
|---|---|
| **Repo work** | [`/pr`](.claude/skills/pr/SKILL.md) · [`/clean`](.claude/skills/clean/SKILL.md) · [`/git-sync`](.claude/skills/git-sync/SKILL.md) |
| **Building** | [`/create`](.claude/skills/create/SKILL.md) · [`/inference-cost`](.claude/skills/inference-cost/SKILL.md) |

The six corpus skills live with the corpus, in
[opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge/tree/main/.claude/skills).
Full index, and how to write a new skill: [`.claude/skills/README.md`](.claude/skills/README.md).

Skills are procedures an agent follows. For programs it runs, see
[`scripts/`](scripts/README.md).

---

## Applications

### The Library (`apps/web/`)
- **URL:** [opencosmos.ai](https://opencosmos.ai/)
- **Purpose:** The site that serves the commons — the Library, the graph, Cosmo.
- **Deps:** `@opencosmos/ui`, `@opencosmos/constellation` (npm)

**This is the only application in this repository.** The personal apps were
peeled out on 18 September 2026 (migration step `c-6-7`), so the organization
holds the commons and the site that serves it, and nothing else:

| App | Repository | URL |
|---|---|---|
| Portfolio | [shalomormsby/portfolio](https://github.com/shalomormsby/portfolio) | [shalomormsby.com](https://www.shalomormsby.com/) |
| Creative Powerup | [shalomormsby/creative-powerup](https://github.com/shalomormsby/creative-powerup) | [ecosystem-creative-powerup.vercel.app](https://ecosystem-creative-powerup.vercel.app/) |
| Stocks | [shalomormsby/stocks](https://github.com/shalomormsby/stocks) — **archived** | dormant since 2026-03-09 |

cosmOS was a single README with no application behind it and was dropped rather
than given a repository; its text is in this repository's history.

---

## Cosmo AI ([opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo))

The shared intelligence layer for the platform. It left this repository in
September 2026 and is fetched into `apps/web/.content/cosmo` at build time by
`apps/web/scripts/fetch-content.mjs`; edit it in its own repo, not here.
**Read [COSMO_SYSTEM_PROMPT.md](https://github.com/opencosmos-ai/cosmo/blob/main/COSMO_SYSTEM_PROMPT.md) for the voice and values.**

- **License:** CC BY-SA 4.0, with a [Use Policy](https://github.com/opencosmos-ai/cosmo/blob/main/USE-POLICY.md) stating intent the licence does not bind — not MIT like the app code
- **Inference:** Claude via the Anthropic API — a shared, token-budgeted free tier, or the member's own key (BYOK). Which model each surface uses: `/inference-cost`.
- **Sovereignty:** *voice is sovereign, compute is flexible* — sovereignty lives in the constitutional layer, not in who owns the silicon. See [docs/architecture.md](docs/architecture.md).

---

## File Organization Rules

| If you're creating... | Put it in... |
|----------------------|--------------|
| Component | `apps/web/components/` |
| Utility, server helper | `apps/web/lib/` |
| Cosmo's voice, prompts, lessons | [cosmo](https://github.com/opencosmos-ai/cosmo) — not here |
| Anything that should be RAG-indexed | [knowledge](https://github.com/opencosmos-ai/knowledge) — not here |
| Documentation | See "Document Organization" below |

**Do NOT create `packages/ui/`, `packages/tokens/`, or `packages/mcp/` in this repo.** Those packages live in [opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui).

---

## Document Organization

Root should contain only the files every visitor or contributor needs immediately. Technical deep-dives, narratives, and transitional plans belong in `docs/`.

### Where docs live

| Location | What goes here | Max files |
|----------|---------------|-----------|
| **Root** | README, WELCOME, DESIGN-PHILOSOPHY, CHANGELOG, CONTRIBUTING | 5 |
| **Root (agent context)** | AGENTS.md, .claude/CLAUDE.md | 2 |
| **docs/** | Architecture, migration plans, research, narrative history (chronicle), retrospectives | No limit |
| **docs/decisions/** | ADRs — numbered, append-only, one per load-bearing decision | No limit |
| **docs/archive-and-deprecated/** | Historical documents superseded by current work | No limit |
| **the corpus** | Anything that should be RAG-indexed. **Not in this repo** — it lives in [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge); see its [README](https://github.com/opencosmos-ai/knowledge/blob/main/README.md) for the schema | No limit |

### Edge cases

- **New design pattern doc?** → `docs/` if it's about how we build; the knowledge repo's `references/` if it should be RAG-retrievable.
- **Project retrospective?** → `docs/` — it's internal reflection, not corpus material.
- **Philosophical essay or primary source?** → the [knowledge](https://github.com/opencosmos-ai/knowledge) repo; its README has the schema.
- **Historical/superseded doc?** → `docs/archive-and-deprecated/` with a note at the top pointing to the current version.

---

## Using the Design System

### Importing Components

```typescript
import { Button, Card, Dialog } from '@opencosmos/ui'
import { useMotionPreference, useTheme } from '@opencosmos/ui/hooks'
import { ThemeProvider } from '@opencosmos/ui/providers'
import { cn } from '@opencosmos/ui/utils'
import '@opencosmos/ui/globals.css'
```

### Updating

```bash
pnpm update @opencosmos/ui
pnpm build
```

### Local Development with Design System

When testing design system changes before publishing:

```bash
# In opencosmos-ui
cd packages/ui && pnpm link --global

# In this repo
cd apps/web && pnpm link --global @opencosmos/ui

# Unlink when done
pnpm unlink @opencosmos/ui && pnpm install
```

### Rules

- **Motion:** Always check `useMotionPreference()` before animating. Intensity 0 must work perfectly.
- **Colors:** Use CSS variables (`bg-background`, `text-foreground`), never hardcoded.
- **Components:** Use `@opencosmos/ui` first. Don't recreate what exists.
- **Accessibility:** WCAG AA contrast, keyboard navigation, screen reader support. Non-negotiable.

---

## Build & Development

```bash
pnpm dev                         # opencosmos.ai at localhost:3000 (fetches content first)
pnpm build                       # Production build
pnpm --filter web content        # Re-fetch knowledge + cosmo into apps/web/.content/
```

### CI Pipeline

`.github/workflows/ci.yml` — runs on PR and push to main:
1. `pnpm install --frozen-lockfile`
2. `pnpm build`
3. `pnpm adr:index --check`

Node 24, pnpm 10.26.1+. Deployed to Vercel.

### Clear Stale Caches

```bash
rm -rf .turbo apps/web/.next && pnpm build
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | React Server Components |
| React | React 19.2.1 | |
| Language | TypeScript 5 | Strict mode |
| Styling | Tailwind CSS | Via CSS variables from @opencosmos/ui |
| Design System | `@opencosmos/ui` (npm) | 100 components, 3 themes |
| Package manager | pnpm (+ Turborepo) | |
| Deployment | Vercel | Auto-deploys main; the knowledge repo's sync workflow also triggers a rebuild |

---

## Git Conventions

```
type(scope): description
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes:** the area touched — e.g. `library`, `dialog`, `inception`, `xenso`, `api`, `docs`, `scripts`

**Branch naming:** `type/brief-description`

---

## Accessibility Requirements

Non-negotiable. Every UI must:

- Work with `prefers-reduced-motion: reduce`
- Be keyboard navigable
- Be screen reader compatible
- Meet WCAG AA color contrast (4.5:1)
- Have visible focus states
- Not convey information by color alone

---

## Changelog

Log significant changes in [CHANGELOG.md](CHANGELOG.md) with ISO timestamps.

**Where reasoning goes.** A changelog entry explains *this change, now, in this form*. A decision that is expensive to reverse, that constrains future work, or whose rationale is non-obvious also gets an ADR in **[docs/decisions/](docs/decisions/)** — see [0001](docs/decisions/0001-adopt-architecture-decision-records.md) for purpose, conventions, and structure. Writing an ADR does not require asking first; it is the one kind of new markdown file you should create on your own initiative. Check `docs/decisions/` before changing something that looks arbitrary — it may be load-bearing. For narrative history, see [docs/chronicle.md](docs/chronicle.md).

**Format:**
```markdown
## 2026-03-07T10:00:00Z

- Added/Updated/Fixed [specific thing]
  - Additional context if needed
```

---

## What NOT to Do

- Make major architectural decisions without discussing with Shalom
- Create design system packages in this repo (use opencosmos-ui)
- Skip accessibility requirements
- Hardcode colors instead of CSS variables
- Animate without checking motion preferences
- Over-engineer beyond what's requested
- Create markdown files unless explicitly requested

---

## Decision Framework

**Priority order:**
1. **Functional** — It must work
2. **Honest** — It must be true to what it claims
3. **Lovable** — It should delight
4. **Perfect** — Polish comes last

**Ship working over perfect. One excellent thing over three mediocre things.**

When in doubt, ask Shalom.

---

## Related Documentation

- **[WELCOME.md](WELCOME.md)** — The front door to OpenCosmos
- **[DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md)** — The North Star
- **[COSMO_SYSTEM_PROMPT.md](https://github.com/opencosmos-ai/cosmo/blob/main/COSMO_SYSTEM_PROMPT.md)** — Cosmo's voice and values, in [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo)
- **[docs/architecture.md](docs/architecture.md)** — Infrastructure decisions and service map
- **[docs/decisions/](docs/decisions/)** — ADRs: why load-bearing choices were made, and what was rejected
- **[docs/chronicle.md](docs/chronicle.md)** — The narrative story behind the work
- **[docs/pm.md](docs/pm.md)** — Current work
- **[CHANGELOG.md](CHANGELOG.md)** — Work history
- **[OpenCosmos/UI repo](https://github.com/opencosmos-ai/opencosmos-ui)** — Where the design system lives
- **[opencosmos.ai](https://opencosmos.ai/)** — Interactive component documentation
