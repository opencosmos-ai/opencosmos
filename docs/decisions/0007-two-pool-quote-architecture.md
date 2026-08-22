# 0007 — Two-pool quote architecture

**Date:** 2026-05-07 · **Status:** Accepted · **Implements** 0003 · **Relates to** 0012

_Unverified quotes live outside `knowledge/` entirely, so they cannot leak into the index by accident rather than by policy._

## Context

0003 decided that only verified provenance reaches the index. That is a policy, and a policy needs a mechanism, or it degrades into a filter someone eventually forgets to apply.

The obvious mechanism is a status field: keep everything in one place, check `status` before embedding. It works until a new consumer forgets the check, or a refactor drops it, or a script iterates the directory directly. The guarantee then depends on every reader remembering, forever.

A quote is also not shaped like the rest of the corpus. It has no sections, no table of contents, no reader page of its own in the way a source text does. It is a record with an author, a text, and a provenance block. Filing 1,509 of them as markdown documents would drown the corpus in files that are not documents.

## Decision

Two physically separate pools:

- **`knowledge/quotes/*.yaml`** — embeddable records only, `status ∈ {verified, attributed}`. One YAML file per author, plus three collective files: `proverbs.yaml` (traditional sayings), `attributed-collectives.yaml` (e.g. a Delphic maxim), `anonymous.yaml` (unknown).
- **`data/quotes-pending/`** — everything awaiting validation, as `pending.jsonl` plus a working `pending.csv`.

`data/` is outside `knowledge/`, so the embed pipeline never walks it. The separation is structural: an unverified quote is not in a place the indexer looks.

Stage 3 mutates the pending pool; Stage 4 applies human decisions; `pnpm quotes:promote` migrates records that clear the bar into the embeddable pool. Promotion is the only path in, and it lives in one script.

Three collective files rather than one because the tradition signal is what the graph clusters on — "Zen proverb", "Delphic maxim", and "unknown" are genuinely different, and merging them later is trivial if any turns out redundant.

## Consequences

- The guarantee in 0003 holds by construction. No consumer can accidentally embed an unverified quote, because the file is not there.
- One file per author gives readable diffs and no edit collisions between authors.
- Promotion is auditable: a single script, with `--dry`, that reports exactly what moved.
- The pools must reconcile, so `pnpm quotes:lint` checks cross-pool integrity — unique ids, no overlap, and every record from the original import present in exactly one pool.
- Two locations to reason about, and a `data/` directory that is corpus-adjacent but deliberately not corpus.
- YAML files in the embeddable pool are written by the pipeline, so they are not hand-edited (see 0012 for what became canonical).

## Alternatives considered

- **One big `quotes.yaml`.** Rejected: diffs become opaque and per-author edits collide.
- **One markdown file per quote.** Rejected: 1,500+ files is noise. Quotes have no TOCs or page views — they are graph citizens, not library items.
- **One pool with a status field checked at embed time.** Rejected: it makes the integrity guarantee depend on every present and future consumer remembering to check. Physical separation does not.
- **Keep pending quotes inside `knowledge/` in an underscore directory.** Rejected: the embed walker opts directories out one at a time, and that list has been wrong before — `iching/` and `incoming/` were both being indexed against their stated intent. Relying on an exclusion list to protect the corpus's integrity guarantee repeats a known failure.
