# The I Ching substrate

Sixty-four hexagrams and eight trigrams, held as a **keyed lookup table** rather than as corpus prose — and, beside them, the public-domain evidence a rendering has to answer to.

This is deliberate, and the reasoning is recorded in the Xensō canon at [`docs/corpus-wanted.md`](https://github.com/shalomormsby/xenso) § The oracular layer: *"The I Ching is a lookup system: sixty-four hexagrams with fixed keys, consulted by a cast rather than by similarity. The chunk-and-embed pipeline serves it badly. It wants a different data shape — closer to `knowledge/quotes/`."* So it sits beside the corpus, not inside it, and it is never embedded — `scripts/knowledge/embed-knowledge.ts` skips this whole directory by name.

## The arrangement

Two halves, and the line between them is the only structural idea here worth remembering.

**Decisions** — one markdown file per unit, the frontmatter is the source of truth, the index is generated, the locks are machine-checked. This is the taoteching glossary's arrangement, copied because it works.

```
hexagrams/01.md … 64.md      the sixty-four, in King Wen order
trigrams/01-qian.md … 08-kun.md
```

**The record** — what changed and when, pointing into the layers below rather than restating them.

```
CHANGELOG.md                  dated entries; the chronological spine
```

**Principles** — the rules this project learned by making particular decisions, which then govern every decision after. The index is generated and the evidence links are build-verified.

```
principles/README.md          what belongs here — and what belongs to the parent project instead
principles/INDEX.md           GENERATED — `pnpm xenso:principles`
```

**Evidence** — vendored, never hand-edited, every file naming the exact edition and revision it came from.

```
sources/zhouyi/01.md … 64.md      周易 — the base text, per hexagram
sources/wings/                    the five standalone Wings, incl. 說卦
sources/legge-1882/01.md … 64.md  Legge's English, as a reference
sources/harlez-1889/01.md … 64.md de Harlez's French — the reading that disagrees
sources/mcclatchie-1876/          McClatchie's English, his Wings, his Appendix, four plates
sources/locks/                    the Tao Te Ching glossary, vendored
sources/PROVENANCE.md             what may live here, and on what authority
```

Generated from the decisions, and checked in:

```
apps/web/lib/iching-data.ts   GENERATED — do not edit
```

It is generated *into the app* rather than read from disk, because the cast happens on the client and `apps/web/lib/knowledge.ts`'s fs-from-cwd pattern is server-only. Sixty-four rows is a rounding error in the bundle.

```bash
pnpm xenso:seed-iching            # one-time; refuses to clobber anything past `status: draft`
pnpm xenso:import-iching --fetch  # vendor the sources, and verify them against the table
pnpm xenso:build-iching           # markdown → apps/web/lib/iching-data.ts
pnpm xenso:check-iching           # the verification below
pnpm xenso:principles             # principles/INDEX.md, and verify every evidence link
```

## What is a fact here, and what is a decision

**Facts** — seeded, and settled: the King Wen number, the character, the pinyin, the six-line figure, the trigram decomposition, and the Shuogua image in Chinese (乾為天, 坤為地, and so on). Since the import, also: the judgment, the six line texts, and the per-hexagram Wings, in Chinese, in `sources/`.

**Decisions** — every English word. `render` is the single term a player sees, and it is a translation call made one at a time, in the form the [Tao Te Ching glossary](https://github.com/shalomormsby/taoteching) uses. All sixty-four are `status: draft` with `render: null` until then, and the interface shows `節 · hexagram 60` rather than inventing a name to fill the gap. **An invented name would be exactly the borrowed metaphor Xensō's design forbids, and it would arrive wearing authority.**

The slots for `judgment`, `image`, and `line_texts` in each hexagram file are the *English* ones, and they are still null. The Chinese they will render now sits in `sources/zhouyi/`, so filling them is translation work rather than data entry.

## The sources, and what each is for

Full rights reasoning, admission rules and the wanted-list are in [`sources/PROVENANCE.md`](sources/PROVENANCE.md). How a rendering is actually made from them is [`method.md`](method.md). The rules learned along the way are in [`principles/`](principles/INDEX.md), and when each arrived is in [`CHANGELOG.md`](CHANGELOG.md). In brief:

### 周易 — the base text

All 64 hexagrams from Chinese Wikisource's mainspace transcription: the 卦辭, the six 爻辭, and the per-hexagram Wings (彖傳, 大象傳, 小象傳, and 文言傳 at hexagrams 1 and 2). Public domain by age, and a faithful transcription creates no new copyright.

This is the only text a rendering answers to. Everything else on this list is an argument about it.

### 十翼 — the Wings

Five are distributed one hexagram at a time and live in `sources/zhouyi/`; five stand alone and live in `sources/wings/` — 繫辭上, 繫辭下, 說卦, 序卦, 雜卦. All ten are present.

**說卦 is the one that matters most here**, because chapter 11 is where every trigram image comes from, and `trigrams/*.md` has eight `render: null` fields waiting on it. **雜卦 is the sleeper**: sixty-four one-line glosses, the tersest reading the tradition gives each hexagram, and the closest thing in the classical corpus to the single word `render` is asking for.

### Legge 1882 — a reference, read with the overlay in view

James Legge's *The Yî King* (Sacred Books of the East, vol. XVI, Clarendon Press, 1882), all 64. **It is here to be used, and it is not a source of English.**

This file used to argue the opposite — that importing Legge would install the missionary lexicon that the taoteching [overlay audit](https://github.com/shalomormsby/taoteching) exists to strip. The concern is real and the conclusion was wrong, for two reasons.

**First, it was stricter than the parent project's own rule, without saying so.** `process/method.md` §3 over there settles this: *"Consult sources for meaning, never for phrasing. Reading a commentary or an old translation to understand what a line means is research. Borrowing anyone's English words is not."* Pre-1931 translations are explicitly in scope, and Legge is named in the list. He was never excluded there. He was excluded here by a rule this directory invented for itself.

**Second, the Tao Te Ching's situation and the I Ching's are not alike.** That project triangulates across eight public-domain English translations — Legge, Carus, Giles, Suzuki–Carus, Balfour, Old, Goddard, Mears. When one of them wanders, the other seven show it. The I Ching's public-domain English is three books: **McClatchie (1876)**, an Anglican missionary whose reading of the first two hexagrams as a phallic cosmogony made him a scandal in his own lifetime; **Legge (1882)**, London Missionary Society; and **de Harlez (1889, in English 1896)**, a Catholic monsignor. Wilhelm–Baynes is 1950 and closed.

Which is the point, and it is a sharper one than the old stance allowed: **every English I Ching in the public domain is missionary work.** There is no clean alternative to pick instead. You cannot escape the overlay by changing translators; you can only catalogue it and read past it — which is what the taoteching overlay audit is, and why that project reads Legge rather than refusing him. All three are now in the repository, which makes the overlay something you can measure across translators instead of something you have to take on trust.

**And what Legge gets wrong is known, finite, and already locked against.** 天 → "Heaven", 君子 → "the superior man", 王 → "the king", 罪 → "sin", 德 → "virtue". Three of those are forbidden outright by the vendored glossary; the rest are on the watchlist in [`method.md`](method.md). A predictable bias is a usable source. It is the *un*catalogued bias that contaminates, and Legge's has been catalogued for a century.

**What he is worth having.** He read the whole text with the Kangxi-era commentarial apparatus at hand and forty years of classical Chinese behind him, and his account of the line positions, the correlates, the centrality of lines 2 and 5, and the trigram logic is still the standard scholarly construal in English. Where his English is strange it is usually because the Chinese is, and that is information.

And he marks his own uncertainty, which is the habit this project calls [`divergence-stays-open`](https://github.com/shalomormsby/taoteching). On hexagram 50's first line — 得妾以其子, the concubine whose position is improved by her son — he sets out the commentators' reading and then adds: *"The above is what is found in the best commentaries on the paragraph. I give it, but am myself dissatisfied with it."* A translator who will write that sentence in 1882 is a translator worth reading in 2026.

**The discipline, in one line: read Legge for construal, never for English.** Every English word in a rendering answers to a character in the Chinese file beside it — that is [`renders-no-character`](https://github.com/shalomormsby/taoteching), and it is what makes consulting him safe.

### de Harlez 1889 — the second witness, and the one that disagrees

Charles de Harlez of Louvain, *Yih-king: texte primitif rétabli, traduit et commenté*, Brussels 1889, all 64 — in French.

**One witness is not triangulation.** Legge alone is a single reading with a known bias, and a known bias you cannot cross-check is still the only account you have. De Harlez is the cross-check, and he is a sharp one, because he rejects the premise Legge translates from. His preface opens by denying that the Yih-king is *"ce livre de divination bizarre … que certains lettrés de la Chine ont jadis présenté à leurs concitoyens"* — the strange divination book certain Chinese literati once presented to their countrymen. He reads it as an older, soberer text that the tradition later made into an oracle.

Set the two side by side on the four characters that open hexagram 1, 元亨利貞:

| | |
|---|---|
| Legge | *"what is great and originating, penetrating, advantageous, correct and firm"* |
| de Harlez | *"l'origine, le progrès, l'affermissement et l'achèvement des êtres"* |

Neither is ours, and the distance between them is the size of the decision. That is what a reference base is for.

**Being in French is a feature.** `renders-no-character` is what makes Legge safe to read; de Harlez is safe structurally, because he has no English phrase to leak.

**The standing caution:** his subtitle is *texte primitif rétabli* — the primitive text **restored**. He reorders, emends, and marks passages as interpolations. **He is a reading, never a witness**; `sources/zhouyi/` is the witness. Each file says so.

**What is still out.** Val d'Eremao's English of de Harlez (1896) was serialised in a journal that printed only some chapters, and the complete separate volume is not scanned. Wilhelm's German (1924) is genuinely public domain, but the only transcription available is set from the 1987 Köln edition and fails the admission rules on the *printing*, not on the text. Both searches are recorded in [`sources/PROVENANCE.md`](sources/PROVENANCE.md) so nobody repeats them.

### McClatchie 1876 — the first English I Ching, and the overlay explaining itself

Thomas McClatchie's *A translation of the Confucian 易經*, Shanghai 1876, all 64 — plus three texts nothing else here holds in English, and four plates.

**He is the least reliable translation of the three and the most valuable document.** Both things are true and they are not in tension. Read as a construal he is an outlier; read as evidence he is the clearest thing in the corpus.

**What he gives the translation work.** 君子 is **"the Model Man"**, seventy-two times — a term not in the Tao Te Ching glossary, needing an entry from scratch, and now holding three competing renderings instead of Legge's one. 元亨利貞 is **"Origin, Luxuriance, Benefit, and Completion"**, a third shape beside Legge's and de Harlez's. And he labels the lines by position and polarity — "First-Nine", "Second-Six" — which is the most transparent of the three schemes and the closest to what 初九 and 九二 actually say.

**What he gives the overlay audit — and this is the real find.** The audit holds that the missionary translators "translated with the only religious vocabulary they had, and that vocabulary carried a cosmology inside it." **McClatchie does not translate that way by accident. He argues for it.** His Appendix sets the Yih King beside Greek and Roman cosmogony — Θεός, Deus, the Demiurgus, Plato's world-soul — and concludes that 神 *"signifies… God, Gods"* and *"never means 'Spirit' in any Chinese book whatever, classical or otherwise."* 神 is locked in the vendored glossary. [`sources/mcclatchie-1876/appendix.md`](sources/mcclatchie-1876/appendix.md) is the primary document of the thing that lock exists to keep out.

**Three Wings in English.** He translated the 繫辭傳, the 說卦傳 and the 序卦傳 as well as the sixty-four. Those are vendored separately, and they are the only English this project holds for texts it otherwise has only in Chinese — which matters most for 說卦, since the eight `trigrams/*.md` files answer to it.

**Four plates**, in [`sources/mcclatchie-1876/figures/`](sources/mcclatchie-1876/figures/) with a manifest in `plates.yaml`: the 先天 Fu Xi and 後天 King Wen arrangements of the eight trigrams with their compass points and family relations, the five colours, and — directly on the open question — a plate laying out 元亨利貞 as four phases in nature rather than an oracle's verdict.

**The grade is the lowest here, and it is marked.** A scan of a photo-reproduction, OCR'd locally; the printed numbers are so damaged that sections are located by page order and the numbers used only to check it. 51 of 64 give all six line paragraphs cleanly; the rest lost a label and run one line into the next. Every file says which. And the Chinese half of this bilingual edition is **not transcribed** — see [`sources/PROVENANCE.md`](sources/PROVENANCE.md) for why that is a rule and not a shortfall.

**It is read twice, by two engines, and the disagreements are kept.** The English is Tesseract's reading; an independent Apple Vision pass corroborates it word by word. Where both engines read a word the same way — 79.8% of the sixty-four — the error rate is 3.9%; where they differ, 28%. Those 5,039 positions are listed in [`sources/mcclatchie-1876/disputed.yaml`](sources/mcclatchie-1876/disputed.yaml), **none of them resolved**, because choosing between two readings needs the scan open. Every hexagram file carries its own `ocr_disputed_words:` count. This is the only source here with a measured error rate rather than an asserted grade, and it is the worst-scanned one — which is the right way round.

### The locks

`sources/locks/terms.yaml` is vendored verbatim from the Tao Te Ching glossary, and `sources/locks/README.md` is generated from it — a table of every locked term measured against this book.

**36 of the 47 locked terms occur in the Zhouyi.** 天 appears 122 times and is locked away from "Heaven". 王 appears 45 times and is locked away from "king" — a word Legge uses on nearly every one of them. That is not a hypothetical conflict; it is the single most frequent decision this project will make, and it is already settled.

## Verification

`pnpm xenso:check-iching` asserts, on every run:

- **Bijection** — 64 distinct figures covering all 64 possible.
- **The King Wen pair invariant** — consecutive pairs (1,2), (3,4) … (63,64) are each other's inversions, except the eight figures that are their own inversion, which pair by complement instead. A single transposed row breaks it, which makes the table self-checking and worth more than proofreading.
- **Trigram agreement** — lower ++ upper equals the figure, every time.
- **Engine behaviour** — coin arithmetic, the non-uniform odds (1/8, 3/8, 3/8, 1/8 — not even, and this is the check that says so), moving-line resolution, and `relating: null` when nothing moves.
- **The founding cast** — the six throws Shalom logged on 2024-02-23 asking *"What will help bring Xenso into the world?"*, recorded in the Xensō archive and never resolved, must come out at hexagram 60 moving at line one, becoming 29. It also asserts that reading those throws top-down would give 59 instead — because **lines read bottom to top**, and getting that backwards produces a plausible wrong answer with no error to notice.

`pnpm xenso:import-iching` adds two more, and fails the run rather than writing an unverified file:

- **Trigram agreement, from outside.** Each Zhouyi page prints its own decomposition — 兌下坎上, *dui below, kan above* — which must equal the `trigrams:` in our table. **64 of 64.**
- **The figure, read back out of the line labels.** The classical labels name each line's polarity: 九 is a solid line, 六 a broken one, so 初九 九二 六三 六四 九五 上六 spells `110010` and nothing else. Reassembling every figure from its labels checks **all 384 line values against a source that has no idea what our table says.** This is the check that a transposed row cannot survive, and it now passes 64 of 64.

## What is not here, and why

**The excavated witnesses** — the Mawangdui silk Zhouyi (1973), the Fuyang bamboo (1977), the Shanghai Museum Chu slips (1994) — are not vendored, and the reasoning is the taoteching project's, unchanged: reconstructing damaged and missing graphs is genuine editorial work by living scholars, and reproducing a reconstruction reproduces the scholarship. **Record the facts instead.** "The Mawangdui Zhouyi runs the hexagrams in a different order entirely" is a fact about a text and facts are not copyrightable. See [`sources/PROVENANCE.md`](sources/PROVENANCE.md).

**Legge's footnotes** — his commentary, as opposed to his translation — are on the wanted-list rather than in the repository. They are where most of his construal actually lives, and most of his overlay too.

**Any modern translation, of anything, for any reason.** Wilhelm–Baynes included.
