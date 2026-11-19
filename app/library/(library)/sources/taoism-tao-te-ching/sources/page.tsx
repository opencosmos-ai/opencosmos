import type { Metadata } from 'next'
import Link from 'next/link'
import { taoTeChingHref } from '@/lib/corpus-href'
import { CATEGORY_LABELS } from '@/lib/knowledge-meta'
import { atlasEntryHref, getSourceCatalog, plain, taoTeChingEvidenceHref, taoTeChingRepoHref } from '@/lib/tao-te-ching'
import { REPO_LOCATOR, type Edition, type SourceKind, type SourceRecord, type SourceReference } from '@/lib/tao-te-ching-sources'
import LibraryBreadcrumb from '../../../../LibraryBreadcrumb'
import TextFooter from '../_components/TextFooter'
import { DESC, H2, SOURCE_LINK } from '../_components/styles'

export const metadata: Metadata = {
  title: 'Tao Te Ching, Sources — OpenCosmos',
  description: 'Manuscripts, commentaries, and other evidence behind the Open Tao Te Ching.',
}

const groups: { id: string; title: string; kinds: SourceKind[] }[] = [
  { id: 'text', title: 'The text and its copies', kinds: ['base', 'excavated', 'transmitted'] },
  { id: 'commentaries', title: 'Commentaries', kinds: ['commentary'] },
  { id: 'characters', title: 'Characters', kinds: ['dictionary', 'reference'] },
  { id: 'context', title: 'Texts read for context', kinds: ['context'] },
  { id: 'translations', title: 'Translations read for range', kinds: ['translation'] },
]

const useLabel: Record<SourceRecord['use'], string> = {
  stored: 'Stored in the translation repository',
  facts: 'Evidence recorded as facts',
  consulted: 'Consulted for this translation',
}

type Catalog = ReturnType<typeof getSourceCatalog>
type Entry = Catalog['entries'][number]
type Citation = { entry: Entry; citation: SourceReference }
type SourceProps = {
  source: SourceRecord
  records: Map<string, SourceRecord>
  citations: Citation[]
}

function EditionName({ edition }: { edition: Edition }) {
  const details = [edition.publisher, edition.date ?? edition.year].filter(Boolean).join(' · ')
  return (
    <>
      {edition.url ? <a href={edition.url} className={SOURCE_LINK}>{edition.title}</a> : edition.title}
      {details && <span className="text-foreground/80">{' · '}{details}</span>}
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
      {entry.refs_status === 'incomplete' && <span className="text-foreground/80">{' · Citations incomplete'}</span>}
    </li>
  )
}

function ChapterLinks({ chapters }: { chapters: number[] }) {
  return chapters.map((n, i) => (
    <span key={n}>{i > 0 ? ', ' : ''}<Link href={`${taoTeChingHref(n)}#sources`} className={SOURCE_LINK} aria-label={`Chapter ${n} sources`}>{n}</Link></span>
  ))
}

function Source({ source, records, citations }: SourceProps) {
  const { id, name, kind, date, found, chain, use, editions, holds, chapters, url, scan, policy } = source
  const hasExternal = Boolean(editions.length || url || scan)
  return (
    <li className="border-b border-foreground/15 py-6 last:border-b-0">
      <h3 id={id} className="scroll-mt-28 text-xl font-medium text-foreground mb-2">{name}</h3>
      <div className="space-y-3 text-base text-foreground/90">
        <p className="text-sm text-foreground/80">
          {[date ?? source.author_dates, useLabel[use], found && `Found ${found}`].filter(Boolean).join(' · ')}
          {' · '}<a href={taoTeChingRepoHref(policy)} className={SOURCE_LINK}>Source policy</a>
        </p>
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
        {kind === 'excavated' && source.coverage.chapters.length > 0 && (
          <p>Attested chapters · <ChapterLinks chapters={source.coverage.chapters} /></p>
        )}
        {source.coverage.items !== undefined && <p>{source.coverage.items} entries in the stored selection.</p>}
        {source.pending_print > 0 && <p>{source.pending_print} {source.pending_print === 1 ? 'reading awaits' : 'readings await'} a print check.</p>}
        {source.citation_debt && <p>Citation recovery is incomplete. Worklist item {source.citation_debt} tracks the gap.</p>}
        {hasExternal && (
          <div>
            <h4 className="text-sm font-semibold">Editions and external references</h4>
            <ul role="list" className="space-y-1 mt-1">
              {editions.map((edition) => <li key={edition.id}><EditionName edition={edition} /></li>)}
              {url && !editions.some((edition) => edition.url === url) && <li><a href={url} className={SOURCE_LINK}>Source or transcription</a></li>}
              {scan && scan !== url && !editions.some((edition) => edition.url === scan) && <li><a href={scan} className={SOURCE_LINK}>Scan</a></li>}
            </ul>
          </div>
        )}
        {holds.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold">{use === 'stored' ? 'Stored copy' : 'Project records'}</h4>
            <ul role="list" className="space-y-1 mt-1">
              {holds.map((path) => (
                <li key={path}><a href={taoTeChingRepoHref(path)} className={SOURCE_LINK}>{path.split('/').at(-1)}</a></li>
              ))}
            </ul>
          </div>
        )}
        {(chapters.length > 0 || citations.length > 0) && (
          <div>
            <h4 className="text-sm font-semibold">Recorded uses</h4>
            {chapters.length > 0 && (
              <p className="mt-1">
                Chapter evidence · <ChapterLinks chapters={chapters} />
              </p>
            )}
            {citations.length > 0 && (
              <ul role="list" className="space-y-1 mt-1">
                {citations.map((citation, i) => (
                  <GlossaryUse key={`${citation.entry.slug}-${i}`} {...citation} records={records} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
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

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16">
      <LibraryBreadcrumb
        items={[
          { label: 'The Library', href: '/library' },
          { label: CATEGORY_LABELS.sources ?? 'Sources', href: '/library' },
          { label: 'Tao Te Ching', href: taoTeChingHref() },
          { label: 'Sources' },
        ]}
      />
      <h1 className="text-3xl font-light tracking-wide text-foreground mb-2 leading-tight">Sources</h1>
      <p className="text-sm text-foreground/80 mb-6">The Open Tao Te Ching · {totals.sources} sources</p>
      <div className="max-w-prose space-y-4">
        <p className={DESC}>
          The evidence behind the translation, with the editions used, the records held by the project,
          and links to the places that cite them.
        </p>
        <p className={DESC}>
          The project records evidence from excavated manuscripts as facts. A full transcription can be
          included when it meets the <a
            href={taoTeChingRepoHref('sources/PROVENANCE.md#excavated')}
            className={SOURCE_LINK}
          >admission rules</a>.
        </p>
        {(totals.pending_print > 0 || totals.incomplete_entries > 0 || totals.citation_debt > 0) && (
          <ul className={DESC}>
            {totals.pending_print > 0 && <li>{totals.pending_print} readings await a print check.</li>}
            {totals.incomplete_entries > 0 && <li>Recorded citations are incomplete for {totals.incomplete_entries} of {totals.entries} glossary entries.</li>}
            {totals.citation_debt > 0 && <li>{totals.citation_debt} sources have open citation recovery work.</li>}
          </ul>
        )}
      </div>
      <nav aria-label="Source groups" className="mt-8">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {sections.map(({ id, title }) => (
            <li key={id}><Link href={`#sources-${id}`} className={SOURCE_LINK}>{title}</Link></li>
          ))}
        </ul>
      </nav>
      <div className="max-w-prose">
        {sections.map(({ id, title, records }) => (
          <section aria-labelledby={`sources-${id}`} key={id}>
            <h2 id={`sources-${id}`} className={`${H2} mb-1!`}>{title}</h2>
            <ul role="list" className="[overflow-wrap:anywhere]">
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
      <TextFooter />
    </div>
  )
}
