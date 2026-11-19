import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Badge, Card } from '@opencosmos/ui'
import { ExternalLink } from 'lucide-react'
import { TAO_TE_CHING_DOC, taoTeChingHref } from '@/lib/corpus-href'
import { CATEGORY_LABELS } from '@/lib/knowledge-meta'
import { atlasEntryHref, getSourceCatalog, plain, taoTeChingEvidenceHref, taoTeChingRepoHref } from '@/lib/tao-te-ching'
import { REPO_LOCATOR, type Edition, type SourceKind, type SourceRecord, type SourceReference } from '@/lib/tao-te-ching-sources'
import TableOfContents, { type TocEntry } from '../../../[...slug]/TableOfContents'
import LibraryBreadcrumb from '../../../../LibraryBreadcrumb'
import TextFooter from '../_components/TextFooter'
import { DESC, H2, SOURCE_LINK } from '../_components/styles'

export const metadata: Metadata = {
  title: 'Tao Te Ching, Sources — OpenCosmos',
  description: 'Manuscripts, commentaries, and other evidence behind the Open Tao Te Ching.',
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const

const groups: { id: string; title: string; desc: string; kinds: SourceKind[] }[] = [
  {
    id: 'text',
    title: 'The text and its copies',
    desc: 'The received text this edition translates, and the copies it is checked against: manuscripts excavated from tombs, other early recensions, and readings that later editors recorded.',
    kinds: ['base', 'excavated', 'transmitted'],
  },
  {
    id: 'commentaries',
    title: 'Commentaries',
    desc: 'Three classical readings of the text, stored in full in the translation’s repository.',
    kinds: ['commentary'],
  },
  {
    id: 'characters',
    title: 'Characters',
    desc: 'Dictionaries and reference works for each character’s form, sound and sense, including the online transcriptions some readings came through.',
    kinds: ['dictionary', 'reference'],
  },
  {
    id: 'context',
    title: 'Texts read for context',
    desc: 'Other early Chinese writings, read for how the Tao Te Ching’s words were used in and near its time.',
    kinds: ['context'],
  },
  {
    id: 'translations',
    title: 'Translations read for range',
    desc: 'English translations published before 1931, read for the range of possible meanings and never for their phrasing.',
    kinds: ['translation'],
  },
]

const useLabel: Record<SourceRecord['use'], string> = {
  stored: 'Stored copy',
  facts: 'Recorded as facts',
  consulted: 'Consulted',
}

/** A label inside a source card, in the small capitals of "On this page". */
const LABEL = 'text-xs uppercase tracking-widest text-foreground/50 font-medium mb-1.5'

/** A chapter number as a small tile, like the chapter grid on the landing page. */
const CHIP =
  'inline-flex items-center justify-center min-w-8 h-7 px-1.5 rounded-md border border-foreground/10 text-xs tabular-nums text-foreground/80 hover:bg-foreground/10 hover:text-foreground hover:border-foreground/30 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]'

type Catalog = ReturnType<typeof getSourceCatalog>
type Entry = Catalog['entries'][number]
type Citation = { entry: Entry; citation: SourceReference }
type SourceProps = {
  source: SourceRecord
  records: Map<string, SourceRecord>
  citations: Citation[]
}

/** A standalone link that leaves the site, marked as the landing page marks one. */
function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} {...external} className={SOURCE_LINK}>
      {children}
      <ExternalLink className="inline-block w-3 h-3 ml-1 align-[-1px]" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

function EditionName({ edition }: { edition: Edition }) {
  const details = [edition.publisher, edition.date ?? edition.year].filter(Boolean).join(' · ')
  return (
    <>
      {edition.url ? <Out href={edition.url}>{edition.title}</Out> : <span className="text-foreground/90">{edition.title}</span>}
      {details && <span className="text-foreground/60">{' · '}{details}</span>}
    </>
  )
}

function GlossaryUse({ entry, citation, records }: Citation & { records: Map<string, SourceRecord> }) {
  const edition = [citation.source, ...citation.chain]
    .flatMap((id) => records.get(id)?.editions ?? [])
    .find(({ id }) => id === citation.edition)
  const local = citation.locator && REPO_LOCATOR.test(citation.locator) ? citation.locator : null
  const href = citation.url ?? local
  const where = [edition?.title, local ? 'Cited passage' : citation.locator].filter(Boolean).join(' · ')
  const rendering = plain(entry.render)
  return (
    <li>
      <a href={atlasEntryHref(entry.slug)} className={SOURCE_LINK}>{rendering || entry.pinyin}</a>
      {entry.pinyin && rendering && <span className="italic">{' ('}{entry.pinyin}{')'}</span>}
      {citation.at && <>{' · '}<a className={SOURCE_LINK} href={taoTeChingRepoHref(`glossary/${entry.slug}.md#${citation.at}`)}>Citing section</a></>}
      {href
        ? <>{' · '}<a className={SOURCE_LINK} href={taoTeChingEvidenceHref(href)}>{where || 'Cited passage'}</a></>
        : where && <>{' · '}{where}</>}
      {local && citation.url && local !== citation.url && <>{' · '}<a className={SOURCE_LINK} href={taoTeChingRepoHref(local)}>Project’s cited passage</a></>}
      {citation.chain.length > 0 && <>{' · via '}{citation.chain.map((id) => records.get(id)!.name).join(' via ')}</>}
      {entry.refs_status === 'incomplete' && <span className="text-foreground/60">{' · Citations incomplete'}</span>}
    </li>
  )
}

function ChapterChips({ chapters, label }: { chapters: number[]; label: string }) {
  return (
    <ul role="list" aria-label={label} className="flex flex-wrap gap-1">
      {chapters.map((n) => (
        <li key={n}>
          <Link href={`${taoTeChingHref(n)}#sources`} className={CHIP} aria-label={`Chapter ${n} sources`}>{n}</Link>
        </li>
      ))}
    </ul>
  )
}

function Source({ source, records, citations }: SourceProps) {
  const { id, name, kind, date, found, chain, use, editions, holds, chapters, url, scan, policy } = source
  const when = date ?? source.author_dates
  const hasExternal = Boolean(editions.length || url || scan)
  return (
    <li>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" size="sm">{useLabel[use]}</Badge>
            {source.pending_print > 0 && (
              <Badge variant="outline" size="sm">
                {source.pending_print} awaiting a print check
              </Badge>
            )}
            {source.citation_debt && <Badge variant="outline" size="sm">Citations being recovered</Badge>}
          </div>
          {when && <span className="text-xs text-foreground/50 shrink-0 pt-0.5 text-right">{when}</span>}
        </div>

        <h3 id={id} className="scroll-mt-28 text-lg font-medium text-foreground leading-snug">{name}</h3>
        {found && <p className="text-sm text-foreground/60 mt-1">Found {found}</p>}

        <div className="space-y-4 text-sm text-foreground/85 leading-relaxed mt-4">
          {kind === 'base' && <p>The listed printings serve as comparisons for this edition’s base text.</p>}
          {chain.length > 0 && (
            <p>
              {'Evidence reached this edition via '}
              {chain.map((id, i) => (
                <span key={id}>{i > 0 ? ' via ' : ''}<Link className={SOURCE_LINK} href={`#${id}`}>{records.get(id)!.name}</Link></span>
              ))}
              .
            </p>
          )}
          {source.coverage.items !== undefined && <p>{source.coverage.items} entries in the stored selection.</p>}
          {source.citation_debt && <p>Worklist item {source.citation_debt} tracks the missing citations.</p>}
          {kind === 'excavated' && source.coverage.chapters.length > 0 && (
            <div>
              <h4 className={LABEL}>Attested chapters</h4>
              <ChapterChips chapters={source.coverage.chapters} label={`${name}: attested chapters`} />
            </div>
          )}
          {hasExternal && (
            <div>
              <h4 className={LABEL}>Editions and references</h4>
              <ul role="list" className="space-y-1">
                {editions.map((edition) => <li key={edition.id}><EditionName edition={edition} /></li>)}
                {url && !editions.some((edition) => edition.url === url) && <li><Out href={url}>Source or transcription</Out></li>}
                {scan && scan !== url && !editions.some((edition) => edition.url === scan) && <li><Out href={scan}>Scan</Out></li>}
              </ul>
            </div>
          )}
          {holds.length > 0 && (
            <div>
              <h4 className={LABEL}>{use === 'stored' ? 'Stored copy' : 'Project records'}</h4>
              <ul role="list" className="space-y-1">
                {holds.map((path) => (
                  <li key={path}><Out href={taoTeChingRepoHref(path)}>{path.split('/').at(-1)}</Out></li>
                ))}
              </ul>
            </div>
          )}
          {chapters.length > 0 && (
            <div>
              <h4 className={LABEL}>Chapter evidence</h4>
              <ChapterChips chapters={chapters} label={`${name}: chapter evidence`} />
            </div>
          )}
          {citations.length > 0 && (
            <div>
              <h4 className={LABEL}>Cited in the glossary</h4>
              <ul role="list" className="space-y-1">
                {citations.map((citation, i) => (
                  <GlossaryUse key={`${citation.entry.slug}-${i}`} {...citation} records={records} />
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-4 pt-3 border-t border-foreground/10 text-xs text-foreground/60">
          <Out href={taoTeChingRepoHref(policy)}>Source policy</Out>
        </p>
      </Card>
    </li>
  )
}

export default function TaoTeChingSourcesPage() {
  const { records, totals, entries } = getSourceCatalog()
  const byId = new Map(records.map((source) => [source.id, source]))
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]))
  const sections = groups
    .map((group) => ({ ...group, records: records.filter((source) => group.kinds.includes(source.kind)) }))
    .filter((group) => group.records.length > 0)
  // The outline lists every group and every source in it, the same headings the page renders.
  const toc: TocEntry[] = sections.flatMap(({ id, title, records }) => [
    { id: `sources-${id}`, text: title, depth: 2 as const },
    ...records.map((source) => ({ id: source.id, text: source.name, depth: 3 as const })),
  ])
  const stats = [
    { value: totals.sources, label: 'sources' },
    { value: totals.stored, label: 'stored in the repository' },
    { value: totals.readings, label: 'readings recorded' },
    { value: totals.pending_print, label: 'await a print check' },
  ]

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_224px]! gap-12 items-start">
        <div className="min-w-0" data-doc-content>
          <LibraryBreadcrumb
            items={[
              { label: 'The Library', href: '/library' },
              { label: CATEGORY_LABELS.sources ?? 'Sources', href: '/library' },
              { label: 'Tao Te Ching', href: taoTeChingHref() },
              { label: 'Sources' },
            ]}
          />
          <h1 className="text-3xl font-light tracking-wide text-foreground mb-2 leading-tight">Sources</h1>
          <p className="text-sm text-foreground/40 mb-6">The Open Tao Te Ching · {totals.sources} sources</p>
          <p className="text-lg font-light text-foreground/60 leading-relaxed mb-6 max-w-prose">
            The evidence behind the translation: the editions used, the records the project holds, and every
            place that cites them.
          </p>
          <p className={`${DESC} max-w-prose`}>
            The project records evidence from excavated manuscripts as facts. A full transcription can be
            included when it meets the <a
              href={taoTeChingRepoHref('sources/PROVENANCE.md#excavated')}
              className={SOURCE_LINK}
            >admission rules</a>.
          </p>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col-reverse rounded-md border border-foreground/10 px-4 py-3">
                <dt className="text-xs text-foreground/50 leading-snug">{label}</dt>
                <dd className="text-2xl font-light tabular-nums text-foreground/90">{value}</dd>
              </div>
            ))}
          </dl>
          {(totals.incomplete_entries > 0 || totals.citation_debt > 0) && (
            <ul className="mt-3 space-y-1 text-sm text-foreground/60">
              {totals.incomplete_entries > 0 && (
                <li>Recorded citations are incomplete for {totals.incomplete_entries} of {totals.entries} glossary entries.</li>
              )}
              {totals.citation_debt > 0 && <li>{totals.citation_debt} sources have open citation recovery work.</li>}
            </ul>
          )}

          {/* Narrow screens only: from lg up the outline beside the page lists these groups.
              `lg:hidden!` needs the important modifier for the reason TableOfContents gives for `lg:block!`. */}
          <nav aria-label="Source groups" className="mt-8 lg:hidden!">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {sections.map(({ id, title }) => (
                <li key={id}><Link href={`#sources-${id}`} className={SOURCE_LINK}>{title}</Link></li>
              ))}
            </ul>
          </nav>

          {sections.map(({ id, title, desc, records }) => (
            <section aria-labelledby={`sources-${id}`} key={id}>
              <h2 id={`sources-${id}`} className={H2}>{title}</h2>
              <p className={`${DESC} max-w-prose mb-5`}>{desc}</p>
              <ul role="list" className="space-y-3 [overflow-wrap:anywhere]">
                {records.map((source) => {
                  const citations = source.entries.flatMap((slug) => {
                    const entry = bySlug.get(slug)!
                    return entry.refs
                      .filter((ref) => ref.source === source.id || ref.chain.includes(source.id))
                      .map((citation) => ({ entry, citation }))
                  })
                  return <Source key={source.id} source={source} records={byId} citations={citations} />
                })}
              </ul>
            </section>
          ))}
        </div>

        <TableOfContents toc={toc} docTitle="Tao Te Ching" docPath={TAO_TE_CHING_DOC} />
      </div>
      <TextFooter />
    </div>
  )
}
