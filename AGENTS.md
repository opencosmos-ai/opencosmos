# AGENTS.md

> **For AI coding agents working on this platform. Read [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md) first — it's the North Star. This file tells you how to build in alignment with it.**

Last updated: 2026-03-08

---

## Quick Orientation

This is a **consumer monorepo** — the product applications that use [OpenCosmos/UI](https://opencosmos.ai/). Apps here install `@opencosmos/ui` from npm. The design system packages are developed and published from a [separate repository](https://github.com/opencosmos-ai/opencosmos-ui).

```
opencosmos/
├── apps/
│   ├── portfolio/           # Next.js — Production portfolio (shalomormsby.com)
│   ├── creative-powerup/    # Next.js — Community platform (in development)
│   ├── stocks/              # Next.js — AI-powered investment intelligence
│   └── cosmos/              # Future — cosmOS personal operating system
├── packages/
│   └── ai/                  # @opencosmos/ai — Sovereign AI intelligence layer (WIP)
├── WELCOME.md               # The front door — OpenCosmos vision and philosophy
├── DESIGN-PHILOSOPHY.md     # The North Star — four principles
├── CHANGELOG.md             # Work history
└── README.md                # Overview
```

### What Lives Where

| What | Where | Why |
|------|-------|-----|
| `@opencosmos/ui` (components) | [opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui) | Published to npm |
| `@opencosmos/tokens` (design tokens) | opencosmos-ui | Published to npm |
| `@opencosmos/mcp` (MCP server) | opencosmos-ui | Published to npm |
| OpenCosmos Studio (component docs) | opencosmos-ui (`apps/web`) | Lives with packages it documents |
| opencosmos.ai (platform shell) | **This repo** (`apps/web/`) | The home of the entire project |
| Portfolio, Creative Powerup, Stocks | **This repo** (`apps/`) | Consumer applications |
| Knowledge base + RAG API | **This repo** (`apps/web/` + `knowledge/`) | Deployed to opencosmos.ai |
| Cosmo AI (`@opencosmos/ai`) | **This repo** (`packages/ai/`) | Platform intelligence layer |

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
   Portfolio runs at **http://localhost:3000**.

3. **Check current state:**
   ```bash
   git status
   git log -5 --oneline
   ```

4. **If working on Cosmo AI:** the constitutional layer lives in [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo) now. Read [COSMO_SYSTEM_PROMPT.md](https://github.com/opencosmos-ai/cosmo/blob/main/COSMO_SYSTEM_PROMPT.md) for the voice and values, and [INCEPTION.md](docs/archive-and-deprecated/INCEPTION.md) for historical technical context. `pnpm --filter web content` fetches it into `apps/web/.content/cosmo`.

---

## Skills

Before writing a procedure from scratch, check whether one already exists.
Eleven live in [`.claude/skills/`](.claude/skills/README.md) — that directory is
where Claude Code discovers them, so a skill is invoked by typing `/<name>`.

| | |
|---|---|
| **Repo work** | [`/pr`](.claude/skills/pr/SKILL.md) · [`/clean`](.claude/skills/clean/SKILL.md) · [`/git-sync`](.claude/skills/git-sync/SKILL.md) |
| **Building** | [`/create`](.claude/skills/create/SKILL.md) · [`/inference-cost`](.claude/skills/inference-cost/SKILL.md) |
| **The corpus** | [`/groom`](.claude/skills/groom/SKILL.md) · [`/new-quote`](.claude/skills/new-quote/SKILL.md) · [`/knowledge-compile`](.claude/skills/knowledge-compile/SKILL.md) · [`/knowledge-lookup`](.claude/skills/knowledge-lookup/SKILL.md) · [`/knowledge-review`](.claude/skills/knowledge-review/SKILL.md) · [`/standardize-knowledge`](.claude/skills/standardize-knowledge/SKILL.md) |

The corpus six operate on [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge)
and expect a sibling checkout at `../knowledge`. Full index, and how to write a
new skill: [`.claude/skills/README.md`](.claude/skills/README.md).

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
| Creative Powerup | [shalomormsby/creative-powerup](https://github.com/shalomormsby/creative-powerup) | [creativepowerup.com](https://creativepowerup.com/) |
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
- **Status:** Phase 1a (hardware setup) + Phase 1b (package foundation) in parallel
- **Hardware:** Dell XPS 8950, RTX 3090, 64GB RAM, solar-powered in Marin County
- **Models:** Apertus 8B/70B via Ollama, with cloud fallback tiers

### Sovereignty Tiers (Compute)

Sovereignty Tiers govern **compute** — where LLMs process prompts. The knowledge base is separate: it's cloud-primary (globally accessible) with a local mirror. See [Migration Phase 1d](docs/projects/opencosmos-migration.md#1d-knowledge-base-hosting-strategy-not-started).

- **Tier 1 (Full Sovereignty):** All inference on local hardware. No external calls.
- **Tier 2 (Reduced Capability):** Low-power mode (nighttime/low solar). Queries may be queued for sunrise.
- **Tier 3 (Cloud-Assisted):** User opted in per-request. Prompt sent to external provider.

---

## File Organization Rules

| If you're creating... | Put it in... |
|----------------------|--------------|
| App-specific component | `apps/<app>/components/` |
| App-specific hook | `apps/<app>/hooks/` |
| App-specific utility | `apps/<app>/lib/` |
| App-specific state store | `apps/<app>/store/` |
| AI capabilities (shared) | `packages/ai/src/` |
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
| **packages/\*/** | Package-specific docs that live with their code (COSMO_SYSTEM_PROMPT.md, etc.) | As needed |

### Edge cases

- **New design pattern doc?** → `docs/` if it's about how we build; `knowledge/reference/` if it should be RAG-retrievable.
- **Project retrospective?** → `docs/` — it's internal reflection, not corpus material.
- **Philosophical essay?** → `knowledge/sources/` if it's original work; `knowledge/commentary/` if it's analysis of another work.
- **Technical report (e.g., Apertus)?** → `knowledge/sources/` — it's a primary source document.
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

## State Management

Zustand for client-side state with localStorage persistence.

**Use Zustand for:** User preferences, feature flags, client-side state shared across components.
**Don't use Zustand for:** Server data (use RSC + fetch), form state, single-component state.

```typescript
// App-specific store
// apps/web/store/navigation.ts
import { create } from 'zustand'

interface NavigationState {
  isMenuOpen: boolean
  toggleMenu: () => void
}

export const useNavigation = create<NavigationState>((set) => ({
  isMenuOpen: false,
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
}))
```

Design system stores (`useTheme`, `useMotionPreference`) come from `@opencosmos/ui/hooks`.

---

## Build & Development

```bash
# Development
pnpm dev                         # Start all apps
pnpm dev --filter web      # Start specific app

# Build
pnpm build                       # Build everything
pnpm build --filter web    # Build specific app

# Quality
pnpm lint
```

### CI Pipeline

`.github/workflows/ci.yml` — runs on PR and push to main:
1. `pnpm install --frozen-lockfile`
2. `pnpm build` (all apps)

Node 24, pnpm 10.26.1+. Deployed to Vercel.

### Clear Stale Caches

```bash
rm -rf .turbo apps/*/.next && pnpm build
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | React Server Components |
| React | React 19.2.1 | |
| Language | TypeScript 5 | Strict mode |
| Styling | Tailwind CSS | Via CSS variables from @opencosmos/ui |
| Animation | Framer Motion 12 | Respects motion preferences |
| State | Zustand 5 | localStorage persistence |
| Design System | `@opencosmos/ui` (npm) | 100 components, 3 themes |
| Monorepo | Turborepo + pnpm | |
| Deployment | Vercel | Auto-deploys main |

---

## Git Conventions

```
type(scope): description
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes:** `portfolio`, `creative-powerup`, `stocks`, `ai`, `cosmos`

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
- **[docs/projects/opencosmos-migration.md](docs/projects/opencosmos-migration.md)** — Active migration plan
- **[CHANGELOG.md](CHANGELOG.md)** — Work history
- **[OpenCosmos/UI repo](https://github.com/opencosmos-ai/opencosmos-ui)** — Where the design system lives
- **[opencosmos.ai](https://opencosmos.ai/)** — Interactive component documentation
