---
id: "xun"
character: "巽"
pinyin: "xùn"
kind: trigram
lines: "011"
shuogua_image: "風 · 木"
render: "wind"
forbidden: ["the gentle", "penetration"]
status: draft
since: 2026-09-12
occurrences: { daxiang_wind: 10, daxiang_wood: 5 }
evidence:
  - "../sources/wings/shuogua.md"
  - "../sources/mcclatchie-1876/book-4-treatise-on-the-diagrams.md"
---

# 巽 — `wind`

**巽 is the only trigram 說卦 gives two images to**, and it gives them in the same breath:
**巽為木、為風**. Both are live in the 大象傳, and they are not a gloss and a variant — they are
two different physical things, stacked against other tiers in different hexagrams.

| | hexagrams |
|---|---|
| **風**, 10 | 9 小畜 風行天上 · 18 蠱 山下有風 · 20 觀 風行地上 · 32 恆 雷風 · 37 家人 風自火出 · 42 益 風雷 · 44 姤 天下有風 · 57 巽 隨風 · 59 渙 風行水上 · 61 中孚 澤上有風 |
| **木**, 5 | 28 大過 澤滅木 · 46 升 地中生木 · 48 井 木上有水 · 50 鼎 木上有火 · 53 漸 山上有木 |

One `render:` shows one word, so **whichever is chosen, five or ten hexagrams get an image the
text does not support.** 鼎 (50) is the sharpest case: its whole 大象 is 木上有火 — fire over
**wood**, a cauldron on a cooking fire — and "wind" makes it meaningless. Equally, 渙 (59) is
風行水上, wind moving over water, and "wood" makes *that* meaningless.

## The ruling — `wind`, Shalom's call, 2026-09-12

**Two things decided it, and neither was the 10-to-5 count.**

**First, 說卦 uses 風 every time it names the eight as a system.** Chapter 3 arranges them in four
pairs — 天地定位，山澤通氣，**雷風**相薄，水火不相射, *"sky and earth set the positions; mountain
and lake exchange breath; **thunder and wind** rouse each other; water and fire do not quench each
other."* Chapter 4: 雷以動之，**風**以散之. Chapter 6, twice — 橈萬物者，莫疾乎**風**, and then the
four pairs made again in different words: 故水火相逮，**雷風**不相悖，山澤通氣. **木 appears in none
of them** — it is one of eleven items in the ch 11 attribute list, beside "a straight cord", "an
artificer" and "scent". Wind is the structural member of the set; wood is an attribute, and a
grouping the text repeats outranks a list it states once — see [[the-8-trigrams-are-arranged-in-4-pairs]].

**Second, the eighth word is constrained by the other seven.** sky · earth · thunder · water ·
fire · mountain · lake are all things you can point at in a landscape. *Wood* is a material, and
it breaks the level of abstraction the other seven hold. The eight are the alphabet of the book —
every hexagram is two of them, so the set is read sixty-four times and its coherence is a property
of the whole translation, not of this entry. See [[a-closed-set-is-one-decision]].

## The five 木 hexagrams keep their wood, and nothing is lost

The dilemma below was posed wrongly: it assumed `render:` had to carry the image for every
hexagram 巽 appears in. It does not. **`image:` in each hexagram file is a separate rendering of a
separate sentence** — the 大象傳 — and 鼎's is 木上有火, *fire above the wood*, a cauldron on a
cooking fire. That is what that sentence says and that is how it will be rendered. The trigram's
name and the hexagram's image are different objects, and asking one field to do both jobs is what
made this look like a conflict.

## Why the count alone does not resolve it

Both readings are original, not late. The graph 巽 is not a picture of either; the 說卦 gives
both without ranking them; and the 大象傳 uses both without signalling a switch. There is no
evidence that decides it, which means `divergence-stays-open` applies — **the English must not
settle what the Chinese leaves open.**

McClatchie writes **Wind 11 times and Wood 4** across his 大象傳, which tracks the Chinese
distribution rather than resolving it. He is the only one of the three whose Image sections are
vendored in English.

## The options, and what each costs

1. **`wind`** — the majority reading (10 of 15), and the one that matches what 巽 *does* in
   說卦 ch 7: 入, entering, penetrating, getting in everywhere. Costs 鼎, 井, 升, 漸, 大過 their
   image. **Recommended**, with 木 named in the notes for those five.
2. **`wood`** — costs the other ten, including 渙 and 姤, and loses the action sense entirely.
3. **Render per hexagram rather than per trigram** — correct, and a change to the data shape:
   `trigrams/*.md` would stop being the place a trigram's English lives, and
   [`build-iching.ts`](../../../scripts/xenso/build-iching.ts) would need the image resolved at
   the hexagram level. Truest to the text, most work, and **Shalom's call, not mine.**

**Settled: `wind`**, with the wood carried by `image:` in 28, 46, 48, 50 and 53.

## What is ruled out, and why

- **"the Gentle", "penetration"** — the action (說卦 ch 7: 入) rather than the image, which is the
  objection that rules out *the Receptive* for 坤 and *the Abysmal* for 坎. They also cannot stack:
  風自火出 (家人) is wind issuing from fire, not a gentleness issuing from fire.

Neither *wind* nor *wood* is ruled out. Both are 說卦's own, both are used by the 大象傳, and the
whole difficulty is that the text supports each — see [[convergence-is-evidence]] on why "someone
else chose this one" is not a tiebreaker.
