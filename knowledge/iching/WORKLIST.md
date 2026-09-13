# WORKLIST — what this translation still owes

*The single forward-looking file for `knowledge/iching/`. Everything here has a status that
needs keeping current. When an item closes it leaves the list and becomes one line in the
ledger at the foot — the reasoning already lives somewhere permanent, and repeating it here
is how a debt list goes stale.*

**Where things live.** The **ruling and its argument** go in [`glossary/`](glossary/README.md).
The **rendering** goes in `hexagrams/NN.md` / `trigrams/*.md` as `render:`. **Evidence** is
[`sources/`](sources/PROVENANCE.md), vendored and never hand-edited. **What is owed** is here.
**What happened** is [`CHANGELOG.md`](CHANGELOG.md). **Rules learned** are
[`principles/`](principles/INDEX.md). **Research that is not yet a ruling** is a dated brief —
so far one, [`tao-te-ching-relation.md`](tao-te-ching-relation.md). Nothing belongs in two of those.

**Last updated:** 2026-09-12

---

## Where the project actually stands

**Five sources vendored, thirteen principles written, and the first eight English words drafted.**
The eight trigrams carry a `render:` and eight glossary entries argue them. The 64 hexagrams are
still `render: null`, all `status: draft`. The parent Tao Te Ching project has 49 glossary entries
and 81 drafted chapters.

The principles split **11 sources · 7 drafting · 6 process · 5 tooling · 1 glossary**, and
[`principles/README.md`](principles/README.md) already names that ratio as the thing to
watch: while it does not shift toward `drafting`, this project is building instruments
rather than translating. It has begun to shift — the three newest entries are all about
getting from a character to an English word — and the next thing should be the next
rendering, not another instrument.

**The order of work is set by [`method.md`](method.md) §7**, and it is set by frequency,
not by position: the eight trigrams, then the verdict vocabulary as one decision, then
君子/小人, then the 64 names, then the judgments and line texts.

---

## The list

**⬜ open · 🔶 part done · ✅ done · ⏸ deferred by Shalom · 🔴 blocked on Shalom**

| # | | Item | Where | Unit |
|---|---|---|---|---|
| | | **A · Drafting — the actual work** | | |
| A1 | ✅ | ~~**The eight trigrams**~~ — all eight rendered, 2026-09-12 | `trigrams/` | 8 |
| A2 | ✅ | ~~**巽 is two images**~~ — **`wind`**; the five 木 hexagrams carry wood in `image:` | `trigrams/05-xun.md` | 1 |
| A3 | ✅ | ~~**澤 — what kind of water**~~ — **`lake`**, Shalom 2026-09-12 | `trigrams/02-dui.md` | 1 |
| A4 | ⬜ | **The verdict vocabulary, decided as one set** — 吉 凶 咎 悔 吝 厲 无咎. 386 occurrences, 9.3% of the text; decide them individually and they will overlap | `glossary/` | ~7 |
| A5 | ⬜ | **君子 (20×) and 小人 (10×)** — not in the parent glossary, so written from scratch. Register *and* gender; `universalize-and-name-the-seam` applies. **Rule it here and promote it to the parent's lock table** — 君子 is 20× here against 3× in the Laozi, and 君子終日 is the one four-character string the two books share | `glossary/` | 2 |
| A6 | ⬜ | **貞 (111×) · 亨 (48×) · 孚 (42×)** — the divinatory/ethical fork, the deepest open question in the project. Read all three translators before touching any of them | `glossary/` | 3 |
| A7 | ⬜ | **The 64 hexagram names** | `hexagrams/` | 64 |
| A8 | ⬜ | **The judgments and line texts** — 64 × 8 | `hexagrams/` | 512 |
| A9 | ⬜ | **Hexagram-name concordance against the locks**, before any name is drafted | — | 1 |
| A10 | 🔴 | **ADR 0016 — the Wings are the lens, and it is declared** — `Proposed`. Fixes whether this translates the Bronze Age core text or the book the Wings made of it; the trigram renderings already assume an answer. Accepting it adds a stated lens to `README.md` | [`0016`](../../docs/decisions/0016-the-i-ching-is-read-through-the-wings-and-the-lens-is-declared.md) | 1 |
| | | **B · Evidence — what the sources still owe** | | |
| B1 | ⬜ | **1,947 OCR disputes still unsettled** in McClatchie — both engines disagree and the scan could not resolve it | `sources/mcclatchie-1876/disputed.yaml` | 1947 |
| B2 | ⬜ | **說文解字 not vendored** — corner 3 of the four. Until it is, argue from the graph and say that is what you are doing | `sources/` | 1 |
| B3 | ⏸ | **The Chinese half of McClatchie is not transcribed** — a rule, not a shortfall. Route named: `brew install tesseract-lang`, `chi_tra_vert` | `sources/` | 1 |
| B4 | ⬜ | **Legge's footnotes not vendored** | `sources/legge-1882/` | 1 |
| B6 | ⬜ | **王弼's 周易略例 not vendored** — [`tao-te-ching-relation.md`](tao-te-ching-relation.md) §2 and §8 quote 得意忘象 **from memory**. Vendor it before the phrase binds any decision | `sources/` | 1 |
| B7 | ⬜ | **The two-corpus measurements have no script** — computed once by hand; until they are `pnpm xenso:`-something they are a claim, not a grade | `scripts/xenso/` | 1 |
| B5 | ⬜ | **`prescrves-the «`-class errors** — multi-token blocks straddling a line break are left alone by design; a proofreading pass would need the scan | `disputed.yaml` | — |
| | | **C · Tooling** | | |
| C1 | ⬜ | **No glossary index generator** — the parent has one; `glossary/` here has none | `scripts/xenso/` | 1 |
| C2 | ⬜ | **`build-iching.ts` does not check `glossary_refs:` resolve** — a rendering can cite an entry that does not exist | `scripts/xenso/` | 1 |
| C3 | ⬜ | **No check that a rendering respects the locks** — 47 locked terms, enforced by reading rather than by code | `scripts/xenso/` | 1 |
| C4 | ✅ | ~~Two OCR witnesses, corpus and scan adjudication~~ — closed 2026-09-12 | — | — |
| C5 | ✅ | ~~`mcPageBody` truncating pages at the first long line~~ — closed 2026-09-12 | — | — |

---

## A1 · The eight trigrams — done

**sky · earth · thunder · wind · water · fire · mountain · lake**

Decided as one set, not as eight, which is now [[a-closed-set-is-one-decision]]. The common
reasoning: 說卦 gives every trigram both an **action** (ch 7: 乾，健也) and an **image** (ch 11:
乾為天), and the 大象傳 bound into every hexagram runs on the images — across the 64 they name
天 18 times, 地 17, 雷 15, 山 15, 澤 15, 水 11, 風 10, 火 10, against 健 1, 順 2, 入 2, 麗 1, and
動 陷 止 說 not at all.

Constraints that came from the set rather than from any member: 坎 takes *water*, so 兌 cannot;
乾 is held to *sky* by the lock on 天 across 122 occurrences; and 巽 takes *wind* because *wood*
breaks the register the other seven hold. 說卦 confirms it — 天地定位，山澤通氣，**雷風**相薄，
水火不相射 (ch 3) names the eight as four pairs, and 木 appears in none of its systematising
passages.

**One thing still owed here:** the five hexagrams whose 大象傳 names 木 — **28 大過, 46 升,
48 井, 50 鼎, 53 漸** — must render *wood* in their own `image:` field. That is a different
sentence from the trigram's name, and 鼎 is a cauldron on a **wood** fire. Queued as part of A8.

---

## Closed — the ledger

- **2026-09-12** · **The eight trigrams rendered** (A1, A2) — sky · earth · thunder · wind ·
  water · fire · mountain · lake. The project's first English. → [glossary](glossary/)
- **2026-09-12** · **澤 → `lake`** (A3). 47 困 澤无水 shows 澤 is the hollow, not the water;
  lake survives 13 of 15 images and pairs with 山 as 咸 and 損 need. → [glossary](glossary/兌-dui.md)
- **2026-09-12** · McClatchie OCR: two witnesses, corpus and scan adjudication, page
  truncation fixed. 7.19% → 4.50%; 60 of 64 complete. → [CHANGELOG](CHANGELOG.md)
- **2026-09-12** · `method.md` §2 rewritten around **derivation**, after two related errors on
  one day: "Never for a word" would have forbidden *thunder* for 雷, and 澤 was ruled away from
  *lake* because the word is Wilhelm's — fusing the source-admission rule with a rule about
  renderings. No English word is unavailable because a prior translator used it, and convergence
  is evidence. → [[convergence-is-evidence]]
- **2026-09-11** · Five sources vendored; `principles/` started. → [CHANGELOG](CHANGELOG.md)
- **2026-08-19** · The substrate seeded, self-checking. → [CHANGELOG](CHANGELOG.md)
