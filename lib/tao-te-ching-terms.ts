// The Key Terms shapes and their ordering, without `fs`, so a client component
// can order a chapter's terms exactly as the server does. The counts come from
// the Tao Te Ching export's `where` (lib/tao-te-ching.ts); nothing here counts.

export type TermView = {
  slug: string
  term: string
  pinyin: string
  render: string
  status: string
  href: string
  /** How often the term stands in this chapter, from the export's `where`. */
  count: number
}

/** A glossary entry across the whole book, for the Key Terms page. */
export type BookTermView = Omit<TermView, 'count'> & {
  /** The entry's place in the export, which breaks every tie. */
  order: number
  /** Occurrences by chapter: `byChapter[n]` for chapter n, `byChapter[0]` unused. */
  byChapter: number[]
  /** Occurrences in the whole book. */
  total: number
  /** How many chapters it stands in. */
  chapters: number
}

/** Chapter n's terms, most frequent first; a tie keeps the export's order. */
export function chapterTerms(book: BookTermView[], n: number): TermView[] {
  return book
    .filter((t) => (t.byChapter[n] ?? 0) > 0)
    .sort((a, b) => b.byChapter[n]! - a.byChapter[n]! || a.order - b.order)
    .map(({ slug, term, pinyin, render, status, href, byChapter }) => ({
      slug, term, pinyin, render, status, href, count: byChapter[n]!,
    }))
}

/** The whole book's terms: by how many chapters each stands in, then how often. */
export function byReach(book: BookTermView[]): BookTermView[] {
  return [...book].sort((a, b) => b.chapters - a.chapters || b.total - a.total || a.order - b.order)
}
