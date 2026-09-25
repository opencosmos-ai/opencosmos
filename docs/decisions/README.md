# Decisions (ADRs)

**Why we chose what we chose.** Numbered, dated, append-only. Never edit a decision — supersede it with a new one and link back.

Format: `NNNN-short-slug.md` · Status: Proposed | Accepted | Superseded by NNNN · Structure: Context → Decision → Consequences → Alternatives considered

Write one when a decision is expensive to reverse, constrains future work, or has non-obvious rationale — especially when the code alone would read as arbitrary. Not every choice; only the load-bearing ones. Reasoning about a specific change belongs in [CHANGELOG.md](../../CHANGELOG.md); plans in flight belong in [pm.md](../pm.md).

Start with [0001 — Adopt Architecture Decision Records](0001-adopt-architecture-decision-records.md), which covers the purpose, conventions, and structure in full.

## Index

<!-- adr-index:start -->

| # | Decision | Status | |
|---|---|---|---|
| [0001](0001-adopt-architecture-decision-records.md) | **Adopt Architecture Decision Records** | Accepted | Records why load-bearing choices were made, so they survive the session that made them and are not undone by someone who cannot see the reason. |
| [0002](0002-corpus-paths-and-library-urls-are-separate-namespaces.md) | **Corpus paths and library URLs are separate namespaces** | Accepted | The `knowledge/` prefix and the `/library` URL look inconsistent and are not: the corpus path is an identifier baked into stored data, and renaming it would break every citation Cosmo has ever emitted. |
| [0003](0003-verification-first-only-verified-provenance-enters-the-corpus.md) | **Verification-first: only verified provenance enters the corpus** | Accepted | Unverified attributions never reach the index, because an AI whose authority rests on honesty cannot be allowed to launder a misattribution — even with a caveat attached. |
| [0004](0004-upstash-vector-as-the-retrieval-substrate.md) | **Upstash Vector as the retrieval substrate** | Accepted | One serverless vector index for the whole corpus, addressed by corpus path, because documents already live in git and the only thing missing was search. |
| [0005](0005-the-ai-triad.md) | **The AI Triad: Sol, Socrates, Optimus, with Cosmo moderating** | Accepted | Three distinct cognitive stances in tension produce richer responses than one blended voice, and Cosmo moderates the exchange rather than joining it. |
| [0006](0006-kaizen-lessons-always-on-exemplars-few-shot.md) | **Kaizen: lessons always-on, exemplars few-shot** | Accepted | Cosmo's learning is a human-in-the-loop policy update, not training: lessons are injected into every turn to set a floor, curated exemplars set the ceiling, and both are deterministic rather than retrieved. |
| [0007](0007-two-pool-quote-architecture.md) | **Two-pool quote architecture** | Accepted | Unverified quotes live outside the corpus categories entirely, so they cannot leak into the index by accident rather than by policy. |
| [0008](0008-the-library-is-one-index.md) | **The Library is one index: documents and quotes are shapes, not places** | Accepted | Differing card designs are a presentation problem; solving them by giving quotes their own route siloed the corpus and made a search for "einstein" return nothing while eleven Einstein quotes sat one URL away. |
| [0009](0009-constellation-as-its-own-package.md) | **`@opencosmos/constellation` as its own package** | Accepted | The obvious graph library is non-commercial licensed, so the constellation is built on its MIT-licensed engine and published as a reusable primitive rather than buried in the design system. |
| [0010](0010-stable-quote-ids-over-semantic-slugs.md) | **Stable `q_NNNN` quote ids over semantic slugs** | Accepted | Quote ids are opaque and permanent because they appear in citations Cosmo has already emitted into conversations that cannot be rewritten. |
| [0011](0011-provenance-validation-runs-on-subagents.md) | **Provenance validation runs on subagents, not the API** | Accepted | The API driver cost ~$20 per 10 quotes and stalled the pipeline for three months; Claude Code subagents do the same work under the subscription, writing the identical checkpoint format so either driver remains valid. |
| [0012](0012-the-quote-pools-are-canonical.md) | **The quote pools are canonical; the source JSONL is history** | Accepted | Once every quote carried a provenance verdict, the original import stopped being the source of truth — and the script that rebuilds from it became the most dangerous command in the repository. |
| [0013](0013-human-review-is-scoped-to-contested-attributions.md) | **Human review is scoped to contested attributions** | Accepted | An untraceable proverb at 0.2 confidence is correctly described, not a defect awaiting triage — so review covers only the records where the validator asserts an attribution is wrong. |
| [0014](0014-tradition-not-domain-is-the-corpus-facet.md) | **Tradition, not domain, is the corpus facet** | Accepted | `domain` is set on 25 of 110 documents and leaks template placeholders into the filter pills; `tradition` covers 91 and is the only vocabulary documents and quotes share. |
| [0015](0015-promoted-quotes-cite-their-source-work.md) | **Promoted quotes cite their source work** | Accepted | The constellation's `quote → work` edge had never fired once because the emitter hardcoded `source_work: null`; resolving it requires the work's title **and** its author to agree, because a wrong edge is worse than no edge. |
| [0016](0016-the-i-ching-is-read-through-the-wings-and-the-lens-is-declared.md) | **The I Ching is read through the Wings, and the lens is declared** | Accepted | Fixes which book `iching/` is translating, and requires the interpretive lens to be stated in the front matter rather than operating invisibly. |
| [0017](0017-a-translation-and-its-interpretation-are-two-documents.md) | **A translation and its interpretation are two documents** | Accepted | Patañjali enters the corpus twice — Woods's translation and Johnston's interpretation, each declaring what it is — because collapsing them would either import a lens silently or throw away the document that carries it. |
| [0018](0018-the-commons-and-the-applications-live-in-separate-repositories.md) | **The commons and the applications live in separate repositories** | Accepted | Six repositories, split by **rights and invitation** rather than by topic — because what someone may read, cite, fork and contribute to is a different question from what happens to be convenient to build together. |
| [0019](0019-one-application-lives-at-the-repository-root.md) | **One application lives at the repository root** | Accepted | This repository holds one application, so the application is the repository. `apps/web/` moves to the root, and the monorepo shell around it (turbo, the pnpm workspace, a second `package.json`) is removed. |

_19 records. Generated by `pnpm adr:index` — edit the ADRs, not this table._
<!-- adr-index:end -->
