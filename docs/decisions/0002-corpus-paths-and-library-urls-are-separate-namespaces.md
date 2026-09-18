# 0002 — Corpus paths and library URLs are separate namespaces

**Date:** 2026-08-22 · **Status:** Accepted · **Relates to** 0004, 0008

_The `knowledge/` prefix and the `/library` URL look inconsistent and are not: the corpus path is an identifier baked into stored data, and renaming it would break every citation Cosmo has ever emitted._

## Context

The corpus is addressed as `knowledge/`. The pages that serve it live at `/library`. A reader encountering both will reasonably assume someone forgot to finish a rename, and will be tempted to finish it.

They are not the same kind of thing. A corpus path is an **identifier**, not a location:

- It keys every vector in Upstash. Chunk ids are literally `knowledge/quotes/mary-oliver.yaml#q_0003` — the whole index is addressed by corpus path.
- It is the vocabulary of Cosmo's citation tokens. `[ref: knowledge/sources/x.md#slug]` and `[quote: knowledge/quotes/y.yaml#q_0003]` are stored **verbatim** in every past conversation and every public share link.
- It keys the constellation's graph nodes, including the seeded layout positions carried between runs.

A URL is just where a reader goes.

This distinction is what made renaming `/knowledge` to `/library` safe. Citations are resolved to URLs at *render* time by `apps/web/lib/corpus-href.ts`, so every historical conversation and share link healed automatically the moment the URL changed — no migration, no dual-routing, no dead links. Stored tokens hold corpus paths, not URLs, precisely so the reader-facing surface can move without touching history.

Renaming the corpus directory attacks that same property from the other side. Every chunk id changes, so the embed reconciliation deletes ~4,000 vectors and re-upserts ~4,000 replacements. Worse, the citation vocabulary either stops matching the directory — a deeper incoherence than the one being fixed — or changes, breaking every token already sitting in conversation history unless dual-prefix support is carried forever.

There is also a scoping reason the names should differ. `knowledge/` is a superset of what the Library shows: it covers `incoming/` (unreviewed staging) and `data/quotes-pending/` (records that have not cleared provenance), neither of which appears at `/library`. Naming it `library/` would assert an equivalence that is false and make `library/incoming/` read as a promise the Library does not keep.

## Decision

Treat these as two namespaces with different lifetimes and different owners.

| Namespace | Example | May change |
|---|---|---|
| **Corpus path** — on disk, in citation tokens, in chunk ids, in graph node ids | `knowledge/sources/x.md#slug` | No |
| **Library URL** — where a reader goes | `/library/sources/x#slug` | Yes, freely |

`apps/web/lib/corpus-href.ts` is the single translation layer between them, shared by the chat renderer, the constellation, and the library index so all three agree. Changing the reader-facing base is a one-constant edit there.

When searching for URLs to update, match on the **leading slash** — `'/knowledge` — never bare `knowledge`. The bare string appears in corpus paths, in the corpus repository's `scripts/knowledge/`, in `/api/knowledge/*`, and in the `/knowledge-compile` family of slash commands, none of which are URLs.

## Consequences

- **This was tested in September 2026 and held.** The corpus left the monorepo for [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge), where it *is* the repository root — so the directory named `knowledge/` stopped existing. Every chunk id still begins `knowledge/`, deliberately, and the embedder now carries an explicit `CORPUS_PREFIX` to keep it that way. Nothing re-embedded, no citation broke. A path that survives its own directory is the clearest possible demonstration that it was never a location.
- The apparent inconsistency between `knowledge/` and `/library` is permanent and intentional. This record exists so it is not repeatedly rediscovered as a bug.
- Reader-facing URLs stay cheap to change; the corpus stays stable.
- A future rename of the corpus directory is possible but is a data migration, not a rename: it requires a full re-embed and dual-prefix citation support for the lifetime of stored conversations.
- Anyone adding a third consumer of corpus paths should route it through `corpus-href.ts` rather than writing a fourth copy of the translation.

## Alternatives considered

- **Rename `knowledge/` to `library/` for consistency.** Rejected. It invalidates every chunk id and every stored citation token, and it asserts a false equivalence — the directory holds material the Library deliberately does not show.
- **Serve the corpus at `/knowledge` so both names match.** Rejected on the reader's behalf. The UI already called this "The Library" in its title, headers, and every breadcrumb; the URL was the only holdout. "Knowledge" is also overloaded here — it named the page, the corpus, and the graph.
- **Bake URLs into citation tokens instead of corpus paths.** Rejected, and this is the load-bearing one: it would have made the URL rename a migration of every stored conversation rather than a no-op.
