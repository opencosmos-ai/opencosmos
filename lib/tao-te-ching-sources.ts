// Contract-1 additions shared by the content fetch and the server reader.
// Keep this module runtime-independent so the Node fetch script can use it.
export type SourceKind = 'base' | 'excavated' | 'transmitted' | 'commentary' | 'dictionary' | 'context' | 'translation' | 'reference'
export type Edition = { id: string; title: string; publisher?: string; year?: number; date?: string; url?: string }
export type SourceRecord = {
  id: string
  name: string
  short_name?: string
  author_dates?: string
  kind: SourceKind
  use: 'stored' | 'facts' | 'consulted'
  date?: string
  years?: number[]
  found?: string
  url?: string
  scan?: string
  editions: Edition[]
  holds: string[]
  policy: string
  via?: string
  chain: string[]
  coverage: { chapters: number[]; total?: number; items?: number }
  forks: number[]
  chapters: number[]
  entries: string[]
  citation_debt?: string
  pending_print: number
}
export type SourceTotals = Record<
  'sources' | 'stored' | 'facts' | 'pending_print' | 'citation_debt' | 'incomplete_entries' | 'entries' | 'readings',
  number
>
export type Pairing = { text: string; pinyin?: string; english: string; gloss: 'authored' | 'derived' }
export type SourceReference = {
  source: string
  via?: string
  chain: string[]
  edition?: string
  locator?: string
  url?: string
  at?: string
}
export type WitnessReading = Pairing & Omit<SourceReference, 'at'> & {
  annotation?: string
  verification: 'unassessed' | 'pending-print' | 'confirmed-print'
  confirm?: string
  confirmed_edition?: string
  confirmed_locator?: string
  confirmed_on?: string
  confirmation?: string
  cards: string[]
}
export type AttestationExtent = 'complete' | 'opening' | 'middle' | 'end' | 'split'
export type ChapterSources = {
  attestation: {
    source: 'guodian'
    present: boolean
    extent: AttestationExtent | null
    bundles: string[]
    units: string[]
  }
  forks: {
    id: number
    base: Pairing
    our_call: string
    meaning_bearing: boolean
    readings: WitnessReading[]
    refs?: Omit<SourceReference, 'at'>[]
  }[]
  commentary: { source: string; path: string }[]
}
export type SourcesExport = {
  sources: { records: SourceRecord[]; totals: SourceTotals }
  chapter_sources: Record<string, ChapterSources>
  entries: { slug: string; refs: SourceReference[]; refs_status: 'incomplete' | 'complete' }[]
}

const HAN = /\p{Script=Han}/u
const TONE = /[\u0300\u0301\u0304\u030c]/u
const ID = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/
const EDITORIAL = ['various', 'wangbi_collation']
export const REPO_LOCATOR = /^(sources|glossary|chapters|notes|source|process)\//
const DECISIONS = ['base', 'punctuation', 'undecided']

function invalid(at: string, expected: string): never {
  throw new Error(`Invalid Tao Te Ching sources export at ${at} (expected ${expected})`)
}

function object(value: unknown, at: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalid(at, 'an object')
  return value as Record<string, unknown>
}

function array(value: unknown, at: string): unknown[] {
  if (!Array.isArray(value)) invalid(at, 'an array')
  return value
}

function text(value: unknown, at: string): string {
  if (typeof value !== 'string' || !value.trim()) invalid(at, 'a nonempty string')
  return value
}

function prose(value: unknown, at: string): string {
  const wording = text(value, at)
  if (HAN.test(wording)) invalid(at, 'English or romanized text')
  return wording
}

function id(value: unknown, at: string): string {
  const key = text(value, at)
  if (!ID.test(key)) invalid(at, 'a stable id')
  return key
}

function count(value: unknown, at: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
    invalid(at, `an integer of at least ${minimum}`)
  }
  return value
}

function oneOf(value: unknown, options: readonly string[], at: string) {
  if (typeof value !== 'string' || !options.includes(value)) invalid(at, options.join(', '))
}

function webUrl(value: unknown, at: string) {
  const url = text(value, at)
  if (!/^https?:\/\//.test(url) || !URL.canParse(url) || /\s/u.test(url)) invalid(at, 'an absolute HTTP or HTTPS URL')
}

function repoPath(value: unknown, at: string) {
  const path = text(value, at)
  const [file, anchor, unexpected] = path.split('#')
  if (path.includes('\\') || path.includes('?') || path.includes(':') || anchor === '' || unexpected !== undefined ||
      file!.split('/').some((part) => !part || part === '..' || part === '.')) {
    invalid(at, 'a repository-relative path')
  }
}

function passageUrl(value: unknown, at: string) {
  const url = text(value, at)
  if (/^https?:\/\//.test(url)) webUrl(url, at)
  else repoPath(url, at)
}

function locator(value: unknown, at: string) {
  const path = text(value, at)
  if (REPO_LOCATOR.test(path)) repoPath(path, at)
  else prose(path, at)
}

function each(value: unknown, at: string, check: (item: unknown, path: string) => void) {
  array(value, at).forEach((item, index) => check(item, `${at}[${index}]`))
}

function optional(record: Record<string, unknown>, key: string, at: string, check: (value: unknown, path: string) => void) {
  if (record[key] !== undefined) check(record[key], `${at}.${key}`)
}

function pairing(value: unknown, at: string) {
  const pair = object(value, at)
  const reading = text(pair.text, `${at}.text`)
  prose(pair.english, `${at}.english`)
  oneOf(pair.gloss, ['authored', 'derived'], `${at}.gloss`)
  if (HAN.test(reading) || pair.pinyin !== undefined) {
    const pinyin = prose(pair.pinyin, `${at}.pinyin`)
    if (HAN.test(reading) && !TONE.test(pinyin.normalize('NFD'))) invalid(`${at}.pinyin`, 'tone-marked pinyin')
  }
}

/** Reject stale exports at fetch and malformed evidence at either entry point. */
export function validateTaoTeChingSources(value: unknown): asserts value is SourcesExport {
  const x = object(value, 'export')
  if (x.contract !== 1) invalid('contract', '1')
  const chapterKeys = Object.keys(object(x.chapters, 'chapters'))
  const chapterKeySet = new Set(chapterKeys)
  const chapter = (value: unknown, at: string) => {
    const n = count(value, at, 1)
    if (!chapterKeySet.has(String(n))) invalid(at, 'a chapter in the export')
  }
  const cards = new Set(array(x.chars, 'chars').map((item, i) => text(object(item, `chars[${i}]`).c, `chars[${i}].c`)))

  const sources = object(x.sources, 'sources')
  const totals = object(sources.totals, 'sources.totals')
  for (const key of ['sources', 'stored', 'facts', 'pending_print', 'citation_debt', 'incomplete_entries', 'entries', 'readings']) {
    count(totals[key], `sources.totals.${key}`)
  }
  const bySource = new Map<string, { kind: string; editions: Set<string> }>()
  const entries = array(x.entries, 'entries').map((entry, i) => object(entry, `entries[${i}]`))
  const slugs = new Set(entries.map((entry, i) => text(entry.slug, `entries[${i}].slug`)))
  const records = array(sources.records, 'sources.records')
  if (!records.length) invalid('sources.records', 'at least one source')
  records.forEach((item, i) => {
    const at = `sources.records[${i}]`
    const record = object(item, at)
    const key = id(record.id, `${at}.id`)
    if (bySource.has(key)) invalid(`${at}.id`, 'a unique source id')
    const kind = text(record.kind, `${at}.kind`)
    oneOf(kind, ['base', 'excavated', 'transmitted', 'commentary', 'dictionary', 'context', 'translation', 'reference'], `${at}.kind`)
    oneOf(record.use, ['stored', 'facts', 'consulted'], `${at}.use`)
    prose(record.name, `${at}.name`)
    for (const field of ['date', 'found', 'short_name', 'author_dates', 'citation_debt']) optional(record, field, at, prose)
    for (const field of ['url', 'scan']) optional(record, field, at, webUrl)
    repoPath(record.policy, `${at}.policy`)
    optional(record, 'years', at, (years, path) => {
      const range = array(years, path)
      if (!range.length || range.length > 2 || !range.every(Number.isSafeInteger)) invalid(path, 'one year or a range of years')
    })
    each(record.holds, `${at}.holds`, repoPath)
    each(record.forks, `${at}.forks`, (fork, path) => count(fork, path, 1))
    each(record.chapters, `${at}.chapters`, chapter)
    each(record.entries, `${at}.entries`, (slug, path) => {
      if (!slugs.has(text(slug, path))) invalid(path, 'an entry in the export')
    })
    const coverage = object(record.coverage, `${at}.coverage`)
    each(coverage.chapters, `${at}.coverage.chapters`, chapter)
    optional(coverage, 'total', `${at}.coverage`, count)
    count(record.pending_print, `${at}.pending_print`)

    const editions = new Set<string>()
    each(record.editions, `${at}.editions`, (item, path) => {
      const edition = object(item, path)
      const editionId = id(edition.id, `${path}.id`)
      if (editions.has(editionId)) invalid(`${path}.id`, 'a unique edition id')
      editions.add(editionId)
      prose(edition.title, `${path}.title`)
      optional(edition, 'publisher', path, prose)
      optional(edition, 'date', path, prose)
      optional(edition, 'url', path, webUrl)
      optional(edition, 'year', path, (year, field) => {
        if (!Number.isSafeInteger(year)) invalid(field, 'an integer year')
      })
    })
    bySource.set(key, { kind, editions })
  })

  const knownSource = (value: unknown, at: string) => {
    const key = id(value, at)
    if (!bySource.has(key)) invalid(at, 'a source in the export')
    return key
  }

  function provenance(record: Record<string, unknown>, at: string) {
    optional(record, 'via', at, knownSource)
    const chain = array(record.chain, `${at}.chain`).map((key, i) => knownSource(key, `${at}.chain[${i}]`))
    if (new Set(chain).size !== chain.length || chain.includes(record.source as string) || chain.includes(record.id as string)) {
      invalid(`${at}.chain`, 'a chain without repeated sources')
    }
    if (record.via && record.via !== chain[0]) invalid(`${at}.via`, 'the first intermediary in the chain')
    return chain
  }

  function reference(record: Record<string, unknown>, at: string, source: string) {
    const chain = provenance(record, at)
    optional(record, 'edition', at, (value, path) => {
      const edition = id(value, path)
      if (![source, ...chain].some((key) => bySource.get(key)?.editions.has(edition))) invalid(path, 'an edition of the source or intermediary')
    })
    optional(record, 'locator', at, locator)
    optional(record, 'url', at, passageUrl)
  }

  function citation(value: unknown, at: string) {
    const ref = object(value, at)
    const source = knownSource(ref.source, `${at}.source`)
    reference(ref, at, source)
    if (!ref.locator && !ref.url) invalid(at, 'a locator or passage URL')
    return ref
  }

  records.forEach((item, i) => provenance(object(item, `sources.records[${i}]`), `sources.records[${i}]`))
  entries.forEach((entry, i) => {
    const at = `entries[${i}]`
    oneOf(entry.refs_status, ['complete', 'incomplete'], `${at}.refs_status`)
    each(entry.refs, `${at}.refs`, (item, path) => {
      const ref = citation(item, path)
      optional(ref, 'at', path, text)
    })
  })

  const chapterSources = object(x.chapter_sources, 'chapter_sources')
  if (Object.keys(chapterSources).length !== chapterKeys.length) invalid('chapter_sources', 'one record per chapter')
  for (const n of chapterKeys) {
    const at = `chapter_sources.${n}`
    const evidence = object(chapterSources[n], at)
    const attestation = object(evidence.attestation, `${at}.attestation`)
    knownSource(attestation.source, `${at}.attestation.source`)
    oneOf(attestation.source, ['guodian'], `${at}.attestation.source`)
    const tuple = array((x.chapters as Record<string, unknown>)[n], `chapters.${n}`)
    if (typeof attestation.present !== 'boolean' || Number(attestation.present) !== tuple[3]) {
      invalid(`${at}.attestation.present`, 'the same attestation as the chapter tuple')
    }
    each(attestation.bundles, `${at}.attestation.bundles`, prose)
    each(attestation.units, `${at}.attestation.units`, prose)
    if (attestation.present) {
      oneOf(attestation.extent, ['complete', 'opening', 'middle', 'end', 'split'], `${at}.attestation.extent`)
    } else if (attestation.extent !== null || (attestation.bundles as unknown[]).length || (attestation.units as unknown[]).length) {
      invalid(`${at}.attestation`, 'no extent, bundles or units for an unattested chapter')
    }

    each(evidence.commentary, `${at}.commentary`, (item, path) => {
      const commentary = object(item, path)
      const source = knownSource(commentary.source, `${path}.source`)
      if (bySource.get(source)?.kind !== 'commentary') invalid(`${path}.source`, 'a commentary source')
      repoPath(commentary.path, `${path}.path`)
    })

    const forks = new Set<number>()
    each(evidence.forks, `${at}.forks`, (item, path) => {
      const fork = object(item, path)
      const key = count(fork.id, `${path}.id`, 1)
      if (forks.has(key)) invalid(`${path}.id`, 'a unique fork id in the chapter')
      forks.add(key)
      pairing(fork.base, `${path}.base`)
      if (typeof fork.meaning_bearing !== 'boolean') invalid(`${path}.meaning_bearing`, 'a boolean')
      optional(fork, 'refs', path, (refs, field) => each(refs, field, citation))
      const seen = new Set<string>()
      each(fork.readings, `${path}.readings`, (item, readingPath) => {
        const reading = object(item, readingPath)
        const source = id(reading.source, `${readingPath}.source`)
        if (!EDITORIAL.includes(source)) knownSource(source, `${readingPath}.source`)
        if (seen.has(source)) invalid(`${readingPath}.source`, 'one reading per witness in a fork')
        seen.add(source)
        pairing(reading, readingPath)
        reference(reading, readingPath, source)
        for (const field of ['annotation', 'confirm', 'confirmation']) {
          optional(reading, field, readingPath, prose)
        }
        optional(reading, 'confirmed_locator', readingPath, locator)
        optional(reading, 'confirmed_on', readingPath, (value, field) => {
          const label = text(value, field)
          const date = new Date(label)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(label) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== label) {
            invalid(field, 'an ISO date')
          }
        })
        optional(reading, 'confirmed_edition', readingPath, (value, field) => {
          if (!bySource.get(source)?.editions.has(id(value, field))) invalid(field, 'an edition of the witness')
        })
        oneOf(reading.verification, ['unassessed', 'pending-print', 'confirmed-print'], `${readingPath}.verification`)
        if (reading.verification === 'pending-print' && (!(reading.chain as string[]).length || !reading.locator || !reading.confirm)) {
          invalid(readingPath, 'an intermediary, locator and worklist reference for a pending print check')
        }
        if (reading.verification === 'confirmed-print' && (!reading.confirmed_edition || !reading.confirmed_locator || !reading.confirmed_on || !reading.confirmation)) {
          invalid(readingPath, 'an edition, locator, date and outcome for a completed print check')
        }
        const textChars = new Set(Array.from(reading.text as string))
        each(reading.cards, `${readingPath}.cards`, (value, field) => {
          const card = text(value, field)
          if (!textChars.has(card) || !cards.has(card)) invalid(field, 'a character in this reading with an exported Atlas card')
        })
      })
      const call = id(fork.our_call, `${path}.our_call`)
      if (![...DECISIONS, ...seen].includes(call)) invalid(`${path}.our_call`, 'an editorial decision or a witness in the fork')
    })
  }
}
