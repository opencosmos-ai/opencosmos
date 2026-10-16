'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Label, Switch, cn } from '@opencosmos/ui'
import { useMotionPreference } from '@opencosmos/ui/hooks'
import type { ChapterView } from '@/lib/tao-te-ching'
import CharacterSheet, { type Selection } from './CharacterSheet'
import { H2 } from './styles'

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

const GUTTER = 'w-8 shrink-0 pr-3 text-right text-xs tabular-nums text-foreground/35 select-none'

/**
 * Translation and Original, together, because they share one piece of state:
 * which line is lit. Focusing or hovering a Chinese line lights the English
 * that renders it, and the reverse — but only in a chapter whose alignment is
 * exact. Elsewhere the pairing is a proportional guess, and a guess is never
 * shown as a pairing (ADR 0020 §2).
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

  const litVerses = useMemo(() => {
    const line = chapter.lines.find((l) => l.seq === activeLine)
    return new Set(line?.verse ?? [])
  }, [activeLine, chapter.lines])

  const link = chapter.exact
  const light = shouldAnimate ? 'transition-colors duration-150' : ''

  let verseNo = 0
  return (
    <>
      {/* No visible heading: the verse opens the page. The id keeps the
          contents list's "Translation" link, and the hidden heading keeps the
          section in a screen reader's list of headings. */}
      <section id="translation" aria-labelledby="translation-heading" className="scroll-mt-28 pt-6">
        <h2 id="translation-heading" className="sr-only">Translation</h2>

        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <Switch id="ttc-line-numbers" checked={showNumbers} onCheckedChange={setShowNumbers} />
            <Label htmlFor="ttc-line-numbers" className="text-xs text-foreground/50">Line numbers</Label>
          </div>
        </div>

        <div className="space-y-5 text-lg leading-relaxed text-foreground/85">
          {chapter.stanzas.map((stanza, s) => (
            <p key={s}>
              {stanza.map((line, i) => {
                const v = ++verseNo
                const lit = link && litVerses.has(v)
                const source = linesOfVerse.get(v) ?? []
                return (
                  <span key={i} className="flex items-baseline">
                    {showNumbers && (
                      <span className={GUTTER} aria-hidden="true">{source.length ? lineLabel(source) : ''}</span>
                    )}
                    <span
                      data-verse={v}
                      onMouseEnter={link ? () => setActiveLine(source[0] ?? null) : undefined}
                      onMouseLeave={link ? () => setActiveLine(null) : undefined}
                      className={cn('rounded px-1 -mx-1', light, lit && 'bg-[var(--color-primary)]/15 text-foreground')}
                    >
                      {line}
                    </span>
                  </span>
                )
              })}
            </p>
          ))}
        </div>

        {showNumbers && !link && (
          <p className="mt-4 mb-0 text-xs text-foreground/40 max-w-prose">
            This chapter’s English and Chinese aren’t paired line by line yet, so only the Chinese is numbered.
          </p>
        )}
      </section>

      <section aria-labelledby="original">
        <h2 id="original" className={H2}>Original</h2>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Switch id="ttc-pinyin" checked={showPinyin} onCheckedChange={setShowPinyin} />
            <Label htmlFor="ttc-pinyin" className="text-sm text-foreground/60">Pinyin</Label>
          </div>
          <p className="text-sm text-foreground/50 m-0 max-w-prose">
            Select any character for its reading, its meaning, and how this translation renders it.
            {link
              ? ' Point to a line to see the English that renders it.'
              : ' This chapter’s English and Chinese have different numbers of lines, so the lines are not paired here.'}
          </p>
        </div>

        <div className="space-y-2">
          {chapter.lines.map((line) => {
            const lit = link && activeLine === line.seq
            return (
              <div key={line.seq} className="flex items-baseline">
              {showNumbers && <span className={GUTTER} aria-hidden="true">{line.seq}</span>}
              <p
                lang="zh-Hant"
                onMouseEnter={link ? () => setActiveLine(line.seq) : undefined}
                onMouseLeave={link ? () => setActiveLine(null) : undefined}
                onFocus={link ? () => setActiveLine(line.seq) : undefined}
                onBlur={link ? () => setActiveLine(null) : undefined}
                className={cn(
                  'font-han text-2xl sm:text-3xl text-foreground/90 rounded-md px-2 -mx-2 py-1 m-0 w-fit',
                  showPinyin ? 'leading-[2.4]' : 'leading-relaxed',
                  light,
                  lit && 'bg-[var(--color-primary)]/15',
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
                          <rt className="font-sans text-xs tracking-normal text-foreground/50">{t.p ?? ''}</rt>
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
