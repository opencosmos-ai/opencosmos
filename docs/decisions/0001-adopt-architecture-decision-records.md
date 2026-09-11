# 0001 — Adopt Architecture Decision Records

**Date:** 2026-08-22 · **Status:** Accepted

_Records why load-bearing choices were made, so they survive the session that made them and are not undone by someone who cannot see the reason._

## Context

A codebase records what it does. It rarely records why, and almost never records what was rejected and on what grounds. That gap costs two specific things.

**Relitigation.** Settled questions get reopened from scratch, usually under deadline pressure, usually with worse information than the first time. A single maintainer is the highest-risk case: there is no colleague who remembers.

**Agent context loss.** OpenCosmos is built with agents, continuously. An agent reading a constraint without its reasoning treats the constraint as arbitrary — and arbitrary constraints get helpfully optimized away. This is not hypothetical. The corpus directory is called `knowledge/` while the URL it serves is `/library`. That looks like an oversight and invites tidying. It is in fact load-bearing: the corpus path keys every vector id in the index and every citation token in every stored conversation, so renaming the directory would silently break every citation Cosmo has ever emitted. Until this record existed, nothing in the repository said so. An agent "fixing the inconsistency" would have been doing real damage while believing it was cleaning up.

The value of a decision record is highest exactly where the reasoning is least visible from the code — which is also where the risk of a well-intentioned reversal is highest.

## Decision

Record each load-bearing decision as a small, numbered, immutable markdown file in `docs/decisions/`, using the Nygard format already running at 44 records in the sibling Agency of One repository. Adopting the same conventions deliberately, so the two read the same way.

### Conventions

- **Location:** `docs/decisions/NNNN-short-slug.md`, zero-padded, sequential.
- **Status:** `Proposed` · `Accepted` · `Superseded by NNNN`.
- **Append-only.** Never edit a record to change its meaning. To reverse a decision, write a new one that supersedes it and link both directions. The history of reversals is itself information.
- **Header:** `**Date:** YYYY-MM-DD · **Status:** …` plus any `Supersedes` / `Superseded by` / `Relates to` cross-links.
- **Summary line:** one italic sentence directly beneath the header, saying what the record is for. It orients a reader opening the file, and `pnpm adr:index` harvests it into the index table in [README.md](README.md).
- **No frontmatter.** The heading carries the number and title and the header line carries the status; restating either in frontmatter would duplicate facts that then drift apart. The index is generated from the documents rather than from a parallel set of metadata.

### What belongs here

A decision earns a record when it is **expensive to reverse**, **constrains future work**, or has **non-obvious rationale** — especially when the code alone would mislead a reader into thinking it was arbitrary. Not every choice; only the load-bearing ones. A useful test: *if someone changed this next month without knowing why it was chosen, would something break or regress?*

Decisions that never produce a commit still belong here — a considered-and-declined design, a naming call, an ethical constraint, a question answered before any code exists. These have no other home.

### What belongs elsewhere

| Where | Holds |
|---|---|
| `docs/decisions/` | why a load-bearing choice was made, and what was rejected |
| [CHANGELOG.md](../../CHANGELOG.md) | why *this change, now, in this form* — shipped work, organized by date |
| [docs/pm.md](../pm.md) | plans in flight; links out to a record rather than restating it |
| [docs/chronicle.md](../chronicle.md) | the narrative story, when a session has that quality |

CHANGELOG is explicitly not demoted to a list of what changed. It carries real reasoning today — recent entries open with a diagnosis rather than a summary — and keeps that job. The difference is scope and lifetime: CHANGELOG explains a change, an ADR explains a constraint, and only the latter needs to still be findable in two years without knowing when it was decided.

### Structure

Four headings, in this order. Keep each short enough to read in a sitting.

- **Context** — the situation and the forces in tension. What made this a decision rather than an obvious step. Include the concrete detail that motivated it; specifics age better than principles.
- **Decision** — what was chosen, stated plainly and in the present tense.
- **Consequences** — what follows, including the costs accepted. A record with only upsides is not being honest.
- **Alternatives considered** — what was rejected and why. Usually the most valuable section, because it is the part that prevents relitigation.

## Consequences

- Small cost per decision; the payoff lands at every future *"why did we…?"*.
- `docs/decisions/` becomes onboarding material — for collaborators, for agents, and for the maintainer who no longer remembers.
- Agents get a place to check before "improving" something load-bearing, and a place to write when they make a call that a future reader would find surprising. `AGENTS.md` points here and permits writing a record without asking first.
- Superseded records stay in place rather than being deleted or edited.
- This is the third attempt at a decision-keeping habit here, and the first two died — a narrative chronicle and a table buried deep in a long architecture document. The failure modes differ from this one: the chronicle required a *mood*, being essayistic and transcript-laden, and the table required scrolling to a place nobody scrolls to. A numbered directory with a four-heading template needs neither, only a trigger. Seeding it by backfilling decisions whose reasoning already exists in prose means it is useful on day one rather than aspirational, which is the main defence against a third death.

## Alternatives considered

- **Rationale inline in the plan document.** Rejected: `pm.md` is a living document, pruned as phases complete. Decisions need immutability, and mixing the two loses both — the plan gets cluttered and the reasoning gets deleted when the plan is tidied.
- **Commit messages and PR descriptions.** Rejected: not discoverable without knowing what to search for, and many of these decisions precede any code.
- **Revive `docs/chronicle.md`.** Rejected as the primary mechanism. It is the best writing in the repository and should continue as narrative, but it is per-episode rather than per-decision: no index, no titles that name decisions, no way to look up a specific choice without reading prose.
- **Revive the Decision Log table in `architecture.md`.** Rejected: a table row cannot hold consequences or rejected alternatives, and has no supersession mechanism. Its surviving rows are migrated here instead.
- **Nothing.** Rejected. The reasoning behind the `knowledge/` versus `/library` split survived only because someone asked about it directly, in a conversation that was about to end.
