# 十翼 — the Ten Wings

*What they are, where they came from, and which of them this project holds. The rule for **using**
them is one line and it is not here: they are commentary, not text — [`method.md`](../../method.md)
§ 5.*

**Counts are measured** from the vendored files and can be recomputed. **Origins and dating are
remembered, not vendored** — flagged again where they appear, and owed a source before they bind
anything ([`WORKLIST.md`](../../WORKLIST.md) B6 is the same debt for 王弼).

---

## What a "wing" is

**翼 (*yì*) is a wing, and as a verb, to assist.** The image is a text flanked by what helps it fly.
Everything under that name is **commentary written centuries after the thing it comments on** — the
64 hexagram statements and 386 line texts of the 周易 (*zhōuyì*), which are Western Zhou divination
material.

**"Ten" is a count of scrolls, not of works.** There are **seven** distinct compositions; three of
them are long enough to be split in two, which brings the total to ten. And two of those splits are
not the works' own: 彖傳 and 象傳 divide into upper and lower because **the hexagrams do** — 上經 is
hexagrams 1–30, 下經 is 31–64 — so the seam belongs to the book being commented on, not to the
commentary. Only 繫辭 is genuinely a two-part work.

---

## The ten, and what this project holds

| # | Wing | What it does | Where it is here | Size |
|---|---|---|---|---|
| 1–2 | **彖傳** (*tuàn zhuàn*) — Judgment commentary | Explains each hexagram's **judgment** from its trigram structure and line positions. The *why* behind the 卦辭 | inside each `sources/zhouyi/NN.md` | 2,912 · **64/64** |
| 3–4 | **象傳** (*xiàng zhuàn*) — Image commentary | Two distinct things under one name, and this project separates them: | | |
| | ↳ **大象傳** the Great Image | One per hexagram, always *"[trigram] over [trigram]; the 君子 accordingly…"*. **The layer the eight trigram renderings serve** | `## 大象傳` | 869 · **64/64** |
| | ↳ **小象傳** the Small Image | One terse gloss per **line** — 386 of them | `## 小象傳` | 3,617 · **64/64** |
| 5–6 | **繫辭傳** (*xì cí zhuàn*) — the Great Treatise | The philosophical core: 太極, 陰陽, 剛柔相推, how the Yi was made, how a cast works. **Where this book's vocabulary is closest to the Laozi's** | [`xici-shang.md`](xici-shang.md) · [`xici-xia.md`](xici-xia.md) | 4,573 · 21 ch |
| 7 | **文言傳** (*wén yán zhuàn*) — Words of the Text | Extended ethical commentary on **hexagrams 1 乾 and 2 坤 only**. Home of 同聲相應 | `## 文言傳` | 1,053 · **2/64** |
| 8 | **說卦傳** (*shuō guà zhuàn*) — Discussion of the Trigrams | The eight trigrams: images, actions, directions, kin, attributes. **Everything in [`trigrams/`](../../trigrams/) answers to this** | [`shuogua.md`](shuogua.md) | 1,017 · 11 ch |
| 9 | **序卦傳** (*xù guà zhuàn*) — Sequence of the Hexagrams | Why the 64 run in King Wen order — a chain of *"X, therefore Y"* | [`xugua.md`](xugua.md) | 920 |
| 10 | **雜卦傳** (*zá guà zhuàn*) — Miscellaneous Notes | 64 one-line glosses, mostly in contrasting pairs | [`zagua.md`](zagua.md) | 516 |

**All ten are vendored, complete**, from Chinese Wikisource mainspace transcriptions — the five
standalone files here, and Wings 1, 3, 4 and 7 interleaved into the hexagram files where the
orthodox edition puts them.

### The number that should govern how this project talks about "the I Ching"

| | characters |
|---|---|
| the **core text** — 卦辭 716 + 爻辭 4,219 | **4,935** |
| the **Wings** | **15,477** |

**The commentary is three times the size of the text it comments on.** Anyone reading an English
"I Ching" is reading a merged object, and mostly reading the Wings.

---

## Where they came from

*Remembered, not vendored. Verify before relying on any of it.*

**The traditional attribution is to Confucius**, and it comes from 史記 (*Shǐjì*, c. 100 BCE), which
says he delighted in the Yi in old age and 序 — *put in order*, or *composed*; the verb is
ambiguous and the ambiguity has been argued over ever since — the 彖, 繫, 象, 說卦 and 文言. **That
attribution is why the Yijing is a Confucian classic** rather than a diviner's handbook, why it
sits among the Five Classics, and why the Chinese commentarial tradition on it is enormous.

**The doubt is also old and is native.** 歐陽修 (*Ōuyáng Xiū*, 1007–1072), in 易童子問, argued that
Confucius did not write the 繫辭 — his sharpest point being that **the Wings quote him by name**,
子曰, *"the Master said."* A man does not introduce his own sentences that way.

**Modern consensus puts them in the Warring States to early Han period**, roughly the 4th to 2nd
centuries BCE — composite, many hands, and not all of one date. Which means the gap between the core
text and its commentary is **several centuries at minimum**, and the Wings are nearer in time to the
Laozi than to the hexagram statements they explain.

**And "ten" is a Han canonisation, not a fact about the texts.** The Mawangdui silk manuscripts
(buried 168 BCE) carry a 繫辭 differing from the received one **plus commentaries that are not in the
received Ten at all** — 二三子問, 要, 繆和, 昭力 and others. In the second century BCE the corpus was
still open. Somebody later closed it at ten.

---

## Why this matters here, in three consequences

**1 · The trigram renderings come from Wing 8.** Sky, earth, thunder, wind, water, fire, mountain,
lake are 說卦's images, and 說卦 is commentary written centuries after the hexagrams. That is a real
dependency and it is now stated rather than assumed — see
[ADR 0016](../../../../docs/decisions/0016-the-i-ching-is-read-through-the-wings-and-the-lens-is-declared.md).

**2 · The file layout already merged them.** `sources/zhouyi/NN.md` holds 卦辭, 爻辭, 彖傳, 大象傳 and
小象傳 in one file because the orthodox edition interleaved the Wings under the hexagrams somewhere
in the Han–Wei period. The sections are kept **separately labelled** here precisely so a reader can
tell 1000 BCE from 300 BCE — which no printed English translation lets you do.

**3 · Wing 10 is the specific trap.** 雜卦's 64 one-line glosses are the exact shape and length of a
`render:`, which makes translating that file and calling the job done very easy —
[`a-source-shaped-like-your-answer`](../../principles/a-source-shaped-like-your-answer.md).
