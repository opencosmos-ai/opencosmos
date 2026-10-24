# 0020 — The Tao Te Ching is read in the Library, a chapter to a page

**Date:** 2026-10-15 · **Status:** Accepted · **Relates to** [0002](0002-corpus-paths-and-library-urls-are-separate-namespaces.md), [0015](0015-promoted-quotes-cite-their-source-work.md), [0017](0017-a-translation-and-its-interpretation-are-two-documents.md), [0018](0018-the-commons-and-the-applications-live-in-separate-repositories.md)

_The Open Tao Te Ching replaces the Feng–English translation at `/library/sources/taoism-tao-te-ching`, one page per chapter, built from the taoteching repository's export rather than a hand-kept copy. The copyright text leaves now, replaced in place, so nothing that cites it breaks._

## Context

**The Library's Tao Te Ching is someone else's, and mislabelled.** `knowledge/sources/taoism-tao-te-ching.md` holds Gia-Fu Feng and Jane English's 1972 translation (Knopf), still in copyright, under `source: public-domain`. Its 81 chapters are H2 headings spelled as words (`## One` … `## Eighty-one`), it carries the transcription's typos (`cab be told`, `manifestatiuons`), and its summary still names the translators.

**OpenCosmos now has its own.** [opencosmos-ai/taoteching](https://github.com/opencosmos-ai/taoteching) is a CC0 translation with all 81 chapters drafted and an editing pass under way. Each `chapters/NNN.md` carries three things, which is what made this a decision rather than a content swap:

- **Translation:** the English verse, in stanzas.
- **Source:** the Chinese, by block, with pinyin and a literal gloss per line.
- **Notes:** the reasoning behind contested renderings, often longer than the verse.

Around the chapters sit 53 glossary entries (rulings, with locked English and forbidden renderings), the 說文 analysis of nearly every character, and `data/atlas-export.json`. That file is a CI-gated export which the [Character Atlas](https://chinese-atlas.opencosmos.ai/) already builds from.

**It changes weekly.** Seven pull requests merged in the 48 hours before this record, among them a new opening line for chapter 1, 民 and 百姓 settled, nine verse fixes, and restored pinyin. Any copy of the text that is not regenerated from the source will be wrong within days.

**Three measured facts shaped the design.**

- **The English is not line-for-line with the Chinese.** In 49 of 81 chapters the line counts differ. *(Corrected 2026-10-17: was "20". taoteching's database had recorded 32 exact chapters all along.)* There, taoteching's database aligns the lines proportionally, records that guess at confidence 0.3 and flags it as unsettled, but the export drops the flag.
  - **Chapter 6 shows the guess going wrong.** 玄牝之門 (*xuán pìn zhī mén* — the gate of the dark female) is paired with "This is the dark female", but its English is the next line, "This dark gateway birthed the sky and the earth."
  - **So a row-per-line table is unsafe.** It would present guesses as pairings.
- **4% of characters are read differently from the modern default.** That is 212 of the 5,296, in 187 of the 798 lines: 為 *wéi* ×107, 夫 *fú* ×20, 處 *chǔ* ×14, 長 *cháng* ×11, 惡 *wù* ×4. These readings are decisions the translation has made, and the export's pinyin records them.
- **Stored conversations cite the old headings.** Cosmo cites a chunk as `knowledge/sources/taoism-tao-te-ching.md#<heading-slug>`, so conversations already hold tokens like `#twelve`. ADR [0002](0002-corpus-paths-and-library-urls-are-separate-namespaces.md) makes that path permanent.

## Decision

**1. Where it lives.**
- **The landing page.** `/library/sources/taoism-tao-te-ching` introduces the translation, says how it is made and where it stands (first draft complete, editing in the open), and lists all 81 chapters with their Chinese and English titles.
- **The chapters.** Each chapter is its own page at `/library/sources/taoism-tao-te-ching/{1…81}`, with previous and next.
- **Why not one page.** A chapter carries verse, the original, terms, notes and its own discussion. Eighty-one of those make an unreadable single page and an unusable table of contents.

**2. Every chapter has the same sections, in the same order,** as H2s so the existing right-hand contents list follows them:

| Section | Holds |
|---|---|
| Translation | the English verse, stanzas as authored |
| Original | the Chinese line by line; pinyin shown or hidden by the reader; every character opens a panel (see 4) |
| Listen | the Chinese read aloud, **only when clips exist** (see 6) |
| Terms | the glossary entries whose character appears in this chapter, each linked to the atlas |
| Notes | the chapter's notes, set apart as the translator's voice, per [0017](0017-a-translation-and-its-interpretation-are-two-documents.md) |
| Discussion | open issues and pull requests for this chapter, and a way to open one |

**The English and the Chinese are linked by highlighting, not by table rows.** Focusing a Chinese line highlights the English line that renders it. That link is shown **only where the alignment is certain**:
- **Today:** the 32 chapters whose line counts agree. *(Corrected 2026-10-17: was "61".)*
- **The other 49:** no link until taoteching records an authored alignment for them. A proportional guess is never presented as a pairing, the same rule the database already keeps.
- **What the export must carry:** each alignment's confidence, so the page can tell the two cases apart.

**3. The source is taoteching's export, fetched at build time.**
- **A third content source.** `scripts/fetch-content.mjs` adds `taoteching` beside `knowledge` and `cosmo`, with its own `verify`, which refuses an export with fewer than 81 chapters. The site still builds the commons in and contains none of it ([0018](0018-the-commons-and-the-applications-live-in-separate-repositories.md)).
- **The export is the contract.** The app reads `data/atlas-export.json`, extended with what a reader needs and the atlas does not yet carry: each chapter's stanzas, its literal glosses, its notes, and each line alignment's confidence. It never parses `chapters/*.md`, because the export is gated in taoteching's CI and the chapter file's layout is not.
- **Additions only.** The fields are added without bumping `contract`, because the atlas refuses any other contract number.
- **A merge redeploys the site.** A merge to taoteching's `main` triggers a rebuild through a Vercel deploy hook, the same way `notify-atlas.yml` signals the atlas. knowledge already redeploys the site this way, through its `VERCEL_DEPLOY_HOOK` secret, so taoteching can hold the same hook URL under the same secret name.

**4. Characters open into the atlas; the glossary stays there.**
- **The panel.** Tapping a character shows its pinyin, gloss, this translation's rendering, the parts it is built from, and how often it occurs, all from the export.
- **The links.** The panel links out to the character's atlas page and, where one exists, its glossary entry.
- **No glossary here.** The glossary is not rebuilt on opencosmos.ai. Consolidating later is open if it earns its keep.

**5. Discussion follows the convention the repository already has.**
- **The title convention.** taoteching's issue templates title issues `Ch N — …`, and chapter pull requests follow it.
- **What the page shows.** A chapter page links to issues and pull requests whose titles carry that chapter, and to a new issue pre-titled `Ch N — `.
- **Corrections.** "Suggest an edit" opens `chapters/NNN.md` in taoteching, not the knowledge copy.

**6. Audio: the Chinese, later; the English, not yet.**
- **The Listen section exists in the layout** and renders nothing until clips exist.
- **The clips will be made in taoteching,** where the readings are decided: one per line, one per character. A changed line re-renders only its own clip, and the atlas's "Hear in Chinese" button uses the same character clips.
- **The voice is a separate decision,** still being auditioned. Whatever voice is chosen must follow the export's pinyin wherever it departs from the default reading.
- **English audio is deferred.** The English changes too often to keep a recording current.

**7. The corpus copy is generated, keeps its path, and carries English, Chinese and notes.**
- **Same path, new content.** `knowledge/sources/taoism-tao-te-ching.md` stays at its path ([0002](0002-corpus-paths-and-library-urls-are-separate-namespaces.md)) and is regenerated from the export, never edited by hand.
- **One `## Chapter N` per chapter.** Each holds the English, the Chinese, and the notes under their own heading. That lets Cosmo quote the original and explain why a line reads as it does, without passing a note off as scripture.
- **No pinyin.** It adds tokens and almost nothing to retrieval.
- **Rights and summary.** The frontmatter declares CC0 and the translator, and the summary is rewritten.
- **Old citations keep resolving.**
  - `#one` … `#eighty-one` and the new `#chapter-N` resolve to the chapter page.
  - Anything else resolves to the landing page.
  - The mapping lives in `lib/corpus-href.ts`, which every citation already passes through, and is permanent.

**8. Cosmo learning the glossary is deferred, and named.** Cosmo explaining a ruling, or proposing a rendering, needs four things it does not have:
- the glossary entries;
- the locks and forbidden renderings;
- taoteching's principles and house rules;
- the readings, so its pinyin matches the translation's (為 *wéi*, not *wèi*).

That is its own decision, after this one ships.

**9. Feng–English leaves the corpus now, by replacement, not deletion.**
- **Why it leaves.** It is a copyright translation published on a public page, so it goes before the reader is built, not after.
- **Why not a second document.** Keeping it beside the new translation, as [0017](0017-a-translation-and-its-interpretation-are-two-documents.md) did for Johnston, would require the right to publish it, and the corpus does not have that right.

**What depends on the file (inventory taken 2026-10-15).** Deleting it would break all of these at once:
- **The page.** `/library/sources/taoism-tao-te-ching` would 404 until the reader ships.
- **Eight documents that link to it.** Two sources list it in `related_docs` (`buddhism-heart-sutra`, `stoicism-meditations`), five wiki pages list it among their sources, and the Sol Foundations collection links to it. The wiki pages are `entities/lao-tzu`, `concepts/impermanence`, `concepts/the-good`, `concepts/logos-and-tao` and `connections/cosmology-comparison`.
- **Two quotes.** q_0885 and q_0887 in `quotes/lao-tzu.yaml` name `sources/taoism-tao-te-ching` as their `source_work`, so the constellation's `quote → work` edge ([0015](0015-promoted-quotes-cite-their-source-work.md)) would fail to resolve. Their wording is the popular paraphrase, not Feng's, so the quotes themselves stand.
- **The grooming script.** `scripts/knowledge/groom.py` maps the slug to its `tao` tag.
- **Stored citations.** Every citation Cosmo has already emitted into a stored conversation (`…taoism-tao-te-ching.md#twelve`) would point at a 404.
- **Cosmo's retrieval.** Cosmo would have no Tao Te Ching to retrieve at all.

**Feng–English is not only in the source file.** Four of those wiki pages quote it verbatim:

| Page | Quotes Feng–English |
|---|---|
| `entities/lao-tzu` | ch. 1, "The Tao that can be told is not the eternal Tao…"; ch. 2, "Work is done, then forgotten…", "…beauty as beauty only because there is ugliness" |
| `concepts/impermanence` | ch. 2, "The ten thousand things rise and fall without cease…" |
| `concepts/the-good` | ch. 1 |
| `concepts/logos-and-tao` | ch. 1 |

The fifth, `connections/cosmology-comparison`, quotes chapter 42 as "The Tao gave birth to one…". That wording is in neither Feng–English nor the Open Tao Te Ching, and is unattributed.

**Every one of these quotations is also wrong by this project's settled renderings.** The translation reads 天 as *sky*, not "heaven"; 萬物 as *the countless things*, not "the ten thousand things"; and 常道 as *the ever-present Tao*, not "the eternal Tao". The wiki is the ambient context Claude loads in every session in this repository, so it would keep teaching the overlays the translation exists to remove.

**So the file is replaced in place, in two steps.**
- **Now: a stopgap.**
  - One knowledge pull request ([knowledge#14](https://github.com/opencosmos-ai/knowledge/pull/14)) regenerates the file with a one-off script from taoteching's chapter files (the export does not yet carry stanzas): the CC0 English, chapter by chapter, under the **same headings** (`## One` … `## Eighty-One`), so every existing link, citation and graph edge still lands where it did.
  - The frontmatter declares CC0 and Shalom Ormsby as translator, and the summary no longer names Feng and English.
  - The same pull request re-quotes the five wiki pages from the Open Tao Te Ching, with chapter numbers. Where a page's own prose echoes the old wording ("heaven and earth", "the ten thousand things"), it follows the quotation, so no Feng–English wording and no unsourced rendering stays in the corpus.
  - Merging it is enough: knowledge's `knowledge-sync` workflow already rebuilds the graph, re-embeds the corpus (removing the Feng chunks from the index) and redeploys the site through its `VERCEL_DEPLOY_HOOK`.
- **Later: the generated document of point 7,** with the Chinese, the notes and `## Chapter N` headings. It replaces the stopgap in the same pull request that adds the old-anchor mapping to `lib/corpus-href.ts`. Until that mapping exists, the headings must not change.

**The stopgap is an exception to point 7, and is labelled as one.** It is a copy no workflow regenerates, so it will lag the translation for as long as it stands. The file itself and its pull request both say so, and name what replaces it. It is acceptable because it lags a CC0 text by weeks, whereas the alternative is to keep publishing a copyright text.

## Consequences

- **The Library's Tao Te Ching becomes OpenCosmos's own and is correctly licensed.** The copyright text leaves with the stopgap, before the reader is built, and nothing that linked to it breaks on the way.
- **For a while the corpus copy lags the translation.** Between the stopgap and the generated document, Cosmo quotes an English that may be weeks behind taoteching. That is the price of removing a copyright text now.
- **The old headings are frozen until the mapping lands.** Renaming them before `lib/corpus-href.ts` maps the old anchors would break every stored citation.
- **The build depends on a third repository.** A taoteching outage or a malformed export fails the opencosmos build. That is intended, and `verify` exists to make the failure loud instead of a site with no chapters.
- **These are Tao Te Ching–specific routes.** The I Ching will want the same reader. The route and components should be written to generalise, but the generalisation waits for the second text.
- **Two sync paths are needed.**
  - **The site redeploy:** a deploy hook, which knowledge already has.
  - **The corpus copy:** written into knowledge, whose `knowledge-sync` workflow then re-embeds and redeploys on merge.

  Until both run, the site and Cosmo can lag the translation.
- **The old-citation mapping is permanent.** It is small, but deleting it would break links in stored conversations.
- **The atlas and the site share one data file.** A change to it is tested by both builds, and the atlas's contract check limits how the file may evolve.

## Alternatives considered

- **All 81 chapters on one page.** It reads straight through and fits the generic document viewer. Rejected because each chapter carries five kinds of content and its own discussion; the page and its contents list would be unusable.
- **The reader on the atlas site.** The atlas has the data and the character cards already. Rejected because the Library is where readers come for texts, beside Cosmo. The atlas is a reference for characters and rulings, and is linked from every character.
- **Parsing `chapters/*.md` directly.** It needs no export work. Rejected because it couples the site to a file layout no gate protects; the export exists so readers of the translation never depend on its internals.
- **Deleting the Feng–English file now.** It is quick, and the copyright text would be gone today. Rejected because it breaks the page, eight linking documents, two quote edges and every stored citation (point 9), and leaves Feng's wording in four wiki pages anyway.
- **A placeholder page until the reader ships.** It would remove the text without breaking links. Rejected because Cosmo would have no Tao Te Ching to retrieve for weeks, and the stopgap costs only a one-off script.
- **Leaving Feng–English until the reader ships.** Nothing breaks and nothing is done twice. Rejected because it keeps publishing a copyright text for as long as the build takes.
- **A hand-edited corpus copy.** Rejected because the text changes weekly. A copy no one regenerates is how the corpus came to hold a copyright translation labelled public domain.
- **Pinyin in the corpus copy.** Rejected for now: little retrieval value at real token cost. The readings belong in a glossary lookup Cosmo can call (point 8).
- **English audio now.** Deferred: every verse edit would orphan a recording.
- **Row-per-line bilingual tables.** Rejected because the English is not line-for-line in 49 chapters *(corrected 2026-10-17: was "20")*, and the pairing there is a guess.
- **Highlighting the proportional guess, marked "approximate".** Rejected because chapter 6 shows the guess pairing a line with the wrong English; a reader would learn the wrong correspondence however it was labelled.

## Updates

- **2026-10-15 — The stopgap of point 9 shipped** ([knowledge#14](https://github.com/opencosmos-ai/knowledge/pull/14)). Feng–English left the corpus, replaced in place under the old headings, and the five wiki pages were re-quoted from the Open Tao Te Ching.
- **2026-10-15 — The reader shipped** ([opencosmos#222](https://github.com/opencosmos-ai/opencosmos/pull/222)), on the export extended by [taoteching#30](https://github.com/opencosmos-ai/taoteching/pull/30) with `verse`, `notes`, `literal` and `align`. The export now carries each alignment's confidence, so the flag the Context says it drops is there. Lines are linked only in the 32 exact chapters. `lib/corpus-href.ts` maps every old anchor (`#one` … `#eighty-one`, `#chapter-N`).
- **2026-10-15 — The generated document of point 7 replaced the stopgap** ([knowledge#16](https://github.com/opencosmos-ai/knowledge/pull/16)): `## Chapter N` headings with the English, the Chinese and the notes, written by `npm run ttc:generate` and regenerated by knowledge's daily *Tao Te Ching sync*. With the mapping in place, the old headings are no longer frozen.
- **2026-10-17 — The per-merge redeploy of point 3 is built but not connected.** taoteching's `notify-opencosmos.yml` runs on every change to the export, but its `VERCEL_DEPLOY_HOOK` and `KNOWLEDGE_DISPATCH_TOKEN` secrets are not set, so each run skips both steps with a notice. Until they are, the site and Cosmo's copy follow the translation through knowledge's daily sync, at most a day behind. Setting the two secrets completes point 3 and the two sync paths of *Consequences*.
- **2026-10-24 — taoteching records authored alignments.** A chapter whose line counts differ can now name the source rows each English line renders, in its own `## Alignment` section, checked whole by taoteching's build. The export marks those pairings `authored`, at confidence 1.0, and the reader links them as it links `exact-count`. All 49 chapters with uneven counts are paired, so every chapter now links its lines, and taoteching's build no longer makes the proportional guess this ADR refused to show. Chapter 6's gate of the dark female pairs with its own English. taoteching `WORKLIST-CLOSED.md` T5-23.
