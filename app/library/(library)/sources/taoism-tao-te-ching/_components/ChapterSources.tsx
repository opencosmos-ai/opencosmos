import Link from 'next/link'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@opencosmos/ui'
import { ChevronDown } from 'lucide-react'
import { taoTeChingSourcesHref } from '@/lib/corpus-href'
import { atlasCharHref, taoTeChingEvidenceHref, taoTeChingRepoHref } from '@/lib/tao-te-ching'
import { REPO_LOCATOR, type AttestationExtent, type ChapterSources as Evidence, type Pairing, type SourceRecord, type SourceReference, type WitnessReading } from '@/lib/tao-te-ching-sources'
import { H2, SOURCE_LINK } from './styles'

const extentLabel: Record<AttestationExtent, string> = {
  complete: 'complete chapter',
  opening: 'opening only',
  middle: 'middle only',
  end: 'end only',
  split: 'split passages',
}

const editorialLabels: Record<string, string> = {
  base: 'the base text',
  punctuation: 'a punctuation decision',
  undecided: 'undecided',
  various: 'several witnesses',
  wangbi_collation: 'Wang Bi collation notes',
}

const verificationLabel: Record<WitnessReading['verification'], string> = {
  'unassessed': 'Print verification unassessed',
  'pending-print': 'Print check pending',
  'confirmed-print': 'Checked in print',
}

function SourceName({ id, records }: { id: string; records: Map<string, SourceRecord> }) {
  const source = records.get(id)
  if (!source) return editorialLabels[id] ?? id
  return <Link className={SOURCE_LINK} href={taoTeChingSourcesHref(id)}>{source.short_name ?? source.name}</Link>
}

function ReadingPair({ reading, cards = [] }: { reading: Pairing; cards?: string[] }) {
  const han = /\p{Script=Han}/u.test(reading.text)
  const known = new Set(cards)
  const content = cards.length ? Array.from(reading.text, (character, index) => (
    known.has(character)
      ? <a className={SOURCE_LINK} href={atlasCharHref(character)} key={index}>{character}</a>
      : character
  )) : reading.text

  if (!han && reading.text === reading.english) return <span>{reading.english}</span>

  return (
    <span data-reading className="[overflow-wrap:anywhere]">
      <span lang={han ? 'zh-Hant' : undefined} className={han ? 'font-han' : undefined}>{content}</span>
      {' ('}{reading.pinyin && <><span lang="zh-Latn-pinyin" className="italic">{reading.pinyin}</span>{' — '}</>}
      <span lang="en">{reading.english}</span>{')'}
    </span>
  )
}

function referencePassage(citation: SourceReference, records: Map<string, SourceRecord>) {
  const edition = [citation.source, ...citation.chain]
    .flatMap((id) => records.get(id)?.editions ?? [])
    .find(({ id }) => id === citation.edition)
  const local = citation.locator && REPO_LOCATOR.test(citation.locator) ? citation.locator : null
  const label = [edition?.title, local ? 'Source passage' : citation.locator].filter(Boolean).join(' · ')
  return { local, href: citation.url ?? local, label }
}

function Witness({ reading, records }: { reading: WitnessReading; records: Map<string, SourceRecord> }) {
  const confirmed = records.get(reading.source)?.editions.find(({ id }) => id === reading.confirmed_edition)
  const { local, href, label: acquisition } = referencePassage(reading, records)
  const confirmedLocal = reading.confirmed_locator && REPO_LOCATOR.test(reading.confirmed_locator)
  const check = [confirmed?.title, confirmedLocal ? undefined : reading.confirmed_locator, reading.confirmed_on].filter(Boolean).join(' · ')

  return (
    <li>
      <p>
        <strong className="font-medium"><SourceName id={reading.source} records={records} /></strong>
        {' · '}<ReadingPair reading={reading} cards={reading.cards} />
      </p>
      {reading.annotation && <p className="mt-1 text-sm text-foreground/80">{reading.annotation}</p>}
      <p className="mt-1 text-sm text-foreground/80">
        {reading.chain.length > 0 && (
          <>
            {'Via '}
            {reading.chain.map((id, index) => (
              <span key={id}>{index > 0 ? ' via ' : ''}<SourceName id={id} records={records} /></span>
            ))}
            {' · '}
          </>
        )}
        {(acquisition || href) && (
          <>{href ? <a href={taoTeChingEvidenceHref(href)} className={SOURCE_LINK}>{acquisition || 'Source passage'}</a> : acquisition}{' · '}</>
        )}
        {local && reading.url && local !== reading.url && (
          <><a href={taoTeChingRepoHref(local)} className={SOURCE_LINK}>Project’s source passage</a>{' · '}</>
        )}
        <span className={reading.verification === 'unassessed' ? undefined : 'font-medium text-foreground'}>
          {verificationLabel[reading.verification]}
        </span>
      </p>
      {reading.verification === 'confirmed-print' && (
        <p className="mt-1 text-sm text-foreground/80">
          {check}
          {confirmedLocal && <>{' · '}<a href={taoTeChingRepoHref(reading.confirmed_locator!)} className={SOURCE_LINK}>Print reference</a></>}
          {'. '}{reading.confirmation}
        </p>
      )}
    </li>
  )
}

function ForkCitation({ citation, records }: { citation: SourceReference; records: Map<string, SourceRecord> }) {
  const { href, label } = referencePassage(citation, records)
  return (
    <li className="[overflow-wrap:anywhere]">
      <SourceName id={citation.source} records={records} />
      {citation.chain.map((id) => (
        <span key={id}>{' via '}<SourceName id={id} records={records} /></span>
      ))}
      {' · '}{href ? <a href={taoTeChingEvidenceHref(href)} className={SOURCE_LINK}>{label || 'Source passage'}</a> : label}
    </li>
  )
}

type Props = { evidence: Evidence; sources: SourceRecord[] }

export function ChapterSourcesEvidence({ evidence, sources }: Props) {
  const { attestation, forks, commentary } = evidence
  const records = new Map(sources.map((record) => [record.id, record]))
  const inventory = [...attestation.bundles.map((b) => `Bundle ${b}`), ...attestation.units].join(' · ')

  return (
    <div className="space-y-5 pt-2 pb-5 text-base text-foreground/90">
      <p>
        <SourceName id={attestation.source} records={records} />
        {' · '}{attestation.extent ? extentLabel[attestation.extent] : 'No attestation in the recorded inventory'}
        {inventory && <span className="text-sm text-foreground/80">{' · '}{inventory}</span>}
      </p>
      {forks.length ? (
        <ul className="space-y-4">
          {forks.map((fork) => (
            <li id={`source-reading-${fork.id}`} key={fork.id} className="scroll-mt-28 border-t border-foreground/15 pt-3">
              <p className="mb-2">
                <strong className="font-medium">This edition’s choice</strong>
                {' · '}<SourceName id={fork.our_call} records={records} />
              </p>
              <ul className="space-y-2">
                <li><strong className="font-medium">Base text</strong>{' · '}<ReadingPair reading={fork.base} /></li>
                {fork.readings.map((reading) => <Witness key={reading.source} reading={reading} records={records} />)}
              </ul>
              {fork.refs && fork.refs.length > 0 && (
                <div className="mt-2 text-sm text-foreground/80">
                  <p className="font-medium">References</p>
                  <ul className="mt-1 space-y-1">
                    {fork.refs.map((citation, index) => (
                      <ForkCitation key={`${citation.source}-${index}`} citation={citation} records={records} />
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : <p>No readings are recorded in the apparatus for this chapter.</p>}
      {commentary.length > 0 && (
        <p>
          <strong className="font-medium">Stored commentaries</strong>
          {commentary.map(({ source, path }) => (
            <span key={path}>
              {' · '}<a href={taoTeChingRepoHref(path)} className={SOURCE_LINK}>{records.get(source)?.name ?? source}</a>
            </span>
          ))}
        </p>
      )}
      <p><Link href={taoTeChingSourcesHref()} className={SOURCE_LINK}>Sources for the whole translation</Link></p>
    </div>
  )
}

export default function ChapterSources(props: Props) {
  return (
    <section aria-labelledby="sources">
      <Collapsible>
        <h2 className={`${H2} mb-2!`} id="sources">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="-mx-2 h-auto px-2 py-1 text-2xl font-light group">
              Sources
              <ChevronDown className="size-4 group-data-[state=open]:rotate-180" aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
        </h2>
        <CollapsibleContent className="animate-none!">
          <ChapterSourcesEvidence {...props} />
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
