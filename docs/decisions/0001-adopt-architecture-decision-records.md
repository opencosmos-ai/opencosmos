# 0001 — Adopt Architecture Decision Records

**Date:** 2026-08-22 · **Status:** Accepted

## Context

OpenCosmos has two places that were built to hold the reasoning behind decisions. Both
are dead, and they died nine days apart:

- **[docs/chronicle.md](../chronicle.md)** — narrative, chaptered, transcript-laden.
  Last updated **2026-03-31**.
- **[docs/architecture.md](../architecture.md) § Decision Log** — a Date | Decision |
  Rationale table. Last row **2026-03-22**.

Five months of substantial work has shipped since: the Cosmo learning loop, Inception,
the constellation, the whole quote substrate. None of its reasoning reached either file.
What survived did so *incidentally*, in two documents that were not built for it:

- **CHANGELOG.md** carries genuinely good rationale — recent entries open with a
  diagnosis rather than a summary, and some close with an explicit trade-off. But it is
  organized by ship date, so retrieval requires knowing roughly *when* something
  happened, and it only records work that shipped.
- **pm.md** records decisions inline with plans (`##### Two-pool architecture (decided
  2026-05-07)`, `**Why not the obvious alternatives:**`). The content is strong; the
  container is wrong. pm.md is a living plan document, pruned as phases complete. When
  Phase 1.3 closes, the reasoning for the two-pool architecture goes with it.

Three specific losses follow:

1. **Decisions that never ship leave no trace.** A considered-and-declined design, a
   naming call, an ethical constraint, a question answered before any code exists — none
   of these produce a CHANGELOG entry.
2. **Reversals have no forward link.** BYOK-with-Claude superseded the three-tier solar
   sovereignty model, recorded only as a prose aside. A reader who finds the original has
   no signal it was overturned.
3. **The instruction layer points at a dead file.** Both `AGENTS.md` and
   `.claude/CLAUDE.md` tell agents that "the story behind the decisions" lives in
   chronicle.md. AGENTS.md separately discourages creating markdown files unless asked.
   Every session is routed into a void and then told not to dig a new one.

The same reasoning was worked through a month ago in a sibling repository. Agency of
One's [ADR 0001](https://github.com/shalomormsby/agencyofone) states the problem almost
verbatim — *"each with reasoning that felt obvious at the time and will be invisible in
six months"* — names the two risks as **relitigation** and **agent context loss**, and
observes that *"a single founder is the highest-risk case for both."* That system is
alive at 44 records. This one adopts its format deliberately, so the two repositories
read the same way.

The second risk is the sharper one here. OpenCosmos is built with agents, continuously.
An agent reading a constraint without its reasoning treats it as arbitrary — and
arbitrary constraints get helpfully optimized away. This session produced a live example:
`knowledge/` stays `knowledge/` while the URL became `/library`, because corpus paths key
every vector id and every citation token in every stored conversation. Nothing in the
repository said so. The reasoning existed only in a chat window, one question away from
being lost, and a future agent "tidying up the inconsistency" would have broken every
historical citation.

## Decision

Adopt Architecture Decision Records — small, numbered, immutable markdown files, one per
load-bearing decision, in the Nygard format already in use at Agency of One.

**Conventions:**

- Location: `docs/decisions/NNNN-short-slug.md`, zero-padded, sequential.
- Status: `Proposed` · `Accepted` · `Superseded by NNNN`.
- **Append-only.** An ADR is never edited to change its meaning. To reverse a decision,
  write a new one that supersedes it and link both directions.
- Scope: expensive to reverse, constrains future work, or non-obvious rationale. Not
  every choice — only the load-bearing ones.
- Structure: Context → Decision → Consequences → Alternatives considered.

**Division of labour with what already works:**

| Where | Holds |
|---|---|
| `docs/decisions/` | why a load-bearing choice was made, and what was rejected |
| `CHANGELOG.md` | why *this change, now, in this form* — shipped work, by date |
| `docs/pm.md` | plans in flight; links out to an ADR rather than restating it |
| `docs/chronicle.md` | the narrative story, when a session has that quality |

CHANGELOG is explicitly **not** demoted to a WHAT log. It is the best rationale capture
in the repository today and keeps that job.

**Seeded by backfill, not by resolution.** Roughly fifteen records can be written from
prose that already exists — the seven Decision Log rows, the approved decisions in pm.md,
and the load-bearing calls from the quote-substrate work. No new reasoning is required.
The directory is useful on day one rather than aspirational.

**The instruction layer is corrected in the same change.** AGENTS.md and
`.claude/CLAUDE.md` are updated to point here, and to permit writing a decision record
without asking first.

## Consequences

- Small cost per decision; the payoff lands at every future "why did we…?"
- `docs/decisions/` becomes onboarding material — for collaborators, for agents, and for
  the future self who no longer remembers.
- Superseded records stay. The history of reversals is itself information.
- A third decision system could die like the first two. The failure modes differ, which
  is the reason to expect otherwise: chronicle.md required a *mood* — it is essayistic
  and transcript-laden, and one only writes that when the session has that quality. The
  Decision Log died because it was a table at line 1,213 of a 1,256-line file nobody
  scrolls to. A numbered directory with a four-heading template needs neither mood nor
  scrolling, only a trigger. Backfilling first supplies the trigger.
- Two live documents keep entries that a strict reading would migrate. Leave them.
  Moving CHANGELOG's reasoning here would gut the best thing in the repository, and
  rewriting pm.md's history is churn. New decisions land here; old ones are backfilled
  only where the reasoning is load-bearing and would otherwise be pruned.

## Alternatives considered

- **Revive `docs/chronicle.md`.** Rejected. It is the best *writing* in the repository
  and should continue as narrative, but it is per-episode rather than per-decision: no
  index, no titles that name decisions, no way to look up "why two pools" without reading
  prose. And it died once already, for a reason that adopting it harder does not fix.
- **Revive the `architecture.md` § Decision Log table.** Rejected. A table cannot hold
  Context / Consequences / Alternatives, has no supersession mechanism, and its location
  is why it died. Its seven rows are migrated here instead.
- **Keep relying on CHANGELOG and pm.md.** Rejected, and Agency of One's ADR 0001 already
  rejected exactly this pairing: *"the PRD is a living document that gets rewritten;
  decisions need immutability"* and *"commit messages and PR descriptions… not
  discoverable, not durable, and most of these decisions precede any code."* Substitute
  pm.md for PRD and CHANGELOG for commit messages and that is a written critique of the
  status quo here.
- **Nothing.** Rejected. Five months of reasoning already went unrecorded, and the one
  decision that prompted this ADR survived only because it was asked about directly.
