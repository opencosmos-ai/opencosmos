'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Label, Switch, cn } from '@opencosmos/ui'
import { useMotionPreference } from '@opencosmos/ui/hooks'
import type { ChapterView } from '@/lib/tao-te-ching'
import CharacterSheet, { type Selection } from './CharacterSheet'
import { DESC, H2 } from './styles'

const PINYIN_KEY = 'opencosmos.tao-te-ching.pinyin'
const NUMBERS_KEY = 'opencosmos.tao-te-ching.line-numbers'

/**
 * A reader's choice, remembered per visitor. Read after mount so the server
 * render and the first client render agree; storage can be missing or throw
 * (private windows, blocked site data), so every access is guarded.
 */
function useStoredToggle(key: string, initial: boolean): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(initial)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) setOn(saved === '1')
    } catch {
      // no storage — the default stands
    }
  }, [key])
  const set = useCallback((next: boolean) => {
    setOn(next)
    try {
      localStorage.setItem(key, next ? '1' : '0')
    } catch {
      // no storage — the choice lasts for this visit
    }
  }, [key])
  return [on, set]
}

/** [3] → "3", [3, 4] → "3–4", [3, 5] → "3, 5". */
function lineLabel(nums: number[]): string {
  const sorted = [...nums].sort((a, b) => a - b)
  const contiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1]! + 1)
  if (sorted.length > 1 && contiguous) return `${sorted[0]}–${sorted[sorted.length - 1]}`
  return sorted.join(', ')
}

// Left-aligned, so the numbers share a clean left edge, and never wrapped: a
// range like "13–14" stays on one line. The width is set per chapter, below.
const GUTTER = 'shrink-0 pr-3 text-left whitespace-nowrap text-xs tabular-nums text-foreground/35 select-none'

/**
 * Translation and Original, together, because they share one piece of state:
 * which line is lit. Focusing or hovering a Chinese line lights the English
 * that renders it, and the reverse, and selecting an English line scrolls to
 * its Chinese — but only in a chapter whose alignment is certain, which since
 * 2026-10-24 is all 81. A guess is never shown as a pairing (ADR 0020 §2).
 */
export default function ChapterText({ chapter }: { chapter: ChapterView }) {
  const { shouldAnimate } = useMotionPreference()
  const [showPinyin, setShowPinyin] = useStoredToggle(PINYIN_KEY, true)
  const [showNumbers, setShowNumbers] = useStoredToggle(NUMBERS_KEY, false)
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [selected, setSelected] = useState<Selection | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)

  // verse line (1-based) → the Chinese lines it renders, the inverse of each
  // line's `verse`. Empty unless the chapter's alignment is exact.
  const linesOfVerse = useMemo(() => {
    const m = new Map<number, number[]>()
    for (const l of chapter.lines) for (const v of l.verse) m.set(v, [...(m.get(v) ?? []), l.seq])
    return m
  }, [chapter.lines])

  // One gutter width for both columns, wide enough for the chapter's longest
  // label and never narrower than 2rem, so the English and the Chinese start at
  // the same indent and a chapter of single numbers keeps its narrow gutter.
  const gutterStyle = useMemo(() => {
    const labels = [...linesOfVerse.values()].map(lineLabel)
    const longest = Math.max(String(chapter.lines.length).length, ...labels.map((l) => l.length))
    return { width: `max(2rem, calc(${longest}ch + 0.75rem))` }
  }, [linesOfVerse, chapter.lines.length])

  const litVerses = useMemo(() => {
    const line = chapter.lines.find((l) => l.seq === activeLine)
    return new Set(line?.verse ?? [])
  }, [activeLine, chapter.lines])

  const link = chapter.exact
  const light = shouldAnimate ? 'transition-colors duration-150' : ''
  const lit = 'bg-[var(--color-primary)]/30 text-foreground'

  // The Chinese line an English line was just selected to reach. It stays lit
  // a moment after the scroll, because the scroll moves the English line out
  // from under the pointer and clears the hover.
  const [landed, setLanded] = useState<number | null>(null)
  const landedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (landedTimer.current) clearTimeout(landedTimer.current)
  }, [])
  // The English line a reader arrived at from the landing page's search
  // (`#verse-N`). Next scrolls to it; this lights it long enough to be found.
  const [arrived, setArrived] = useState<number | null>(null)
  useEffect(() => {
    const m = /^#verse-(\d+)$/.exec(window.location.hash)
    if (!m) return
    setArrived(Number(m[1]))
    const t = setTimeout(() => setArrived(null), 2400)
    return () => clearTimeout(t)
  }, [])

  const goToLine = useCallback((seq: number) => {
    const target = document.querySelector(`[data-line="${seq}"]`)
    if (!target) return
    target.scrollIntoView({ behavior: shouldAnimate ? 'smooth' : 'auto', block: 'center' })
    setLanded(seq)
    if (landedTimer.current) clearTimeout(landedTimer.current)
    landedTimer.current = setTimeout(() => setLanded(null), 1600)
  }, [shouldAnimate])

  const lineNumbersToggle = (
    <div className="flex items-center gap-2">
      <Label htmlFor="ttc-line-numbers" className="text-sm text-foreground/70">Line numbers</Label>
      <Switch id="ttc-line-numbers" checked={showNumbers} onCheckedChange={setShowNumbers} />
    </div>
  )

  let verseNo = 0
  return (
    <>
      {/* No visible heading: the verse opens the page. The id keeps the
          contents list's "Translation" link, and the hidden heading keeps the
          section in a screen reader's list of headings. */}
      <section id="translation" aria-labelledby="translation-heading" className="scroll-mt-28 pt-16">
        <h2 id="translation-heading" className="sr-only">Translation</h2>

        <div className="space-y-6 text-lg leading-loose text-foreground/85">
          {chapter.stanzas.map((stanza, s) => (
            <p key={s}>
              {stanza.map((line, i) => {
                const v = ++verseNo
                const isLit = (link && litVerses.has(v)) || arrived === v
                const source = linesOfVerse.get(v) ?? []
                const target = link ? source[0] : undefined
                const verseClass = cn('rounded px-1 -mx-1 scroll-mt-28', light, isLit && lit)
                return (
                  <span key={i} className="flex items-baseline">
                    {showNumbers && (
                      <span className={GUTTER} style={gutterStyle} aria-hidden="true">{source.length ? lineLabel(source) : ''}</span>
                    )}
                    {target !== undefined ? (
                      // Selecting a paired line takes the reader to the Chinese it renders.
                      <button
                        type="button"
                        id={`verse-${v}`}
                        data-verse={v}
                        onMouseEnter={() => setActiveLine(target)}
                        onMouseLeave={() => setActiveLine(null)}
                        onFocus={() => setActiveLine(target)}
                        onBlur={() => setActiveLine(null)}
                        onClick={() => goToLine(target)}
                        className={cn(
                          verseClass,
                          'text-left cursor-pointer',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
                        )}
                      >
                        {line}
                      </button>
                    ) : (
                      <span id={`verse-${v}`} data-verse={v} className={verseClass}>{line}</span>
                    )}
                  </span>
                )
              })}
            </p>
          ))}
        </div>

        <div className="flex justify-end mt-6">{lineNumbersToggle}</div>

        {showNumbers && !link && (
          <p className="mt-3 mb-0 text-sm text-foreground/50 sm:text-right">
            This chapter’s English and Chinese aren’t paired line by line yet, so only the Chinese is numbered.
          </p>
        )}
      </section>

      <section aria-labelledby="original">
        <h2 id="original" className={cn(H2, 'mt-20')}>Original</h2>

        <div className="flex flex-col sm:flex-row sm:items-start gap-x-8 gap-y-3 mb-6">
          <p className={cn(DESC, 'm-0 flex-1 min-w-0')}>
            Select any character for its reading, its meaning, and how this translation renders it.
            {link
              ? ' Point to a line to see the English that renders it, or select an English line to go to its Chinese.'
              : ' This chapter’s English and Chinese have different numbers of lines, so the lines are not paired here.'}
          </p>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto pt-0.5">
            <Label htmlFor="ttc-pinyin" className="text-sm text-foreground/70">Pinyin</Label>
            <Switch id="ttc-pinyin" checked={showPinyin} onCheckedChange={setShowPinyin} />
          </div>
        </div>

        <div className="space-y-2">
          {chapter.lines.map((line) => {
            const isLit = link && (activeLine === line.seq || landed === line.seq)
            return (
              <div key={line.seq} className="flex items-baseline">
              {showNumbers && <span className={GUTTER} style={gutterStyle} aria-hidden="true">{line.seq}</span>}
              <p
                lang="zh-Hant"
                data-line={line.seq}
                onMouseEnter={link ? () => setActiveLine(line.seq) : undefined}
                onMouseLeave={link ? () => setActiveLine(null) : undefined}
                onFocus={link ? () => setActiveLine(line.seq) : undefined}
                onBlur={link ? () => setActiveLine(null) : undefined}
                className={cn(
                  'font-han text-3xl sm:text-4xl text-foreground/90 rounded-md px-2 -mx-2 py-1 m-0 w-fit',
                  showPinyin ? 'leading-[2.4]' : 'leading-relaxed',
                  light,
                  isLit && lit,
                )}
              >
                {line.tokens.map((t, i) => {
                  if (t.kind === 'text') {
                    return <span key={i} aria-hidden="true" className="text-foreground/40">{t.text}</span>
                  }
                  const info = chapter.chars[t.c]
                  const reading = t.p ?? info?.p ?? ''
                  const meaning = info?.g ?? info?.r ?? ''
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={[t.c, reading, meaning].filter(Boolean).join(', ')}
                      aria-haspopup="dialog"
                      onClick={(e) => {
                        trigger.current = e.currentTarget
                        setSelected({ c: t.c, p: t.p, line: line.seq })
                      }}
                      className={cn(
                        'rounded-sm px-0.5 cursor-pointer hover:bg-foreground/10',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
                        light,
                      )}
                    >
                      {showPinyin ? (
                        <ruby>
                          {t.c}
                          <rt className="font-sans text-sm tracking-normal text-foreground/55">{t.p ?? ''}</rt>
                        </ruby>
                      ) : (
                        t.c
                      )}
                    </button>
                  )
                })}
              </p>
              </div>
            )
          })}
        </div>
      </section>

      <CharacterSheet
        selection={selected}
        info={selected ? chapter.chars[selected.c] ?? null : null}
        onClose={() => setSelected(null)}
        returnFocus={() => trigger.current?.focus()}
      />
    </>
  )
}
