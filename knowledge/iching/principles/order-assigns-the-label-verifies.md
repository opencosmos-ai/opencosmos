---
id: order-assigns-the-label-verifies
title: "Where the label is the damaged thing, order assigns and the label checks"
status: active
since: 2026-09-11
trigger: "a source carries both a position and a printed identifier, and you are about to key your data off the identifier"
applies: [tooling, sources]
evidence:
  - "../sources/PROVENANCE.md#harlez-1889--le-yih-king"
  - "../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11"
check: xenso:import-iching
supersedes: []
---

# Where the label is the damaged thing, order assigns and the label checks

**The rule.** When a source gives both a sequence and a printed identifier for each unit, work out which of the two the damage falls on. Where it falls on the identifier — as it usually does — **assign by position and use the identifier to verify the assignment**, then report the disagreements rather than resolving them.

**When it fires.** On every import from a scan, and on any source whose section numbers, chapter numbers or ids come through an unreliable channel.

---

## Why this holds

**Printed numerals are the most fragile thing on a scanned page and the most trusted thing in a parser.** They are short, so there is no redundancy to recover from; they are set in a display face, so they carry unusual glyphs; and they sit alone at the top of a page, so there is no surrounding word to disambiguate them. A page of prose survives a bad scan legibly. The number at its head does not.

**Order, by contrast, cannot be damaged by a scanner.** Page 132 follows page 128 whatever the ink says. In a printed book the sequence of sections is the one piece of structure that is physically guaranteed, and it is normally thrown away in favour of the numbers — which is exactly backwards.

**Inverting the two turns a parse into a check.** Once position does the assigning, every readable identifier becomes a free assertion to test: *"this should be hexagram 46; the page says 1G."* Fifty-seven agreements out of sixty-four is a measurement of the scan's quality, reported in the run output. Under the usual arrangement the same seven misreadings would have been seven silently misfiled hexagrams.

**And it fails loudly rather than quietly.** Position-based assignment is only valid if the count is right, so the importer can refuse outright — *"found 60 of 64 section openings, refusing to assign hexagrams by an order that is not the book's."* An identifier-keyed parser has no equivalent moment; it simply writes what it found.

---

## The cases

**de Harlez 1889.** The scan renders `Koua LIII.` as `LLLI`, and spaces others apart as `XL VI.` The sixty-four headings are taken in document order; **63 of 64 numerals decode and agree with their position**, and the one that will not decode falls back to position and is named in the run report. → [PROVENANCE](../sources/PROVENANCE.md#harlez-1889--le-yih-king)

**McClatchie 1876.** Worse: hexagram 7 prints as `E.`, 9 as `De`, 46 as `1G.`, 64 as `GI.` Sections are located in page order; **57 of 64 printed numbers agree**; the four that disagree are named, and three sections that lost their heading entirely were found by the one thing every section does — its paragraph numbering restarting at 1. → [PROVENANCE](../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11)

---

## Where it does not fire

**Where the identifier is the more robust channel, keep it.** The Chinese Wikisource pages are addressed by hexagram name in the URL, which arrives over HTTP intact; there is no scanner between us and it, and nothing is gained by pretending otherwise.

**And order is only usable where it is complete.** If the count cannot be established — a volume missing pages, a partial run — position assigns nothing, and the honest move is to refuse. This is not a licence to infer a sequence that is not fully present.

**It says nothing about content.** Locating a section supplies no words; see [[never-supply-what-the-source-withheld]] for the line this must not cross.

---

## What it obliges

1. **Establish the count first**, and fail if it is wrong, before any assignment happens.
2. **Report the agreement rate** — it is a measurement of the source's condition and belongs in the run output.
3. **Name every disagreement**, with the page and what it printed, so a later reader can check the ones most likely to be wrong.
4. **Record in the file** which units were placed by position rather than confirmed by their own number — `located_by:` in the frontmatter.
