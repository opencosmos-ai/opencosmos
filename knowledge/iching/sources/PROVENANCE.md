# PROVENANCE — what may live in `sources/`, and on what authority

*This directory holds the primary material a rendering answers to. Every file in it must be **provably free**: the `knowledge/` corpus is intended for the public domain, this repository ships under MIT, and Xensō is a product. Nothing here may carry a restriction that any of those three cannot honour.*

**These rules are inherited from the Tao Te Ching project's [`sources/PROVENANCE.md`](https://github.com/shalomormsby/taoteching), deliberately and almost verbatim.** That file was argued out over months, has been wrong once and says so in public, and there is no reason for a neighbouring project to re-derive it badly. Where the two differ, the difference is noted below and the reason given.

---

## Why stricter than the law requires

The Zhouyi is roughly three thousand years old; the Ten Wings are Warring States to Han; Wang Bi died in 249 CE; Legge died in 1897. No copyright subsists in any of them, and a faithful transcription of a public-domain text creates no new copyright — in the United States see *Feist v. Rural Telephone* (1991), rejecting "sweat of the brow", and *Bridgeman Art Library v. Corel* (1999) for faithful reproductions.

**So why keep rules at all?** Because "the characters are ancient, therefore the file is free" has to be true *of the specific file in front of you*, and two things can make it untrue:

1. **A source can hold its own licence over its own additions.** ctext.org licenses its structured data **CC BY-NC-SA 3.0**. The characters are not theirs; the database is. NonCommercial is incompatible with a product, so ctext is not a source here however convenient its alignment of Legge against the Chinese may be.
2. **Modern editions really do add protectable material.** Not the characters, but the punctuation, the collation apparatus, the emendations, the reconstruction of damaged graphs, the annotations, and the selection and arrangement. Some of that is thin. Some is genuine scholarship by living people.

**On Wikisource, specifically.** Its own copyright policy holds that *"the transcription of a work on Wikisource does not create a new copyright, so if the original work has entered the public domain the transcription here is also public domain"*, and that *"anything that could attract copyright would no longer be faithful to the original"*, so the site-wide CC BY-SA default never reaches mainspace transcriptions. That is Wikisource's account of its own licence and it matches the law it reasons from. The taoteching project spent three weeks blocked on a misreading of the site banner and recorded the correction rather than quietly editing it away; this file inherits the corrected position.

---

## The admission rules

**A file may be added only if all four hold.**

1. **The work itself is public domain by age** — pre-modern, or its author long dead.
2. **The specific printing or transcription is either pre-1929, or dedicated CC0 / marked public domain, or a faithful transcription of such a printing.** "Found on the open web" is not provenance; the *edition* must be nameable.
3. **Its frontmatter names that source exactly** — work, edition, dates, host, URL, and where the host versions its pages, the revision.
4. **Any modern editorial layer is absent, excluded, or marked.** Punctuation especially.

**And one category is excluded outright, on grounds unrelated to licence text.**

**No transcriptions of the excavated Yijing manuscripts.** The **Mawangdui** silk Zhouyi was excavated in 1973, the **Fuyang** bamboo in 1977, and the **Shanghai Museum** Chu slips were acquired in 1994. Reading damaged and missing graphs into modern characters — the brackets, the □ marks, the conjectural readings — is **editorial work by living scholars**, not faithful transcription of anything. Reproducing a reconstruction reproduces the scholarship.

**The exclusion is on the reconstructions, not on the manuscripts**, and it tracks what is currently available rather than what is permanently forbidden. It lapses for any excavated transcription that clears all four rules on its own merits.

**Instead, record the facts.** That the Mawangdui Zhouyi arranges the sixty-four in a wholly different order — by trigram pairing, not King Wen — is a **fact about an object recovered from the ground**, and facts are not copyrightable. A fact can be cited and checked; a bulk transcription only invites trust.

**One difference from the parent project.** There, pre-1931 translations are consulted but never vendored, because eight of them are available and the risk is absorbing a phrase. Here, **Legge and de Harlez are both vendored**, because the field is three books rather than eight and none of them is neutral (see the README). Vendoring them puts the overlay *on the page, labelled*, where it can be argued with — which is safer than consulting it from memory. The compensating discipline is [`method.md`](../method.md): read them for construal, never for English.

---

## What is here

| Path | Contents | Coverage | Grade |
|---|---|---|---|
| `zhouyi/` | 周易 — judgment, six line texts, and the per-hexagram Wings | **64 of 64** | human transcription |
| `wings/` | The five standalone Wings | **5 of 5** | human transcription |
| `legge-1882/` | Legge's English translation, judgment and lines | **64 of 64** | 31 proofread · 33 OCR |
| `harlez-1889/` | de Harlez's French, judgment, lines, and his own commentary | **64 of 64** | OCR |
| `mcclatchie-1876/` | McClatchie's English, the three Wings he translated, his Appendix, four plates | **64 of 64** | OCR |
| `locks/` | The Tao Te Ching glossary, vendored, and measured against this text | 47 terms, 36 binding | generated |
| `.cache/` | The fetched wikitext and OCR the importer ran from | — | gitignored |

Everything above is written by `pnpm xenso:import-iching`. **Nothing in this directory is hand-edited.** Fix the importer, or fix the upstream source, and re-run.

### `zhouyi/` — 周易

**Source:** Chinese Wikisource mainspace, one page per hexagram at `周易/<name>`, each file naming its own revision id. Public domain by age.

**Punctuation: present, and marked as editorial.** The transcription supplies modern punctuation; the received text has none. The admission rules permit *marked* as well as absent, and an unpunctuated Zhouyi would be substantially harder to use for no gain in fidelity — the punctuation is recoverable as an editorial choice rather than being passed off as the text.

**Collation notes are preserved and marked 〔…〕**, following the taoteching convention for the Siku compilers' notes. Hexagram 1 carries one: 〔一作太和〕 at 保合大和 — *"for 大和, one edition reads 太和"*. That is 18th-century-style editorial matter, useful, and never silently dropped.

**The importer verifies itself, and this is the point of it.** Each page prints its own trigram decomposition, and the classical line labels independently encode each line's polarity — 九 solid, 六 broken. Both are checked against `hexagrams/*.md` on every run:

```
64/64 pages decompose exactly as the table does
64/64 figures reassembled from 九/六 labels — 384 line values, from a source that has no idea what our table says
```

A transposed row in our table cannot survive that. It is worth more than proofreading, and it is worth more than the text itself.

**One orthographic variant carried across:** hexagram 32 is titled 恒 on Wikisource and 恆 in our table. The same character; the map is in the importer, and is meant to be read rather than to grow.

### `wings/` — 十翼

**Source:** Chinese Wikisource mainspace at `易傳/<name>`. The `周易/<name>` paths are redirects and the importer follows them.

**Five of the Ten Wings are distributed** one hexagram at a time — 彖上 and 彖下, 大象 and 小象, and 文言 — and live in `zhouyi/`, where they belong. **Five stand alone** and live here: 繫辭上 (12 chapters), 繫辭下 (9), 說卦 (11), 序卦 (2), 雜卦 (2). All ten are present.

The received chapter divisions are preserved as headings, because they are how anyone cites this text.

### `legge-1882/` — The Yî King

**Source:** *The Sacred Books of the East*, vol. XVI, ed. F. Max Müller, Clarendon Press, Oxford, **1882**. Public domain by age on every count.

**Imported at two grades, which are never blurred, and each file's `transcription:` field says which it is.**

**Grade 1 — proofread, hexagrams 1–32 (31 files).** English Wikisource mainspace, transcluded page by page from `Index:Sacred Books of the East - Volume 16.djvu` and proofread by hand against the scan. Pages 1–161 of that index are proofread; past 161 there is essentially nothing, which is why the grade changes at hexagram 32.

**Hexagram 32 is the exception, and it is a finding worth keeping.** Its mainspace page looks finished and is not: the transclusion is broken, it returns a fragment of the translation ending mid-sentence, and it pulls in *hexagram 31's* footnote. It would have shipped as a proofread text. The importer now requires every proofread page to yield its full set of numbered paragraphs — seven for hexagrams 1 and 2, six otherwise — and demotes anything that does not. **A page that looks proofread and is not is more dangerous than a page that is obviously OCR.**

**Grade 2 — machine OCR, hexagrams 33–64 and 32 (33 files).** The same 1882 printing, from the University of Michigan scan at [archive.org/details/1922707.0016.002.umich.edu](https://archive.org/details/1922707.0016.002.umich.edu) — which is the scan Wikisource itself is proofreading against, so the two grades are two readings of one book rather than two books.

**The extractor is scored before it is trusted.** Legge sets his translation in full-size type above his notes in small type, so on the page a note line simply fits more characters than a text line does; that, plus the numbered-paragraph formula, separates them. Running that extractor over hexagrams 1–32 — where a proofread answer already exists — and comparing gives **99.3% word agreement**. It earns the other thirty-three that way, rather than by assertion.

**What the OCR grade still gets wrong, stated plainly.** The scanner reads `1.` as `i.` routinely, `LII.` as `LI I.`, and `LIII.` as `LI 1 1.`; hexagram 53's name comes back `.ATien`. Those are handled. What is *not* handled is letter-level dropout inside a sentence — hexagram 64's sixth line reads "shows its subject fidence, till he…", having lost several words around *confidence*. Each file therefore carries `scan_heading:` holding the heading exactly as the scanner read it, mangling included, and `paragraphs:` holding the count. **Before any OCR-grade line is quoted or relied on, check it against the scan.** One file, hexagram 39, is flagged `incomplete:` because an unreadable numeral runs one paragraph on into the next; no text is lost there, only a boundary.

**Legge's footnotes are not vendored.** They sit below the rule on every page and the importer stops at it. They are where most of his construal lives — and most of his overlay. See the wanted-list.

### `harlez-1889/` — Le Yih-king

**Source:** *Yih-king: texte primitif rétabli, traduit et commenté*, Ch. de Harlez, F. Hayez, Bruxelles, **1889**, extracted from vol. XLVII of the *Mémoires de l'Académie royale des sciences, des lettres et des beaux-arts de Belgique*. Scanned from the Princeton Theological Seminary copy at [archive.org/details/yihking00harl](https://archive.org/details/yihking00harl). Public domain by age. Machine OCR, unproofread.

**Why a French book is in an English translation project.** Charles de Harlez of Louvain opens his preface by denying the premise Legge translates from — that *"le Yih-king n'était point ce livre de divination bizarre … que certains lettrés de la Chine ont jadis présenté à leurs concitoyens"*: the Yih-king was never the strange divination book that certain Chinese literati once presented to their countrymen. He reads it as an older, soberer text that the tradition later turned into an oracle.

That is the other side of the fork this project's deepest open question sits on — 貞, 亨, 孚 — argued in 1889, decades before the modernist school made the same case. Where Legge renders 元亨利貞 as "what is great and originating, penetrating, advantageous, correct and firm", de Harlez has *"l'origine, le progrès, l'affermissement et l'achèvement des êtres."* Two complete readings of the same four characters, neither of them ours.

**And being in French is a feature, not a tax.** [`renders-no-character`](https://github.com/shalomormsby/taoteching) makes consulting Legge safe; a source in another language is safe structurally, because it has no English phrase to leak.

**The standing caution, which is real.** His subtitle is *texte primitif rétabli* — **the primitive text restored.** He reorders, emends, and marks passages as interpolations. **He is a reading, never a witness.** `zhouyi/` is the witness. Every file says so in its `standing:` field.

**What is here and what is not.** Judgment (*Texte I*), the line texts (*Texte II*), and his own *Com. I / Com. II / Symbolisme / Note* in a separate labelled section — his renderings of 彖傳 and 象傳 plus his textual criticism, which is often the most interesting thing on the page. His page footnotes are not vendored.

**The extraction, and where it is soft.** He does not print his sections in a fixed order — hexagram 1 runs Texte I, Texte II, Com. I; hexagram 6 runs Texte I, Com. I, Symbolisme, Texte II — and the scanner folds headings into the tail of the paragraph before. So the importer walks the block marker by marker rather than cutting at a boundary, and treats the next expected ordinal as resuming the line texts wherever it appears.

Two checks, both printed on every run. The 64 `Koua` headings must be found in document order; **63 of 64 numerals decode and agree with their position**, and the one that does not (hexagram 53, which the scanner read as "LLLI") falls back to position and is named. And **hexagrams 49, 59 and 62 lost their "Texte II." heading entirely**; their line texts were recovered on the rule that three ascending ordinals in a row is a line-text run and not prose. Those three carry `recovered_by:` in their frontmatter. It is a guess about the layout, never about the words.

### `locks/`

`terms.yaml` is copied verbatim from [shalomormsby/taoteching](https://github.com/shalomormsby/taoteching) `glossary/terms.yaml`, which is itself generated from that project's glossary entries. `README.md` beside it is generated here, and reports each locked term's occurrence count in the Zhouyi base text.

**Both are generated. Neither is ever hand-edited** — that is [`edited-or-generated`](https://github.com/shalomormsby/taoteching). A rendering that conflicts with a lock is fixed by changing the rendering, or by changing the lock *in the other repository* and re-importing. It is never fixed here.

---

## Frontmatter

```yaml
---
work: "周易"                  # or the translation's own title
hexagram: 60
edition: "Chinese Wikisource mainspace transcription"
obtained: "https://zh.wikisource.org/wiki/周易/節"
revision: 2405027            # where the host versions its pages
transcription: "human, mainspace"        # or "machine OCR of the 1882 scan, unproofread"
punctuation: "editorial, present"        # or "none in source"
editorial_notes: "collation notes preserved, marked 〔…〕"
rights: "public domain by age; a faithful transcription creates no new copyright"
transcribed: 2026-09-11
---
```

---

## The other translations — what is reachable, and what is not

*Shalom asked for the remaining public-domain translations to be imported alongside Legge, to widen the reference base. De Harlez went in. The other two are recorded here — what was searched, what was found, and what blocks each — so that nobody repeats the search and so the reasons sit on the record rather than in someone's memory. **McClatchie was found after the first sweep missed it, which is the standing argument for writing these sections down rather than concluding "not available".***

**Where the English public domain actually stands.** Three complete English I Chings are out of copyright, and the second of them is the one already here:

| | Translator | Status |
|---|---|---|
| 1876 | Thomas McClatchie, Anglican missionary, Shanghai | ✅ `mcclatchie-1876/` |
| 1882 | James Legge, London Missionary Society | ✅ `legge-1882/` |
| 1896 | J. P. Val d'Eremao, from de Harlez's French | **partial only** |
| 1889 | Charles de Harlez, in French | ✅ `harlez-1889/` |

### McClatchie 1876 — vendored — updated 2026-09-11

*A translation of the Confucian 易經 or the "Classic of Change", with notes and appendix*, American Presbyterian Mission Press, Shanghai, and Trübner, London, **1876**. The first English I Ching.

**The copy digitised is a facsimile.** HathiTrust's `mdp.39015085786880` is a **Taipei: Ch'eng Wen, 1973** photo-reprint of the 1876 edition — MARC date type `r`, reprint note, no edition statement, no new introduction, and the 1876 pagination preserved throughout. **Shalom made the call to admit it on 2026-09-11**: the work is public domain by age, a photographic facsimile of a public-domain printing creates no new copyright (*Bridgeman*, *Feist*), and this file already rests on the same reasoning for `commentaries/heshanggong/` in the parent project, which comes from a 1919 photo-reproduction of a Song printing. HathiTrust's own rights determination is `pdus`. The Ch'eng Wen front matter is outside the 1876 pagination and is not carried across.

**How the text was got out, since none of the usual routes worked.** babel.hathitrust.org sits behind a Cloudflare challenge no script can pass, so Shalom downloaded the volume as a PDF by hand. That PDF then turned out to have **no text layer at all** — 498 JBIG2 page images and 23 JPEG2000 plates, and not one content stream containing a word of the book. So it was OCR'd locally with **[`scripts/xenso/ocr-pdf.swift`](../../../scripts/xenso/ocr-pdf.swift)**, which rasterises each page and runs Apple's Vision engine over it. No install, no network, no dependency added to this monorepo.

```
swiftc -O scripts/xenso/ocr-pdf.swift -o /tmp/ocr-pdf -framework PDFKit -framework Vision -framework AppKit
/tmp/ocr-pdf knowledge/iching/sources/.cache/mcclatchie-1876.pdf \
    knowledge/iching/sources/.cache/mcclatchie-1876-ocr.txt --scale 3
pnpm xenso:import-iching --only mcclatchie
```

**The PDF and the OCR both live in `.cache/` and are gitignored.** 21 MB of page images is not what this corpus is for; the derived text and the four plates are.

**What the book turned out to contain**, which was more than expected:

| | Scan pages | Vendored as |
|---|---|---|
| Plates I–IV | 14–17 | `figures/`, catalogued in `plates.yaml` |
| The sixty-four | 36–327, English facing Chinese | `01.md` … `64.md` |
| **Book III — Commentary by Confucius** (繫辭傳) | 328–393 | `book-3-great-treatise.md` |
| **Book IV — A Treatise on the Diagrams** (說卦傳) | 394–405 | `book-4-treatise-on-the-diagrams.md` |
| **The Order of the Diagrams** (序卦傳) | 406–416 | `the-order-of-the-diagrams.md` |
| Appendix, Notes A–H | 418–491 | `appendix.md` |

**McClatchie translated the Wings as well as the hexagrams**, which neither Legge nor de Harlez does in the material vendored here. Those three files are the only English the project holds for texts it otherwise has only in Chinese.

**How a section is found, and why order rather than number.** The printed hexagram numbers are the worst-scanned thing on the page — 7 reads "E.", 9 reads "De", 46 reads "1G.", 64 reads "GI." So the sixty-four sections are located in **page order**, which the scanner cannot damage, and the printed number is used to *check* that order rather than to set it. **57 of 64 numbers agree.** The four that disagree (46, 53, 62, 64) are named in the run output; three sections (37, 61, 63) lost their heading line outright and were found by the one thing every section does — its paragraph numbering restarting at 1.

**How the parts of a section are found.** Not by the paragraph numbers, which are equally damaged, but by McClatchie's own labels: he names every line "First-Nine", "Second-Six", "Topmost-Nine", and introduces the two commentaries as "Wăn Wang says" (彖傳) and "Chow Kung says" (大象傳, and again as 小象 under each line). **The hyphen in the line labels is what makes them findable** — "the number Nine" is prose and unhyphenated; every real label is hyphenated.

**What that yields, stated exactly.** 40 of 64 give a judgment and all six line paragraphs. The other 24 lost one label to the scanner, so that line's text runs on into the line before it — no text is lost, only a boundary, and every file carries `lines_found:` in its frontmatter. 彖傳 is split out in 54 of 64 and 大象傳 in 45; where the attribution is missing the commentary stays inside the judgment, and `sections:` in each file says which it has.

**The inline figures.** He sets trigram figures *inside* his English — "Cheerfulness (☱) with submission (☷)" — and the scanner renders every one as a scrap of capitals: `(E)`, `(EE)`, `(ET)`, `(GE)`. **102 of them are marked `⟦trigram figure⟧` rather than left as debris or guessed at.** The hexagram's actual trigrams are in this project's own table and go in the frontmatter, beside the sentence rather than inside it.

**The Chinese is not transcribed, and must not be.** The 1876 edition sets Chinese and English on facing pages, and the Chinese is vertical columnar type, which Vision does not read — those pages come back with the running head and nothing else. `chinese-pages.yaml` records which scan page holds which hexagram's Chinese, so a page can be opened and looked at. **A transcription produced by a language model from those images would be indistinguishable from that model's memory of the Yijing while wearing the authority of an 1876 printing.** That is the excavated-manuscripts rule in a different costume, and it applies with the same force. `zhouyi/` is the text; this is a photograph of a second witness, for checking it by eye.

*One such check has been made: scan page 131, printed page 97, hexagram 19 臨 — the judgment, the 彖, the 大象 and the first two lines agree with `zhouyi/19.md` character for character, including the 无 forms. An 1876 Shanghai printing confirming a 21st-century wiki transcription is worth the record.*

**If the Chinese is ever wanted as a text**, the route is `brew install tesseract tesseract-lang` and the `chi_tra_vert` model, which is trained for vertical traditional Chinese. Deferred: the base text is already complete and verified, and 1876 type would need adjudicating against a source we trust more.

### Val d'Eremao 1896 — published in two places, and the complete one is not digitised

De Harlez's French was translated into English by J. P. Val d'Eremao and **serialised in the *Imperial and Asiatic Quarterly Review*** across 1896. Both relevant volumes are on archive.org, openly, with OCR ([3rd series vol. 1](https://archive.org/details/in.ernet.dli.2015.530454); [vol. 22, July 1896](https://archive.org/details/sim_imperial-asiatic-quarterly-oriental-colonial-record_1896-07_22)), and the July issue carries the last instalment.

**But the journal printed only part of it, by the editor's own account.** The note introducing the final instalment says the work is "published separately by the Oriental University Institute — we have already produced some of its Chapters in this Review." So the journal run is an anthology, not the book, and reconstructing it would produce a text that is incomplete by design. The separately published volume was not found on archive.org, OpenLibrary or in open web search.

**This one is worth revisiting**, because the source is open and the gap is known. Two routes: locate the Oriental University Institute volume, or harvest the instalments from the journal and label the result honestly as a partial anthology. Either would give an *English* de Harlez to set beside the French already here — useful, though not urgent, since the French is complete and the project reads for construal rather than for English.

### Wilhelm 1924 — the text is free, the available transcription is not

*I Ging: Das Buch der Wandlungen*, Eugen Diederichs, Jena, **1924**. The German original is genuinely public domain: published 1924, so free in the United States since 2020, and Wilhelm died in 1930, so free in Germany since 2001. The Cary Baynes English of 1950 is a separate work and is closed.

**The text being free is not enough — admission rule 2 asks for the *edition*.** The only transcription found is the e-text at zeno.org that German Wikisource links from its Richard Wilhelm page, and **it is set from the 14th edition, Köln 1987**, not from the 1924 printing. A 1987 Diederichs edition carries a modern editorial layer that is neither absent, excluded, nor marked; it fails rules 2 and 4 together. archive.org's only holding is a restricted 1982 lending copy of *I Ging: Texte und Materialien*, which is neither downloadable nor the right book.

**So this is a transcription problem, not a rights problem**, and it lapses the moment a scan or transcription of the 1924 Jena printing turns up. Worth re-checking periodically — reading the German is the only lawful way to see which of "the superior man", "the Judgment" and "the Image" are Wilhelm's and which are Baynes'.

*Everything in this section is a claim about availability on one date. None of it is a clearance: verify the rights position independently before importing anything named here.*

---

## What is wanted, in order of value

**1. Wang Bi's 周易注.** The same commentator the Tao Te Ching project already vendors, on this book — and the commentary that made this the *received* text. Public domain by age; on Chinese Wikisource, and scanned in the Siku Quanshu at archive.org. **This is the highest-value item on the list by a distance**, because it supplies for the I Ching exactly what `sources/commentaries/wangbi/` supplies over there, and because the continuity between the two projects becomes a fact about the sources rather than a claim about the method.

**2. Legge's footnotes.** Already sitting in the cached HTML and OCR that the importer reads, below the rule it currently stops at. They hold his construal of the line positions and correlates — the most useful thing he has — and the overlay at its densest. Vendor them into a `notes:` section, clearly separated, or not at all.

**3. A hexagram-name concordance against the locks.** Which of the 64 names contain a locked character, and what each lock already decides. 乾 and 坤 are the obvious pair, but 復 (24), 无妄 (25), 大有 (14) and 大過 (28) all collide with entries that are already settled. Mechanical to build from what is here, and it turns 36 measured locks into 64 answered questions.

**4. 說文解字 for the hexagram names.** The taoteching project has `tools/import_shuowen.py` already written and a `sources/shuowen/` directory to match. Sixty-four characters is a small ask of it, and the radical-level reading is where a `render` decision usually gets settled.

**5. The English de Harlez.** Now that the French is vendored, the Val d'Eremao English of 1896 is worth having beside it — see the section above for where it is and why it is only partly reachable. Lower value than it looks: the French is complete and this project reads for construal, not for English.

**6. Richard Wilhelm's German, 1924.** Blocked on a transcription rather than on rights — see above. Re-check periodically; it lapses the moment a scan of the Jena printing appears.

**7. Proofreading the OCR grades.** Three of the five sources are unproofread machine OCR, and the worst of them is McClatchie, being a scan of a photo-reproduction. The 24 hexagrams whose line boundaries ran on, and the Chinese side that was never read at all, are the two places where hand work would pay.

**8. The excavated witnesses, as facts.** A `variants.yaml` on the taoteching model: which hexagrams the Mawangdui silks carry, in what order, and where they name a hexagram differently (the silk's 鍵 for 乾, 川 for 坤). Facts about objects, never a text. The question it answers is the one that actually blocks work: *before drafting hexagram N, what does the oldest witness call it?*

---

## On citing rather than copying

Where a commentary's *reading* matters to a decision, the practice is the parent project's: **quote the phrase that carries the argument, gloss it, and cite it.** Quoting nine characters of a third-century commentary to argue about them is fair by any standard and free by age.

A repository does not need to *contain* a library in order to *use* one.
