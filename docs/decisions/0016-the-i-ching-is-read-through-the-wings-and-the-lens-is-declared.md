# 0016 — The I Ching is read through the Wings, and the lens is declared

**Date:** 2026-09-12 · **Status:** Proposed · **Relates to** [0003](0003-verification-first-only-verified-provenance-enters-the-corpus.md)

_Fixes which book `knowledge/iching/` is translating, and requires the interpretive lens to be stated in the front matter rather than operating invisibly._

## Context

`knowledge/iching/` translates the 周易 (*zhōuyì*). That name covers two things a translator must choose between, and the choice had been made implicitly.

**The 周易 is two texts bound together.** The **core text** — 64 hexagram statements and 386 line texts, roughly 4,900 characters — is Western Zhou divination material, terse, concrete, and largely pre-philosophical. The **Ten Wings** are Warring States to Han commentary, roughly three times longer, and they are where cosmology, ethics and the trigram system live. Every English I Ching silently merges them.

**The two layers are measurably different books**, and until 2026-09-12 nobody here had checked how different. Measured against the sibling Tao Te Ching project's vendored Laozi ([`knowledge/iching/tao-te-ching-relation.md`](../../knowledge/iching/tao-te-ching-relation.md) § 3):

| | Daodejing | Zhouyi core | Ten Wings |
|---|---|---|---|
| 道 (*dào*) | 70 | **4** | 104 |
| 天地 · 萬物 · 常 · 善 · 器 · 仁 · 極 | all present | **0 each** | all present |
| 陰 / 陽 | 1 / 1 | **1 / 0** | 19 / 19 |
| 聖人 (*shèng rén*) | 30 | **0** | 38 |
| graph inventory shared with the Laozi | — | 24.5% | **34.6%** |

**陰 occurs once in the entire core text and 陽 not at all.** The book everyone calls the yin-yang book got that vocabulary from its commentaries.

**Three forces were in tension.** The project has already committed to the Wings in practice — the eight trigrams were rendered from 說卦 (ADR-free, recorded in [`knowledge/iching/CHANGELOG.md`](../../knowledge/iching/CHANGELOG.md) 2026-09-12), and 說卦 ch 3's four-pairs passage is now a principle. The project's own rules forbid exactly that kind of import when it is unstated: `commentary-is-not-a-rendering`, `a-source-shaped-like-your-answer`, and the overlay audit that bars *Heaven* for 天. And the sibling project's base text is the 王弼 (*Wáng Bì*) recension, which commits it to a reader who read both books as one system — a commitment nothing in either repository had written down.

**Reading the Changes through Daoist metaphysics is an overlay.** A distinguished one, seventeen centuries old, canonical since 孔穎達's Tang edition — and still the same category as Legge's Confucian frame and McClatchie's cosmogony, differing in quality and in nothing else. This project catalogues overlays. It does not get to adopt one silently.

## Decision

**`knowledge/iching/` translates the 周易 as the Wings made it, and says so in the front matter.**

1. **The core text is the only text a rendering answers to.** Unchanged — `renders-no-character` still governs, and every English word answers to a character in `sources/zhouyi/`.
2. **The Wings are the primary interpretive authority**, ahead of the three old translations. They are the oldest reading in existence and the one the trigram system comes from.
3. **The lens is 王弼's cross-reading, and it is declared** — in `README.md` and `method.md`, not inferred from the renderings. Following him means taking his **cross-reading**, that these two books answer to one another. It does **not** mean taking his 掃象, the sweeping-away of the images: this project renders the trigrams *as their images*, which is the side of the Han argument Wang Bi demolished. [`method.md`](../../knowledge/iching/method.md) § 0 makes that repair — *"Meet the image. Grasp the meaning. Forget the image."*
4. **The two-question test gates every import from the Laozi.** Does the character occur in the layer being rendered? Does the English answer to *that* character or to the Laozi's? Fail either and it goes in the notes as commentary, never into `render:`.
5. **The layer is labelled wherever it matters.** A reading that comes from a Wing is marked as coming from a Wing, so a reader can tell 1000 BCE from 300 BCE.

## Consequences

- **The trigram renderings are retroactively legitimate** rather than quietly inconsistent with the project's own principles. They came from 說卦; that is now a stated method.
- **The verdict vocabulary gets no help.** 貞 · 亨 · 孚 occur 201 times in the core and 1 · 0 · 0 times in the Laozi. The hardest open question in the project (`WORKLIST.md` A6) is unaffected by any of this, and expecting the sibling project to illuminate it would be a category error.
- **君子 should be ruled here and promoted to the parent's lock table** — 20 occurrences against the Laozi's 3. The first term to flow from child to parent.
- **A cost accepted: the translation will be less archaic and less anthropological than a core-text-only reading.** Someone wanting the Bronze Age oracle recovered from under the philosophy will not find it here. That is a real loss and it is chosen.
- **A second cost: the lens invites overfitting**, which is why [`tao-te-ching-relation.md`](../../knowledge/iching/tao-te-ching-relation.md) § 6 enumerates six specific ways to do it and the discipline against each.
- **Debt this creates.** 王弼's 周易注 and 周易略例 are **not vendored**, and the argument above rests on a brief that quotes him from memory. `WORKLIST.md` B6. The route is proven — the sibling project vendors his Laozi commentary from the 欽定四庫全書 through a reproducible importer — but until it is run, § 2 of that brief is a lead and not evidence.

## Alternatives considered

**Translate the core text alone, as reconstructed Western Zhou divination.** The scholarly purist's position, and the one Shaughnessy's work makes possible. Rejected because the hexagram and trigram *system* — which is what the product actually consults — is a Wings construction. Without 說卦 there are no trigram images, and the eight renderings that exist would have no evidence behind them. The purist version is a different and much smaller book.

**Merge silently, as every existing English translation does.** Rejected as the thing this project exists to stop doing. It is precisely what Legge and Wilhelm do, and the overlay audit's whole complaint is that the merge is invisible to the reader.

**Vendor Wilhelm's reading as the interpretive frame.** Rejected on rights (1950, in copyright) and on substance: his renderings — *the Gentle*, *the Receptive*, *the Abysmal* — are already on the `forbidden:` lists for discarding the image.

**Make the Laozi a fourth corner of the triangulation** alongside the Chinese, the Wings, the graph and the three translations. Rejected as a rank inflation that would license exactly the six failures in § 6 of the brief. The Laozi is a **check** on the Wings' register, never a source for a Zhouyi reading.

**Write nothing and let the trigram renderings stand on their own.** Rejected because an undeclared lens is the failure mode ADR-0001 was adopted to prevent: a future reader finds 說卦-derived renderings, cannot see why commentary was allowed to drive them, and either relitigates or "corrects" them.
