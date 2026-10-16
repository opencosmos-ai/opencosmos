# 0021 — Tao Te Ching chapters carry numbers, not titles

**Date:** 2026-10-16 · **Status:** Accepted · **Amends** [0020](0020-the-tao-te-ching-is-read-in-the-library-a-chapter-to-a-page.md)

_The Library shows each chapter of the Open Tao Te Ching by its number alone. Heshang Gong's titles are left out of the chapter pages and the landing page, so the reader meets the text as Laozi left it._

## Context

**Laozi's chapters had no titles.** The two-character titles that most editions print, such as 體道 "Embodying the Tao" for chapter 1, are Heshang Gong's. He added them in his Han-dynasty commentary, centuries after the text. `data/atlas-export.json` carries them, with a working English rendering of each.

**0020 put them on the page.** Its landing page "lists all 81 chapters with their Chinese and English titles". The chapter reader printed each title under the chapter number, with a caption saying whose title it was.

**A caption does not undo the framing.** A title is the first thing a reader sees and the frame for everything after it. Printing Heshang Gong's word for what a chapter means tells the reader, before the first line, what to look for. The translation's own aim is the opposite: to remove the overlays that later readings laid over the text. Its landing page says the aim is an English "free of what dynastic, Christian missionary, and New Age readings overlaid upon the text".

## Decision

**A chapter is shown by its number and nothing else.**

- **The chapter page** opens with "Chapter N", then space, then the English verse. It has no title, no caption and no divider.
- **The landing page** lists the chapters as a nine-by-nine grid of numbers.

**The data stays in the export.** The titles remain in `atlas-export.json` and in the type that reads it. They belong to the commentary tradition, and the Character Atlas or a later page about Heshang Gong may still want them. The site does not show them.

## Consequences

- **The reader's first contact with a chapter is the verse.** No other reading frames it first.
- **The landing page no longer helps readers find a chapter by its theme.** A reader who remembers "the chapter about water" has to search or browse by number. Search and Cosmo cover that need, and a title that steered the search would be the overlay this record removes.
- **0020's line about titles on the landing page no longer describes the site.** 0020 stands in every other respect.

## Alternatives considered

- **Keep the titles, with the caption.** This was 0020's choice. Rejected because the caption names the overlay but still lays it over the text first.
- **Show the opening line of each chapter as its label.** This is the classical way to name an untitled poem, and it uses only Laozi's words. Not taken now: the translation's opening lines still change weekly, and a grid of numbers is the cleaner view. It remains open.
