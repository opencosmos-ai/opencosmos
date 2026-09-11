---
id: inheriting-means-saying-where-you-differ
title: "A project that inherits a rulebook owes the record every place it differs from it"
status: active
since: 2026-09-11
trigger: "you are writing a rule for this project that is stricter, looser, or otherwise unlike the one it inherits"
applies: [process, sources]
evidence:
  - "../README.md#legge-1882--a-reference-read-with-the-overlay-in-view"
  - "../sources/PROVENANCE.md#the-admission-rules"
check: none
supersedes: []
---

# A project that inherits a rulebook owes the record every place it differs from it

**The rule.** This project takes the Tao Te Ching project's method, principles and admission rules as its own. Wherever it departs from them — tighter, looser, or merely different — **the departure must be stated as a departure, with its reason.** An unmarked difference is not a local adaptation; it is a second rulebook growing quietly beside the first.

**When it fires.** Whenever a rule is written here that has a counterpart over there.

---

## Why this holds

**Inheritance is the whole reason this project can move fast**, and it only works if the two rulebooks can be compared. The moment a difference goes unrecorded, nobody can tell whether a rule here is the parent's, an adaptation of the parent's, or something invented locally and never examined — and the parent's rule then can't be improved without silently breaking something here.

**An unmarked difference is usually a mistake rather than a decision.** The costly case was in this directory's own README, which argued that Legge's *I Ching* was ruled out as a source. The parent's `process/method.md` § 3 says the opposite in terms — *"consult sources for meaning, never for phrasing"* — and names Legge explicitly among the pre-1931 translations in scope. **He was never excluded there. He was excluded here by a rule this directory invented for itself and did not notice it was inventing.**

**Stricter is not automatically safer.** That invented rule cost the project its only English cross-check for months, in a field where every witness is missionary work — see [[no-neutral-witness]]. Extra strictness has a price, and the price is only visible when the difference is on the record where someone can weigh it.

**Where a difference *is* deliberate, saying so makes it defensible.** The admission rules here permit vendoring old translations, where the parent consults them and never vendors. That is a real departure with a real reason — three candidates rather than eight, none neutral, so putting the overlay on the page labelled beats consulting it from memory. Written down, it is a decision. Unwritten, it would look like drift.

---

## The cases

**The Legge reversal**, which states plainly that the old stance *"was stricter than the parent project's own rule, without saying so"* and quotes the parent's rule against it. → [README](../README.md#legge-1882--a-reference-read-with-the-overlay-in-view)

**The admission rules**, which carry an explicit *"one difference from the parent project"* paragraph covering the vendoring of translations. → [PROVENANCE](../sources/PROVENANCE.md#the-admission-rules)

---

## Where it does not fire

**Subject matter is not a difference.** An I Ching watchlist entry for 君子 (*jūnzǐ*) is new material, not a departure — the parent has no counterpart because its text does not use the word.

**And a difference in the same direction as the parent's reasoning is still a difference.** Tightening because this book is harder is fine; tightening silently is not.

**It does not require re-deriving the parent's arguments.** Link and move on; this directory's first rule is not to restate the twenty-seven.

---

## What it obliges

1. **Before writing a rule here, look for its counterpart over there** — and link to it if one exists.
2. **Mark every departure in the file that carries it**, in the section where it applies, not in a change log.
3. **Give the reason in terms of this book**, not in terms of preference.
4. **When a departure turns out to be an accident, print the correction beside it** rather than editing it away.
