# glossary — where an English word gets decided

**This is the project's own writing.** Everything under [`sources/`](../sources/) is
evidence, vendored and never hand-edited; everything here is a decision, authored, argued
and signed with a date. The two never mix.

## Where a rendering lives, and why it lives in two places

| | |
|---|---|
| **The ruling and its whole argument** | here — one file per term |
| **The rendering itself** | the `render:` field in [`hexagrams/NN.md`](../hexagrams/) or [`trigrams/`](../trigrams/) |
| **What is still owed** | [`WORKLIST.md`](../WORKLIST.md) |
| **The evidence it was decided from** | [`sources/`](../sources/) |

The split is not duplication. `render:` is **data** — [`build-iching.ts`](../../../scripts/xenso/build-iching.ts)
compiles it into the app, and it has to be one word in one field. The entry here is the
**reasoning**, which is longer than any field and is the thing a later reader needs when
the word looks arbitrary. Each trigram or hexagram file points back with `glossary_refs:`.

This mirrors the parent [Tao Te Ching](https://github.com/shalomormsby/taoteching) project,
whose `glossary/` holds 49 entries and is the unit of work there. **Its 47 locked terms
bind here unchanged** — see [`sources/locks/`](../sources/locks/README.md). A rendering
that reaches for a forbidden word is a defect, not a preference, and it is fixed by
changing the rendering or by changing the lock *in the other repository*, never here.

## What an entry owes

1. **The character, and what it does in this book** — with counts, because frequency is
   what makes a decision load-bearing. 天 occurs 122 times; a word chosen for it is chosen
   122 times.
2. **The evidence, all four corners** — the Chinese, the Wings, the graph, and the three
   old translations *as a set*. [`method.md`](../method.md) §2.
3. **What the three translators do, and where they split.** Convergence is support;
   divergence is the live question and [`divergence-stays-open`](../method.md#6-the-principles)
   governs it.
4. **The ruling, and what it forbids.** Name the words this rendering rules out, so the
   next reader does not have to re-derive them. **A `forbidden:` entry almost always names a
   translator who forgot the image on the reader's behalf** — *the Gentle*, *the Receptive*,
   *the Abysmal*, *the Joyous*, *Heaven*, each a grasped meaning shipped with the evidence
   discarded. That is [`method.md`](../method.md) §0, and it is the reason behind the shorter
   objection these entries usually give (*"the action rather than the image"*).
5. **The seam, named.** Where English cannot carry the Chinese, say so here rather than
   letting the rendering pretend otherwise.

**Read the sources for meaning, never for phrasing** — and note that the English word for
the thing is not borrowing. 雷 is thunder. See [`method.md`](../method.md) §2.

## Status

`status: draft` — proposed, still movable. `status: locked` — settled; the trigram or
hexagram file may be relied on. Nothing is locked without Shalom.
