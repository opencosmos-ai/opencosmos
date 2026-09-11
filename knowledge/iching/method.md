# Method — how an I Ching rendering gets made

*[`README.md`](README.md) says what is here. [`sources/PROVENANCE.md`](sources/PROVENANCE.md) says what may be here and on what authority. This file says **how to turn the one into the other**.*

It is a local adaptation of the Tao Te Ching project's [`process/method.md`](https://github.com/shalomormsby/taoteching), and it inherits that project's [principles](https://github.com/shalomormsby/taoteching) wholesale — twenty-seven of them, each firing on a stated trigger. **Where this file and those principles disagree, the principles win and this file is the bug.**

---

## 1. What is being decided

Not a chapter. Four things, in this order of scope:

| Unit | Count | Where the decision lives |
|---|---|---|
| A trigram's English | 8 | `trigrams/*.md` → `render` |
| A verdict word's English | ~11 | needs a glossary, and has none yet |
| A hexagram's name in English | 64 | `hexagrams/*.md` → `render` |
| A judgment, an image, six line texts | 64 × 8 | `hexagrams/*.md` → `judgment`, `image`, `line_texts` |

`render` is **one word or one short phrase** — the single term a player sees. That constraint is the hardest thing about this project and it is not negotiable: the interface has one slot.

---

## 2. Triangulating meaning — the four corners

The rule that makes this both original and legally clean is the parent project's, unchanged:

> **Consult sources for *meaning*, never for *phrasing*.** Reading a commentary or an old translation to understand what a line *means* is research. Borrowing anyone's English *words* is not.

**The corners, all now in `sources/`:**

1. **The Chinese.** `sources/zhouyi/NN.md` — the judgment and the six line texts. This is the only text a rendering answers to.
2. **The Wings.** The classical interpretive tradition, and the oldest one there is for this book. 彖傳 and 象傳 are in the hexagram's own file; 說卦 and 雜卦 are in `sources/wings/`. **They are commentary, not text** — see §5.
3. **The characters themselves.** 說文解字 and the radical-level reading. Not vendored yet; on the wanted-list. Until then, argue from the graph as it stands and say that is what you are doing.
4. **The three old translations.** `sources/legge-1882/NN.md`, `sources/harlez-1889/NN.md` and `sources/mcclatchie-1876/NN.md`. For the range of readings and the construal of line positions. **Never for a word.**

**Method:** gather the four, form an independent reading, then render in Shalom's voice.

**Use corner 4 as a set, not as three singles.** The three disagree about what kind of book this is — Legge reads an oracle through the Confucian commentaries, de Harlez denies it was ever an oracle, McClatchie reads a cosmogony and says so. Where they converge the reading is well supported; where they split the decision is live. That spread is the most useful signal in the repository.

**And they are all missionary work**, which is the second thing to hold while reading them: Legge for the London Missionary Society, de Harlez a Catholic monsignor, McClatchie an Anglican who argues in his Appendix that 神 *means* God. The public-domain English I Ching has no neutral witness, so the overlay is not avoided by choosing among them — only measured across them.

---

## 3. What makes this book different from the Tao Te Ching

**It is mostly formula.** The judgments and line texts together are **4,163 characters drawn from 794 distinct graphs**, and a small set of oracular formulae accounts for a startling share of them:

| | Occurrences |
|---|---|
| 吉 凶 咎 悔 吝 厲 — the verdict graphs | **386 (9.3% of the text)** |
| 貞 | 111 |
| 利 | 119 |
| 无咎 | 92 |
| 亨 | 48 |
| 孚 | 42 |
| 貞吉 | 36 |
| 元 | 27 |
| 有孚 | 26 |
| 利貞 | 23 |
| 君子 | 20 |
| 利有攸往 | 13 |
| 利涉大川 | 10 |
| 元亨利貞 | 6 |

**This changes the order of work, and it is the single most important practical fact in this file.** [`repeat-yourself`](https://github.com/shalomormsby/taoteching) holds that where the Chinese repeats itself, the English must repeat itself. In the Tao Te Ching that governs a few dozen lines. Here it governs the spine of the book: **a rendering of 无咎 settled at hexagram 60 has to hold at the other ninety-one occurrences, or be retrofitted to all of them.**

So: **decide the formulae before the particulars.** A verdict word chosen late is not one decision made late, it is ninety-two decisions unmade.

---

## 4. The overlay, in this book

The parent project's [overlay audit](https://github.com/shalomormsby/taoteching) applies in full, and its Tier 1 rulings are already locked and already measured against this text — see `sources/locks/README.md`. 天 occurs 122 times here and is locked away from "Heaven". 王 occurs 45 times and is locked away from "king".

What follows is the **I Ching's own watchlist**: places where this book, and not the Tao Te Ching, is where the overlay enters. **None of these is a ruling.** They are open questions with the evidence named, and each one is a glossary entry waiting to be written.

### The divinatory / ethical fork — the big one

Three of the commonest words in the book have an older, concrete, divinatory sense and a later, abstract, moral sense that the Confucian commentarial tradition settled on. Legge translates all three in the later sense, because the tradition he read them through had already made that choice five hundred years before him.

**And this is exactly where the other two witnesses earn their place.** De Harlez's whole preface is an argument that the divinatory frame was imposed late — so on these three words he is not merely a different translator, he is the other side of the question, argued in print in 1889. McClatchie is a third position again: he keeps the oracle but reads it as cosmogony, and renders 亨 as **"Luxuriance"**, a phase of growth in nature rather than either "success" or "offering". Where the three split on 貞, 亨 or 孚, that is the fork itself showing, not a translator's preference. Read all three before touching any of the three words.

**貞 (111×)** — Legge: *"firm and correct."* The received reading is moral: steadfastness, chastity, rectitude. The older reading is procedural: 貞 as **the act of divining**, the inquiry itself — 貞吉 then means not "firmness brings good fortune" but something closer to "the inquiry: auspicious." The graph carries 卜, the cracking oracle bone. **Whichever way this goes it is decided 111 times**, and the two readings are not reconcilable by a clever English word. This is the deepest open question in the project.

**亨 (48×)** — Legge: *"successful progress."* The graph is shared with 享, *to make an offering*. The older reading is sacrificial; the received reading is "penetrating, successful."

**孚 (42×)** — Legge: *"sincerity."* The graph shows a hand over a child, and is shared with 俘, *captive*. The received reading is inward — good faith, trustworthiness. The older reading is concrete and much harsher.

**[`divergence-stays-open`](https://github.com/shalomormsby/taoteching) governs all three: where the commentators diverge, the English must not settle it.** That does not mean refusing to choose a word. It means the notes carry the fork, and the chosen word does not pretend the other reading was never there.

### 君子 (20×) and 小人 (10×)

Legge: *"the superior man"* and *"the small man."* Wilhelm–Baynes keeps both. **McClatchie: "the Model Man"**, seventy-two times. This pair is **not in the Tao Te Ching glossary at all**, so nothing is locked and an entry has to be written from scratch — but it no longer has to be written against a single inherited rendering, which is what McClatchie was worth importing for.

Two problems at once. **Register**: "the superior man" is Victorian Confucianism, and it moralises a term whose sense in the line texts is often closer to *the one in a position of responsibility* — the person the oracle is addressed to. **Gender**: 子 is a son. [`universalize-and-name-the-seam`](https://github.com/shalomormsby/taoteching) is explicit — render toward the universal, honouring the philosophy, and name the seam in the notes rather than erasing it.

### The verdict graphs (386×)

**吉 / 凶** — Legge: *"good fortune"* and *"evil."* 凶 is an outcome, not a moral judgment, and "evil" is [`no-verdict-the-chinese-lacks`](https://github.com/shalomormsby/taoteching) in a single word.

**咎** — Legge: *"error," "mistake."* Blame, fault, the thing you would be held to account for. 无咎 at ninety-two occurrences is the most-repeated phrase in the book.

**悔 / 吝 / 厲** — regret, stinting/trouble, danger. A graded scale that English will flatten unless the whole scale is decided at once, as a set. Decide them individually and they will overlap.

### 神 — and the one source that argues for the overlay

Already locked to **numinous potency, never "God" and never "the divine."** McClatchie's Appendix is the reason to keep that lock in view here rather than inherit it quietly: he devotes pages to arguing that 神 *"signifies… God, Gods"* and *"never means 'Spirit' in any Chinese book whatever."* [`sources/mcclatchie-1876/appendix.md`](sources/mcclatchie-1876/appendix.md) is the primary document of the position the lock rejects, and worth reading once in full before rendering 神 anywhere.

### 帝 (in 說卦: 帝出乎震)

Already locked in the glossary to *god — any god* — with "God", "the Lord", "Creator", "heaven" and "emperor" all forbidden. It appears here in the Shuogua's account of the trigram cycle, and it will be the first place a reader feels a creator arriving.

**And there is a worked example of the failure sitting in `sources/`.** McClatchie's Book IV renders 帝出乎震 as *"The (Supreme) Emperor issues forth in the Chin Diagram"* and, one chapter later, the same character as *"God"* — **two of the five forbidden renderings, in one text, four pages apart.** Read [`sources/mcclatchie-1876/book-4-treatise-on-the-diagrams.md`](sources/mcclatchie-1876/book-4-treatise-on-the-diagrams.md) beside [`sources/wings/shuogua.md`](sources/wings/shuogua.md) before rendering 帝 anywhere: it is the cleanest demonstration in the repository of what the lock is for.

---

## 5. The Wings are commentary

彖傳, 象傳, 文言 and 說卦 are the oldest interpretation of this text in existence, and they are still interpretation. [`commentary-is-not-a-rendering`](https://github.com/shalomormsby/taoteching) fires on exactly this: *a commentator's gloss is an argument for a rendering, never a rendering.*

The trap is specific and this project will walk into it if it is not named. **說卦 says 乾為天 — "qian is sky".** That is a Warring States gloss, not a definition, and rendering the trigram *as* its Shuogua image would silently promote one Wing's reading into the name a player sees. **雜卦 is the same trap in more tempting form**: sixty-four one-line glosses, exactly the length of a `render`, and it would be very easy to translate that file and call the job done.

Use them. Do not copy them.

---

## 6. The principles

**Two sets, and they do not overlap.**

**The Tao Te Ching project's twenty-seven apply here in full.** They are not restated in this repository — [`principles/README.md`](principles/README.md) explains why not, and the rule against copying them is itself one of the local ones. These are the inherited ones this book will trip hardest:

- [`repeat-yourself`](https://github.com/shalomormsby/taoteching) — §3. The governing constraint.
- [`already-spoken-for`](https://github.com/shalomormsby/taoteching) — **sharpened almost to breaking point here.** Sixty-four hexagrams need sixty-four *distinct* single-word renders, plus eight for the trigrams. The English words for difficulty, obstruction, hardship, adversity and danger will run out before the hexagrams do — 3, 29, 39, 47 and 12 all compete for them. This needs a register kept across all seventy-two, not decided one file at a time.
- [`commentary-is-not-a-rendering`](https://github.com/shalomormsby/taoteching) — §5.
- [`divergence-stays-open`](https://github.com/shalomormsby/taoteching) — §4.
- [`no-verdict-the-chinese-lacks`](https://github.com/shalomormsby/taoteching) — the verdict graphs, and 小人.
- [`universalize-and-name-the-seam`](https://github.com/shalomormsby/taoteching) — 君子, and the wife/concubine/expedition material in the line texts, which is more socially specific than anything in the Tao Te Ching.
- [`renders-no-character`](https://github.com/shalomormsby/taoteching) — the guard that makes Legge safe to read. Every English word answers to a character in `sources/zhouyi/`.
- [`witnesses-before-drafting`](https://github.com/shalomormsby/taoteching) — check the sources before drafting, not after. They are in the repository now; there is no excuse.
- [`one-question-at-a-time`](https://github.com/shalomormsby/taoteching) — bring Shalom the deepest open question, with a recommendation. Not a menu.

**And nine are this project's own** — see [`principles/INDEX.md`](principles/INDEX.md), which is generated and whose evidence links are build-verified. They are mostly about evidence rather than drafting, because here the evidence came first and arrived damaged: five sources were vendored before a single word was rendered. The ones that bear on the work ahead:

- [`frequency-sets-the-order`](principles/frequency-sets-the-order.md) — §3 and §7 of this file, stated as a rule. **Do not start at hexagram 1.**
- [`a-source-shaped-like-your-answer`](principles/a-source-shaped-like-your-answer.md) — §5 of this file, stated as a rule. 雜卦's sixty-four one-line glosses are the exact shape of `render`, and that is the danger.
- [`no-neutral-witness`](principles/no-neutral-witness.md) — why all three translations are vendored rather than the least contaminated one chosen.
- [`never-supply-what-the-source-withheld`](principles/never-supply-what-the-source-withheld.md) — the line the AI collaborator does not cross, and the reason the Chinese pages of McClatchie are not transcribed.

---

## 7. The order of work

Atoms before molecules; formulae before particulars. Each stage closes questions the next one would otherwise have to reopen.

**1. The eight trigrams.** The smallest set, and every hexagram name sits on top of them. 說卦 is now in hand. Two of the eight are nearly free — 乾為天 and 坤為地 meet a lock that already says *sky* and *earth* — which makes them the right place to find out whether the Shuogua image should drive the render at all, on the two cases where the answer is least in doubt. *(§5 says it should not. Test that on 乾 and 坤 before it costs anything.)*

**2. The verdict vocabulary, as one decision.** 吉 凶 咎 悔 吝 厲, then 貞 亨 利 元 孚. Eleven entries covering roughly a fifth of the text. **This needs a glossary directory that does not exist yet** — `glossary/`, on the taoteching model, with the same frontmatter and the same `status: locked` discipline, so that `terms.yaml` and the I Ching's own locks can be checked together.

**3. 君子 and 小人.** One entry, both terms, because they are a pair and deciding either alone will misplace the other.

**4. The sixty-four names.** Only after 1–3, and only with the whole set in view at once — see `already-spoken-for` above.

**5. The judgments, then the line texts.** By then most of the words are already decided.

**Before any of it:** the [hexagram-name concordance against the locks](sources/PROVENANCE.md) — item 3 on the wanted-list. It is mechanical, it is an afternoon, and it turns thirty-six measured locks into sixty-four answered questions.
