// The Tao Te Ching reader's data: taoteching's export, shaped into pages.
//
// Read at build time only, from `.content/taoteching/data/atlas-export.json`,
// which scripts/fetch-content.mjs fetches and verifies. The export is the
// contract (ADR 0020 §3): this file reads it and nothing else in taoteching —
// never `chapters/*.md`, whose layout no gate protects. What each field means
// is documented where it is made, in taoteching's `tools/export_atlas.py` and
// `tools/build_explorer.py` (`payload()`).
//
// Server-only (`fs`). Pages pass the shaped `ChapterView` to client components.

import fs from 'fs'
import path from 'path'
import {
  TAO_TE_CHING_CHAPTERS,
  chapterWord,
} from './corpus-href'

const CONTENT = path.join(process.cwd(), '.content')
const EXPORT_PATH = path.join(CONTENT, 'taoteching', 'data', 'atlas-export.json')
const AUDIO_MANIFEST = path.join(CONTENT, 'taoteching', 'data', 'audio', 'manifest.json')
const DISCUSSION_PATH = path.join(CONTENT, 'taoteching-discussion.json')

export const TAOTECHING_REPO = 'opencosmos-ai/taoteching'
export const TAOTECHING_URL = `https://github.com/${TAOTECHING_REPO}`
export const ATLAS_URL = 'https://chinese-atlas.opencosmos.ai/'
/** The atlas's text id; its glossary URLs are /glossary/<id>/<slug>/. */
const ATLAS_TEXT = 'tao-te-ching'

// ── The export, as written ────────────────────────────────────────────────────

type ExportChar = {
  c: string
  p: string | null
  g: string | null
  r: string | null
  n: number
  chs: number[]
  sem: string[]
  pho: string[]
  entries: string[]
}

type ExportEntry = {
  slug: string
  term: string
  pinyin: string
  render: string
  status: string
}

type AtlasExport = {
  contract: number
  /** n → [title_zh, title_pinyin, title_en, guodian_attested, han_chars]: Heshang Gong's titles. */
  chapters: Record<string, [string | null, string | null, string | null, number, number]>
  /** "ch.line" → [zh, pinyin, english, exact] */
  lines: Record<string, [string, string, string, number]>
  chars: ExportChar[]
  /** Component graphs, some outside the text: char → [pinyin, gloss]. */
  glyphs: Record<string, [string | null, string | null]>
  entries: ExportEntry[]
  verse: Record<string, string[][]>
  notes: Record<string, string>
  literal: Record<string, string>
  /** "ch.line" → [[verse line (1-based across stanzas), confidence, method]] */
  align: Record<string, [number, number, string][]>
}

/** The alignment methods that are pairings, not guesses: the counts agree, or
 *  the chapter names its pairings by hand (taoteching WORKLIST T5-23). */
const CERTAIN = new Set(['exact-count', 'authored'])

let cached: AtlasExport | null = null

function load(): AtlasExport {
  if (cached) return cached
  if (!fs.existsSync(EXPORT_PATH)) {
    throw new Error(`No Tao Te Ching export at ${EXPORT_PATH} — run \`pnpm content\``)
  }
  cached = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf-8')) as AtlasExport
  return cached
}

// ── Shapes the pages use ──────────────────────────────────────────────────────

export type ChapterTitle = {
  n: number
  /** Heshang Gong's title (Han dynasty commentary), never Laozi's. */
  zh: string | null
  pinyin: string | null
  en: string | null
}

export type Token =
  | { kind: 'han'; c: string; p: string | null }
  | { kind: 'text'; text: string }

export type OriginalLine = {
  seq: number
  zh: string
  pinyin: string
  tokens: Token[]
  /** Verse lines (1-based) this line renders. Empty unless the chapter is exact. */
  verse: number[]
}

export type Part = { c: string; p: string | null; g: string | null }

export type CharView = {
  c: string
  /** The reading most common in the text; a token's own reading wins in the panel. */
  p: string | null
  g: string | null
  /** This translation's rendering, Markdown emphasis removed. */
  r: string | null
  sem: Part[]
  pho: Part[]
  /** Occurrences in the whole book, and in how many chapters. */
  n: number
  chapters: number
  entries: { slug: string; term: string; pinyin: string; render: string; href: string }[]
  atlas: string
}

export type TermView = {
  slug: string
  term: string
  pinyin: string
  render: string
  status: string
  href: string
}

export type ChapterView = {
  n: number
  title: ChapterTitle
  stanzas: string[][]
  lines: OriginalLine[]
  /** Every line pairs with certainty, at exact-count or authored: the only case a link is shown (ADR 0020 §2). */
  exact: boolean
  chars: Record<string, CharView>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// U+3400–U+9FFF, as taoteching's build_db.py tokenises (`HAN`). The base text
// is inside the BMP; component graphs outside it are looked up, not tokenised.
const HAN_RE = /[㐀-鿿]/
// build_db.py's `syllables()`: one per Han character, apostrophes internal.
const SYLLABLE_RE = /[A-Za-zÀ-ÿāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü']+/g

/** A rendering with its Markdown emphasis removed, as the atlas does (`plain`). */
export function plain(s: string | null | undefined): string {
  return (s ?? '').replace(/\*+([^*]+)\*+/g, '$1')
}

export function atlasCharHref(c: string): string {
  return `${ATLAS_URL}${encodeURIComponent(c)}/`
}

export function atlasEntryHref(slug: string): string {
  return `${ATLAS_URL}glossary/${ATLAS_TEXT}/${encodeURIComponent(slug)}/`
}

/** taoteching's own file for a chapter, three digits: `chapters/012.md`. */
export function chapterFile(n: number): string {
  return `chapters/${String(n).padStart(3, '0')}.md`
}

/**
 * A line's Han characters paired with the export's pinyin, positionally.
 *
 * The same rule as build_db.py's `align_pinyin`: one syllable per character,
 * and on a count mismatch no syllable at all rather than a guess, because a
 * wrong reading looks authoritative. The pinyin is the translation's decision
 * — 為 *wéi*, not the dictionary's *wèi* — so nothing here ever substitutes a
 * default reading.
 */
export function tokenize(zh: string, pinyin: string): Token[] {
  const chars = Array.from(zh)
  const han = chars.filter((c) => HAN_RE.test(c))
  const syllables = pinyin.match(SYLLABLE_RE) ?? []
  const aligned = han.length === syllables.length
  const out: Token[] = []
  let i = 0
  for (const c of chars) {
    if (HAN_RE.test(c)) {
      out.push({ kind: 'han', c, p: aligned ? syllables[i]!.toLowerCase() : null })
      i++
    } else {
      const last = out[out.length - 1]
      if (last?.kind === 'text') last.text += c
      else out.push({ kind: 'text', text: c })
    }
  }
  return out
}

function lineKeys(x: AtlasExport, n: number): string[] {
  const keys: string[] = []
  for (let seq = 1; `${n}.${seq}` in x.lines; seq++) keys.push(`${n}.${seq}`)
  return keys
}

// ── Public API ────────────────────────────────────────────────────────────────

export function chapterNumbers(): number[] {
  return Array.from({ length: TAO_TE_CHING_CHAPTERS }, (_, i) => i + 1)
}

export function getChapter(n: number): ChapterView | null {
  if (!Number.isInteger(n) || n < 1 || n > TAO_TE_CHING_CHAPTERS) return null
  const x = load()
  const keys = lineKeys(x, n)
  const exact = keys.length > 0 && keys.every((k) => (x.align[k] ?? []).every(([, , m]) => CERTAIN.has(m)))

  const lines: OriginalLine[] = keys.map((k, i) => {
    const [zh, pinyin] = x.lines[k]!
    return {
      seq: i + 1,
      zh,
      pinyin,
      tokens: tokenize(zh, pinyin),
      verse: exact ? (x.align[k] ?? []).map(([v]) => v) : [],
    }
  })

  const byChar = new Map(x.chars.map((c) => [c.c, c]))
  const entries = new Map(x.entries.map((e) => [e.slug, e]))
  const part = (c: string): Part => {
    const known = byChar.get(c)
    const glyph = x.glyphs[c]
    return { c, p: known?.p ?? glyph?.[0] ?? null, g: known?.g ?? glyph?.[1] ?? null }
  }

  const chars: Record<string, CharView> = {}
  for (const line of lines) {
    for (const t of line.tokens) {
      if (t.kind !== 'han' || chars[t.c]) continue
      const c = byChar.get(t.c)
      chars[t.c] = {
        c: t.c,
        p: c?.p?.toLowerCase() ?? null,
        g: c?.g ?? null,
        r: c?.r ? plain(c.r) : null,
        sem: (c?.sem ?? []).map(part),
        pho: (c?.pho ?? []).map(part),
        n: c?.n ?? 0,
        chapters: c?.chs.length ?? 0,
        entries: (c?.entries ?? [])
          .map((slug) => entries.get(slug))
          .filter((e): e is ExportEntry => Boolean(e))
          .map((e) => ({ slug: e.slug, term: e.term, pinyin: e.pinyin, render: plain(e.render), href: atlasEntryHref(e.slug) })),
        atlas: atlasCharHref(t.c),
      }
    }
  }

  const [zh, pinyin, en] = x.chapters[String(n)] ?? [null, null, null]
  return {
    n,
    title: { n, zh, pinyin, en },
    stanzas: x.verse[String(n)] ?? [],
    lines,
    exact,
    chars,
  }
}

/**
 * The glossary entries that stand in this chapter: an entry's term occurs in
 * the chapter's Chinese. A pairing (`我 & 吾`) stands where either half does.
 * The same substring test taoteching's build_index.py uses for an entry's
 * chapters, applied to every half rather than the first.
 */
export function getChapterTerms(n: number): TermView[] {
  const x = load()
  const text = lineKeys(x, n).map((k) => x.lines[k]![0]).join('')
  return x.entries
    .filter((e) => e.term.split(' & ').some((t) => t.trim() && text.includes(t.trim())))
    .map((e) => ({
      slug: e.slug,
      term: e.term,
      pinyin: e.pinyin,
      render: plain(e.render),
      status: e.status,
      href: atlasEntryHref(e.slug),
    }))
}

export function getChapterNotes(n: number): string {
  return load().notes[String(n)] ?? ''
}

/** How many chapters pair their lines exactly today. */
export function exactChapterCount(): number {
  return chapterNumbers().filter((n) => getChapter(n)?.exact).length
}

// ── Audio (ADR 0020 §6) ───────────────────────────────────────────────────────
//
// No clips exist, and the voice is undecided. When they do, taoteching will
// publish a manifest beside the export and the Listen section reads it. The
// shape below is a placeholder for that decision, not a contract: a clip per
// line, keyed like the export's `lines`.

export type AudioManifest = { lines?: Record<string, string> }

export function getChapterAudio(n: number): { seq: number; src: string }[] {
  if (!fs.existsSync(AUDIO_MANIFEST)) return []
  try {
    const m = JSON.parse(fs.readFileSync(AUDIO_MANIFEST, 'utf-8')) as AudioManifest
    return Object.entries(m.lines ?? {})
      .filter(([k]) => k.split('.')[0] === String(n))
      .map(([k, src]) => ({ seq: Number(k.split('.')[1]), src }))
      .sort((a, b) => a.seq - b.seq)
  } catch {
    return []
  }
}

// ── Discussion (ADR 0020 §5) ──────────────────────────────────────────────────

export type DiscussionItem = { number: number; title: string; url: string; pr: boolean }
export type Discussion = { ok: boolean; complete: boolean; items: DiscussionItem[] }

/**
 * Does this title name chapter n? taoteching titles chapter issues and pull
 * requests `Ch N — …`. `Ch 1` must not match `Ch 12`, so the number is read
 * whole and compared, never prefix-matched.
 */
export function titleNamesChapter(title: string, n: number): boolean {
  const m = /^Ch\.?\s*(\d+)\b/i.exec(title.trim())
  return m !== null && Number(m[1]) === n
}

/** Open issues and pull requests for chapter n, from the build's one fetch. */
export function getChapterDiscussion(n: number): Discussion {
  try {
    const d = JSON.parse(fs.readFileSync(DISCUSSION_PATH, 'utf-8')) as Discussion
    return {
      ok: Boolean(d.ok),
      complete: Boolean(d.complete),
      items: (d.items ?? []).filter((i) => titleNamesChapter(i.title, n)),
    }
  } catch {
    return { ok: false, complete: false, items: [] }
  }
}

export function discussionHrefs(n: number) {
  const q = encodeURIComponent(`is:open "Ch ${n}" in:title`)
  const title = encodeURIComponent(`Ch ${n} — `)
  return {
    list: `${TAOTECHING_URL}/issues?q=${q}`,
    newIssue: `${TAOTECHING_URL}/issues/new?template=a-line-that-doesnt-land.md&title=${title}`,
  }
}

// ── Cosmo's reading context ───────────────────────────────────────────────────

/**
 * The corpus heading that holds chapter n, so the chat can inject the chapter
 * verbatim (`extractSection` in app/api/chat). It is `## Chapter N` in the
 * generated document and `## Twelve` in the stopgap; whichever the fetched
 * corpus holds wins, so the page is right on either side of the switch.
 */
export function corpusHeadingFor(n: number, corpus: string | null): string {
  const headings = corpus ? [...corpus.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]!) : []
  return (
    headings.find((h) => h.toLowerCase() === `chapter ${n}`) ??
    headings.find((h) => h.toLowerCase() === chapterWord(n)) ??
    `Chapter ${n}`
  )
}

// ── Search (the landing page) ─────────────────────────────────────────────────

/**
 * One English line of the translation, with the Chinese it renders:
 * [chapter, verse line (1-based across stanzas), English, Chinese, pinyin].
 * A tuple, not an object, because the index ships as JSON and 855 copies of
 * five key names would outweigh the pinyin. The Chinese and pinyin are empty
 * for a line whose chapter isn't paired with certainty.
 */
export type SearchLine = [number, number, string, string, string]

export function getSearchIndex(): SearchLine[] {
  const out: SearchLine[] = []
  for (const n of chapterNumbers()) {
    const ch = getChapter(n)
    if (!ch) continue
    const source = new Map<number, OriginalLine[]>()
    for (const l of ch.lines) for (const v of l.verse) source.set(v, [...(source.get(v) ?? []), l])
    let v = 0
    for (const stanza of ch.stanzas) {
      for (const en of stanza) {
        const lines = source.get(++v) ?? []
        out.push([n, v, en, lines.map((l) => l.zh).join(''), lines.map((l) => l.pinyin).join(' ')])
      }
    }
  }
  return out
}
