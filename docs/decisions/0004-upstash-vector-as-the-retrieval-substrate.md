# 0004 — Upstash Vector as the retrieval substrate

**Date:** 2026-03-10 · **Status:** Accepted · **Relates to** 0002

_One serverless vector index for the whole corpus, addressed by corpus path, because documents already live in git and the only thing missing was search._

## Context

The corpus is markdown and YAML in git. Git handles versioning, review, and history well; it cannot do semantic retrieval. The gap was narrow and specific: an index that answers "what in the corpus is relevant to this question," nothing more.

That framing rules out most of the category. A general-purpose database would mean running and paying for infrastructure to duplicate storage git already provides. The requirement was a vector index that could be rebuilt from the repository at any time, treated as derived state rather than a system of record.

Cost shape mattered for a self-funded project: fixed monthly infrastructure is a standing liability, while pay-per-query tracks actual use and stays near zero while the audience is small.

## Decision

Use Upstash Vector as the single retrieval substrate for the corpus, with embeddings generated server-side by the index rather than in the application.

Chunk ids are corpus paths — `knowledge/sources/x.md#section-slug`, `knowledge/quotes/y.yaml#q_0003` — which is what makes 0002 load-bearing and what lets the embed pipeline reconcile: list every id in the index, diff against the corpus, delete what no longer exists. Renames and deletions stay correct without manual cleanup.

[`scripts/knowledge/embed-knowledge.ts`](https://github.com/opencosmos-ai/knowledge/blob/main/scripts/knowledge/embed-knowledge.ts) in [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge) is the corpus's only writer, run there with `npm run embed`. Cosmo's kaizen vectors are written by [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo) under the `kaizen/` prefix; each side reconciles only the prefixes it owns. The index is derived state, rebuildable from those repositories.

## Consequences

- Free tier covers a curated corpus, and pay-per-query scales with a self-funded project. Serverless and Vercel-native, so there is no instance to operate.
- The index can be wiped and rebuilt from git at any time. Nothing of record lives only in Upstash.
- Deletions and renames are handled by reconciliation rather than remembered by hand.
- **A daily write cap exists and is reachable.** Re-embedding the full corpus is roughly 4,000 writes; three runs in a day hit the 10,000/day ceiling and fail mid-upsert. The failure is safe — it aborts before reconciliation, leaving the previous index intact — but it means bulk re-embedding needs pacing, and any change that alters every chunk id (see 0002) costs a delete plus an insert for each.
- The constellation's semantic edges query this same index, so the graph and RAG share one substrate rather than maintaining two.

## Alternatives considered

- **A self-hosted vector database.** Rejected: fixed cost and operational burden to duplicate storage git already provides, for a corpus small enough not to need it.
- **Postgres with pgvector.** Rejected for the same reason — it implies running a database whose only job is an index that can be regenerated on demand.
- **Client-side or in-memory search.** Rejected: the corpus includes book-length sources, and retrieval has to work from a serverless function without loading the whole corpus per request.
- **Storing documents in the vector store as the system of record.** Rejected. Documents belong in git, where they can be reviewed and diffed. The index holds only what is needed to find them.
