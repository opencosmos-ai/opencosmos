# WORKLIST — what this translation still owes

*The single forward-looking file for `knowledge/iching/`. Everything here has a status that
needs keeping current. When an item closes it leaves the list and becomes one line in the
ledger at the foot — the reasoning already lives somewhere permanent, and repeating it here
is how a debt list goes stale.*

**Where things live.** The **ruling and its argument** go in [`glossary/`](glossary/README.md).
The **rendering** goes in `hexagrams/NN.md` / `trigrams/*.md` as `render:`. **Evidence** is
[`sources/`](sources/PROVENANCE.md), vendored and never hand-edited. **What is owed** is here.
**What happened** is [`CHANGELOG.md`](CHANGELOG.md). **Rules learned** are
[`principles/`](principles/INDEX.md). Nothing belongs in two of those.

**Last updated:** 2026-09-12

---

## Where the project actually stands

**Five sources vendored, ten principles written, and not one English word drafted.**
72 renderings, all `render: null`, all `status: draft`. Zero glossary entries. The parent
Tao Te Ching project has 49 glossary entries and 81 drafted chapters.

The principles split **9 sources · 6 tooling · 4 drafting**, and
[`principles/README.md`](principles/README.md) already names that ratio as the thing to
watch: while it does not shift toward `drafting`, this project is building instruments
rather than translating. Three sessions have gone into the evidence layer. It was worth
doing — the Chinese-page bug alone was corrupting 39 pages of vendored text — but the
next thing should be a rendering, not another instrument.

**The order of work is set by [`method.md`](method.md) §7**, and it is set by frequency,
not by position: the eight trigrams, then the verdict vocabulary as one decision, then
君子/小人, then the 64 names, then the judgments and line texts.

---

## The list

**⬜ open · 🔶 part done · ✅ done · ⏸ deferred by Shalom · 🔴 blocked on Shalom**

| # | | Item | Where | Unit |
|---|---|---|---|---|
| | | **A · Drafting — the actual work** | | |
| A1 | 🔶 | **The eight trigrams** — six proposed, two blocked on a call | `trigrams/` | 8 |
| A2 | 🔴 | **巽 is two images** — 風 in 10 of its 大象傳, 木 in 5. One `render:` cannot hold both | `trigrams/05-xun.md` | 1 |
| A3 | 🔴 | **澤 — what kind of water.** `lake` leads on the evidence; `marsh`, `pool`, `basin` live | `trigrams/02-dui.md` | 1 |
| A4 | ⬜ | **The verdict vocabulary, decided as one set** — 吉 凶 咎 悔 吝 厲 无咎. 386 occurrences, 9.3% of the text; decide them individually and they will overlap | `glossary/` | ~7 |
| A5 | ⬜ | **君子 (20×) and 小人 (10×)** — not in the parent glossary, so written from scratch. Register *and* gender; `universalize-and-name-the-seam` applies | `glossary/` | 2 |
| A6 | ⬜ | **貞 (111×) · 亨 (48×) · 孚 (42×)** — the divinatory/ethical fork, the deepest open question in the project. Read all three translators before touching any of them | `glossary/` | 3 |
| A7 | ⬜ | **The 64 hexagram names** | `hexagrams/` | 64 |
| A8 | ⬜ | **The judgments and line texts** — 64 × 8 | `hexagrams/` | 512 |
| A9 | ⬜ | **Hexagram-name concordance against the locks**, before any name is drafted | — | 1 |
| | | **B · Evidence — what the sources still owe** | | |
| B1 | ⬜ | **1,947 OCR disputes still unsettled** in McClatchie — both engines disagree and the scan could not resolve it | `sources/mcclatchie-1876/disputed.yaml` | 1947 |
| B2 | ⬜ | **說文解字 not vendored** — corner 3 of the four. Until it is, argue from the graph and say that is what you are doing | `sources/` | 1 |
| B3 | ⏸ | **The Chinese half of McClatchie is not transcribed** — a rule, not a shortfall. Route named: `brew install tesseract-lang`, `chi_tra_vert` | `sources/` | 1 |
| B4 | ⬜ | **Legge's footnotes not vendored** | `sources/legge-1882/` | 1 |
| B5 | ⬜ | **`prescrves-the «`-class errors** — multi-token blocks straddling a line break are left alone by design; a proofreading pass would need the scan | `disputed.yaml` | — |
| | | **C · Tooling** | | |
| C1 | ⬜ | **No glossary index generator** — the parent has one; `glossary/` here has none | `scripts/xenso/` | 1 |
| C2 | ⬜ | **`build-iching.ts` does not check `glossary_refs:` resolve** — a rendering can cite an entry that does not exist | `scripts/xenso/` | 1 |
| C3 | ⬜ | **No check that a rendering respects the locks** — 47 locked terms, enforced by reading rather than by code | `scripts/xenso/` | 1 |
| C4 | ✅ | ~~Two OCR witnesses, corpus and scan adjudication~~ — closed 2026-09-12 | — | — |
| C5 | ✅ | ~~`mcPageBody` truncating pages at the first long line~~ — closed 2026-09-12 | — | — |

---

## A1 · The eight trigrams

**Six are proposed and two are blocked.** The evidence is in `glossary/` — one entry each —
and the reasoning common to all eight is this: **說卦 gives every trigram two glosses**, an
action in chapter 7 (乾，健也) and an image in chapter 11 (乾為天), and the 大象傳 bound into
every hexagram operates on the **images**:

| | 天 | 地 | 雷 | 山 | 澤 | 水 | 風 | 火 | 木 |
|---|---|---|---|---|---|---|---|---|---|
| across the 64 大象傳 | 18 | 17 | 15 | 15 | 15 | 11 | 10 | 10 | 5 |

against 健 1 · 順 2 · 入 2 · 麗 1 · 動 0 · 陷 0 · 止 0 · 說 0. So rendering by image is not
promoting one Wing's gloss over another — it is the reading the vendored text runs on.

Proposed: 乾 **sky** · 坤 **earth** · 震 **thunder** · 坎 **water** · 離 **fire** · 艮 **mountain**.
乾 is constrained by the lock on 天 (*sky*, "Heaven" forbidden) and 坤 by 天地 → *sky and earth*.

## A2 · 巽 is two images 🔴

風 in 10 of its 大象傳 (風行天上, 山下有風, 天下有風) and 木 in 5 (木上有火, 地中生木,
山上有木, 木上有水, 澤滅木). 說卦 ch 11 lists both: 巽為木、為風. One `render:` shows one
word, so one of these readings becomes invisible in five hexagrams — including 鼎 (50),
whose whole image is fire over **wood**.

**Recommendation: `wind`**, with the seam named in the entry and 木 carried in the
hexagram-level notes for those five. Wind is the majority reading, it is what 巽 does
(入, entering, penetrating), and "wood" cannot carry 風行水上. But this loses something
real and the alternative — rendering per hexagram rather than per trigram — is a change
to the data shape, which is Shalom's call.

## A3 · 澤 — what kind of water 🔴

15 occurrences, all in the 大象傳. Two of them constrain the English hard: **47 困 澤无水**
("澤 without water") is incoherent if 澤 *is* the water, so 澤 is the hollow that holds it; and
**60 節 澤上有水** puts water *above* it, because the hexagram is about a basin's capacity. And it
cannot be "water" — 坎 already is.

`lake` survives thirteen of the fifteen cleanly and pairs with 山 the way 咸 (31) and 損 (41)
need; its one real strain, 60, is a strain in the Chinese too. `marsh` fits 47 best and fits the
trigram worst — 說卦 glosses 兌 **說** (= 悅), delight, and *marsh* carries bog and stagnation.
McClatchie's **Moisture** (12×) is true to 澤's other half — lustre, 恩澤, beneficence — and
cannot be a tier that holds a fire (49) or lies empty (47).

**Leading: `lake`.** That it is also the popular English is neither a reason to take it nor a
reason to avoid it — [[convergence-is-evidence]]. → [`glossary/兌-dui.md`](glossary/兌-dui.md)

*A3 was previously written as "marsh or lake" with lake ruled out for being Wilhelm's. That was
not a reason, and the entry has been redone from the evidence.*

---

## Closed — the ledger

- **2026-09-12** · McClatchie OCR: two witnesses, corpus and scan adjudication, page
  truncation fixed. 7.19% → 4.50%; 60 of 64 complete. → [CHANGELOG](CHANGELOG.md)
- **2026-09-12** · `method.md` §2 rewritten around **derivation**, after two related errors on
  one day: "Never for a word" would have forbidden *thunder* for 雷, and 澤 was ruled away from
  *lake* because the word is Wilhelm's — fusing the source-admission rule with a rule about
  renderings. No English word is unavailable because a prior translator used it, and convergence
  is evidence. → [[convergence-is-evidence]]
- **2026-09-11** · Five sources vendored; `principles/` started. → [CHANGELOG](CHANGELOG.md)
- **2026-08-19** · The substrate seeded, self-checking. → [CHANGELOG](CHANGELOG.md)
