---
id: a-grade-must-be-testable
title: "A provenance grade the importer cannot test is a claim, not a grade"
status: active
since: 2026-09-11
trigger: "you are about to mark a vendored file as proofread, verified, complete or authoritative"
applies: [sources, tooling]
evidence:
  - "../sources/PROVENANCE.md#legge-1882--the-yî-king"
  - "../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11"
check: xenso:import-iching
supersedes: []
---

# A provenance grade the importer cannot test is a claim, not a grade

**The rule.** Where vendored files carry grades — proofread against OCR, complete against partial, verified against assumed — the importer must **test the grade it is about to write** and demote anything that fails. A grade asserted from where the file came from is a claim about a source, not a fact about a file.

**When it fires.** Whenever a `transcription:`, `status:` or coverage field is about to be set, and whenever a source is described as better than another.

---

## Why this holds

**A file that looks proofread and is not is more dangerous than a file that is obviously OCR.** Damaged OCR announces itself: a reader meets `Dingram` and `frults` and calibrates accordingly. A page carrying a proofread badge is read at face value, and an error in it propagates with the badge's authority attached. **The grade is a promise to a later reader, and an untested promise is worse than none.**

**Provenance is a property of the channel; quality is a property of the artefact**, and the two come apart. English Wikisource's mainspace is genuinely a human-proofread channel. One of its pages was nonetheless a broken transclusion returning a fragment of the translation plus the *neighbouring hexagram's* footnote — and nothing about its provenance would have caught that. Only counting what came out did.

**The test can be cheap and still be decisive.** Legge prints six numbered paragraphs per hexagram and seven for the first two. Requiring exactly that of a "proofread" page is three lines of code, and it is what demoted hexagram 32 to the OCR grade rather than shipping it as the best-graded file in the set.

**And where grades differ, the better one is also the measuring stick for the worse.** Running the OCR extractor over the stretch where a proofread answer already existed produced a number — 99.3% word agreement — before it was trusted with the stretch where none did. The grade was earned rather than asserted.

---

## The cases

**Legge 1882 is vendored at two grades, and hexagram 32 was demoted between them.** Its English Wikisource page looks finished and is not; the importer now requires every proofread page to yield its full paragraph count, and anything short falls back to the scan. → [PROVENANCE](../sources/PROVENANCE.md#legge-1882--the-yî-king)

**McClatchie's grade is the lowest here and is stated in every file.** A scan of a photo-reproduction, OCR'd locally; 40 of 64 sections yield all six line paragraphs, and each file carries `lines_found:` and `sections:` saying exactly what it has. → [PROVENANCE](../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11)

---

## Where it does not fire

**Rights are not a grade.** Whether a file may be here is settled by `../sources/PROVENANCE.md`'s admission rules and is a separate question from whether it came out intact. A perfectly clean transcription of something inadmissible is still inadmissible.

**And a grade with genuinely nothing to test against is written as such.** Where no expected shape exists, say so in the frontmatter rather than inventing a check to have one — the parent's `evidence-gate` rule, that a gate which cries wolf is not a gate.

---

## What it obliges

1. **Write the test before the badge.** If you cannot say what a well-formed file of this kind looks like, you cannot grade it.
2. **Demote automatically.** A failing file changes grade in the importer, not in a note asking someone to remember.
3. **Put the grade in the file**, not only in the documentation, so it travels with the text.
4. **Score one grade against another wherever both exist**, and publish the number.
