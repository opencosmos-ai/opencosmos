---
name: new-quote
description: Add one or many quotes to the OpenCosmos corpus. Parses free-form input, checks for duplicates, infers category and keywords, validates provenance, and routes the record into the right pool.
argument-hint: "<paste a quote, or several>"
disable-model-invocation: true
user-invocable: true
---

> **Where this runs.** The corpus moved to
> [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge) in
> September 2026. **Every path and command below is relative to that
> repository, not this one**, and its scripts run with `npm`, not `pnpm`.
>
> ```bash
> cd ../knowledge     # sibling of the opencosmos repo root
> npm install         # first run only
> ```
>
> `apps/web/scripts/fetch-content.mjs` uses the same `../knowledge` sibling
> convention, so if your local dev loop already works the checkout is there.

# /new-quote — Add a quote to the corpus

**Full pipeline:** `/new-quote` → `npm run quotes:add` → `npm run quotes:promote` → `npm run embed` → `npm run graph:constellation`

## The flow at a glance

```
Shalom pastes a quote (any format, one or many)
  │
  ├─ 1. Parse            text · author · SOURCE if present
  │                      → reflect back what you parsed
  │
  ├─ 2. Dupe check       npm run quotes:add -- --check-dupes --json <file>
  │                      → on a match, AskUserQuestion: skip or add anyway?
  │
  ├─ 3. Enrich           category · keywords · context (→ tradition)
  │
  ├─ 4. Provenance       apply VALIDATION_PROMPT.md
  │                      → if you cannot name a source, ONE AskUserQuestion
  │                        call bundling: "do you know the source?" +
  │                        confirm the inferred category/keywords
  │
  ├─ 5. Write            quotes:add --dry → quotes:add → quotes:promote → lint
  │
  └─ 6. Report           where it landed · status · source · page URL
                         → offer to run embed + graph:constellation
```

**Use `AskUserQuestion`, not prose questions**, and **batch them into a single
call** — one interruption, not four. The only moments that genuinely warrant
asking are the duplicate decision and the source/enrichment confirmation; ask
both at once when both apply. Everything else you infer and report.

Do not ask when there is nothing to decide: a quote that parses cleanly, isn't
a duplicate, and whose source you can name outright should be added and
reported without stopping.

`$ARGUMENTS` is whatever Shalom pasted. It might be a bare line, a line with
`— Author` on the end, something copied out of a book with the citation
attached, or twenty quotes at once. Parse it; don't ask him to reformat.

## The one rule that matters

**Never write to `quotes/*.yaml` or `pending.jsonl` yourself.**

`scripts/normalize-quotes/08-add-quote.ts` is the single enforcement point for
ID allocation, author-key normalization, routing, and duplicate detection. If
you hand-write YAML you will drift from it and corrupt the pools. Your job is
the judgment a CLI can't do — parsing, enrichment, provenance — then you hand
structured JSON to the script.

Pass quotes via `--json <file>`, never as `--text` flags. Quotes are full of
apostrophes, quotation marks, em-dashes and newlines; shell escaping will
eventually mangle one.

## What to do

### 1. Parse

Pull out `text`, `author`, and — this one matters most — **any source that came
along with the quote**. Strip surrounding quotation marks and the `—`/`--`/`~`
before an attribution. If the author is genuinely absent, use `Unknown` — the
pipeline routes that to `anonymous.yaml` on its own.

**Never discard a source.** If the paste carries a book, essay, speech, letter,
interview, chapter, or year — "*Thirst*, Beacon Press, 2006", "in a 1974 letter
to his brother", "Meditations 4.7" — capture it as `source`. It is the single
most valuable thing in the input and the easiest to drop while tidying up the
text. Whatever is in `source` flows into `provenance.earliest_print_source`.

Reflect back what you parsed before writing anything. A misparsed author is
much cheaper to fix now than after promotion.

### 2. Check for duplicates

```bash
npm run quotes:add -- --check-dupes --json <file>
```

Exits non-zero and prints matches as JSON if any text already exists across the
embeddable, pending, or archive pools. On a match, show Shalom the existing
record and ask whether to skip it or add anyway (`--allow-dupe`). Don't decide
for him — near-duplicates are sometimes genuinely distinct translations.

### 3. Enrich

Fill in what you can infer, and say what you inferred:

- **`category`** — one of the corpus's existing vocabulary: `insight`, `spirit`,
  `creativity`, `business`, `relationships`, `humor`, `design`. Pick the closest;
  don't invent a new one.
- **`keywords`** — three to five, lowercase, the concepts a person would search.
  These are load-bearing in both directions: [`embed-knowledge.ts`](https://github.com/opencosmos-ai/knowledge/blob/main/scripts/knowledge/embed-knowledge.ts)
  folds them into the quote's embedding text (alongside author, tradition, and
  category) so Cosmo retrieves by theme rather than only by literal wording, and
  they render as tags on the quote's page and drive search on
  `/library/quotes`. Vague keywords make a quote hard to find for both.
- **`context`** — a short descriptor of who the author is (`Poet`, `Stoic
  philosopher`, `Zen teacher`). This is load-bearing: `synthesizeTradition()`
  derives the tradition from it, and the tradition drives the graph and the
  browse filters. A quote with no context lands as `tradition: null`.
- **`favorite`** — only if Shalom says so.

### 4. Validate provenance

Run the quote through the same rules the backlog used —
`scripts/normalize-quotes/VALIDATION_PROMPT.md`. Read that file and apply it
honestly:

- Training knowledge only. **Never invent a print source or a Wikiquote URL.**
  A low-confidence `attributed_unverified` is a success; a fabricated citation
  is a failure, and worse than no verdict, because it launders a bad attribution
  into a corpus whose whole purpose is being trustworthy.
- Confidence is about the strength of the *attribution*, not how good the quote
  is. A beautiful line of unknown origin is a 0.15.
- Watch the misattribution magnets: Einstein, Gandhi, Churchill, Twain, Lincoln.

**Naming the source is the job.** The whole substrate exists so a reader can see
where a line actually came from, and the status vocabulary is really a statement
about the source:

| You can name… | Status | Confidence |
|---|---|---|
| a specific work, with date — book, essay, speech, letter, chapter | `verified` | 0.90–1.00 |
| no specific work, but the attribution is consistently and credibly carried | `attributed` | 0.70–0.85 |
| nothing; the attribution just circulates | `attributed_unverified` | 0.10–0.45 |
| a *different* origin than the one claimed | `likely_misattributed` | set low, and fill `suggested_reattribution` |
| no credible origin at all | `apocryphal` | 0.10–0.25 |

So, in order:

1. **Use the source Shalom gave you.** If the paste carried one, it goes in
   `earliest_print_source` — don't re-derive or "improve" it.
2. **Add one from your own knowledge if you genuinely have it.** If you know the
   line opens *The Messenger* in *Thirst* (Beacon Press, 2006), say so, and the
   quote earns `verified`. This is the payoff over a bare CLI: a well-attested
   quote gets a real citation at capture time and can go live in the same
   interaction, instead of waiting for the next validation tranche.
3. **If you can't place it, ask — via `AskUserQuestion`.** He often knows; he's
   the one who collected it. Offer real options rather than an open prompt, e.g.
   *"I can't place this one — do you know the source?"* with choices like
   *"I have the source"* (he types it), *"Add it unverified"*, and *"Skip it."*
   Bundle this into the **same** `AskUserQuestion` call as any duplicate decision
   or category confirmation so he's interrupted once.

   A source he supplies beats a confident guess. If he confirms an attribution
   personally, set `"reviewed_by_human": true` — that clears the promotion bar
   regardless of confidence. If he doesn't know either, leave
   `earliest_print_source` null and explain the gap honestly in `notes`; the
   quote sits in pending as `attributed_unverified`, which is the correct
   outcome, not a failure.

Never quietly downgrade a quote to `attributed_unverified` when a single
question would have gotten you the citation.

Put the verdict in the record's `provenance` block:

```json
{
  "text": "My work is loving the world.",
  "author": "Mary Oliver",
  "category": "spirit",
  "keywords": ["purpose", "love", "attention"],
  "context": "Poet",
  "provenance": {
    "status": "verified",
    "confidence": 0.97,
    "earliest_print_source": "\"The Messenger\", in Thirst, Beacon Press, 2006",
    "notes": "Opening line of the poem; attribution unambiguous."
  }
}
```

If Shalom has personally verified an attribution, set
`"reviewed_by_human": true` — that clears the promotion bar regardless of
confidence.

### 5. Add, promote, report

Write the JSON to a temp file, then:

```bash
npm run quotes:add -- --json <file> --dry    # confirm routing and IDs
npm run quotes:add -- --json <file>
npm run quotes:promote                        # only moves what clears the bar
npm run quotes:lint
```

Then tell him, concretely:

- Where each quote landed — `quotes/<bucket>.yaml`, or still pending
- Its provenance status and confidence, **and the source you recorded** — or a
  plain statement that you couldn't place it, so he knows what's still open
- For anything promoted, its page: `/library/quotes/<bucket>#<id>`
- That it becomes citable by Cosmo on the next `npm run embed` (or automatically
  via CI on push to main, per `.github/workflows/knowledge-sync.yml`)

Offer to run `npm run embed` if he wants it live immediately — and
`npm run graph:constellation` alongside it, since every embeddable quote is also a
node in the constellation (its own tier, with a `cites` edge to a work when
`source_work` resolves and a `member_of` edge to its tradition otherwise). A
promoted quote that hasn't been re-graphed is missing from the visualization.

## Notes

- Quotes always enter the **pending** pool. `quotes:promote` is the only thing
  that moves records into `quotes/`, and only for `verified` or
  `attributed` at confidence ≥ 0.80 or human-reviewed. Don't try to shortcut it.
- Anything left with null confidence is picked up automatically by the next
  `npm run quotes:checkpoint remaining --write-batches` tranche, so an unvalidated
  add is never lost — just deferred.
- **Never run `npm run quotes:migrate-from-source`.** It rebuilds both pools from
  the historical import and would discard every provenance verdict and review
  decision. It refuses without an explicit flag; leave it that way.
