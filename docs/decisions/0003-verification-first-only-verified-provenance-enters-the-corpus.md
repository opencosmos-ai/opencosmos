# 0003 — Verification-first: only verified provenance enters the corpus

**Date:** 2026-05-07 · **Status:** Accepted · **Relates to** 0007, 0013

_Unverified attributions never reach the index, because an AI whose authority rests on honesty cannot be allowed to launder a misattribution — even with a caveat attached._

## Context

The personal quote collection that seeded the corpus held 1,509 records, and a substantial fraction were the internet's greatest hits: lines Einstein never wrote, Gandhi never said, Twain never published. Tier 1 normalization flagged fourteen outright before anyone looked closely; the eventual full validation found 120 likely-misattributed and 49 apocryphal.

The original plan was to embed all 1,509 with provenance metadata attached and let Cosmo soften its language for the unverified ones — "attributed to", "popularly attributed to". That is the conventional answer, and it is wrong here for a reason specific to what Cosmo is.

Cosmo's usefulness rests entirely on being trustworthy about sources. A caveat is a weak guard: it depends on the model reliably applying it under every phrasing, in every conversational context, for the lifetime of the corpus. One slip and the system has laundered a fabrication into something a person will repeat. Softened language also does nothing for retrieval — an apocryphal quote still competes for the top-K slots that a real one could have occupied.

The counter-argument was velocity. Embedding everything immediately would have let Stages 3–5 iterate against a populated index rather than an almost-empty one.

## Decision

Only content whose provenance has been checked reaches the vector index. Everything else stays in a pending pool that the embed pipeline cannot see (see 0007 for the mechanism).

The promotion bar: `status ∈ {verified, attributed}` **and** (`confidence ≥ 0.8` **or** `reviewed_by_human = true`).

Cosmo is instructed to soften attribution for anything not `verified`, and never to present a `likely_misattributed` or `apocryphal` record without flagging the doubt — but that is defence in depth, not the primary control. The primary control is that the unverified material is not in the index at all.

## Consequences

- **Integrity over velocity, explicitly accepted.** The index launched with 46 quotes instead of 1,509, and Cosmo sometimes had to say "I don't have a verified quote on that yet." That is the correct failure mode.
- Retrieval quality is higher per-slot: every candidate is real.
- Roughly a thousand records remain permanently pending, and that is a success rather than a backlog. Most are untraceable material now correctly *described* as untraceable — the outcome the substrate exists to produce.
- Validation becomes a prerequisite for usefulness, which made the cost of Stage 3 a live architectural concern (see 0011).
- A quote cannot be cited into existence by accident. Cosmo has no path to citing something unverified even if its language guard fails.

## Alternatives considered

- **Embed all 1,509 with provenance metadata and soften language.** Rejected. Half the corpus is "Einstein said" quotes Einstein never said, and shipping unverified is a betrayal of Cosmo's voice — flourishing isn't built on misattribution. It also makes the guarantee depend on the model behaving, rather than on the data being absent.
- **Delete the unverified records.** Rejected. The pending pool is where reattribution happens; discarding it would destroy the only record of what was claimed, and a dropped quote could be silently re-imported later. Records rejected in review are archived rather than deleted for the same reason.
- **Ship verified-only and abandon the rest.** Rejected. The validation pass eventually promoted 349 records and produced correct reattributions for dozens more — value that only exists because the unverified pool was kept and worked.
