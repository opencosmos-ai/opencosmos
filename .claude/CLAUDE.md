# Claude Context for OpenCosmos

> **Context file for AI assistants (primarily Claude) working on this platform. Read this first, then [DESIGN-PHILOSOPHY.md](../DESIGN-PHILOSOPHY.md) and [AGENTS.md](../AGENTS.md).**

Last updated: 2026-09-24

---

## Quick Orientation

You're working on **OpenCosmos** — a creative platform built on the recognition that we are not separate from the universe we inhabit. This monorepo contains the product applications that consume [OpenCosmos/UI](https://opencosmos.ai/) from npm. The design system is developed in a [separate repository](https://github.com/opencosmos-ai/opencosmos-ui).

**The North Star:** Help to reduce suffering, nourish flourishing, and enable acts of wisdom.  

**Your Role:** Partner in creative work. You execute within the vision Shalom defines. Ask questions, propose options, challenge assumptions, but never make unilateral architectural decisions.

---

## Repository Structure

```
opencosmos/
├── apps/
│   └── web/                 # opencosmos.ai — the Library, the graph, Cosmo
├── docs/                    # Technical docs, architecture, migration plans
│   └── archive-and-deprecated/  # Historical/superseded documents
├── scripts/                 # Programs you run — see scripts/README.md
├── .claude/skills/          # Procedures an agent follows — see its README
├── WELCOME.md               # The front door — vision and philosophy
├── DESIGN-PHILOSOPHY.md     # The North Star for creative projects
├── AGENTS.md                # Technical guide for AI agents
└── CHANGELOG.md             # Work history
```

### One Philosophy, Six Repositories

The commons was split out of this monorepo in September 2026 — separated by
rights and invitation, not by topic ([ADR 0018](../docs/decisions/0018-the-commons-and-the-applications-live-in-separate-repositories.md)).
Each is public and contributable.

| Repo | Purpose | License |
|------|---------|---------|
| **This repo** (opencosmos) | `apps/web` — opencosmos.ai. **Builds the corpus and Cosmo in at build time — it does not contain them.** | MIT |
| **[knowledge](https://github.com/opencosmos-ai/knowledge)** | The corpus — sources, quotes, wiki — and its whole toolchain | CC0 |
| **[cosmo](https://github.com/opencosmos-ai/cosmo)** | Cosmo's constitution — system prompt, the triad, Xensō, kaizen | CC BY-SA 4.0 |
| **[taoteching](https://github.com/opencosmos-ai/taoteching)** | A translation, 81 chapters | CC0 |
| **[iching](https://github.com/opencosmos-ai/iching)** | A translation; the app copies its generated hexagram table | CC0 |
| **[opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui)** | `@opencosmos/ui`, `/tokens`, `/mcp`, the Studio docs site | MIT |

The personal apps (portfolio, creative-powerup) left for `shalomormsby/` on
18 Sept 2026 and are not part of the organization.

**Fetching:** `pnpm --filter web content` pulls `knowledge` and `cosmo` into
`apps/web/.content/`. A sibling checkout at `../knowledge` or `../cosmo` is used
in preference to a clone, so local edits are picked up.

**Rule:** Don't create `packages/ui/`, `packages/tokens/`, or `packages/mcp/` here. Those are developed and published from opencosmos-ui.

---

## Essential Files

1. **[WELCOME-COSMO.md](https://github.com/opencosmos-ai/cosmo/blob/main/WELCOME-COSMO.md)** — in [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo)
2. **[COSMO_SYSTEM_PROMPT.md](https://github.com/opencosmos-ai/cosmo/blob/main/COSMO_SYSTEM_PROMPT.md)** — Cosmo's voice, values, and practice. Fetched to `apps/web/.content/cosmo/` at build time.
3. **[Knowledge Wiki](https://github.com/opencosmos-ai/knowledge/blob/main/wiki/index.md)** – Ambient context for the OpenCosmos knowledge base, in [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge). Loaded into context via the `@import` below, from the fetched copy — see the [Knowledge Wiki (Ambient Context)](#knowledge-wiki-ambient-context) section.
4. **[WELCOME.md](../WELCOME.md)** — The front door. OpenCosmos vision, cosmology, values, and invitation.
5. **[DESIGN-PHILOSOPHY.md](../DESIGN-PHILOSOPHY.md)** — The North Star for all design work. Four principles.
6. **[AGENTS.md](../AGENTS.md)** — Technical guide: file organization, document organization, build commands, conventions.
7. **[docs/architecture.md](../docs/architecture.md)** — Infrastructure decisions, service map, and data flow.
8. **[docs/decisions/](../docs/decisions/)** — ADRs: why load-bearing choices were made. Check here before changing something that looks arbitrary; write one when you make a call a future reader would find surprising. See [0001](../docs/decisions/0001-adopt-architecture-decision-records.md).
9. **[docs/chronicle.md](../docs/chronicle.md)** — The narrative story behind the work.

---

## Skills

Five procedures live in [`.claude/skills/`](../.claude/skills/README.md),
invoked by typing `/<name>`. **Check there before writing a procedure from
scratch** — `/pr`, `/clean` and `/git-sync` cover the git workflow, `/create`
covers UI, `/inference-cost` covers model choice. The six corpus skills live
with the corpus, in
[opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge/tree/main/.claude/skills).

See [AGENTS.md § Skills](../AGENTS.md#skills) for the table, or
[.claude/skills/README.md](../.claude/skills/README.md) for the full index.

---

## Document Organization

See [AGENTS.md § Document Organization](../AGENTS.md#document-organization) for the full rules. In brief:

- **Root (5 max):** README, WELCOME, DESIGN-PHILOSOPHY, CHANGELOG, CONTRIBUTING
- **Root (agent context):** AGENTS.md, .claude/CLAUDE.md
- **docs/:** Architecture, migration plans, research, chronicle, retrospectives
- **docs/decisions/:** ADRs — numbered, append-only, one per load-bearing decision
- **the corpus:** not in this repo — [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge), see its [README](https://github.com/opencosmos-ai/knowledge/blob/main/README.md)
- **Cosmo's documents:** in [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo), not here

---

## Cosmo

The shared AI intelligence layer. Lives in its own repository,
[opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo), and is fetched
into `apps/web/.content/cosmo` at build time — edit it there, not here.

- **License:** CC BY-SA 4.0 + a non-binding [Use Policy](https://github.com/opencosmos-ai/cosmo/blob/main/USE-POLICY.md)
- **Inference:** Claude via the Anthropic API — shared free tier or BYOK. *Voice is sovereign, compute is flexible* — see [docs/architecture.md](../docs/architecture.md).
- **Read [COSMO_SYSTEM_PROMPT.md](https://github.com/opencosmos-ai/cosmo/blob/main/COSMO_SYSTEM_PROMPT.md)** for the voice and values

---

## Import Patterns

```typescript
// Design system (from npm)
import { Button, Card, useTheme } from '@opencosmos/ui'
import { useMotionPreference } from '@opencosmos/ui/hooks'
import { ThemeProvider } from '@opencosmos/ui/providers'
import { cn } from '@opencosmos/ui/utils'
import '@opencosmos/ui/globals.css'

// Never use (legacy)
// import { Button } from '@thesage/ui'
// import { Card } from '@ecosystem/design-system'
```

---

## Key Patterns

### Motion Must Respect Preferences

```typescript
import { useMotionPreference } from '@opencosmos/ui/hooks'

function AnimatedComponent() {
  const { shouldAnimate, scale } = useMotionPreference()
  return (
    <motion.div
      animate={{ opacity: 1, y: shouldAnimate ? 20 : 0 }}
      transition={{ duration: shouldAnimate ? 0.3 : 0 }}
    />
  )
}
```

### CSS Variables Over Hardcoded Colors

```typescript
// ✅ Theme-aware
className="bg-background text-foreground border-border"

// ❌ Hardcoded
className="bg-white text-black border-gray-200"
```

### Use Design System Components First

Always search for existing `@opencosmos/ui` components before writing custom JSX or CSS.

---

## Build & Development

See [AGENTS.md § Build & Development](../AGENTS.md#build--development) for the full reference. Essentials:

```bash
pnpm dev --filter web            # Start opencosmos.ai at localhost:3000
pnpm build                       # Build everything
pnpm update @opencosmos/ui       # Update design system
```

---

## Tech Stack

See [AGENTS.md § Tech Stack](../AGENTS.md#tech-stack) for the full table.

---

## What NOT to Do

1. Make architectural decisions without Shalom
2. Create design system packages here (use opencosmos-ui)
3. Skip accessibility requirements

See [AGENTS.md § What NOT to Do](../AGENTS.md#what-not-to-do) for the full list.

---

## Quick Links

- Live: https://opencosmos.ai/
- Studio (design system docs): https://studio.opencosmos.ai/
- Local: http://localhost:3000

---

## Knowledge Wiki (Ambient Context)

The knowledge wiki is a synthesis layer above the raw source corpus. It is always loaded here so Claude has the current index in context without being explicitly asked.

> **Note:** This `@` directive is the actual loading mechanism — not the markdown link above. A markdown link is navigational only; `@path` causes Claude Code to expand the file inline at session start. Both are needed: the link for human navigation, the `@` for ambient loading.

> **The path moved.** The corpus lives in
> [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge) now, and
> is fetched into `apps/web/.content/`. That means **this import only resolves
> after `pnpm --filter web content` has run** — which any working dev loop has
> already done. It pointed at the old `knowledge/wiki/index.md` until 18
> September and had been silently resolving to nothing since the corpus left.

@apps/web/.content/knowledge/wiki/index.md
