# 0013 — Human review is scoped to contested attributions

**Date:** 2026-08-21 · **Status:** Accepted · **Relates to** 0003, 0011

_An untraceable proverb at 0.2 confidence is correctly described, not a defect awaiting triage — so review covers only the records where the validator asserts an attribution is wrong._

## Context

Validation produced 1,509 verdicts. Roughly 1,160 sit below the promotion bar. The original Stage 4 plan was to export everything below the bar for human review, estimated at 45–60 minutes.

That framing treats low confidence as a backlog. It is not. Most of those records are traditional sayings, aphorisms, and widely-circulated lines with no traceable origin — and `attributed_unverified` at 0.15 is the *correct and final* description of them. There is no decision to make. Reviewing them would mean confirming, hundreds of times, that something untraceable is untraceable.

The records that genuinely need a person are the ones where the validator makes a positive claim about the attribution being wrong: this is misattributed, this is apocryphal, this belongs to someone else. Those carry consequences — a quote gets dropped, or moves to a different author — and they rest on model judgment that deserves a human check.

Volume settled it. The wide net is ~1,160 rows of mostly-nothing; the narrow net is 197, of which 128 name a specific alternative author.

## Decision

Review covers only records where the validator asserts the attribution is wrong:

- `status ∈ {likely_misattributed, apocryphal}`, or
- any record carrying a `suggested_reattribution`

`04-export-review-csv.ts` emits that set; `--all` widens to everything below the bar for anyone who wants the full sweep. `05-apply-review.ts` applies one of three decisions:

- **keep** — mark `reviewed_by_human`, leave status and pool as they are. The doubt is real and stays recorded; the record simply stops reappearing in future exports.
- **drop** — status becomes `rejected` and the record moves to `_archive/rejected.yaml`, kept as a tombstone so a dropped quote is never silently re-imported.
- **reattribute** — new author, re-keyed, original recorded in the notes, marked reviewed. That clears the promotion bar, so the next `quotes:promote` routes it to the right file.

Reattribution suggestions are read from the **checkpoint**, not `pending.jsonl`: the merge step folds them into notes as prose, while the checkpoint keeps the structured value.

## Consequences

- Review is roughly 197 decisions rather than 1,160, which is the difference between a sitting and a project — and a review that gets done beats a thorough one that does not.
- Low-confidence records stay pending indefinitely, which is their correct resting state, not an unfinished queue.
- A dropped quote leaves a tombstone rather than a hole. Re-importing cannot silently resurrect it.
- **Model judgment gates what a human sees.** If the validator failed to flag a misattribution, it never reaches review. The 0.8 promotion bar is the backstop, and it is not perfect — a confidently-wrong `attributed` at 0.85 would pass both.
- `keep` deliberately does not promote. A flagged record marked reviewed stays out of the corpus; the review confirms the doubt rather than resolving it.

## Alternatives considered

- **Review everything below the promotion bar.** Rejected: ~1,160 rows, the large majority of which need no decision. It converts a focused judgment task into an endurance one, and endurance tasks do not get finished.
- **Review nothing; trust the promotion bar.** Rejected: reattributions and apocryphal calls are exactly where a wrong model judgment does visible damage — dropping a real quote, or moving one to the wrong author.
- **Have the model apply its own reattributions automatically.** Rejected. The suggestions in this corpus were largely correct, which is precisely why the failures would be hard to notice. A wrong reattribution is worse than the original error because it looks researched.
