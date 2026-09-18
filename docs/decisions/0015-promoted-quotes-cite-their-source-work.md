# 0015 — Promoted quotes cite their source work

**Date:** 2026-08-22 · **Status:** Accepted · **Relates to** 0007, 0009

_The constellation's `quote → work` edge had never fired once because the emitter hardcoded `source_work: null`; resolving it requires the work's title **and** its author to agree, because a wrong edge is worse than no edge._

## Context

The constellation defines a four-tier hierarchy, and its intended shape is quotes orbiting the works they came from — a `cites` edge from quote to work, with `member_of` to a tradition as the fallback for quotes whose source isn't in the corpus.

That edge had **never fired, for any of the 349 promoted quotes**. `emitQuoteBlock` in the corpus repository's `scripts/normalize-quotes/shared.ts` wrote `source_work: null` unconditionally, so every quote took the fallback and hung off its tradition. The graph looked plausible, which is why nobody noticed: a tradition-clustered constellation is a reasonable-looking constellation.

Meanwhile Stage 3 had recorded `earliest_print_source` for 338 quotes, and some of those name works the corpus actually holds — *Meditations*, *Leaves of Grass*, the *Tao Te Ching*, the *Dhammapada*. The data to draw the edge existed; nothing was reading it.

The obvious matcher — does the print source contain a corpus work's title — is too loose. Alan Watts' *Nature, Man and Woman* contains the string "Nature", which is the title of Emerson's essay in the corpus. Title-only matching produced that edge and several like it.

## Decision

`09-resolve-source-works.ts` (`npm run quotes:link-works`) resolves `source_work` by matching a quote's `earliest_print_source` against corpus works, requiring **both**:

1. the work's title appears in the print source, and
2. the authors agree — work author matches quote author, or the work's author name appears in the print source

Titles shorter than five characters are ignored entirely, and works are checked longest-title-first so *Tao Te Ching* wins over a hypothetical *Tao*.

The emitters now **preserve** `source_work` and `source_section` rather than hardcoding null, so a resolved link survives the next promote.

## Consequences

- 24 quotes now cite their actual work: ten Marcus Aurelius to *Meditations*, four Whitman to *Leaves of Grass*, Plato to *Apology* and *Gorgias*, Socrates to *Apology* (he speaks in it), and others. Constellation edges 1,049 → 1,058.
- Those quotes also carry their work into Cosmo's RAG context rather than floating unsourced.
- **Recall is deliberately low.** 24 of 338 quotes with a print source matched. Most name works the corpus does not hold, which is correct; some are near-misses a looser matcher would catch along with false positives. Precision was chosen over recall because a wrong `cites` edge asserts a relationship that does not exist, and it looks researched.
- All 24 were reviewed by hand. That does not scale, and a future run over a much larger corpus would need spot-checking rather than full review.
- The rule is conservative enough that legitimate matches are missed. Loosening it is tempting and should not be done without re-checking the Emerson/Watts case, which is the canary.

## Alternatives considered

- **Match on title alone.** Rejected: produces the *Nature* / *Nature, Man and Woman* collision, attributing a Watts quote to Emerson's essay.
- **Fuzzy or embedding-based matching.** Rejected: higher recall, and every additional match is one nobody can easily verify. The failure mode is a confident wrong edge, which is exactly what the provenance work exists to avoid.
- **Have the validator emit `source_work` during Stage 3.** Rejected: the validator does not know what the corpus contains, so it would be guessing at slugs. Resolution belongs where both sides are in hand.
- **Resolve at graph-generation time instead of writing the field.** Rejected: `source_work` is also read by the embed pipeline into chunk metadata and shown in Cosmo's RAG context, so computing it only for the graph would leave the other two consumers blind.
