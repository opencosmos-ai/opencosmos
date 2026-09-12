# Changelog — the I Ching substrate

Notable changes to `knowledge/iching/`. The root [`CHANGELOG.md`](../../CHANGELOG.md) covers the monorepo; this one covers a directory that has its own method, its own admission rules and its own principles, and whose changes would otherwise be legible only by reading a whole session back.

**Last updated:** 2026-09-12

## What goes here, and what does not

**The rule across every changelog in this ecosystem is one change, one changelog — the one that owns the decision.** The system is written down once, in the [opencosmos root `CHANGELOG.md`](../../CHANGELOG.md). This section says only what it means here.

### Relative to the root changelog

The root records **the monorepo's work history** — apps, infrastructure, Cosmo, and the knowledge corpus taken as a whole. This file records **one sub-project inside that corpus**, which has its own method, its own admission rules and its own principles.

| | Root | Here |
|---|---|---|
| A source vendored, at what coverage and grade | — | ✅ |
| A stance reversed about how this project works | — | ✅ |
| A rule this project learned | — | ✅ (pointing at `principles/`) |
| The importer, the OCR tool, the scripts behind it | — | ✅ |
| **That this project exists, and when it reached a milestone the monorepo should know about** | ✅ | ✅, in full |
| Anything that changes the app, the corpus pipeline, or another package | ✅ | — |

**The test: would someone not working on the I Ching need to know?** If yes it goes to the root — in a sentence, with a link here, never in full. The 2026-09-11 root entry naming this project is the one entry that exists in both, and it says so.

### Relative to the layers beside it

This is a **chronological spine that points into them**, never a second copy.

| | Lives in |
|---|---|
| Why a source may be vendored, and its grade | [`sources/PROVENANCE.md`](sources/PROVENANCE.md) |
| A rule learned, with its trigger and evidence | [`principles/`](principles/INDEX.md) — each entry carries its own `since:` |
| How a rendering gets made | [`method.md`](method.md) |
| What each source is and what it is for | [`README.md`](README.md) |
| Coverage, counts, and what failed to extract | the run output of `pnpm xenso:import-iching`, and each file's frontmatter |

**Counts quoted below are a snapshot on the date of the entry**, not a table anyone maintains. The importer prints the live numbers; a hand-kept copy of a derivable list is precisely what the inherited `edited-or-generated` principle forbids.

**Entries are milestones, not commits.** `git log` holds every change; this holds the ones that changed the shape of the work.

---

## 2026-09-12 — McClatchie read a second time, and the instruments get measured

Shalom opened `sources/mcclatchie-1876/04.md`, saw `**Sixtli-Nine`, and asked how bad it was. It was bad: roughly **one word in five** across the English body. The fix is not a better setting, it is **a second engine and a refusal to blend the two.**

- **Tesseract is the primary now, on a measurement and nothing else.** Over all 462 English body pages, scored by the share of words no expanded dictionary recognises: **Apple Vision 19.8%, Tesseract 10.5%.** New [`scripts/xenso/ocr-tesseract.sh`](../../scripts/xenso/ocr-tesseract.sh) produces it — `brew install tesseract`, which sits outside the pnpm workspace and so cannot regenerate the shared lockfile that has broken sibling apps' builds before.
- **Vision is kept, because agreement between two separately-trained engines is worth more than either engine's opinion of itself.** 72.7% of the body is read identically by both, and **inside that agreement the error rate is 3.9%** — while the 27.3% they disagree about carries **73% of all the remaining damage.** Corroboration does not repair anything; it says where to look.
- **`disputed.yaml` — 5,039 word-level disagreements across the sixty-four, none resolved.** Both readings, the page, and enough context to find the spot on the scan. New [`scripts/xenso/ocr-consensus.ts`](../../scripts/xenso/ocr-consensus.ts) (`pnpm xenso:ocr-consensus`) does the same for any two passes. Each hexagram file carries its own `ocr_disputed_words:`.
- **Automatic resolution was considered and rejected, and that is the load-bearing decision here.** Preferring whichever engine read a dictionary word would lower the measured error and make the text worse. Hexagram 4's Second-Nine read *"To marry now is **alas** lucky"* — fluent, and wrong for *also*. It now reads *"is **alse** lucky"*: still wrong, visibly so. **A source at this grade should announce its damage**, and an automatic fluency preference is a machine for hiding it.
- **A bug the second engine exposed: 39 of 147 Chinese pages were being vendored as English.** `isChinesePage()` wanted `[NM]` directly after `CHI`, so the common "CHINESP TEXT." never matched, nor did a running head the scanner split across lines. Their columnar gibberish had been merging into the facing hexagram's text since the first import. The test now takes the head from *any* witness, or an English word count below 20 — an English page yields a median of 172 words here and a Chinese page a median of 1, with nothing in between.
- **All 64 section headings are found, where the first pass found 61 and inferred 3.** Vision finds 61 and Tesseract 56; between them they have every one. `MC_HEADING` was widened for Tesseract's trailing scanner furniture, and `looksLikeDiagram()` replaces an ever-growing alternation with a letter-fold and an edit distance of two — extending that regex one engine at a time is how it becomes a liability.
- **Structure recovered, because better characters find more boundaries.** All six line texts in **51 of 64** (was 40); 大象傳 split out in **57** (was 45); the full section set in **49** (was 39); the worst file went from 2 of 6 lines to 4. 135 inline trigram figures marked, against 102. Total text vendored rose 69,677 → 71,533 words, so none of this came from dropping anything.
- **The resolution hypothesis was wrong, and the refutation is written down so nobody repeats the afternoon.** The rasters are 600 DPI and the first pass rendered them at 216, which looks like a plain mistake and is not: the source is bitonal, downsampling anti-aliases the glyphs into what the engines expect, and **600 DPI scored 16.6% against 216 DPI's 13.7%.** Everything from 120 to 300 was noise. `ocr-pdf.swift` now derives the scale from the page's own embedded raster and reports it, takes `--dpi`/`--revision`/`--no-langcorrect`/`--words`, and **no longer destroys out-of-range pages on a partial `--from/--to` run** — the old writer silently clobbered the other 488.
- **New principle, provisional — [`an-instrument-is-not-a-witness-to-itself`](principles/an-instrument-is-not-a-witness-to-itself.md).** Vision reported a mean confidence of **0.98** on text where one word in five was wrong. A tool's account of its own accuracy is not evidence, and neither is a mechanism you can explain; both are hypotheses. It is provisional because both its cases come from this one investigation.
- **The Chinese half is still not transcribed.** Nothing here changes that rule, and Tesseract was run `-l eng` only.

## 2026-09-11 — Two more witnesses, and the project starts keeping its own principles

The evidence layer went from one English translation to three translations and a plates section, and — more consequentially — the work started producing **transferable rules faster than the existing files could hold them.** The Legge reversal's actual lesson was buried in a README section about Legge; the reason the Chinese is not transcribed was buried in a PROVENANCE paragraph about McClatchie. Both are rules that govern hexagrams nobody has looked at.

- **de Harlez 1889 vendored — `sources/harlez-1889/`, 64 of 64.** *Yih-king: texte primitif rétabli*, Brussels, from the Princeton Theological Seminary scan. In French, deliberately: he opens his preface by **denying the premise Legge translates from** — that the book was ever a divination manual — which puts him on the far side of the deepest open question in the project (貞, 亨, 孚). A source in another language is also structurally safe, having no English phrase to leak. His subtitle is *texte primitif rétabli*, so every file's `standing:` says he is a reading and never a witness. 63 of 64 Koua numerals decode and agree with their position; hexagrams 49, 59 and 62 lost their `Texte II.` heading outright and were recovered by ordinal run, marked `recovered_by:`.
- **McClatchie 1876 vendored — `sources/mcclatchie-1876/`, 71 files.** The first English I Ching. **Shalom found it on HathiTrust after a sweep here had wrongly concluded no digitisation was reachable**, and made the call to admit the 1973 Ch'eng Wen facsimile: the work is public domain by age, a photographic facsimile creates no new copyright, and this file already rests on that reasoning for the parent project's Song-edition photo-reproduction.
- **The PDF had no text layer at all** — 498 JBIG2 page images, 23 JPEG2000 plates, not one content stream containing a word of the book. New [`scripts/xenso/ocr-pdf.swift`](../../scripts/xenso/ocr-pdf.swift) rasterises each page and runs Apple's Vision engine locally: no install, no network, and **no dependency added to the monorepo**, which matters here because a root `pnpm add` regenerates the shared lockfile and has silently broken sibling apps' builds before.
- **The book held more than the sixty-four.** McClatchie also translated the 繫辭傳, the 說卦傳 and the 序卦傳, now vendored as three separate files — **the only English this project holds for texts it otherwise has only in Chinese**, which matters most for 說卦, since the eight `trigrams/*.md` answer to it. Plus his Appendix, and four plates in `figures/` including both the 先天 Fu Xi and 後天 King Wen arrangements.
- **His Appendix turned out to be the reason the book matters.** The overlay audit holds that missionary translators "translated with the only religious vocabulary they had." McClatchie **argues for it**: he sets the Yih King beside Θεός, Deus and Plato's world-soul and concludes 神 *"signifies… God, Gods"* and *"never means 'Spirit' in any Chinese book whatever."* And his Book IV renders 帝 as "The (Supreme) Emperor" and, four pages later, as "God" — **two of the five renderings the vendored glossary forbids, in one text.** That worked example is now in `method.md` § 4.
- **Sections are located by page order, not by their printed numbers**, because in this scan the numbers are the most damaged thing on the page (7 prints as `E.`, 46 as `1G.`, 64 as `GI.`). 57 of 64 numbers agree with the order and the disagreements are named; three sections that lost their heading entirely were found by their paragraph numbering restarting at 1. The parts of a section are found by McClatchie's own labels — "First-Nine", "Wăn Wang says" — rather than by numbers, because words survive a bad scan and numerals do not.
- **The Chinese half is not transcribed, and that is a rule rather than a shortfall.** The 1876 edition is bilingual, the Chinese is vertical columnar type that Vision cannot read, and a transcription produced by a language model from those page images would be indistinguishable from that model's memory of the Yijing while wearing an 1876 printing's authority. `chinese-pages.yaml` maps every scan page to its hexagram so a page can be opened and looked at. **One check was made by eye:** scan page 131 is hexagram 19 臨, and it agrees with `sources/zhouyi/19.md` character for character including the 无 forms — an 1876 Shanghai printing confirming a 21st-century wiki transcription.
- **`principles/` added — 9 entries, 8 active and 1 provisional.** The form is the Tao Te Ching project's, copied deliberately: `trigger:`-first frontmatter, two-independent-cases before `active`, and a generated index. **Its first rule is not to restate the parent's twenty-seven**, which apply here in full and are linked from `method.md` § 6 instead. New [`scripts/xenso/build-iching-principles.ts`](../../scripts/xenso/build-iching-principles.ts) (`pnpm xenso:principles`) regenerates `INDEX.md` and `principles.yaml`, enforces the evidence threshold, and **verifies every `evidence:` anchor resolves to a real heading** — it caught two dead anchors on its first run.
- **The entries are mostly about evidence rather than drafting, and that is diagnostic.** The parent's principles are about getting from a character to an English word, because its text arrived long ago and is not in doubt. Here five sources were vendored before a single word was rendered and every one arrived damaged differently. `principles/README.md` says so, and says that when the balance in `applies:` does not shift toward `drafting`, that is a sign this project is still building instruments instead of translating.
- **The 21 MB PDF moved to `sources/.cache/`** (gitignored) on Shalom's call. Everything else under `sources/` is text; the derived text and the four plates are what the corpus is for.

## 2026-09-10 — The evidence layer, and the reversal that made it possible

This directory held sixty-four hexagram files with `render: null` and no text to render. It also held an argument against vendoring the one English translation available — a rule invented locally, stricter than the parent project's, which had never been examined.

- **The stance on Legge reversed, and both arguments are on the record.** The old "Why not Legge" section was **stricter than the parent project's own `process/method.md` § 3 without saying so** — that file settles the question in terms (*"consult sources for meaning, never for phrasing"*) and names Legge among the pre-1931 translations in scope. And the two books are not alike: the Tao Te Ching triangulates across eight public-domain English translations, while **every public-domain English I Ching is missionary work.** Excluding Legge bought no purity, only working blind. → [README](README.md#legge-1882--a-reference-read-with-the-overlay-in-view)
- **The Chinese base text vendored — `sources/zhouyi/`, 64 of 64.** Judgment, six line texts, and the per-hexagram Wings, from Chinese Wikisource mainspace, each file naming its own revision.
- **The import verifies itself against something outside our own data, and this is the point of it.** Each page prints its own trigram decomposition (兌下坎上), and the classical line labels independently encode each line's polarity — 九 solid, 六 broken — so 初九 九二 六三 六四 九五 上六 spells `110010` and nothing else. **64 of 64 decompositions and all 384 line values now check against a source that has no idea what our table says.** A transposed row cannot survive it.
- **The five standalone Wings vendored — `sources/wings/`.** 繫辭上下, 說卦, 序卦, 雜卦. The other five are distributed per hexagram and live with them, so all ten are present.
- **Legge 1882 vendored at two grades, never blurred.** 31 hexagrams from the English Wikisource mainspace, human-proofread against the 1882 Clarendon scan; the rest extracted from the OCR of that same scan, with the extractor **scored at 99.3% word agreement against the proofread stretch before it was trusted with the rest**.
- **Hexagram 32 was demoted, and it is the reason the grade is now machine-checked.** Its Wikisource page looks finished and is not — a broken transclusion returning a fragment plus *hexagram 31's* footnote. It would have shipped as the best-graded file in the set. The importer now requires every proofread page to yield its full paragraph count.
- **The Tao Te Ching locks vendored and measured — `sources/locks/`.** 47 locked terms, of which **36 occur in the Zhouyi**: 天 122 times and locked away from "Heaven", 王 45 times and locked away from "king" — a word Legge uses on nearly every one of them.
- **[`method.md`](method.md) and [`sources/PROVENANCE.md`](sources/PROVENANCE.md) written.** The admission rules are inherited from the parent almost verbatim, with the one departure stated as a departure.
- **The formulaic measurement that set the order of work.** The judgments and line texts are **4,163 characters drawn from 794 distinct graphs**, and six verdict graphs account for 386 of them — 9.3% of the text. 无咎 appears 92 times. So the order of drafting is set by frequency, not by position: the eight trigrams, then the verdict vocabulary as one decision, then 君子/小人, then the sixty-four names.

## 2026-08-19 — The substrate seeded

Sixty-four hexagrams and eight trigrams, as a keyed lookup table rather than corpus prose — the data shape the Xensō canon asked for, since the I Ching is consulted by a cast rather than by similarity and the chunk-and-embed pipeline serves it badly.

- **`hexagrams/01.md … 64.md` and `trigrams/01-qian.md … 08-kun.md`** seeded with the settled facts — King Wen number, character, pinyin, the six-line figure, the trigram decomposition, the Shuogua image in Chinese — and `render: null` for every English word, because every English word is a decision.
- **`pnpm xenso:seed-iching`, `xenso:build-iching`, `xenso:check-iching`.** The markdown frontmatter is the source of truth; `apps/web/lib/iching-data.ts` is generated into the app rather than read from disk, because the cast happens on the client.
- **The table is self-checking.** The King Wen pair invariant — consecutive pairs are each other's inversions, except the eight self-inverse figures which pair by complement — plus a bijection check, trigram agreement, the non-uniform coin odds, and **the founding cast**: the six throws logged on 2024-02-23 asking *"What will help bring Xensō into the world?"* must come out at hexagram 60 moving at line one, becoming 29 — with an assertion that reading them top-down would give 59 instead, because lines read bottom to top and getting that backwards produces a plausible wrong answer with no error to notice.
- **The interface shows `節 · hexagram 60` rather than inventing a name to fill the gap**, because an invented name would be exactly the borrowed metaphor Xensō's design forbids, and would arrive wearing authority.
