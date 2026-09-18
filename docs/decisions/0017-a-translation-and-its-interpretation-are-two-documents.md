# 0017 — A translation and its interpretation are two documents

**Date:** 2026-09-13 · **Status:** Accepted · **Relates to** [0003](0003-verification-first-only-verified-provenance-enters-the-corpus.md), [0016](0016-the-i-ching-is-read-through-the-wings-and-the-lens-is-declared.md)

_Patañjali enters the corpus twice — Woods's translation and Johnston's interpretation, each declaring what it is — because collapsing them would either import a lens silently or throw away the document that carries it._

## Context

The Yoga Sutras arrived as Charles Johnston's 1912 *The Yoga Sutras of Patanjali: "The Book of the Spiritual Man"*. It is public domain, complete, and readable. It is also not a translation, and it does not say so on the tin.

**The lens is measurable, not a matter of taste.** Against James Haughton Woods's 1914 literal rendering for the Harvard Oriental Series:

| | Johnston 1912 | Woods 1914 |
|---|---|---|
| I.2 | "Union, spiritual consciousness, is gained through **control of the versatile psychic nature**." | "Yoga is the **restriction of the fluctuations of mind-stuff**." |
| II.30 | "The **Commandments** are these: noninjury, truthfulness… from **covetousness**." | "Abstinence from injury… and from **acceptance of gifts** are the **abstentions**." |

*Aparigraha* is non-grasping. Johnston makes it **covetousness**, a Decalogue vice, and calls the set **Commandments**; his commentary reads Patañjali through Paul at Corinth, "the Master," salvation, and eye-salve out of Revelation. This is the same phenomenon the Tao Te Ching project's overlay audit documents for Laozi, and the same category ADR [0016](0016-the-i-ching-is-read-through-the-wings-and-the-lens-is-declared.md) addresses for the I Ching: a distinguished reading that must not operate invisibly.

**Johnston is still worth having.** A 1912 Theosophist reading the sutras into Christian mysticism is a real document about a real moment in how the West received Indian philosophy. Discarding it costs the corpus something; publishing it unlabelled costs more.

**Three things about transcription were learned the hard way while settling the texts.**

**Project Gutenberg is a transcription, not the printing.** PG #2526 is the source of the Johnston file and carries **61 defects** — `Boston` for *position*, `sassing` for *passing*, `wit!` for *with*, `nom injury` for *non-injury*, a dropped `comes`, six dropped sentence periods. A word-level diff of the incoming file against PG found zero divergences; the defects were PG's all along, and only the 1912 printing revealed them.

**Two witnesses can turn out to be two books.** Settling Johnston used two independent 1912 scans, and they disagree in a way no OCR error explains. Sutra I.9 reads *"Phantasy is a fiction of mere words, with no underlying reality"* in the Library of Congress copy and *"Predication is carried on through words or thoughts not resting on an object perceived"* in the Boston Public Library copy. The LoC copy also carries expanded commentary and a closing address to the reader the other lacks. Gutenberg descends from the BPL state. Had the differences been treated as errors, the corpus would now hold a text that exists in no printing.

**The text layer is not the page.** Woods's Sanskrit is set with 1914 Harvard conventions — cedilla, underdot, macron — and **neither** OCR pass recovers any of it. One term came through as `piddha`, which is Woods's *çuddha*. No amount of cross-checking text layers finds that, because both engines fail identically. It was settled by reading seven page images.

And one guess that was wrong: `quiesence` looked like a misspelling of *quiescence* and is how the 1912 printing spells it. Both scans agree. Checking is what stopped it being "corrected" into something the book never said.

## Decision

**Both texts enter, as separate documents, each declaring what it is — and a text's transcription must declare how it was warranted.**

1. **A translation and an interpretation are separate corpus entries.** Woods is the reference Patañjali; Johnston is tagged as an interpretation through a Christian-Theosophical lens. The corpus keeps the gap between them legible rather than resolving it, because the gap is itself informative.

2. **A translator's voice is typographically separable from the source text.** Woods's group headings and group summaries are his own — the section's own subtitle says *"group-headings added by the translator"* — so summaries are italic and sutras bold. This is a retrieval requirement, not styling: an undifferentiated chunk lets a translator's paraphrase be quoted as scripture.

3. **A text declares its transcription warrant.** Human transcription and machine OCR are different grades and the document says which. This generalises [`iching/sources/PROVENANCE.md`](https://github.com/opencosmos-ai/iching/blob/main/sources/PROVENANCE.md) — *"Before any OCR-grade line is quoted or relied on, check it against the scan"* — from the I Ching to the whole corpus.

4. **Repair only where independent witnesses agree, and never splice across textual states.** Agreement is what licenses a repair. Disagreement means you may have found two books rather than one error, and the burden is to establish which.

5. **Orthography goes to the page images.** Diacritics, and anything else the type carries but a text layer cannot, are settled against the scan itself or left alone and flagged.

6. **Repairs are auditable tables in version control, with per-entry evidence and occurrence assertions** — never silent edits. [`scripts/knowledge/groom.py`](https://github.com/opencosmos-ai/knowledge/blob/main/scripts/knowledge/groom.py) carries 61 repairs for Johnston, and for Woods 35 line-break hyphen decisions plus 13 Sanskrit readings, each recording the folio or the evidence it rests on.

## Consequences

- **Cosmo can show the gap.** Asked what Patañjali says about the yamas, the corpus holds both *abstentions* and *Commandments* and can say which is whose. Neither text alone supports that.

- **Admission got materially more expensive**, and that is the trade being accepted. Johnston took a two-witness diff of 30,000 words; Woods took two scans, a vocabulary built from all 438 pages to decide 35 hyphens, and seven page images.

- **The assertions are the deliverable, not the ceremony.** Three defects introduced during this work — a greedy regex that deleted sutras i.12 and i.13, a page-turn rejoin that produced `hasceased`, and stacked page furniture that emptied sutra ii.10 — were invisible in the output and caught only by a count assertion. `--force` on a groomed file now fails loudly and leaves it untouched.

- **Hyphenation needs a corpus, not a rule.** Woods's style is exceptionally hyphen-dense, so a blanket rejoin corrupts `mind-stuffs` into `mindstuffs`. Each hyphen was decided by his own usage — `mind-stuff` hyphenated 1033 times against 3 joined; `concentration` joined 537 against 0. Future OCR-grade texts should expect to build the same evidence.

- **A known limit, stated rather than papered over.** Woods's English prose rests on the two text layers and has *not* been read against the images end to end. Only the Sanskrit has. The header in `groom.py` says so.

- **One reading is not settled.** `complete-mastery` (Woods II.55) had no attestation either way and fell back to a rule. It is flagged in the source as the only reading here that would not be defended as settled.

## Alternatives considered

- **Publish Johnston alone.** Rejected: it would make a 1912 Theosophical reading the corpus's Patañjali, with the overlay unmarked and *aparigraha* silently rendered as a Christian vice.

- **Publish Woods alone and shelve Johnston.** Rejected: it discards a genuine historical document, and it overstates Woods, who is not lens-free either — he translates Patañjali as Vyāsa and Vāchaspati Miśra read him, which the frontmatter must declare.

- **Use a modern scholarly translation.** Rejected on copyright. Pre-1929 is the gate, which is why the field was Woods, Jha, Rama Prasada and Dvivedi rather than anything current.

- **Trust Project Gutenberg and skip the scans.** Rejected once the count came in at 61 defects. PG #2526 reads well and is wrong in sixty-one places; a text that looks proofread and is not is more dangerous than one that is obviously OCR.

- **Normalise the Sanskrit from the text layer.** Not rejected so much as impossible: `piddha` for *çuddha* is unrecoverable without the page.

- **Take Woods's full 438-page apparatus** (Vyāsa's *Yoga-Bhāshya* and Vāchaspati Miśra's *Tattva-Vaiçāradī*). Deferred, not refused. The standalone section is ~4,850 words against roughly 150,000, and the commentary would dominate retrieval before anyone has asked it a question. Whether the apparatus, and whether the LoC textual state of Johnston, deserve entries of their own are both left open.
