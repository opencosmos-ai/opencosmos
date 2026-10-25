'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@opencosmos/ui'
import { taoTeChingHref } from '@/lib/corpus-href'
import type { SearchLine } from '@/lib/tao-te-ching'

/** Where the lazy line index lives. See ../search-index. */
const SEARCH_INDEX_URL = `${taoTeChingHref()}/search-index`

/** Below this, matching is noise rather than signal, as in the Library's search. */
const MIN_QUERY = 2

/** Lines shown before the reader asks for the rest. */
const FIRST = 20

const HAN_RE = /[㐀-鿿]/

const MARK = 'bg-[var(--color-primary)]/30 text-foreground rounded-sm'

type Range = [number, number]

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Tone marks off, one character for one, so a match's offsets in the toneless
 * copy are its offsets in the pinyin as written: "gu" finds gǔ, and the mark
 * lands on gǔ. The pinyin is all in the BMP, so a code unit is a character.
 */
function toneless(s: string): string {
  return s.toLowerCase().replace(/[^\x00-\x7f]/g, (c) => c.normalize('NFD')[0] ?? c)
}

function ranges(text: string, re: RegExp): Range[] {
  return [...text.matchAll(re)].map((m) => [m.index, m.index + m[0].length])
}

const hanUnits = (zh: string) => ranges(zh, /[㐀-鿿]/g)
const syllableUnits = (py: string) => ranges(py, /[\p{L}']+/gu)

/**
 * Carry a match across to the other script: the syllables a Chinese match is
 * read as, or the characters a pinyin match reads. One syllable per character,
 * as lib/tao-te-ching's tokenize pairs them, and on a count mismatch no mark
 * at all rather than a wrong one.
 */
function across(marks: Range[], from: Range[], to: Range[]): Range[] {
  if (marks.length === 0 || from.length !== to.length) return []
  return to.filter((_, i) => marks.some(([s, e]) => from[i]![0] >= s && from[i]![1] <= e))
}

function Marked({ text, marks }: { text: string; marks: Range[] }) {
  if (marks.length === 0) return <>{text}</>
  const out: React.ReactNode[] = []
  let at = 0
  marks.forEach(([s, e], i) => {
    if (s > at) out.push(text.slice(at, s))
    out.push(<mark key={i} className={MARK}>{text.slice(s, e)}</mark>)
    at = e
  })
  out.push(text.slice(at))
  return <>{out}</>
}

type Hit = { line: SearchLine; en: Range[]; zh: Range[]; py: Range[] }

/**
 * Search the text itself: every English line, and the Chinese and pinyin it
 * renders. A query with a Chinese character searches the Chinese; any other
 * searches the English from the start of a word, so "art" doesn't find
 * "heart", and the pinyin by whole syllables, so "gu" finds 谷 (gǔ) and 故
 * (gù) but not 國 (guó), and "gǔ" finds only 谷. A match in either script
 * lights its counterpart in the other. Each result opens its chapter at that
 * line.
 */
export default function TextSearch() {
  const [search, setSearch] = useState('')
  const [index, setIndex] = useState<SearchLine[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [allFor, setAllFor] = useState<string | null>(null)
  const requested = useRef(false)

  function loadIndex() {
    if (requested.current) return
    requested.current = true
    fetch(SEARCH_INDEX_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setIndex(data)
        else setFailed(true)
      })
      .catch(() => setFailed(true))
  }

  const query = search.trim()
  const active = query.length >= MIN_QUERY || HAN_RE.test(query)

  const hits = useMemo<Hit[] | null>(() => {
    if (!active || !index) return null
    const out: Hit[] = []
    if (HAN_RE.test(query)) {
      const q = query.replace(/\s+/g, '')
      for (const line of index) {
        const [, , , zh, py] = line
        const marks: Range[] = []
        for (let i = zh.indexOf(q); i !== -1; i = zh.indexOf(q, i + q.length)) marks.push([i, i + q.length])
        if (marks.length) {
          out.push({ line, en: [], zh: marks, py: across(marks, hanUnits(zh), syllableUnits(py)) })
        }
      }
      return out
    }
    const en = new RegExp(`\\b${escapeRegExp(query)}`, 'gi')
    // A query written with tones ("gǔ") means that tone; one without, any.
    const toned = /[^\x00-\x7f]/.test(query)
    const syllables = toned ? query.toLowerCase() : toneless(query)
    const re = /^[\p{L}' ]+$/u.test(syllables)
      ? new RegExp(`(?<!\\p{L})${escapeRegExp(syllables).replace(/ +/g, ' +')}(?!\\p{L})`, 'gu')
      : null
    for (const line of index) {
      const [, , english, zh, py] = line
      const pyMarks = re ? ranges(toned ? py.toLowerCase() : toneless(py), re) : []
      const enMarks = ranges(english, en)
      if (enMarks.length || pyMarks.length) {
        out.push({ line, en: enMarks, zh: across(pyMarks, syllableUnits(py), hanUnits(zh)), py: pyMarks })
      }
    }
    return out
  }, [active, query, index])

  const chapters = hits ? new Set(hits.map((h) => h.line[0])).size : 0
  const shown = hits && allFor !== query ? hits.slice(0, FIRST) : hits

  function status(): string {
    if (!active) return ''
    if (failed) return 'Search isn’t available right now.'
    if (!hits) return 'Searching the text…'
    if (hits.length === 0) return `Nothing in the text matches “${query}”.`
    const lines = `${hits.length} ${hits.length === 1 ? 'line' : 'lines'}`
    return `${lines} in ${chapters} ${chapters === 1 ? 'chapter' : 'chapters'}`
  }

  return (
    <div className="mb-10">
      <Input
        type="search"
        aria-label="Search the Tao Te Ching"
        placeholder="Search in English, pinyin, or Chinese…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={loadIndex}
        className="max-w-sm"
      />

      <p aria-live="polite" className="text-sm text-foreground/40 mt-4 mb-0 empty:hidden">
        {status()}
      </p>

      {shown && shown.length > 0 && (
        <ol className="list-none p-0 mt-4 mb-0 space-y-1">
          {shown.map(({ line: [n, v, en, zh, py], ...marks }) => (
            <li key={`${n}.${v}`}>
              <Link
                href={`${taoTeChingHref(n)}#verse-${v}`}
                className="flex items-baseline gap-4 rounded-md px-3 py-2.5 -mx-3 hover:bg-foreground/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              >
                <span className="w-6 shrink-0 text-sm tabular-nums text-foreground/40">
                  <span className="sr-only">Chapter </span>
                  {n}
                </span>
                <span className="min-w-0">
                  <span className="block text-base leading-relaxed text-foreground/85">
                    <Marked text={en} marks={marks.en} />
                  </span>
                  {/* The Chinese never stands alone: its pinyin beside it, and
                      the English it renders above. */}
                  {zh && (
                    <span className="block text-sm leading-relaxed text-foreground/45">
                      <span lang="zh-Hant" className="font-han mr-3"><Marked text={zh} marks={marks.zh} /></span>
                      <Marked text={py} marks={marks.py} />
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {hits && shown && hits.length > shown.length && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setAllFor(query)}>
          Show all {hits.length} lines
        </Button>
      )}
    </div>
  )
}
