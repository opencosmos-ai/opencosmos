'use client'

// The Key Terms map: every glossary entry (a row) across the 81 chapters (a
// column), shaded by how often the term stands there. It reads two ways:
// across a row, where a term lives; down a column, what a chapter carries.
//
// Each row is shaded against its own peak, as the Character Atlas's heat map
// is, so 為 (the commonest) does not wash every other row pale. Every chapter
// is drawn in every row, so where a term never goes has a shape too.
//
// The squares are drawn for the eye and hidden from assistive technology; each
// row carries the same facts as text. Selection lives in the URL hash
// (#chapter-12, #term-dao-道), so a chapter page can link straight to its column.

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Badge, Button, ScrollArea, ScrollBar, cn } from '@opencosmos/ui'
import { useMotionPreference } from '@opencosmos/ui/hooks'
import { ExternalLink } from 'lucide-react'
import { taoTeChingHref } from '@/lib/corpus-href'
import { type BookTermView, chapterTerms } from '@/lib/tao-te-ching-terms'
import TermList from './TermList'
import { DESC } from './styles'

type Selection = { kind: 'chapter'; n: number } | { kind: 'term'; slug: string } | null

const NINE = Array.from({ length: 9 }, (_, i) => i)

function times(n: number): string {
  return n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`
}

/** A square's fill: the theme's primary, stronger the nearer the row's peak. */
function shade(k: number, peak: number): string | undefined {
  if (k === 0) return undefined
  const pct = Math.round(25 + 75 * (k / peak))
  return `color-mix(in oklab, var(--color-primary) ${pct}%, transparent)`
}

function parseHash(hash: string, terms: BookTermView[], chapters: number): Selection {
  const h = decodeURIComponent(hash.replace(/^#/, ''))
  const ch = /^chapter-(\d{1,2})$/.exec(h)
  if (ch) {
    const n = Number(ch[1])
    return n >= 1 && n <= chapters ? { kind: 'chapter', n } : null
  }
  const slug = h.startsWith('term-') ? h.slice(5) : ''
  return terms.some((t) => t.slug === slug) ? { kind: 'term', slug } : null
}

function hashFor(s: NonNullable<Selection>): string {
  return s.kind === 'chapter' ? `#chapter-${s.n}` : `#term-${s.slug}`
}

function same(a: Selection, b: Selection): boolean {
  if (!a || !b || a.kind !== b.kind) return false
  return a.kind === 'chapter' ? a.n === (b as { n: number }).n : a.slug === (b as { slug: string }).slug
}

export default function TermsMap({ terms, chapters }: { terms: BookTermView[]; chapters: number }) {
  const [sel, setSel] = useState<Selection>(null)
  const units = Array.from({ length: chapters }, (_, i) => i + 1)

  useEffect(() => {
    const read = () => setSel(parseHash(window.location.hash, terms, chapters))
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [terms, chapters])

  // A selection made in the map scrolls its panel into view when the panel is
  // off screen: the map is 71 rows tall, and a choice with no visible answer
  // reads as a click that did nothing. Arriving by a link already lands there.
  const panel = useRef<HTMLDivElement>(null)
  const { shouldAnimate } = useMotionPreference()
  const scrollPending = useRef(false)

  const select = useCallback(
    (next: Selection) => {
      const s = same(sel, next) ? null : next
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${s ? hashFor(s) : ''}`)
      scrollPending.current = s !== null
      setSel(s)
    },
    [sel],
  )

  useEffect(() => {
    if (!scrollPending.current || !panel.current) return
    scrollPending.current = false
    const r = panel.current.getBoundingClientRect()
    if (r.top < 0 || r.top > window.innerHeight * 0.6) {
      panel.current.scrollIntoView({ behavior: shouldAnimate ? 'smooth' : 'auto', block: 'start' })
    }
  }, [sel, shouldAnimate])

  const selChapter = sel?.kind === 'chapter' ? sel.n : null
  const selTerm = sel?.kind === 'term' ? terms.find((t) => t.slug === sel.slug) ?? null : null

  return (
    <>
      <div ref={panel} aria-live="polite" className="mb-8 scroll-mt-28">
        {selChapter !== null && <ChapterPanel n={selChapter} terms={chapterTerms(terms, selChapter)} />}
        {selTerm && <TermPanel t={selTerm} units={units} select={select} />}
        {!sel && (
          <p className={DESC}>
            Select a chapter (the squares along the top of the map, or any square in its column) to list its key
            terms here, or select a term to see where it stands.
          </p>
        )}
      </div>
      <ScrollArea className="w-full rounded-lg border border-foreground/10">
        <table className="border-separate border-spacing-0 text-left">
          <caption className="sr-only">
            Each glossary entry and how often it appears in each of the {chapters} chapters
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-background px-3 pt-3 pb-2 text-xs font-normal uppercase tracking-widest text-foreground/40 align-bottom"
              >
                Term
              </th>
              <th scope="col" className="pt-3 pb-2 pr-3 font-normal align-bottom">
                <span className="sr-only">Chapters 1 to {chapters}</span>
                <div className="flex gap-1">
                  {NINE.map((g) => (
                    <div key={g} className="flex flex-col gap-1">
                      <span aria-hidden="true" className="text-[10px] leading-none tabular-nums text-foreground/40">
                        {g * 9 + 1}
                      </span>
                      <div className="flex gap-px">
                        {NINE.map((i) => {
                          const n = g * 9 + i + 1
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => select({ kind: 'chapter', n })}
                              aria-pressed={selChapter === n}
                              aria-label={`Chapter ${n}`}
                              title={`Chapter ${n}`}
                              className={cn(
                                'w-[9px] h-3 rounded-[1px] bg-foreground/15 hover:bg-foreground/50 transition-colors',
                                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus)]',
                                selChapter === n && 'bg-foreground!',
                              )}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => {
              const peak = Math.max(1, ...t.byChapter)
              const on = selTerm?.slug === t.slug
              const where = units.filter((n) => t.byChapter[n]! > 0)
              return (
                <tr key={t.slug} className={cn('group', on && 'bg-foreground/5')}>
                  <th scope="row" className={cn('sticky left-0 z-10 p-0 font-normal', on ? 'bg-muted' : 'bg-background')}>
                    <button
                      type="button"
                      onClick={() => select({ kind: 'term', slug: t.slug })}
                      aria-pressed={on}
                      title={t.render}
                      className="flex items-baseline gap-2 w-32 sm:w-52! px-3 py-0.5 text-left hover:bg-foreground/10 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                    >
                      <span lang="zh-Hant" className="font-han text-base text-foreground shrink-0">{t.term}</span>
                      <span className="italic text-xs text-foreground/60 truncate sm:shrink-0! sm:overflow-visible!">{t.pinyin}</span>
                      <span className="hidden sm:inline! text-xs text-foreground/50 truncate min-w-0">{t.render}</span>
                    </button>
                  </th>
                  <td className="py-0.5 pr-3 align-middle">
                    <div aria-hidden="true" className="flex gap-1">
                      {NINE.map((g) => (
                        <div key={g} className="flex gap-px">
                          {NINE.map((i) => {
                            const n = g * 9 + i + 1
                            const k = t.byChapter[n] ?? 0
                            return (
                              <span
                                key={n}
                                onClick={() => select({ kind: 'chapter', n })}
                                title={`${t.term} in chapter ${n}: ${k === 0 ? 'not present' : times(k)}`}
                                className={cn(
                                  'block w-[9px] h-3 rounded-[1px] cursor-pointer',
                                  k === 0 && 'bg-foreground/5',
                                  selChapter === n && 'outline outline-1 outline-foreground/70',
                                )}
                                style={k ? { background: shade(k, peak) } : undefined}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                    <span className="sr-only">
                      {t.total} times in {t.chapters} chapters:{' '}
                      {where.map((n, i) => (
                        <Fragment key={n}>{i > 0 && ', '}chapter {n} {times(t.byChapter[n]!)}</Fragment>
                      ))}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

    </>
  )
}

function ChapterPanel({ n, terms }: { n: number; terms: ReturnType<typeof chapterTerms> }) {
  return (
    <section aria-labelledby="panel-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <h2 id="panel-heading" className="text-xl font-light text-foreground">
          Chapter {n}: {terms.length} key {terms.length === 1 ? 'term' : 'terms'}
        </h2>
        <Link href={taoTeChingHref(n)} className="text-base text-foreground/60 hover:text-foreground transition-colors">
          Read chapter {n} →
        </Link>
      </div>
      {terms.length > 0 ? (
        <TermList terms={terms} />
      ) : (
        <p className="text-foreground/50">No glossary entry stands in this chapter yet.</p>
      )}
    </section>
  )
}

function TermPanel({
  t,
  units,
  select,
}: {
  t: BookTermView
  units: number[]
  select: (s: Selection) => void
}) {
  const where = units.filter((n) => t.byChapter[n]! > 0)
  return (
    <section aria-labelledby="panel-heading">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
        <h2 id="panel-heading" className="flex items-baseline gap-3">
          <span lang="zh-Hant" className="font-han text-3xl text-foreground">{t.term}</span>
          <span className="italic text-lg text-foreground/60">{t.pinyin}</span>
        </h2>
        {t.status && t.status !== 'locked' && (
          <Badge variant="outline" className="text-foreground/50">{t.status}</Badge>
        )}
      </div>
      <p className="text-lg text-foreground/85 mb-2">{t.render}</p>
      <p className={`${DESC} mb-4`}>
        {t.total === 1 ? 'Once' : t.total === 2 ? 'Twice' : `${t.total} times`} in {t.chapters} of{' '}
        {units.length} chapters. Select a chapter to list its terms.
      </p>
      <ul className="list-none p-0 mt-0 mx-0 mb-5 flex flex-wrap gap-2">
        {where.map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => select({ kind: 'chapter', n })}
              className="inline-flex items-baseline gap-1 rounded-md border border-foreground/10 px-2.5 py-1 text-sm tabular-nums text-foreground/80 hover:bg-foreground/10 hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
              {n}
              {t.byChapter[n]! > 1 && <span className="text-xs text-foreground/50">×{t.byChapter[n]}</span>}
              <span className="sr-only">: chapter {n}, {times(t.byChapter[n]!)}</span>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" asChild className="gap-2">
        <a href={t.href} target="_blank" rel="noopener noreferrer">
          Why it reads this way: the glossary entry
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </Button>
    </section>
  )
}
