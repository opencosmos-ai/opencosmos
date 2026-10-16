'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Label, Switch, cn } from '@opencosmos/ui'
import { useMotionPreference } from '@opencosmos/ui/hooks'
import type { ChapterView } from '@/lib/tao-te-ching'
import CharacterSheet, { type Selection } from './CharacterSheet'
import { H2 } from './styles'

const PINYIN_KEY = 'opencosmos.tao-te-ching.pinyin'

/**
 * The reader's pinyin choice, remembered per visitor. Read after mount so the
 * server render and the first client render agree; storage can be missing or
 * throw (private windows, blocked site data), so every access is guarded.
 */
function usePinyinPreference(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(true)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINYIN_KEY)
      if (saved !== null) setOn(saved === '1')
    } catch {
      // no storage — the default stands
    }
  }, [])
  const set = useCallback((next: boolean) => {
    setOn(next)
    try {
      localStorage.setItem(PINYIN_KEY, next ? '1' : '0')
    } catch {
      // no storage — the choice lasts for this visit
    }
  }, [])
  return [on, set]
}

/**
 * Translation and Original, together, because they share one piece of state:
 * which line is lit. Focusing or hovering a Chinese line lights the English
 * that renders it, and the reverse — but only in a chapter whose alignment is
 * exact. Elsewhere the pairing is a proportional guess, and a guess is never
 * shown as a pairing (ADR 0020 §2).
 */
export default function ChapterText({ chapter }: { chapter: ChapterView }) {
  const { shouldAnimate } = useMotionPreference()
  const [showPinyin, setShowPinyin] = usePinyinPreference()
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [selected, setSelected] = useState<Selection | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)

  // verse line (1-based) → Chinese line, the inverse of each line's `verse`.
  const lineOfVerse = useMemo(() => {
    const m = new Map<number, number>()
    for (const l of chapter.lines) for (const v of l.verse) m.set(v, l.seq)
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
      <section aria-labelledby="translation">
        <h2 id="translation" className={H2}>Translation</h2>
        <div className="space-y-5 text-lg leading-relaxed text-foreground/85">
          {chapter.stanzas.map((stanza, s) => (
            <p key={s}>
              {stanza.map((line, i) => {
                const v = ++verseNo
                const lit = link && litVerses.has(v)
                return (
                  <span key={i} className="block">
                    <span
                      data-verse={v}
                      onMouseEnter={link ? () => setActiveLine(lineOfVerse.get(v) ?? null) : undefined}
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
              <p
                key={line.seq}
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
