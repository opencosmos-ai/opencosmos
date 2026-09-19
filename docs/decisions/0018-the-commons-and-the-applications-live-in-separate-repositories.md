# 0018 — The commons and the applications live in separate repositories

**Date:** 2026-09-19 · **Status:** Accepted · **Relates to** [0002](0002-corpus-paths-and-library-urls-are-separate-namespaces.md), [0008](0008-the-library-is-one-index.md), [0009](0009-constellation-as-its-own-package.md)

_Six repositories, split by **rights and invitation** rather than by topic — because what someone may read, cite, fork and contribute to is a different question from what happens to be convenient to build together._

## Context

Until September 2026 this was one repository: five applications, the corpus, Cosmo's constitutional layer, the I Ching, and the toolchain for all of it. That is the normal shape for a monorepo and it worked.

It could not survive the invitation. The corpus is meant to be read, quoted and added to by people who have no interest in a portfolio site; Cosmo's constitution is meant to be forked and argued with; the Tao Te Ching translation is meant to be cited. None of that is true of a personal portfolio or a commercial product, and all of it was sitting behind the same `git clone`.

The problem was never technical. A contributor faced with a repository containing someone's consulting case studies cannot tell what they are invited to touch. A licence at the root says one thing about the whole tree, when the tree holds CC0 source texts, a CC BY-SA constitution, MIT application code, and a BUSL product. **One repository can only make one offer.**

## Decision

Split by **rights and invitation**, not by topic.

| Repository | Holds | Licence |
|---|---|---|
| [opencosmos-ai/opencosmos](https://github.com/opencosmos-ai/opencosmos) | `apps/web` — opencosmos.ai, the site that serves the commons | MIT |
| [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge) | the corpus and every tool that writes it | CC0 |
| [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo) | the system prompt, the triad, Xensō, the kaizen practice | CC BY-SA 4.0 + Use Policy |
| [opencosmos-ai/taoteching](https://github.com/opencosmos-ai/taoteching) | 81 chapters | CC0 |
| [opencosmos-ai/iching](https://github.com/opencosmos-ai/iching) | the text, the wings, the Xensō generators | CC0 |
| [opencosmos-ai/opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui) | `@opencosmos/{ui,tokens,mcp,constellation}` and OpenCosmos Studio | MIT |
| [shalomormsby/portfolio](https://github.com/shalomormsby/portfolio), [/creative-powerup](https://github.com/shalomormsby/creative-powerup) | the personal applications | personal |
| [shalomormsby/stocks](https://github.com/shalomormsby/stocks) | archived, recoverable | BUSL 1.1 |

**The test for where something belongs is not "what is it about" but "who is invited to it, and on what terms".** The I Ching and the design system are as unrelated as two subjects can be; they are separate repositories for the same reason, which is that each carries a distinct offer to a distinct audience.

**The organization holds the commons and the site that serves it. Nothing else.** The personal applications were peeled back to `shalomormsby/` on 18 September, which is what makes the org's invitation legible: everything in it is contributable.

## Consequences

- **The app never reads the corpus at runtime.** It fetches it at build time (`pnpm --filter web content`) and retrieves through Upstash. That was already true and is now load-bearing — see [0008](0008-the-library-is-one-index.md).
- **A contributor's `git clone` is an answer.** What they get is what they are invited to work on.
- **Licences apply to trees that deserve them.** `stocks` carrying BUSL 1.1 under an MIT root was a contradiction that resolved itself by moving; nothing had to be argued.
- **Cross-repository work costs more.** A change spanning the corpus and the app is two pull requests in two repositories with no atomic commit between them. This is the real price, and it is accepted: the seam already existed through Upstash, so the coupling being severed was organisational rather than technical.
- **A decision spanning two repositories must be recorded on both sides or it is lost.** [0009](0009-constellation-as-its-own-package.md) names this exact failure — the licensing argument for the graph renderer lives here while the package ships from `opencosmos-ui`. Expect to write the same ADR twice, from each side's point of view.
- **Every repository needs its own everything.** CI, licence, contributing guide, and — discovered the hard way during the peel — its own lockfile. The monorepo's `pnpm-lock.yaml` sits above `apps/`, so it did not travel with the extracted applications and had to be regenerated.
- **Redirects hide staleness.** GitHub redirects every moved URL, so a link to the old path keeps working and nothing signals that it is wrong. Two sweeps missed references because of this; a third found nine more in ADRs and a changelog header. **Grep for the old owner, not the old path.**

## Alternatives considered

- **Stay a monorepo, use directory-level licences and CODEOWNERS.** Rejected: it addresses the legal question and not the human one. A contributor still clones someone's consulting work to fix a typo in a sutra, and the invitation stays illegible however the `LICENSE` files are arranged.
- **Split by topic** — apps in one, content in another. Rejected: it puts the CC0 corpus and the CC BY-SA constitution together because both are "content", while their offers differ in exactly the way that matters. It is the intuitive split and it answers the wrong question.
- **One repository per document.** Rejected as the same principle taken past its use: the Tao Te Ching is its own repository because it is independently citable and independently forkable, which is not true of a single wiki page.
