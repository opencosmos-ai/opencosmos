# 0012 — The quote pools are canonical; the source JSONL is history

**Date:** 2026-08-21 · **Status:** Accepted · **Relates to** 0007, 0010

_Once every quote carried a provenance verdict, the original import stopped being the source of truth — and the script that rebuilds from it became the most dangerous command in the repository._

## Context

`knowledge/quotes/_source/quotes_normalized.jsonl` seeded the corpus in May 2026. `01-jsonl-to-yaml.ts` (`pnpm quotes:normalize`) read it and rebuilt both pools, wiping whatever was there first. That was correct and safe while the source genuinely was the truth and the pools were pure derivations.

It stopped being true incrementally, then completely. The pools accumulated provenance verdicts for all 1,509 records, human review decisions, promotion state, `reviewed_by_human` flags, and resolved `source_work` links — **none of which exist in the source file**. A re-run would have silently discarded all of it and reported success.

The danger was not hypothetical. The command was called `quotes:normalize`, which sounds like tidying. Its own documentation described it as "idempotent," which is true in the sense that running it twice gives the same result, and dangerously misleading in the sense a reader takes: that running it is safe. A `--preserve-validation` flag had been promised in the README and never built.

There was also no supported way to add a quote. The only entry point was editing the source JSONL and re-running the import — which is the destructive path.

## Decision

The YAML pool and `pending.jsonl` are the source of truth. `_source/quotes_normalized.jsonl` is the historical import, retained for provenance of the corpus itself.

- `01-jsonl-to-yaml.ts` is **retired**: renamed to `pnpm quotes:migrate-from-source`, and it refuses to run without `--i-know-this-wipes`, printing what it would destroy first. Kept rather than deleted because it documents how the corpus was built and a re-import from a corrected source is imaginable.
- New quotes enter through **`pnpm quotes:add`** (`08-add-quote.ts`), the single enforcement point for id allocation, author-key normalization, routing, and duplicate detection. `--json` is the primary interface because quotes are full of apostrophes and em-dashes and shell escaping eventually mangles one.
- The `/new-quote` skill is the conversational front door and *drives* that script rather than writing YAML itself, so there is one enforcement point rather than two implementations that drift.
- `quotes:lint` changed from an exact-count check to **source coverage**: every id in the import must still live in exactly one pool, but ids beyond it are legal.

## Consequences

- The validation of 1,509 quotes cannot be destroyed by a command that sounds like housekeeping.
- Adding a quote is a supported operation with a guard rail, rather than an edit to a file that gets overwritten.
- The emitters had to stop hardcoding derived fields. `emitQuoteBlock` wrote `source_work: null` unconditionally, so any value would have been wiped on the next promote — a smaller instance of the same bug class.
- The retired script is still present and still capable of the destructive act. The flag is the guard; anyone passing it should mean it.
- Renaming a command is itself part of the guard. `quotes:normalize` invited a run; `quotes:migrate-from-source` does not.

## Alternatives considered

- **Add the promised `--preserve-validation` flag.** Rejected: it makes the safe path opt-in and keeps the dangerous one as the default. The default should be refusal.
- **Delete `01-jsonl-to-yaml.ts`.** Rejected: it records how the corpus was built, and a genuine re-import from a corrected source is a real future scenario.
- **Keep the source JSONL canonical and write verdicts back to it.** Rejected: it would mean the import file accumulating mutable state, and every promote rewriting a 1.4MB single-file blob — the diff opacity 0007 already rejected, at the whole-corpus scale.
- **Let the `/new-quote` skill write YAML directly.** Rejected: two implementations of routing and id allocation will drift, and the one in the skill would drift silently.
