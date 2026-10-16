import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, Button, GitHubIcon, Separator } from '@opencosmos/ui'
import { BookOpen, ExternalLink } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/knowledge-meta'
import { TAO_TE_CHING_DOC, taoTeChingHref } from '@/lib/corpus-href'
import { ATLAS_URL, TAOTECHING_URL, getChapterTitles } from '@/lib/tao-te-ching'
import TableOfContents from '../../[...slug]/TableOfContents'
import LibraryBreadcrumb from '../../../LibraryBreadcrumb'
import LegacyAnchorRedirect from './_components/LegacyAnchorRedirect'
import { H2 } from './_components/styles'

export const metadata: Metadata = {
  title: 'Tao Te Ching — OpenCosmos',
  description:
    'The Open Tao Te Ching: a new English translation made directly from the classical Chinese by Shalom Ormsby, given to the public domain, and edited in the open.',
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const

const TOC = [
  { id: 'about-this-translation', text: 'About this translation', depth: 2 as const },
  { id: 'chapters', text: 'Chapters', depth: 2 as const },
  { id: 'take-part', text: 'Take part', depth: 2 as const },
]

export default function TaoTeChingPage() {
  const titles = getChapterTitles()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24">
      <LegacyAnchorRedirect />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_224px]! gap-12 items-start">
        <div className="min-w-0" data-doc-content>
          <LibraryBreadcrumb
            items={[
              { label: 'The Library', href: '/library' },
              { label: CATEGORY_LABELS.sources ?? 'Sources', href: '/library' },
              { label: 'Tao Te Ching' },
            ]}
          />

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary">taoism</Badge>
            <Badge variant="outline">scripture</Badge>
            <Badge variant="outline">CC0 · public domain</Badge>
          </div>

          <h1 className="text-3xl font-light tracking-wide text-foreground mb-2 leading-tight">
            Tao Te Ching
          </h1>
          <p className="text-sm text-foreground/40 mb-6">
            The Open Tao Te Ching · Laozi · translated by Shalom Ormsby
          </p>
          <p className="text-lg font-light text-foreground/60 leading-relaxed mb-10">
            A new English translation, made directly from the classical Chinese and given to the public domain.
            Eighty-one short chapters on the Tao, non-doing, emptiness and softness, without the overlays earlier
            translations laid over them.
          </p>

          <Separator className="mb-2" />

          <section aria-labelledby="about-this-translation">
            <h2 id="about-this-translation" className={H2}>About this translation</h2>
            <div className="space-y-5 text-foreground/70 leading-relaxed max-w-prose">
              <p>
                Each chapter was worked out line by line from the Chinese, the classical commentaries and the
                histories of its characters, never from earlier English translations, and no phrasing is borrowed
                from them. The aim is an honest, living English, free of what dynastic, Christian missionary and New
                Age readings brought to the text.
              </p>
              <p>
                So the sage is not “he”. 天 (<em>tiān</em>) is “sky”, not “Heaven”. The text’s own images come
                forward instead: water, root, valley, uncarved wood, the newborn, the mother. Every consequential
                decision is documented and open to comment. Where the Chinese is genuinely double, the English
                leaves it open rather than settling it by fiat.
              </p>
              <p>
                <strong className="font-semibold text-foreground">Where it stands:</strong> the first draft of all
                81 chapters is complete, and the editing pass is under way in the open. The text changes, sometimes
                weekly, and this page is rebuilt from the translation’s repository whenever it does.
              </p>
              <p>
                Each chapter has the English, then the Chinese line by line: select any character for its reading,
                its meaning, and how this translation renders it. Then the glossary terms that stand in the
                chapter, the translator’s notes on why it reads as it does, and what is open for discussion.
              </p>
            </div>
          </section>

          <section aria-labelledby="chapters">
            <h2 id="chapters" className={H2}>Chapters</h2>
            <p className="text-sm text-foreground/50 mb-5 max-w-prose">
              The titles are Heshang Gong’s, from his Han-dynasty commentary, centuries after the text. Laozi’s
              chapters had none. Their English here is a working rendering.
            </p>
            <ol className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {titles.map((t) => (
                <li key={t.n} className="border-b border-foreground/10">
                  <Link
                    href={taoTeChingHref(t.n)}
                    className="flex items-baseline gap-3 py-2.5 px-2 -mx-2 rounded hover:bg-foreground/5 transition-colors"
                  >
                    <span className="text-sm text-foreground/40 w-6 text-right tabular-nums shrink-0">{t.n}</span>
                    {t.zh && <span lang="zh-Hant" className="font-han text-lg text-foreground/90 shrink-0">{t.zh}</span>}
                    <span className="min-w-0 text-sm text-foreground/60 truncate">
                      {t.pinyin && <span className="italic">{t.pinyin}</span>}
                      {t.en && <span> · {t.en}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="take-part">
            <h2 id="take-part" className={H2}>Take part</h2>
            <p className="text-foreground/70 leading-relaxed max-w-prose mb-6">
              The translation, its glossary and its method live in one public repository, released into the public
              domain. A line that doesn’t land, a better word, a typo: every chapter page opens a discussion or an
              edit on its own file. The Character Atlas carries every character in the book, with its parts, its
              history and every line it stands in.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={TAOTECHING_URL} {...external}>
                  <GitHubIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  The translation on GitHub
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={ATLAS_URL} {...external}>
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  The Character Atlas
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
              <a
                href={`${TAOTECHING_URL}/blob/main/CONTRIBUTING.md`}
                {...external}
                className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
              >
                How to contribute
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </section>
        </div>

        <TableOfContents toc={TOC} docTitle="Tao Te Ching" docPath={TAO_TE_CHING_DOC} />
      </div>
    </div>
  )
}
