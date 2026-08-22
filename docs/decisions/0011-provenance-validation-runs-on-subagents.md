# 0011 — Provenance validation runs on subagents, not the API

**Date:** 2026-08-20 · **Status:** Accepted · **Relates to** 0003

_The API driver cost ~$20 per 10 quotes and stalled the pipeline for three months; Claude Code subagents do the same work under the subscription, writing the identical checkpoint format so either driver remains valid._

## Context

0003 made validation a prerequisite for the corpus being useful. Stage 3 was built as an API driver — batches of ten quotes through the Anthropic SDK, web search enabled, high effort — and the pilot run cost roughly **$20 for 10 quotes**. Extrapolated across 1,463 pending records that is about **$2,900**, against a budget of $50–150.

The pipeline stopped there and stayed stopped for three months. The recorded reason was a sequencing choice — resume once the constellation ships — but the sequencing condition was met on 2026-08-15 and nothing resumed. The real blocker was cost, and the fix (drop web search, use training knowledge only) had been written into the plan in May and never applied to the code.

Compounding it: the pilot's own ten verdicts were never merged. Three months of paid-for output sat on disk because the merge step was never run against the checkpoint.

Web search was where the money went, and it was also not needed. Provenance assessment is largely a recall task — a model either knows that "We are what we repeatedly do" is Will Durant paraphrasing Aristotle, or it honestly does not. Searching to confirm what the model already knows is expensive, and searching to discover what it does not know produces exactly the confident-but-wrong citations the corpus exists to prevent.

## Decision

Run validation through Claude Code subagents rather than the API. `scripts/normalize-quotes/02b-checkpoint.ts` queues batches as input files, fans them out to subagents, and takes verdicts back.

**The checkpoint format is unchanged**, so `03-merge-validation.ts` consumes either driver's output without knowing which produced it, and the original API driver stays valid for anyone who wants it.

Two design choices earned their keep immediately:

- **Resume state is derived from which quote ids already have a verdict**, not from a batch counter. Tranches can be resized, re-run, or abandoned midway with no bookkeeping.
- **Ingest is all-or-nothing per file.** One malformed verdict rejects the whole file and leaves that batch queued, rather than half-writing a checkpoint.

`VALIDATION_PROMPT.md` carries the pilot's tuned wording — status vocabulary, confidence ladder, no-fabrication rules — with web search removed and an explicit instruction that a low-confidence honest verdict is a success while a fabricated citation is a failure.

## Consequences

- All 1,509 quotes were validated. Cost fell from a projected ~$2,900 to subscription-covered.
- **The design absorbed real failure.** The org spend limit killed roughly a third of agents mid-run across six tranches. Not one batch of work was lost, because agents write their verdict file before composing their final message and ingest validates whole files.
- Quality held. The pass correctly caught Hafiz→Ladinsky, "We are what we repeatedly do"→Will Durant, the eight "Gandhi" seven-social-sins fragments→Frederick Lewis Donaldson's 1925 sermon, and two "Sagan" lines as *Contact* screenplay dialogue.
- Orchestration is manual — a person runs the tranches. This is not a cron job, and it should not become one without reconsidering the cost model.
- Without web search, a confidently-wrong citation from training memory is the residual risk. Mitigated by the fabrication ban in the prompt, the 0.8 promotion bar, and human review of everything flagged (0013).

## Alternatives considered

- **Keep the API driver, drop web search and lower effort.** Not rejected — retained as `02-validate-provenance.ts` and still valid. Subagents were chosen because they are subscription-covered, and the identical checkpoint format means this was never an exclusive choice.
- **Keep web search for accuracy.** Rejected: it was the cost, and it invites the model to construct citations rather than report what it reliably knows.
- **Validate on demand, as quotes are cited.** Rejected: it puts a slow, failure-prone step in the chat request path and leaves the corpus permanently unvalidated.
- **Ship unverified and caveat.** Rejected by 0003.
