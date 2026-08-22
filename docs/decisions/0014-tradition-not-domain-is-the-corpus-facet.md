# 0014 — Tradition, not domain, is the corpus facet

**Date:** 2026-08-22 · **Status:** Accepted · **Relates to** 0008

_`domain` is set on 25 of 110 documents and leaks template placeholders into the filter pills; `tradition` covers 91 and is the only vocabulary documents and quotes share._

## Context

The library index filtered by `domain`. Measuring it while unifying the index (0008) showed the facet was mostly empty and partly broken:

- **25 of 110 documents** carry a `domain` at all.
- Of its nine distinct values, **three are template junk** leaking from placeholder frontmatter — `<primary domain or cross>` and a value with an inline `#` comment. Those were rendering as clickable filter pills.
- `domain` is also derived rather than authored for source files: the embed pipeline resolves it from `tradition` via `tradition-domain.ts`, defaulting to `uncategorized`.

`tradition`, meanwhile, is present on **91 of 110** documents and **51 of 178** quote buckets — and it is the only vocabulary the two content kinds share. Quotes have no `domain` concept at all.

That last point is what made it decisive. A unified index needs one facet spanning both kinds. Filtering on `domain` would have meant quotes are never filterable; filtering on `tradition` means "stoicism" returns *Meditations* and Marcus Aurelius' quotes together, which is the behaviour the unified index exists to provide.

## Decision

`tradition` is the facet for the library index, falling back to `domain` only where a document has no tradition.

Values are **normalized to lowercase** when building the pill set, so frontmatter written as "Buddhism" and a synthesized "buddhism" do not become two pills.

Template junk is filtered out: any candidate containing `<` or `#`, or longer than ~40 characters, is not a facet.

`domain` keeps its other jobs — it drives node colouring in the constellation and remains in chunk metadata. This decision is about the browse facet only.

## Consequences

- Filter coverage rises from 25/110 to 91/110 documents, plus 51/178 quote buckets.
- One facet spans both content kinds, which is what makes the unified index coherent rather than merely combined.
- The pill row stops advertising `<primary domain or cross>` as a category.
- **The junk filter is a symptom bandage.** The real problem is placeholder frontmatter committed into the corpus; the filter stops it reaching the UI but does not fix the documents. Worth a cleanup pass.
- 19 documents still have no tradition and are unreachable by facet, findable only by search. Better than 85 unreachable, not yet good.
- Two related fields now exist with different jobs — `tradition` for browsing, `domain` for graph colouring — and someone will eventually wonder why. That is what this record is for.

## Alternatives considered

- **Keep `domain` and backfill it across the corpus.** Rejected: it is derived from `tradition` for source files anyway, so backfilling means authoring a second field that a script already computes. And quotes have no domain to backfill.
- **Show both facets as separate pill rows.** Rejected: two filter rows for one corpus, one of which is 77% empty, is a worse browse experience than one that works.
- **Use `category` instead.** Rejected: `category` is a taxonomic tag on quotes (`insight`, `spirit`) and a directory name on documents (`sources`, `guides`). Same field name, incompatible meanings — it would look unified and behave arbitrarily.
