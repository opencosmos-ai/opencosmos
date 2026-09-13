# The two books — what the I Ching and the Tao Te Ching actually share

*A research brief, not a ruling. It records what was found on 2026-09-12 when the question was
first asked seriously, and it is written to be **argued with** rather than cited. The rulings it
bears on belong in [`glossary/`](glossary/README.md); the rules it produced belong in
[`principles/`](principles/INDEX.md); what it leaves owed is in [`WORKLIST.md`](WORKLIST.md).*

**Standing: measured where it says measured, remembered where it says remembered — and the two are
marked apart throughout.** Every **count** was computed from files vendored in this repository and
in [shalomormsby/taoteching](https://github.com/shalomormsby/taoteching), and can be recomputed:
the corpus tables in § 3, the contacts in § 4, and the edition counts in § 2 (97 divergent lemmas,
175 collation notes) are all of that kind. The **biography, dating and scholarly history** in § 2,
and 王弼's own words in § 8, are **not vendored** and are stated from memory; each such passage says
so where it sits. See § 9, *What is owed*, before relying on any of it.

---

## 1. The question

The two projects sit beside each other, share a lock table, and translate texts separated by
perhaps three centuries and an entire worldview. **Can the Tao Te Ching's philosophy, glossary and
principles legitimately inform the I Ching translation — and if so, where does the connection
attach?**

The answer this brief reaches: **yes, through the Ten Wings, and only if the lens is declared.**
The reasoning is below, and so is the case against overdoing it, which matters more.

---

## 2. 王弼 — who he was, and why he is standing in both projects

*Remembered, not vendored. Every claim in this section is stated from memory and none of it is in
`sources/`. Treat it as a lead to verify, not as evidence — and see § 9.*

**王弼 (*Wáng Bì*), courtesy name 輔嗣 (*Fǔsì*), 226–249 CE. He died at twenty-three**, of an
epidemic, in the year his patron was executed, holding a minor secretarial post he had been given
after an interview at which he reportedly talked about metaphysics instead of government. In those
twenty-three years he wrote a commentary on the Laozi and a commentary on the Changes, and both
became the standard ones — which, for reasons the next section sets out, also made the copies of
those two texts bound into his commentaries the standard copies. Both books have been read through
his eyes ever since.

**He grew up inside a library.** His family line in 山陽 (*Shānyáng*) had inherited the collection of
蔡邕 (*Cài Yōng*, 132–192), the great Han scholar, by way of 王粲 (*Wáng Càn*, 177–217) — one of the
Seven Masters of the Jian'an era, who left no surviving heir. What reached Wang Bi was said to run
to thousands of scrolls, at a moment when the Han apparatus of learning had otherwise come apart
with the dynasty.

**His movement was 玄學 (*xuánxué*, "dark learning" or "profound learning"), and the usual English
label for it — Neo-Daoism — is misleading.** Its practitioners did not think Laozi had won. The
anecdote that defines the school has 裴徽 (*Péi Huī*) asking the young Wang Bi: if 無 (*wú*, absence)
really is the root of all things, why did Confucius never discuss it, while Laozi discussed nothing
else? Wang Bi's answer was that **Confucius *embodied* 無, and what is embodied cannot be lectured
on, so he necessarily spoke of 有 (*yǒu*, presence); Laozi had not yet left 有 behind, and so talked
constantly about what he was short of.** That single move — Daoist metaphysics deployed to make
Confucius the greater sage — is the whole of xuanxue in one sentence, and it is the reason the
school could read the Laozi and the 周易 (*zhōuyì*) as one enterprise without either book having to
lose.

**Four works matter here:** 老子注 (his Laozi commentary) and 老子指略 (its outline); 周易注 (his
Changes commentary) and **周易略例** (*General Remarks on the Changes*), whose 明象 (*Clarifying the
Images*) chapter carries 得意忘象.

### What a "recension" is — he did not write these books, and he did not rewrite them

*The distinction matters and the phrase "the Wang Bi recension" hides it. The mechanism below is
general to classical Chinese transmission; the counts at the end are **measured** in this
repository's sibling.*

**Three different things get called "the Laozi," and only one of them is a book Wang Bi touched.**

| | What it is | Examples |
|---|---|---|
| **an excavated text** | a physical manuscript, dated by the tomb it came out of | Guodian, c. 300 BCE · Mawangdui, buried 168 BCE |
| **a recension** | the text as carried down by one **commentary lineage** | 王弼 · 河上公 |
| **a commentary** | one person's explanations of it | 王弼's 老子注 |

**Wang Bi wrote the third. He inherited the second. He never saw the first.** The Laozi was roughly
five centuries old when he was born, and he worked from whatever manuscripts his family library
held.

**So why is his name on a text at all?** Because of how a commentary was physically made. There
were no footnotes and no facing pages: the format is 經 (*jīng*, the text) and 注 (*zhù*, the
comment) **interleaved** — a phrase of the classic, then the remark on it, then the next phrase.
**A commentator therefore had to write the whole text out as part of writing about it**, and the
copy he wrote out travelled with his commentary from then on, hand-copied together for a thousand
years and printed together after that.

**Which makes every commentator two things at once: a reader and a witness.** His explanation is
an argument you may take or leave. His copy of the text is **evidence about what the text said in
his century** — and evidence of a kind that nothing else preserves, because *no transmitted
classical Chinese text reaches us bare.* Everything that came down through copying came down inside
somebody's commentary. The only unwrapped ancient copies are the ones dug up.

**"The Wang Bi recension" therefore names a lineage of copies, not an act of authorship.** Modern
editions print it with the commentary stripped out — which is what the sibling project's
`source/chinese.md` is — and that is legitimate, but the text is still *his lineage's* text and
carries his lineage's readings. **He did not rework the Laozi. His commentary got attached to a
copy of it, and the attachment outlived everything else.**

### But the text now printed under his name is not securely the text he had

**This is the part that changes how the sibling project's base text should be read, and it is
measurable rather than theoretical.**

Seventeen centuries of scribes and editors stood between Wang Bi and any printing of him, and the
rival 河上公 recension was for most of that period **more** popular. A copyist who knew the familiar
reading and met an unfamiliar one in front of him tended to "correct" it. The result is a received
Wang Bi text quietly pulled toward Heshang Gong.

**The sibling repository holds this in plain sight, and the numbers are its own.** Its importer
flags every lemma in the 欽定四庫全書 printing of Wang Bi's commentary that differs from the base
text it calls the Wang Bi recension:

- **97 lemmas differ, and all 71 vendored chapters contain at least one.** Two texts, both named
  after the same man, disagreeing ninety-seven times.
- **The 18th-century imperial editors were already doing this work themselves.** Their own
  collation notes — 175 of them, preserved in the vendored files as 〔案…〕 — cite the 永樂大典
  (*Yongle Encyclopedia*, 1408) **85 times** and **河上公 51 times.** Fifty-one places where the
  editors of the definitive Wang Bi printing checked him against his rival.
- **Chapter 26 is the worked example, and it is the one that matters here.** The Siku lemma reads
  **是以聖人終日行不離輜重** — 聖人, the sage — flagged `*` against a base text that reads 君子.
  See § 4: that is the single four-character string this brief found shared with the Zhouyi core
  text, and it survives only on one side of a disagreement between two editions of the same man.

**A tool falls out of this, and it is worth keeping.** *(Remembered: this is the method of Rudolf
Wagner's reconstruction, and it is not vendored.)* **Where a commentary and the text printed above
it disagree, the commentary is usually the older witness** — a scribe normalising a familiar
reading corrects the text and rarely thinks to correct the remarks, so the comment preserves what
the lemma lost. Wang Bi's actual base text can be partly **reconstructed from his own commentary**.
The same reasoning applies to anything this project vendors from him.

### The Changes is a different case, and this project is built on its editing

**For the 周易, the editorial question is not hypothetical, and the answer is in this repository's
file layout.**

The Ten Wings were originally **separate appendices** — the 彖傳, the 象傳 and the 文言傳 sat at the
back of the book, not with the hexagrams they discuss. At some point in the Han–Wei period they were
broken apart and **interleaved under the individual hexagrams**: each hexagram's 彖 and 象 moved to
sit beneath its own text, and the 文言 went under hexagrams 1 and 2. *(Remembered, and the
attribution is genuinely disputed — 費直, 鄭玄 and 王弼 are all credited with parts of it in
different accounts. Do not repeat any single attribution without a source.)*

**Open [`sources/zhouyi/24.md`](sources/zhouyi/24.md).** It holds 卦辭, 爻辭, 彖傳, 大象傳 and 小象傳
in one file, under one hexagram. **That file structure is that editorial decision** — a second- or
third-century rearrangement, inherited from Chinese Wikisource, which inherited it from the
orthodox edition, which got it from 王弼 and 韓康伯 by way of 孔穎達's 周易正義 (642), the text the
imperial examinations ran on for thirteen centuries.

**This project's data model is therefore already a Wings-interleaved reading of the Changes**, made
before anyone here chose anything. That is the sharpest single argument for
[ADR 0016](../../docs/decisions/0016-the-i-ching-is-read-through-the-wings-and-the-lens-is-declared.md):
the choice was not whether to adopt the merged text but whether to **say** that it had been adopted.

### The complication that matters most: he is also the method this project refuses

**Wang Bi is famous in Yijing scholarship for 掃象 — sweeping away the images.** He demolished the
Han 象數 (*xiàngshù*, image-and-number) apparatus: the calendrical hexagram schemes, the overlapping
inner trigrams, the stem-and-branch correlations. **得意忘象 was the instrument he did it with**,
and it worked — after him the Changes is a philosophical text and the divinatory machinery is
optional. The 義理 (*yìlǐ*, meaning-and-principle) tradition descends from that stroke.

**And this project has just ruled the other way.** The eight trigrams render as their **images** —
sky, earth, thunder, wind, water, fire, mountain, lake — not as their actions, decided across all
eight at once and recorded in [`glossary/乾-qian.md`](glossary/乾-qian.md). *The Creative*, *the
Gentle*, *the Receptive*, *the Abysmal* are forbidden here precisely because they are meanings with
the image discarded.

**So "following Wang Bi" has to be said precisely, or it is incoherent.** What is taken is his
**cross-reading** — that these two books answer to one another and may be read through one lens.
What is declined is his **image-sweeping**. § 8 is where that repair is made, and it is the reason
the repair was needed.

**Two further facts sharpen it.** His 周易注 covers the 64 hexagrams with the 彖傳, 象傳 and 文言傳 —
**and stops.** The 繫辭傳, 說卦, 序卦 and 雜卦 were supplied a century later by 韓康伯 (*Hán Kāngbó*).
**說卦 ch 3, the four-pairs passage this project now builds on, is a Wing Wang Bi never commented
on.** And the 周易參同契 shows where the other end of the road leads: hexagrams as a calendar for
inner alchemy, a system in which everything can be made to mean whatever the system needs.

### The rest of the prior art

| | What it is | What it is worth here |
|---|---|---|
| **韓康伯**, 4th c. | Completed Wang Bi's Changes commentary over the 繫辭傳 and the rest | The merge extended deliberately into the Wings — including the ones Wang Bi left alone |
| **孔穎達**, 574–648 | 周易正義, the Tang orthodox edition, built on 王弼 + 韓康伯 | How the merged reading became **the** text for the next thirteen centuries |
| **周易參同契** (*cāntóngqì*), 2nd c. | Hexagram structure + Laozi cosmology + alchemy | The merge taken to its limit; a caution more than a precedent |
| **Mawangdui**, 1973 | Silk manuscripts held both a Laozi and a Zhouyi with commentaries | Material evidence the two circulated in the same hands |
| **Richard John Lynn**, Columbia 1994 & 1999 | Translated *both*, both *as interpreted by 王弼* | The closest modern analogue — a model, and prior art to differ from |
| **Richard & Hellmut Wilhelm** | Translated both; the I Ching introduction discusses the Laozi | Already inside this project's overlay audit |

**What the scholarship agrees on, and what disciplines all of the above:** the Zhouyi *core text*
is not Daoist and predates the Daodejing. The philosophical kinship lives in the **Ten Wings**
(Warring States to Han), which absorbed the same correlative cosmology the Laozi did — and which
are **nearer in time to the Laozi than to the hexagram statements they explain**. What they are and
which are vendored: [`sources/wings/README.md`](sources/wings/README.md). That claim
was not taken on authority here. It was measured.

---

## 3. The measurement

Three corpora, all vendored: the Daodejing in the Wang Bi recension; the Zhouyi **core text**
(卦辭 and 爻辭 only, all 64); and the **Wings** as this project holds them (彖傳, 大象傳, 小象傳,
文言傳 inside the hexagram files, plus 繫辭上下, 說卦, 序卦, 雜卦 in `sources/wings/`).

| | Daodejing | Zhouyi core | Ten Wings |
|---|---|---|---|
| characters | 5,158 | 4,935 | 15,298 |
| distinct graphs | 787 | 797 | 1,246 |
| graphs shared with the Daodejing | — | 312 — **24.5%** of the union | 523 — **34.6%** of the union |
| share of the Daodejing written in graphs it also uses | — | 69.7% | **90.8%** |

**The locked terms say it far more sharply.** These are the 47 terms the Tao Te Ching glossary has
already settled, vendored here at [`sources/locks/terms.yaml`](sources/locks/README.md):

| term | locked to | Daodejing | core | Wings |
|---|---|---|---|---|
| 道 (*dào*) | the Tao | 70 | **4** | 104 |
| 天地 (*tiān dì*) | sky and earth | 9 | **0** | 50 |
| 萬物 (*wàn wù*) | the countless things | 20 | **0** | 41 |
| 常 (*cháng*) | the ever-present | 28 | **0** | 11 |
| 善 (*shàn*) | masterful | 44 | **0** | 18 |
| 器 (*qì*) · 仁 (*rén*) · 極 (*jí*) | vessel · humaneness · the far end | 12 · 7 · 5 | **0 · 0 · 0** | 12 · 10 · 9 |
| 無為 · 自然 · 樸 · 慈 · 知足 · 復命 | — | present | **0** | **0** |

And the two books' cast of characters is not the same cast:

| | Daodejing | core | Wings |
|---|---|---|---|
| 聖人 (*shèng rén* — the sage) | **30** | **0** | 38 |
| 君子 (*jūn zǐ*) | 3 | 20 | 109 |
| 小人 (*xiǎo rén*) | **0** | 10 | 22 |
| 陰 / 陽 (*yīn* / *yáng*) | 1 / 1 | **1 / 0** | 19 / 19 |
| 貞 (*zhēn*) · 亨 (*hēng*) · 孚 (*fú*) | 1 · 0 · 0 | 111 · 48 · 42 | 65 · 52 · 27 |

**Three findings worth carrying away.**

1. **The bridge runs through the Wings.** Every measure says it: more shared graphs, far higher
   coverage, and the Laozi's whole philosophical vocabulary landing in the Wings and nowhere near
   the core text.
2. **Yin-yang is not the Zhouyi's idea.** 陰 appears **once** in the entire core text and 陽 not
   at all. The book everyone calls the yin-yang book acquired that vocabulary from its
   commentaries, and the Laozi barely uses it either (once each, at ch 42).
3. **The two books have different protagonists.** The Laozi's 聖人 is absent from the Zhouyi core;
   the Zhouyi's 君子 is marginal in the Laozi. And the Yijing's spine — the verdict vocabulary,
   201 occurrences of 貞 亨 孚 in the core alone — gets no help whatsoever from the parent glossary.
   [`WORKLIST.md`](WORKLIST.md) A4 and A6 are on their own.

---

## 4. Where the texts physically touch

Six contacts, each verified in the vendored files. They are few, and § 6 explains why that
fewness is the important part.

- **君子終日** — the **only** four-character string shared with the core text.
  Daodejing 26 是以君子終日行不離輜重 / 乾 line 3 君子終日乾乾，夕惕若；厲，无咎. This is
  [`WORKLIST.md`](WORKLIST.md) **A5**, and it is the one term where this project should rule
  *first* and the parent should follow — 20 occurrences here against 3 there.
  **But read the next paragraph before enjoying it.**

> **The best contact point in this brief is one variant away from not existing.** The sibling
> project's own `sources/variants.yaml` records chapter 26 as a contested line: its base text reads
> 君子, and **both the Siku Quanshu 王弼 edition and the Song 河上公 read 聖人** — the sage, not the
> noble. Two independent editions against the reading that produces the parallel. That project
> looked at it and kept its base (`our_call: base`), for reasons recorded there; **this one has no
> standing to lean on a phrase that two of its own witnesses delete.** § 2 shows the disagreement
> in the file itself — the Siku lemma **是以聖人終日行不離輜重**, flagged `*`, one of **97** places
> where the printed Wang Bi commentary and the base text called the Wang Bi recension do not
> match. If 聖人 is right, the
> Daodejing and the Zhouyi core text share **no** four-character string at all — and the honest
> version of § 4's headline is that the largest shared unit is three characters. *(Found 2026-09-12,
> while writing this file, by checking the variant apparatus instead of the text.)*
- **不出戶** — Daodejing 47 不出戶，**知**天下 / 節 (60) line 1 不出戶庭，无咎, whose 小象傳 reads
  不出戶庭，**知**通塞也. Both pair *not going out* with *knowing*. 節 is also this project's own
  founding-cast fixture.
- **損 / 益** — Daodejing 42 故物或損之而益，或益之而損, and 77 損有餘而補不足. In the Yijing,
  **41 損 and 42 益 are a King Wen pair**, and 或益之，十朋之龜 appears in *both* hexagrams.
- **反 / 復** — 復 (24) 反復其道，七日來復 and 乾's 小象 反復道也 / Daodejing 40 反者道之動.
- **不終日** — Daodejing 23 驟雨不終日 / 豫 (16) line 2 介于石，不終日，貞吉.
- **天之道** — Daodejing 9, 73, 77 / 臨 (19) 彖傳 天之道也.

---

## 5. Where they part — and these matter more

**剛 / 柔 (*gāng* / *róu* — firm and yielding).** The Wings' central pair: 剛 98 times, 柔 69, and
剛柔 as a compound 21. The Daodejing has 柔 eleven times and 剛 **twice**, and never pairs them —
its compound is 柔弱 (*róu ruò*, yielding-and-weak), five times, always preferred. **The Wings hold
the two as symmetrical and each right in its season; the Laozi takes a side.** A 剛 line in a 剛
position is 當位 — correct, not a failure. Importing the Laozi's preference would break the
Yijing's entire line-position logic.

**謙 (*qiān* — modesty).** Core 7, Wings 22, Daodejing **0**. The Yijing gives humility a whole
hexagram, the one traditionally said to have no bad line. The Laozi never writes the character and
is about almost nothing else. **A shared idea with no shared word** — the exact inverse of 剛柔.

**時 (*shí* — the season, the right moment).** Wings 58, Daodejing **0**. Timing is the Wings'
obsession and is simply not in the Laozi's vocabulary.

**水 (*shuǐ* — water).** 坎 (*kǎn*) is water as the thing you fall into — 說卦 ch 7 glosses it 陷
(*xiàn*, a pit) and the trigram is danger. Daodejing 8 is 上善若水, water as the model for conduct.
**The same image carries opposite valences in the two books**, and this is the sharpest single
argument against harmonising them.

---

## 6. The cautionary tale — six ways to overfit this, and how to tell

**The governing rule is already written:**
[`a-source-shaped-like-your-answer`](principles/a-source-shaped-like-your-answer.md) — *a source
offering something the same size and shape as the field you have to fill is the most dangerous
kind.* The Laozi is exactly that for this project: a finished, beloved, already-translated
philosophy the same shape as the meaning each hexagram owes. Everything below is that principle
firing.

**1 · Reading the core text through the Wings.** The measurements in § 3 exist to stop this. 道
appears four times in the core and means a road you walk on; 天地 and 萬物 are absent entirely.
Rendering the judgments and line texts as though they shared the Laozi's vocabulary imports two
thousand years and calls it translation.

**2 · Harmonising an image where the books conflict.** A translator who wants the two to agree
will soften 坎 toward the Laozi's water, or read 謙 back into chapters that never use the word.
[`divergence-stays-open`](https://github.com/shalomormsby/taoteching) forbids it: where they
differ, **the English must not settle it**, and the difference is more informative than the
agreement.

**3 · Taking the Laozi's side in a symmetrical pair.** See 剛柔 above. This is the subtlest of the
six, because it does not show up as a wrong word — it shows up as a consistent tilt across
hundreds of line texts, invisible in any one of them. It is the same shape of failure as
[`convergence-is-evidence`](principles/convergence-is-evidence.md): cheap per instance,
compounding, untraceable afterwards.

**4 · Parallel-hunting without a base rate.** Two texts of roughly 5,000 characters drawn from
roughly 800 graphs, sharing 312 of them, will produce coincidental matches without any historical
relationship at all. **The disciplining number is in § 4: exactly one four-character string is
shared with the core text** — and, as the note there records, **two of the three main editions
delete it.** Any future list of "parallels" that runs to dozens has stopped measuring and started
pattern-matching. Report the denominator, check the variant apparatus, or do not report the finding.

**A working habit that falls out of this:** when a parallel is good enough to be exciting, go and
try to destroy it before writing it down. Chapter 26 took four minutes and changed the finding.

**5 · Letting four pairs become a key.** That both books compose in paired opposites — 說卦 ch 3's
天地定位，山澤通氣，雷風相薄，水火不相射 and Daodejing 2's 有無相生，難易相成，長短相形，高下相盈 —
is a **shared compositional habit**, and habits are evidence about form, not hidden codes. The
moment the pairing is used to *generate* a reading rather than to *check* one, this project has
become 參同契: a system in which every hexagram can be made to mean whatever the system needs.
[`the-8-trigrams-are-arranged-in-4-pairs`](principles/the-8-trigrams-are-arranged-in-4-pairs.md)
is a rule about **where to look for evidence**, and its own *"where it does not fire"* section says
so.

**6 · Leaving the lens undeclared.** Reading the Yijing through Daoist metaphysics is an
**overlay**. It is a distinguished, canonical, seventeen-hundred-year-old overlay, and it is still
an overlay — the same category as Legge's Confucian frame and McClatchie's cosmogony, differing in
quality and in nothing else. This project catalogues overlays; it does not get to adopt one
silently. [`inheriting-means-saying-where-you-differ`](principles/inheriting-means-saying-where-you-differ.md)
obliges the record to name it.

### The two-question test

Before any Laozi reading enters an I Ching rendering:

1. **Does the character occur in the layer being rendered?** The tables in § 3 answer it. Core,
   Wings, or neither.
2. **Does the English answer to *that* character, or to the Laozi's?** That is
   [`renders-no-character`](https://github.com/shalomormsby/taoteching).

**Fail either and it is an overlay.** Which does not mean discard it — it means it goes in the
notes as commentary, never into `render:`.

---

## 7. The convergence that made the question worth asking

The Tao Te Ching project reached this independently, from the other end, and did not know it.
Glossing 河上公 (*Héshàng Gōng*) at chapter 23, its `notes/translation.md` and `chapters/023.md`
say:

> 同聲相應，雲從龍，風從虎，水流濕，火就燥 — *"like sounds answer each other: clouds follow the
> dragon, wind follows the tiger, water flows to the damp, fire goes to the dry."*
> **Four pairs. Every one is two things finding each other by kind.**

**That passage is the 文言傳 of hexagram 1 乾**, vendored here at
[`sources/zhouyi/01.md`](sources/zhouyi/01.md). Both projects arrived at *four pairs* weeks apart,
from opposite ends of the corpus, neither citing the other. The pattern was not imported into
either. It was found twice.

**That is the strongest evidence in this brief, and also the reason for § 6.** A pattern found
twice is worth building on. A pattern *looked* for, after you know what you want it to say, is
worth nothing.

---

## 8. 得意忘象, and the sentence this project answers it with

王弼's 明象 runs, in substance: the image is what brings out the meaning, and the word is what
clarifies the image; so the word exists to get the image — **get the image and forget the word**;
and the image exists to hold the meaning — **得意忘象**, get the meaning and forget the image. He
takes the figure from 莊子: the trap exists for the fish; get the fish and forget the trap.

**Taken as a slogan, it is the banner of the wrong side of this project's own argument.** It was
the 義理 (*yìlǐ* — meaning-and-principle) school's weapon against 象數 (*xiàngshù* — image-and-number),
and read flat it licenses skipping the images entirely: render 乾 as *the Creative*, 巽 as *the
Gentle*, and treat the hexagram figures as scaffolding to be kicked away. **This project has just
ruled the opposite** — the rendering is the **image**, not the action, decided across all eight
trigrams at once and recorded in [`glossary/乾-qian.md`](glossary/乾-qian.md).

**Shalom's answer restores the move Wang Bi's slogan leaves out:**

> **Meet the image. Grasp the meaning. Forget the image.**

**It adds the first beat, and the first beat is the translator's entire job.** 得意忘象 assumes you
already have the image — Wang Bi's full passage does say 尋象以觀意, *seek the image in order to see
the meaning*, but the four-character version travels without it, and what travels is a discarding
instruction. The three-beat version makes the sequence complete and makes the forgetting **earned**:
you cannot forget what you never met.

**And it draws the line where this project needs it drawn.** Meeting is the translator's work.
Grasping and forgetting are the **reader's** — and a translator who does them on the reader's
behalf hands over a conclusion with the evidence thrown away.

**That is exactly what every word on the `forbidden:` lists does.** *The Gentle*, *the Receptive*,
*the Abysmal*, *the Joyous*, *Heaven* — each one is a translator who met the image, grasped
something, forgot the image, and shipped the residue. 風自火出 (家人) is wind issuing from fire;
it is not a gentleness issuing from fire. **The forbidden lists have wanted this sentence as their
reason, and have been getting by on "the action rather than the image."**

---

## 9. What follows, and what is owed

**The stance this brief recommends is now written up as
[ADR 0016](../../docs/decisions/0016-the-i-ching-is-read-through-the-wings-and-the-lens-is-declared.md),
where it stands as `Proposed` and binds nothing until Shalom accepts it:** **read the Zhouyi through
the Wings, read the Wings through the same lens as 王弼 — taking his cross-reading and declining his
image-sweeping — and say so in the front matter.** It is the tradition's own
mainstream, it is what the vendored Laozi recension already commits the sibling project to, and
declaring it converts an invisible overlay into a stated method.

**What this brief owes before any of it is load-bearing:**

- **王弼's 周易注 and 周易略例 are not vendored, and all of § 2 and § 8 is written from memory.**
  That is precisely what
  [`never-supply-what-the-source-withheld`](principles/never-supply-what-the-source-withheld.md)
  forbids in a rendering, and it is tolerable here only because the file is marked as a brief and
  says so three times. **Vendor them before 得意忘象 is quoted anywhere that binds a decision** —
  and the route is already proven rather than hypothetical: the sibling project vendors his
  **Laozi** commentary from the 欽定四庫全書 via Chinese Wikisource mainspace, `{{PD-old}}`, through a
  reproducible importer that checks every lemma against its own base text. The same argument
  (public domain by age, author d. 249, printing 1782) carries his Changes commentary unchanged.
  The biography, the 裴徽 anecdote, the Lynn editions and the dating in § 2 all want the same
  treatment — none of it is load-bearing yet, and none of it may become load-bearing while it is
  still remembered rather than held.
- **The measurements want a script.** They were computed once, by hand, in a scratch directory.
  Until they are `pnpm xenso:` something, they are a claim rather than a grade —
  [`a-grade-must-be-testable`](principles/a-grade-must-be-testable.md).
- **君子 should be ruled here and promoted to the parent's lock table**, not written twice. It is
  the first term this project will settle that the Tao Te Ching project needs.
