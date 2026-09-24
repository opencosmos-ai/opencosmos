# OpenCosmos

> **How might we create technology that helps people feel at home in the universe?**

OpenCosmos is a creative platform built on a simple recognition: we are not separate from the universe we inhabit. Not observers of it. Not masters of it. Participants in it. Dance partners with it.

**Status:** Active Development
**License:** MIT
**Philosophy:** [Read WELCOME.md](WELCOME.md) — The front door
**Design Principles:** [Read DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md) — The North Star

---

## What This Is

This repository is **[opencosmos.ai](https://opencosmos.ai/)**, the site that serves the OpenCosmos commons:

- **The Library:** a public-domain corpus of contemplative texts and verified quotations, readable and cross-linked.
- **The constellation:** the corpus drawn as a knowledge graph.
- **Cosmo:** an AI companion whose values are a versioned document, grounded in the Library and citing it.
- **Inception:** bring a personal AI agent into being. Cosmo draws it out of you, and it goes home with you.
- **Xensō:** a game you play as yourself. The challenges are the real ones of your life.

The site **does not contain** the commons. It fetches them at build time from their own repositories, each with its own licence and invitation ([ADR 0018](docs/decisions/0018-the-commons-and-the-applications-live-in-separate-repositories.md)):

| Repository | What it holds | License |
|---|---|---|
| **opencosmos** (this one) | the site | MIT |
| [knowledge](https://github.com/opencosmos-ai/knowledge) | the corpus and its tools | CC0 |
| [cosmo](https://github.com/opencosmos-ai/cosmo) | Cosmo's constitution | CC BY-SA 4.0 |
| [taoteching](https://github.com/opencosmos-ai/taoteching), [iching](https://github.com/opencosmos-ai/iching) | open translations | CC0 |
| [opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui) | the design system, `@opencosmos/ui` on npm | MIT |

---

## Quick Start

```bash
git clone https://github.com/opencosmos-ai/opencosmos.git
cd opencosmos
pnpm install
pnpm dev          # fetches knowledge + cosmo into .content/, then serves http://localhost:3000
```

If `../knowledge` or `../cosmo` exist as sibling checkouts, the fetch copies them, so local edits show up. Otherwise it clones them.

---

## Core Philosophy

This platform is built on four principles:

1. **Emotionally Resonant** — Touch hearts, not just solve problems. Design should delight.
2. **User Control & Freedom** — Users customize their experience. Motion intensity, themes, everything.
3. **Transparent by Design** — Show the receipts. Users see how things work, including AI collaboration.
4. **Generous by Design** — Open source, teachable, accessible. Code that teaches as it works.

[Read the full philosophy →](DESIGN-PHILOSOPHY.md)

---

## Development

### Prerequisites

- Node.js 24+ (see `.nvmrc`)
- pnpm 10 (pinned in `package.json`)

### Commands

```bash
pnpm dev          # Dev server (fetches content first)
pnpm build        # Production build (fetches content first)
pnpm content      # Re-fetch knowledge + cosmo into .content/
pnpm adr:index    # Regenerate the ADR index after adding one
```

Other scripts: [scripts/README.md](scripts/README.md).

### Updating Design System

When a new version of `@opencosmos/ui` is published:

```bash
pnpm update @opencosmos/ui
pnpm build
```

### Local Development with Design System

When testing design system changes before publishing:

```bash
# In the opencosmos-ui repo
cd packages/ui && pnpm link --global

# In this repo
pnpm link --global @opencosmos/ui

# Don't forget to unlink when done
pnpm unlink @opencosmos/ui && pnpm install
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS |
| Design System | OpenCosmos/UI (`@opencosmos/*`) |
| Package manager | pnpm |
| Deployment | Vercel |
| Retrieval | Upstash Vector + Redis |
| Inference | Claude (Anthropic API), shared free tier or bring-your-own-key |

---

## License

MIT © Shalom Ormsby

---

**Our work is our love made visible.**
