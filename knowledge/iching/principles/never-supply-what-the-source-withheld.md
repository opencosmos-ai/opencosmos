---
id: never-supply-what-the-source-withheld
title: "The model must never supply from memory what the source failed to deliver"
status: active
since: 2026-09-11
trigger: "a source is illegible, damaged or unreadable at some point, and you can tell what it says anyway"
applies: [sources, tooling, drafting]
evidence:
  - "../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11"
  - "../README.md#what-is-not-here-and-why"
check: none
supersedes: []
---

# The model must never supply from memory what the source failed to deliver

**The rule.** Where a source is unreadable, the gap is recorded as a gap. It is never filled from the collaborator's own knowledge of the text — not by transcription, not by inference, not by a quiet correction that happens to be right.

**When it fires.** Whenever an extraction comes back short and you find you can complete it without looking: an OCR dropout in a sentence you recognise, a damaged character in a classic, a figure you could name from the surrounding words.

---

## Why this holds

**The Yijing is one of the most-reproduced texts in existence, and a language model has read it many times.** That is precisely the danger. Faced with a scanned page of 臨 (*lín*) in vertical type that no OCR here can read, the model can produce a perfectly accurate transcription from memory — and the result would be **indistinguishable from a transcription**, while being nothing of the kind. It would enter the corpus wearing the authority of an 1876 Shanghai printing and carrying none of it.

**The parent project already made this argument about human scholars.** Its `record-the-fact` principle excludes transcriptions of the excavated manuscripts because reading damaged Chu-script graphs into modern characters is editorial work by living people, and reproducing a reconstruction reproduces the scholarship. **The same reasoning reaches the AI collaborator, and reaches it harder** — a scholar's reconstruction is at least signed and datable, while a model's is neither, and arrives fluent.

**And the failure is silent by construction.** A vendored file with a model-supplied passage looks exactly like a vendored file without one. There is no mark on the page, no divergence to catch, nothing for a later check to find. The only defence is refusing at the point of temptation, which is why the rule has to be stated rather than left to judgement.

**Reading for verification is a different act, and it stays permitted.** Looking at the scan of printed page 97 and confirming that it agrees with `../sources/zhouyi/19.md` character for character is a check against something already held. The claim is *"these agree"* — falsifiable, and worth recording. The claim *"here is what the page says"* is a manufacture.

---

## The cases

**The Chinese half of McClatchie 1876 is not transcribed.** The 1876 edition sets Chinese and English on facing pages; the Chinese is vertical columnar type and comes back from Vision as a running head and nothing else. `chinese-pages.yaml` maps every scan page to its hexagram so a page can be opened and looked at, and the text is not produced. → [PROVENANCE](../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11)

**The 102 inline trigram figures are marked, not resolved.** McClatchie sets trigram figures inside his English prose and the scanner renders each as `(E)` or `(EE)`. The hexagram's actual trigrams are in this project's own table — so they *could* have been substituted, correctly, every time. They are marked `⟦trigram figure⟧` instead, with the real trigrams in the file's frontmatter, beside the sentence rather than inside it. → [PROVENANCE](../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11)

---

## Where it does not fire

**Structure is not content.** Locating a section by its position when its printed number is unreadable supplies no words — see [[order-assigns-the-label-verifies]]. The distinction is whether the output contains text the source did not yield.

**Nor does it forbid stating a fact about a text.** "The Mawangdui Zhouyi runs the hexagrams in a different order" is a fact and may be recorded. The line between a fact and a text is the parent project's, and it holds here unchanged.

**And it does not reach the project's own renderings.** A rendering is authored, openly, by a named translator working from the Chinese. The prohibition is on *transcription* — on presenting generated text as something recovered.

---

## What it obliges

1. **Record the gap and where it is** — a page reference, a `lines_found:` count, a marker in the text.
2. **Put what you know beside the source, never inside it.** Frontmatter, a manifest, a note — anywhere the reader can see whose claim it is.
3. **Name the route by which the gap could be closed properly**, so deferring is not the same as hiding. For the Chinese pages that is `chi_tra_vert`; the reason for deferring is written down.
4. **Never let a marked gap quietly become unmarked** on a later pass.
