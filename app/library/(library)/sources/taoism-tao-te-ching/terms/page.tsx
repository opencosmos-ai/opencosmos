// The Key Terms page: every glossary entry across the 81 chapters, the book-wide
// counterpart of a chapter's Key Terms. A child of the landing page rather than
// a section of it, so the landing page keeps its one job: the way into the text.
//
// The counts are taoteching's (the export's `where`, from `term_where()`), the
// rule glossary/INDEX.md uses too. This page sums them and counts nothing.

import type { Metadata } from 'next'
import Link from 'next/link'
import { CATEGORY_LABELS } from '@/lib/knowledge-meta'
import { TAO_TE_CHING_CHAPTERS, taoTeChingHref } from '@/lib/corpus-href'
import { TAOTECHING_URL, getBookTerms } from '@/lib/tao-te-ching'
import LibraryBreadcrumb from '../../../../LibraryBreadcrumb'
import TextFooter from '../_components/TextFooter'
import TermsMap from '../_components/TermsMap'
import { DESC } from '../_components/styles'

export const metadata: Metadata = {
  title: 'Tao Te Ching, Key Terms — OpenCosmos',
  description:
    'Every word the Open Tao Te Ching makes a ruling on, and where each stands across the 81 chapters.',
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const

export default function TaoTeChingTermsPage() {
  const terms = getBookTerms()

  return (
    // min-w-0: this sits in a flex column, and without it the map's 81 columns
    // would widen the page on a phone instead of scrolling inside their frame.
    <div className="w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16">
      <LibraryBreadcrumb
        items={[
          { label: 'The Library', href: '/library' },
          { label: CATEGORY_LABELS.sources ?? 'Sources', href: '/library' },
          { label: 'Tao Te Ching', href: taoTeChingHref() },
          { label: 'Key Terms' },
        ]}
      />

      <h1 className="text-3xl font-light tracking-wide text-foreground mb-2 leading-tight">Key Terms</h1>
      <p className="text-sm text-foreground/40 mb-6">The Open Tao Te Ching · {terms.length} glossary entries</p>
      <div className="space-y-4 max-w-prose mb-10">
        <p className="text-lg font-light text-foreground/60 leading-relaxed">
          Every word this translation makes a ruling on, and where each stands across the {TAO_TE_CHING_CHAPTERS}{' '}
          chapters.
        </p>
        <p className={DESC}>
          Read across a row to see where a term lives, and down a column to see what a chapter carries. The deeper
          the square, the more often the term appears there, measured against that term&rsquo;s own busiest
          chapter. Chapters is how many of them a term appears in, and Count is how many times it appears in all, repeats
          within a chapter included. Terms are listed by Chapters, then by Count.
        </p>
      </div>

      <TermsMap terms={terms} chapters={TAO_TE_CHING_CHAPTERS} />

      <p className="text-sm text-foreground/50 leading-relaxed max-w-prose mt-12">
        A pairing such as 無 &amp; 有 (<em>wú / yǒu</em> — &ldquo;absence / presence&rdquo;) counts both of its
        characters. Each term is counted on its own, so 天 (<em>tiān</em> — &ldquo;sky&rdquo;) counts the 天
        inside 天地 (<em>tiān dì</em> — &ldquo;sky and earth&rdquo;). The counts are made in the translation&rsquo;s
        repository, by the same rule as its{' '}
        <a
          href={`${TAOTECHING_URL}/blob/main/glossary/INDEX.md`}
          {...external}
          className="underline underline-offset-2 hover:text-foreground/80 transition-colors"
        >
          glossary index
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        , so the two always agree. Back to{' '}
        <Link href={taoTeChingHref()} className="underline underline-offset-2 hover:text-foreground/80 transition-colors">
          the chapters
        </Link>
        .
      </p>

      <TextFooter />
    </div>
  )
}
