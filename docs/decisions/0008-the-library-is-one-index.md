# 0008 — The Library is one index: documents and quotes are shapes, not places

**Date:** 2026-08-22 · **Status:** Accepted · **Relates to** 0007, 0014

_Differing card designs are a presentation problem; solving them by giving quotes their own route siloed the corpus and made a search for "einstein" return nothing while eleven Einstein quotes sat one URL away._

## Context

Quotes are YAML records with a provenance block. Documents are markdown with frontmatter. Two shapes, two readers — `lib/quotes.ts` and `lib/knowledge.ts` — which is correct at the data layer.

That difference was then allowed to propagate upward. Quotes got their own route, their own browser component, and their own index page, because a quote tile and a document tile do not look alike. No one decided the corpus should have two rooms; a parsing detail decided it.

The cost was concrete and user-visible: **searching "einstein" on the library returned zero results** while `knowledge/quotes/albert-einstein.yaml` held eleven quotes one route away. The two browsers had also drifted into near-clones — byte-identical pill and card class strings — and the library index page already imported both readers, rendering quotes as a teaser card instead of merging them. The merge point existed and was unused.

Investigating surfaced that the silo was the smaller half of the problem. The document filter searched `title`, `summary`, `tags`, `domain` — **not `author`**, which the card nonetheless rendered. So "hesse" failed too, quotes or no quotes.

## Decision

One index over the whole corpus. `apps/web/lib/library.ts` composes both readers into a single `LibraryItem` list, and one `LibraryBrowser` renders a document card or a quote card by switching on `kind`. **The card varies; the architecture does not.**

Granularity: one card per author or collective, not per quote. 349 quotes against 110 documents would swamp the grid, and "Albert Einstein · 11 quotes" is the right-sized peer to a document.

`/library/quotes` survives as a **filtered view** of the same index — a useful deep link and the natural home for provenance framing — not as a separate collection.

Deliberately a *new* aggregator rather than an extension of `getAllDocs()`: that function's other consumer is `generateStaticParams()` for the `[...slug]` catch-all, and feeding it quote pseudo-documents would pre-render `/library/quotes/*` through the catch-all, where `getDoc()` returns null and collides with the real static routes.

## Consequences

- One search covers the corpus. "stoicism" returns *Meditations* and Marcus Aurelius' quotes together.
- `author` is searchable, fixing a bug that predated quotes entirely.
- The count line has to handle mixed units honestly — "110 works · 178 quote sources" — because a single number that reads as 178 quotes when it means 178 authors is a subtler lie than the silo.
- Merging 178 quote sources into a 110-card index roughly triples the searchable data, which forced the payload to be thought about rather than assumed (metadata inline, quote full-text lazily fetched on first focus of the search box).
- Two shapes still exist at the data layer, and should. The lesson is that a data-layer difference is not a reason for an information-architecture difference.

## Alternatives considered

- **Keep the separate routes and cross-link them.** Rejected: a link does not fix search, which is how people actually find things. The reported failure was a search returning nothing.
- **One card per quote rather than per author.** Rejected: 349 quote tiles against 110 documents makes the index a quote wall, and the author card is the natural peer to a document.
- **Unify by adding `quotes` to `BROWSABLE_DIRS`.** Rejected — it breaks static generation via the catch-all collision described above. This is the one implementation route that looks obvious and must not be taken.
- **Delete `/library/quotes` now that quotes appear in the main index.** Rejected: it is a legitimate filtered view and the right place to explain provenance, which would clutter the general index.
