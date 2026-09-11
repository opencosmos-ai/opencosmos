# 0010 — Stable `q_NNNN` quote ids over semantic slugs

**Date:** 2026-05-07 · **Status:** Accepted · **Relates to** 0002

_Quote ids are opaque and permanent because they appear in citations Cosmo has already emitted into conversations that cannot be rewritten._

## Context

A quote needs an identifier. The readable option is a semantic slug derived from the text — `on-love`, `the-unexamined-life`. The opaque option is a sequence number carried from the source import: `q_0159`.

Semantic slugs fail twice here. They **collide**: "on love" is a theme dozens of authors share, so slugs need disambiguation almost immediately and the disambiguation is arbitrary. And they are **derived from mutable data** — Stage 4 reattribution changes a quote's author, and text normalization can change its wording, so a slug that tracked either would need to change with it.

That second failure is the disqualifying one. A quote id is not internal. It is the anchor in `[quote: knowledge/quotes/mary-oliver.yaml#q_0003]`, and those tokens are stored verbatim in conversation history and public share links (see 0002). Renaming an id breaks every citation already emitted, in records that cannot be migrated because they are transcripts of things that were said.

## Decision

The `q_NNNN` id from the original import is canonical and permanent. New quotes continue the sequence, allocated by scanning all three pools for the current maximum.

An optional `slug` field exists for human-readable URLs, but it is decoration: no citation, chunk id, or graph node ever keys on it.

Ids survive everything — reattribution to a different author, moving between pools, promotion, archival. A rejected quote keeps its id in `_archive/rejected.yaml` so the number is never reused and a dropped record cannot silently return as something else.

## Consequences

- Citations stay valid across reattribution, re-import, and promotion. The id is the one thing about a quote that never moves.
- The identifiers are unreadable. `q_0159` tells you nothing, which is a real cost when reading a YAML file or a diff — mitigated by the author, text, and provenance sitting next to it.
- Id allocation must consider the archive as well as the live pools, or a rejected quote's number could be handed to a new record and make an old citation resolve to the wrong text.
- The sequence has no meaning beyond order of arrival. It is not a sort key or a priority.

## Alternatives considered

- **Semantic slugs from the quote text.** Rejected: they collide across authors ("on-love" appears many times) and renames break citations Cosmo has already emitted into conversation history.
- **Author-scoped slugs** (`mary-oliver/the-messenger`). Rejected: still derived from author, which reattribution changes — exactly the case the pipeline exists to handle.
- **Content-hash ids.** Rejected: stable against renaming but not against text correction, and the corpus has real OCR damage to fix. Correcting a typo would orphan the citation.
- **UUIDs.** Rejected: all of the opacity of a sequence number with none of the ordering, and no relationship to the source import.
