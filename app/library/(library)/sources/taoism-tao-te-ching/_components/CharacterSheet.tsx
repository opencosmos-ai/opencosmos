'use client'

import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, cn, useIsMobile } from '@opencosmos/ui'
import { useMotionPreference } from '@opencosmos/ui/hooks'
import { ExternalLink } from 'lucide-react'
import type { CharView, Part } from '@/lib/tao-te-ching'

export type Selection = {
  c: string
  /** This token's own reading, which can differ from the character's usual one. */
  p: string | null
  line: number
}

type Props = {
  selection: Selection | null
  info: CharView | null
  onClose: () => void
  returnFocus: () => void
}

function Parts({ label, parts }: { label: string; parts: Part[] }) {
  if (parts.length === 0) return null
  return (
    <div>
      <dt className="text-sm uppercase tracking-widest text-foreground/50 mb-1.5">{label}</dt>
      <dd className="m-0 space-y-1">
        {parts.map((part) => (
          <div key={part.c} className="flex items-baseline gap-2 text-base text-foreground/75">
            <span lang="zh-Hant" className="font-han text-2xl text-foreground">{part.c}</span>
            {part.p && <span className="italic">{part.p.toLowerCase()}</span>}
            {part.g && <span>— {part.g}</span>}
          </div>
        ))}
      </dd>
    </div>
  )
}

/**
 * One character, opened from the Original. Everything here comes from the
 * export; the full card, with its 說文 analysis and every line it stands in,
 * is the atlas's, and is linked rather than rebuilt (ADR 0020 §4).
 *
 * A side panel on wide screens and a bottom sheet at phone width, so the line
 * it came from stays in view either way. Focus returns to the character's
 * button on close.
 */
export default function CharacterSheet({ selection, info, onClose, returnFocus }: Props) {
  const isMobile = useIsMobile()
  const { shouldAnimate } = useMotionPreference()
  const reading = selection?.p ?? info?.p ?? null

  return (
    <Sheet open={selection !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          returnFocus()
        }}
        className={cn(
          'overflow-y-auto',
          isMobile ? 'max-h-[85vh]' : 'w-full sm:max-w-md!',
          // The library's Sheet slides in whatever the reader's motion setting.
          // Localized until @opencosmos/ui's Sheet reads useMotionPreference itself.
          !shouldAnimate && 'data-[state=open]:animate-none! data-[state=closed]:animate-none!',
        )}
      >
        {selection && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-baseline gap-4">
                <span lang="zh-Hant" className="font-han text-6xl font-normal leading-none text-foreground">
                  {selection.c}
                </span>
                {reading && <span className="text-2xl font-light italic text-foreground/70">{reading}</span>}
              </SheetTitle>
              <SheetDescription className="text-lg text-foreground/75">
                {info?.g ?? 'No gloss recorded yet.'}
              </SheetDescription>
            </SheetHeader>

            {info && (
              <dl className="mt-6 space-y-5">
                {info.r && (
                  <div>
                    <dt className="text-sm uppercase tracking-widest text-foreground/50 mb-1.5">This translation</dt>
                    <dd className="m-0 text-lg text-foreground">{info.r}</dd>
                  </div>
                )}
                <Parts label="Meaning from" parts={info.sem} />
                <Parts label="Sound from" parts={info.pho} />
                <div>
                  <dt className="text-sm uppercase tracking-widest text-foreground/50 mb-1.5">In the book</dt>
                  <dd className="m-0 text-base text-foreground/75">
                    {info.n} {info.n === 1 ? 'time' : 'times'}, in {info.chapters} {info.chapters === 1 ? 'chapter' : 'chapters'}
                  </dd>
                </div>
              </dl>
            )}

            <div className="mt-8 flex flex-col gap-2">
              {info && (
                <Button variant="outline" asChild className="justify-between gap-2">
                  <a href={info.atlas} target="_blank" rel="noopener noreferrer">
                    <span>
                      <span lang="zh-Hant" className="font-han">{selection.c}</span> in the Character Atlas
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Button>
              )}
              {info?.entries.map((entry) => (
                <Button key={entry.slug} variant="outline" asChild className="justify-between gap-2">
                  <a href={entry.href} target="_blank" rel="noopener noreferrer">
                    <span className="truncate">
                      Glossary: <span lang="zh-Hant" className="font-han">{entry.term}</span>{' '}
                      <span className="italic">{entry.pinyin}</span>
                      {entry.render && <span className="text-foreground/60"> — {entry.render}</span>}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Button>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
