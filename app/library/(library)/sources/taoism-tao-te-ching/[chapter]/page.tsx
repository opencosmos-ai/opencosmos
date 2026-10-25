import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDoc } from '@/lib/knowledge'
import { CATEGORY_LABELS } from '@/lib/knowledge-meta'
import { TAO_TE_CHING_DOC, taoTeChingHref } from '@/lib/corpus-href'
import {
  TAOTECHING_URL,
  chapterFile,
  chapterNumbers,
  corpusHeadingFor,
  getChapter,
  getChapterAudio,
  getChapterDiscussion,
  getChapterNotes,
  getChapterTerms,
} from '@/lib/tao-te-ching'
import TableOfContents from '../../../[...slug]/TableOfContents'
import SourceLinks from '../../../../SourceLinks'
import LibraryBreadcrumb from '../../../../LibraryBreadcrumb'
import ChapterText from '../_components/ChapterText'
import ChapterJump from '../_components/ChapterJump'
import TextFooter from '../_components/TextFooter'
import { ChapterNav, Discussion, Listen, Notes, Terms } from '../_components/Sections'
import { SECTIONS } from '../_components/styles'

type Props = { params: Promise<{ chapter: string }> }

// 1–81 and nothing else; /82 is a 404, not a render.
export const dynamicParams = false

export function generateStaticParams() {
  return chapterNumbers().map((n) => ({ chapter: String(n) }))
}

function parse(chapter: string): number | null {
  return /^\d{1,2}$/.test(chapter) ? Number(chapter) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = parse((await params).chapter)
  const ch = n ? getChapter(n) : null
  if (!ch) return {}
  const opening = ch.stanzas[0]?.slice(0, 2).join(' ') ?? ''
  return {
    title: `Tao Te Ching, Chapter ${n} — OpenCosmos`,
    description: opening ? `${opening} … The Open Tao Te Ching, chapter ${n}.` : undefined,
  }
}

export default async function ChapterPage({ params }: Props) {
  const n = parse((await params).chapter)
  const chapter = n ? getChapter(n) : null
  if (!n || !chapter) notFound()

  const clips = getChapterAudio(n)
  const toc = SECTIONS.filter((s) => s.id !== 'listen' || clips.length > 0).map((s) => ({
    id: s.id,
    text: s.text,
    depth: 2 as const,
  }))
  // Cosmo is told the corpus heading for this chapter, so the chat can quote
  // the chapter whole; see corpusHeadingFor.
  const corpus = getDoc(['sources', 'taoism-tao-te-ching'])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_224px]! gap-12 items-start">
        <div className="min-w-0" data-doc-content>
          <LibraryBreadcrumb
            items={[
              { label: 'The Library', href: '/library' },
              { label: CATEGORY_LABELS.sources ?? 'Sources', href: '/library' },
              { label: 'Tao Te Ching', href: taoTeChingHref() },
              { label: `Chapter ${n}` },
            ]}
          />

          {/* A number and nothing else: Laozi's chapters had no titles, and
              Heshang Gong's are not shown (ADR 0021). */}
          <h1 className="text-3xl font-light tracking-wide text-foreground m-0 leading-tight">
            Chapter {n}
          </h1>

          <ChapterText chapter={chapter} />
          <Listen clips={clips} />
          <Terms terms={getChapterTerms(n)} />
          <Notes markdown={getChapterNotes(n)} />
          <Discussion n={n} data={getChapterDiscussion(n)} />

          <ChapterNav n={n} />

          <SourceLinks
            docPath={TAO_TE_CHING_DOC}
            prompt="A line that doesn’t land, a typo, a note that’s wrong?"
            hrefs={{
              view: `${TAOTECHING_URL}/blob/main/${chapterFile(n)}`,
              edit: `${TAOTECHING_URL}/edit/main/${chapterFile(n)}`,
            }}
          />
        </div>

        <TableOfContents
          toc={toc}
          docTitle="Tao Te Ching"
          docPath={TAO_TE_CHING_DOC}
          contextHeading={corpusHeadingFor(n, corpus?.content ?? null)}
        >
          <ChapterJump current={n} />
        </TableOfContents>
      </div>

      <TextFooter />
    </div>
  )
}
