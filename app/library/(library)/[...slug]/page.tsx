import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import GithubSlugger from 'github-slugger'
import { Badge, Separator } from '@opencosmos/ui'
import { getDoc, getAllDocs } from '@/lib/knowledge'
import { CATEGORY_LABELS } from '@/lib/knowledge-meta'
import { TAO_TE_CHING_BASE } from '@/lib/corpus-href'
import DocViewer from './DocViewer'
import TableOfContents, { type TocEntry } from './TableOfContents'
import SourceLinks from '../../SourceLinks'
import LibraryBreadcrumb from '../../LibraryBreadcrumb'

/**
 * Extract H2 and H3 headings from raw markdown for the TOC sidebar.
 * Uses github-slugger (same library as rehype-slug) so IDs match exactly.
 */
function extractToc(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger()
  const matches = [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)]
  return matches.map(m => ({
    depth: m[1].length as 2 | 3,
    text: m[2].trim(),
    id: slugger.slug(m[2].trim()),
  }))
}

type Props = {
  params: Promise<{ slug: string[] }>
}

export async function generateStaticParams() {
  // The Tao Te Ching has its own routes (sources/taoism-tao-te-ching/), which
  // read taoteching's export rather than the corpus copy. Listing it here too
  // would generate the same path twice.
  return getAllDocs()
    .filter((doc) => doc.href !== TAO_TE_CHING_BASE)
    .map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = getDoc(slug)
  if (!doc) return {}
  return {
    title: `${doc.title} — OpenCosmos`,
    description: doc.summary || undefined,
  }
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params
  const doc = getDoc(slug)

  if (!doc) notFound()

  const hasAttribution = doc.author || doc.era || doc.tradition || doc.origin_date
  const toc = extractToc(doc.content)
  // Reconstruct the knowledge/ relative path from the URL slug
  const docPath = `knowledge/${slug.join('/')}.md`

  return (
    <div className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_224px]! gap-12 items-start">

          {/* Main document column */}
          <div className="min-w-0">
            <LibraryBreadcrumb
              items={[
                { label: 'The Library', href: '/library' },
                { label: CATEGORY_LABELS[doc.category] ?? doc.category, href: '/library' },
                { label: doc.title },
              ]}
            />

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {doc.domain && <Badge variant="secondary">{doc.domain}</Badge>}
              {doc.format && <Badge variant="outline">{doc.format}</Badge>}
              {doc.complexity && (
                <Badge variant="outline" className="text-foreground/50">
                  {doc.complexity}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-light tracking-wide text-foreground mb-4 leading-tight">
              {doc.title}
            </h1>

            {/* Attribution */}
            {hasAttribution && (
              <p className="text-sm text-foreground/40 mb-6 flex flex-wrap gap-x-2">
                {doc.author && <span>{doc.author}</span>}
                {doc.origin_date && <span>· {doc.origin_date}</span>}
                {doc.tradition && <span>· {doc.tradition}</span>}
                {doc.era && !doc.origin_date && <span>· {doc.era}</span>}
              </p>
            )}

            {/* Summary */}
            {doc.summary && (
              <p className="text-lg font-light text-foreground/60 leading-relaxed mb-10">
                {doc.summary}
              </p>
            )}

            <Separator className="mb-10" />

            {/* Content */}
            <DocViewer content={doc.content} format={doc.format} />

            {/* Tags */}
            {doc.tags.length > 0 && (
              <div className="mt-16 flex flex-wrap gap-2">
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-foreground/5 text-xs text-foreground/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Related documents */}
            {doc.related_docs && doc.related_docs.length > 0 && (
              <div className="mt-12 pt-8 border-t border-foreground/10">
                <p className="text-xs uppercase tracking-widest text-foreground/30 mb-4">
                  Related
                </p>
                <div className="flex flex-col gap-2">
                  {doc.related_docs.map((rel) => {
                    const parts = rel.replace('.md', '').split('/')
                    const href = '/library/' + parts.join('/')
                    const label = parts[parts.length - 1]?.replace(/-/g, ' ') ?? rel
                    return (
                      <Link
                        key={rel}
                        href={href}
                        className="text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
                      >
                        {label} →
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <SourceLinks
              docPath={docPath}
              prompt="Spotted a typo, an error, or something missing?"
            />
          </div>

          {/* TOC sidebar — sticky, hidden on mobile */}
          <TableOfContents toc={toc} docTitle={doc.title} docPath={docPath} />

        </div>
    </div>
  )
}
