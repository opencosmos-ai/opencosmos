# Principles — the rules this project learned

*[`../README.md`](../README.md) says **what is here**. [`../method.md`](../method.md) says **how a rendering gets made**. [`../sources/PROVENANCE.md`](../sources/PROVENANCE.md) says **what may be vendored and on what authority**. This directory says **what we learned** — the transferable rules discovered while making particular decisions, which then govern every decision after.*

**The form is the Tao Te Ching project's, copied deliberately.** Its [`process/principles/`](https://github.com/shalomormsby/taoteching) was argued out over months, and there is no reason for a neighbouring project to re-derive a good design badly. Read that directory's README for the reasoning behind the frontmatter, the `trigger:` field and the evidence threshold; this file says only what differs here.

**`INDEX.md` and `principles.yaml` are generated — never hand-edit them.**

---

## The first rule of this directory: do not restate the twenty-seven

This project **inherits the Tao Te Ching project's principles wholesale**, and `../method.md` § 6 names the ones that fire hardest on this book. [`repeat-yourself`](https://github.com/shalomormsby/taoteching), [`already-spoken-for`](https://github.com/shalomormsby/taoteching), [`commentary-is-not-a-rendering`](https://github.com/shalomormsby/taoteching), [`renders-no-character`](https://github.com/shalomormsby/taoteching) and the rest apply here in full force and **are not repeated here**.

Copying them across would rebuild exactly the failure the parent's README warns about: two copies of a rule, one of which goes stale. **An entry belongs here only if the twenty-seven do not already contain it.**

The honest test, asked in this order:

1. **Is it in the twenty-seven?** Then link to it from `../method.md` § 6 and stop.
2. **Is it a sharpening of one of the twenty-seven?** Then it goes in that section of `../method.md`, under the inherited principle, as a note on how this book bites harder. `already-spoken-for` needing seventy-two distinct English words is a sharpening, not a new rule.
3. **Does it tell you something about work nobody has started yet, that the twenty-seven do not?** Then it belongs here.

---

## What belongs here, and what does not

| | Goes where | Why |
|---|---|---|
| **A transferable rule this project discovered** | **here** | it governs work nobody has started |
| A rule the Tao Te Ching project already holds | **not here** — link to it from `../method.md` § 6 | two copies, one goes stale |
| How this book sharpens an inherited rule | `../method.md`, under that rule | it is a note on a rule, not a rule |
| The case for one rendering of one hexagram | `../hexagrams/NN.md` | someone working there will find it |
| Why a *term* renders as it does | a glossary entry — **which does not exist yet**, see `../method.md` § 7 | |
| Whether a source may be vendored, and on what authority | `../sources/PROVENANCE.md` | that file is the authority on rights |
| What a particular importer does | the header comment of the importer | |
| An open question with no answer yet | `../method.md` § 4, the watchlist | a question is not a rule |
| When something arrived, or a stance reversed | `../CHANGELOG.md` | a date is not a rule |

---

## Why this directory exists at all, and why it is mostly about evidence

The parent project's principles are overwhelmingly about **drafting** — how to get from a character to an English word without importing something the Chinese does not say. That is the hard part over there, because the text arrived long ago and is not in doubt.

**Here the hard part came first, and it was the evidence itself.** Five sources were vendored before a single word was rendered, and every one of them arrived damaged in a different way: a wiki page that looked proofread and was a broken transclusion; a scan whose roman numerals read `LI 1 1.`; a book whose printed hexagram numbers were less reliable than the order they sat in; a PDF with no text layer at all; a bilingual edition whose Chinese half no OCR here can read.

So most of what this project has learned so far is about **how to turn damaged evidence into something a later reader may safely treat as evidence** — and none of it is in the twenty-seven, because the Tao Te Ching never had to.

That will change. When the renderings start, the entries that follow them will be about drafting, and at that point the balance in `applies:` should shift. **If it does not, that is a sign this project is still building instruments instead of translating.**

---

## Frontmatter

Identical to the parent's, and the generator enforces it:

```yaml
---
id: order-assigns-the-label-verifies
title: "Where the label is the damaged thing, order assigns and the label checks"
status: active
since: 2026-09-11
trigger: "a source carries both a position and an identifier, and you are about to trust the identifier"
applies: [tooling, notes]
evidence: ["../sources/PROVENANCE.md#harlez-1889--le-yih-king", "../sources/PROVENANCE.md#mcclatchie-1876--vendored--updated-2026-09-11"]
check: none
supersedes: []
---
```

| Field | Meaning |
|---|---|
| `id` | kebab-case slug; the filename is `<id>.md`, and other entries link as `[[id]]` |
| `title` | the rule in one sentence, stated as a rule and not as a topic |
| `status` | `provisional` · `active` · `superseded` |
| `since` | the date the rule was first stated |
| `trigger` | **what makes it actionable.** Written so someone about to do the thing recognises themselves |
| `applies` | `drafting` · `glossary` · `sources` · `tooling` · `notes` · `process` |
| `evidence` | links to the decisions that produced it — **the build verifies every anchor resolves** |
| `check` | the tool that enforces it, or `none` |
| `supersedes` | ids this replaces |

**The evidence threshold is the parent's and is enforced here by the generator:** `status: active` requires **two or more independent cases**. One case is an observation. A build that finds an `active` entry with fewer than two fails.

`applies: [sources]` is the one addition — the parent has no category for it because it has no equivalent of `../sources/PROVENANCE.md` as a separate authority.

---

## Writing the entry

The parent's rules, unchanged:

1. **Open with the rule, then the trigger.** Not with the case that produced it.
2. **Argue it generally.** Why is this true of scanned books, of classical Chinese, of this kind of work — rather than true of that one file?
3. **Give the case in two sentences and link out.** The full account is already written in PROVENANCE or method; do not restate it.
4. **Name where it does not fire.** A rule with no boundary is a slogan.
5. **Say what it obliges.** A principle that changes nothing is an observation with better formatting.
6. **Gloss every Chinese character, every time** — 貞 (*zhēn*), never bare 貞.
7. **Lowercase everything but the Tao.**

---

## Finish — every time

```bash
pnpm xenso:principles
```

Regenerates `INDEX.md` and `principles.yaml`, checks the evidence threshold on every `active` entry, and **verifies every `evidence:` anchor resolves to a real heading in the file it names**. A reworded heading in `PROVENANCE.md` becomes a build error rather than a dead link.
