// Corpus path → library URL. Client-safe (no `fs`).
//
// Two namespaces meet here, and conflating them breaks things in opposite
// directions:
//
//   corpus path   knowledge/quotes/mary-oliver.yaml#q_0003
//                 what lives on disk, what Cosmo emits in [ref:]/[quote:]
//                 tokens, and what keys every Upstash chunk id. NEVER changes.
//
//   library URL   /library/quotes/mary-oliver#q_0003
//                 where a reader goes. Free to change.
//
// A third namespace, the file in the knowledge repository, is `sourceHrefs()`.
//
// Three callers must agree on this translation — the chat renderer
// (`app/dialog/citations.tsx`), the constellation (`app/library/graph/nodeHref.ts`),
// and the index (`lib/library.ts`) — so it lives in exactly one place.
//
// Everything returns null rather than a best-effort URL: an unresolvable
// target should render as no link at all, never as a dead one.

/** The reader-facing base. Change this and every citation follows. */
export const LIBRARY_BASE = '/library'

const QUOTE_PREFIX = 'knowledge/quotes/'
const CORPUS_PREFIX = 'knowledge/'

/** A bucket becomes a filesystem path and a URL segment, so keep it strict. */
const BUCKET_RE = /^[a-z0-9-]+$/
const ANCHOR_RE = /^[A-Za-z0-9_-]+$/

function splitAnchor(ref: string): { path: string; anchor: string } {
  const hash = ref.indexOf('#')
  return hash === -1
    ? { path: ref, anchor: '' }
    : { path: ref.slice(0, hash), anchor: ref.slice(hash + 1) }
}

/**
 * `knowledge/quotes/mary-oliver.yaml#q_0003` → `/library/quotes/mary-oliver#q_0003`
 */
export function quoteHref(ref: string): string | null {
  const { path, anchor } = splitAnchor(ref)
  if (!path.startsWith(QUOTE_PREFIX) || path.includes('..')) return null
  const bucket = path.slice(QUOTE_PREFIX.length).replace(/\.yaml$/, '')
  if (!BUCKET_RE.test(bucket)) return null
  if (anchor && !ANCHOR_RE.test(anchor)) return null
  return `${LIBRARY_BASE}/quotes/${bucket}${anchor ? `#${anchor}` : ''}`
}

/** Build a quote URL from parts already known to be clean. */
export function quoteHrefFromParts(bucket: string, quoteId?: string): string {
  return `${LIBRARY_BASE}/quotes/${bucket}${quoteId ? `#${quoteId}` : ''}`
}

// ── The Tao Te Ching ─────────────────────────────────────────────────────────
//
// One corpus document, read as 82 pages: a landing page and a page per chapter
// (ADR 0020). Its citations name the corpus document and a heading anchor, and
// two generations of headings are in stored conversations:
//
//   #one … #eighty-one   the Feng–English file and the stopgap that replaced it
//                        (`## Twenty-One`, as github-slugger slugs it)
//   #chapter-1 …         the generated document (`## Chapter 1`)
//
// Both resolve to the chapter's page; any other anchor resolves to the landing
// page. PERMANENT: deleting a form breaks every stored citation that uses it.

export const TAO_TE_CHING_DOC = 'knowledge/sources/taoism-tao-te-ching.md'
export const TAO_TE_CHING_BASE = `${LIBRARY_BASE}/sources/taoism-tao-te-ching`
export const TAO_TE_CHING_CHAPTERS = 81

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty']

/** 21 → `twenty-one`: the slug of the old `## Twenty-One` heading. */
export function chapterWord(n: number): string {
  if (n < 20) return ONES[n] ?? ''
  const tens = TENS[Math.floor(n / 10)] ?? ''
  return n % 10 ? `${tens}-${ONES[n % 10]}` : tens
}

const WORD_TO_CHAPTER = new Map(
  Array.from({ length: TAO_TE_CHING_CHAPTERS }, (_, i) => [chapterWord(i + 1), i + 1] as const),
)

/** `twelve` or `chapter-12` → 12; anything else → null. */
export function taoTeChingChapterFromAnchor(anchor: string): number | null {
  const a = anchor.trim().toLowerCase()
  const m = /^chapter-(\d{1,2})$/.exec(a)
  const n = m ? Number(m[1]) : WORD_TO_CHAPTER.get(a) ?? null
  return n !== null && n >= 1 && n <= TAO_TE_CHING_CHAPTERS ? n : null
}

/** The landing page, or a chapter's page. */
export function taoTeChingHref(chapter?: number): string {
  return chapter ? `${TAO_TE_CHING_BASE}/${chapter}` : TAO_TE_CHING_BASE
}

/**
 * `knowledge/sources/x.md#slug` → `/library/sources/x#slug`
 *
 * Requires at least two path segments below `knowledge/`, which is what
 * distinguishes a real document from a stray directory reference. The Tao Te
 * Ching is the one document read as more than one page; see above.
 */
export function docHref(ref: string): string | null {
  const { path, anchor } = splitAnchor(ref)
  if (!path.startsWith(CORPUS_PREFIX) || path.includes('..')) return null
  if (path === TAO_TE_CHING_DOC) return taoTeChingHref(taoTeChingChapterFromAnchor(anchor) ?? undefined)
  const inner = path.replace(/^knowledge\//, '').replace(/\.md$/, '')
  if (inner.split('/').filter(Boolean).length < 2) return null
  return `${LIBRARY_BASE}/${inner}${anchor ? `#${anchor}` : ''}`
}

/** Build a doc URL from slug parts (`['sources','x']`). */
export function docHrefFromSlug(slug: string[]): string {
  return `${LIBRARY_BASE}/${slug.join('/')}`
}

/**
 * `knowledge/quotes/mary-oliver.yaml` → `mary-oliver`, else null.
 *
 * The inverse direction: recovering a bucket from a corpus path. Used by the
 * chat route to tell a quote page apart from a markdown document when resolving
 * what the reader currently has open.
 */
export function quoteBucketFromDocPath(docPath: string): string | null {
  if (typeof docPath !== 'string') return null
  const { path } = splitAnchor(docPath.trim())
  if (!path.startsWith(QUOTE_PREFIX) || path.includes('..')) return null
  const bucket = path.slice(QUOTE_PREFIX.length).replace(/\.yaml$/, '')
  return BUCKET_RE.test(bucket) ? bucket : null
}

/** Where the corpus is maintained, and so where a reader can correct it. */
export const KNOWLEDGE_REPO_URL = 'https://github.com/opencosmos-ai/knowledge'

/**
 * `knowledge/sources/x.md` → the file in the knowledge repository.
 *
 * The third namespace. The `knowledge/` prefix is where the corpus is fetched
 * to, not part of the repository's own paths, so it is stripped. `edit` opens
 * GitHub's editor, which forks and opens a pull request for any signed-in
 * reader, with no clone. Both point at `main`, where corrections land, even
 * when a build pinned `CONTENT_REF` to something else.
 */
export function sourceHrefs(ref: string): { view: string; edit: string } | null {
  const { path } = splitAnchor(ref)
  if (!path.startsWith(CORPUS_PREFIX) || path.includes('..')) return null
  if (!/\.(md|yaml)$/.test(path)) return null
  const inner = path.slice(CORPUS_PREFIX.length)
  if (inner.split('/').filter(Boolean).length < 2) return null
  return {
    view: `${KNOWLEDGE_REPO_URL}/blob/main/${inner}`,
    edit: `${KNOWLEDGE_REPO_URL}/edit/main/${inner}`,
  }
}
