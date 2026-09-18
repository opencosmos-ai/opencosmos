# 0006 — Kaizen: lessons always-on, exemplars few-shot

**Date:** 2026-03-21 · **Status:** Accepted

_Cosmo's learning is a human-in-the-loop policy update, not training: lessons are injected into every turn to set a floor, curated exemplars set the ceiling, and both are deterministic rather than retrieved._

## Context

Cosmo needed a way to get better from experience. It has no filesystem access and no memory across conversations, so anything learned has to be delivered into its context deliberately.

Two different kinds of learning were being conflated. **Corrections** — "you confabulated web access; never claim to have read a page you did not fetch" — need to apply on *every* turn, because a failure mode does not announce itself in advance and there is no query that reliably retrieves the relevant caution. **Positive examples** — a session where Cosmo was genuinely at its best — shape voice and posture, and work by demonstration rather than instruction.

An early version indexed the kaizen material into the corpus and relied on retrieval. That failed in the specific way this design now guards against: asked to "find any record of recent learnings," Cosmo could not, because nothing in the query surfaced the log. A lesson that only applies when retrieval happens to surface it is not a lesson.

Naming matters here too. Grouping the artifacts under `kaizen/` (改善, incremental refinement) names the *practice* rather than the files.

## Decision

Two mechanisms, deliberately different:

- **Lessons — always on.** [`kaizen/LESSONS.md`](https://github.com/opencosmos-ai/cosmo/blob/main/kaizen/LESSONS.md) is a curated digest read at build time and injected as a system block on every turn. Never retrieved, never optional. It sets a floor.
- **Exemplars — few-shot.** [`kaizen/exemplars/cosmo/*.md`](https://github.com/opencosmos-ai/cosmo/tree/main/kaizen/exemplars/cosmo) are curated real sessions, frontmatter stripped, injected as a cached block to steer voice and rhythm. They set a ceiling. Absorb the posture; do not reuse the words.

The kaizen material is *also* indexed with `role: 'kaizen'` so Cosmo can answer honestly when asked what it has learned — but it is rendered under a separate "Your Learning Log" heading with anti-citation framing, so a logged failure is never read back as wisdom to repeat.

The loop is human-in-the-loop: converse → an incident is appended to `feedback/notes.md` with a proposed distilled line → Shalom approves → deploy bakes it in. **No weights change.** Shalom's discernment is the reward signal and deterministic prompt assembly is the update.

## Consequences

- Distilled lessons shape every turn rather than only the turns where retrieval cooperates.
- Two prompt-cache breakpoints are consumed by static blocks. Anthropic allows four, and this design deliberately consolidated from four to two to leave room — an earlier version sat at the ceiling and a new block silently broke admin mode.
- Lessons must stay short. Everything in the digest is paid for on every request, so the curation bar is high and the digest is not an append-only log.
- The separation must hold at render time. If the learning log were rendered as corpus, an anti-pattern would read as advice — which is exactly why it gets its own heading and framing.
- This is honestly a policy-update mechanism, not reinforcement learning. Calling it learning is accurate; calling it training would not be.

## Alternatives considered

- **Retrieve lessons like any other corpus content.** Rejected, and tried first: the failure was concrete — asked what it had learned, Cosmo could not find its own log, because no query reliably surfaces a caution before the mistake it prevents.
- **Fine-tune on corrections.** Rejected: slow, expensive, opaque, and irreversible. A prompt block can be edited in one commit and rolled back in another.
- **One undifferentiated pile of "learnings."** Rejected: corrections and exemplars want opposite delivery. A correction must always apply; an exemplar is a demonstration and would be parroted if injected as instruction.
- **Auto-append lessons without review.** Rejected: the digest is in every request, so an unreviewed entry costs tokens on every turn forever, and a badly-phrased lesson actively misdirects.
