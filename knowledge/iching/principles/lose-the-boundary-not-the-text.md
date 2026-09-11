---
id: lose-the-boundary-not-the-text
title: "When extraction degrades, lose the structure before the words — and name what was lost"
status: active
since: 2026-09-11
trigger: "a parser cannot find a marker it expected, and you are choosing between dropping the block and keeping it unsegmented"
applies: [tooling, sources]
evidence:
  - "../sources/PROVENANCE.md#legge-1882--the-yî-king"
  - "../sources/PROVENANCE.md#harlez-1889--le-yih-king"
  - "../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11"
check: xenso:import-iching
supersedes: []
---

# When extraction degrades, lose the structure before the words — and name what was lost

**The rule.** Where a scanned marker cannot be read — a paragraph number, a section heading, a line label — **keep the text and lose the boundary**, and record in the file that the boundary is missing. Never discard a block because its label was unreadable, and never invent the label to keep the shape tidy.

**When it fires.** At every `if (!match) continue` in an extractor, and whenever an expected count comes up short.

---

## Why this holds

**The words and the markers fail independently, and the words fail far less.** A paragraph of prose has enormous redundancy — a reader recovers `frults` as *faults* without effort. A numeral or a label has none: it is two or three characters with no context, and when it goes it goes completely. So an extractor keyed on markers is keyed on the most fragile thing on the page, and will throw away sound text for want of a broken label.

**A missing boundary is a recoverable defect; missing text is not.** A run-on paragraph can be split by a later reader, by a later pass, or by a better scan. Text dropped in an early extraction is simply gone, and nothing downstream can tell it was ever there — which is the second half of the rule, because **an unrecorded loss is indistinguishable from a source that never had the thing.**

**The count is what makes the difference visible.** Legge prints six numbered paragraphs per hexagram; McClatchie names six lines; the Zhouyi has six line texts. Writing the number found into the file turns a silent degradation into a fact a reader can act on: `lines_found: 5` says *look at the scan for this one*, where an unmarked five-paragraph file says nothing at all.

**And the alternative — filling the gap — is a different and worse failure.** The trigrams behind McClatchie's unreadable `(E)` figures are known from this project's own table and could be supplied exactly. They are not: see [[never-supply-what-the-source-withheld]]. Keeping the text and marking the gap is the only move that neither loses evidence nor manufactures it.

---

## The cases

**Legge, hexagram 39.** A numeral the scanner could not read, so one paragraph runs on into the next; the file carries `incomplete:` saying exactly that, and the run output names it. → [PROVENANCE](../sources/PROVENANCE.md#legge-1882--the-yî-king)

**de Harlez, hexagrams 49, 59 and 62.** The `Texte II.` heading was lost outright, so the line texts had been filed as commentary. They were recovered on the rule that three ascending ordinals in a row is a line-text run, and the three files carry `recovered_by:` marking the assignment as a guess about the layout rather than about the words. → [PROVENANCE](../sources/PROVENANCE.md#harlez-1889--le-yih-king)

**McClatchie, twenty-four of sixty-four.** A line label lost, so that line's text runs on into the one before it; `lines_found:` in every file, and the twenty-four named in the run output. **No text is lost, only a boundary** — which is the sentence the whole principle compresses to. → [PROVENANCE](../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11)

---

## Where it does not fire

**A block that is genuinely not part of the text still goes.** Running heads, folio numbers, printer's signature marks and the scanner's own watermark are not degraded text and keeping them is not conservatism.

**Nor does it override a refusal to write a partial set.** Losing a boundary inside a unit is tolerable; being unable to locate the units at all is not, and there the importer should stop rather than write a set with a hole in it.

**And it does not apply to the primary text.** `../sources/zhouyi/` is checked to 384 of 384 line values. Tolerance is for the reference tier, where the reader has been told the grade.

---

## What it obliges

1. **Keep the text under the nearest preceding marker** rather than dropping it.
2. **Write the count into the file** — `lines_found:`, `paragraphs:`, `incomplete:` — so the degradation travels with it.
3. **Name the affected units in the run output**, so a proofreading pass has a worklist.
4. **Mark any recovered boundary as recovered**, and say by what rule.
