#!/usr/bin/env tsx
/**
 * Vendors the public-domain source material for the I Ching renderings into
 * knowledge/iching/sources/.
 *
 *   pnpm xenso:import-iching --fetch          # everything, from the network
 *   pnpm xenso:import-iching                  # everything, from .cache/
 *   pnpm xenso:import-iching --only zhouyi    # zhouyi | wings | legge | harlez | locks
 *   pnpm xenso:import-iching --only mcclatchie --from <file>   # hand-carried; see below
 *
 * Three sources, three rights positions, and the frontmatter of every written
 * file says which one it is. See knowledge/iching/sources/PROVENANCE.md.
 *
 * The importer verifies itself, because a vendored text a later reader will
 * treat as evidence has to earn that standing. Two independent checks run on
 * every import and the run fails if either does:
 *
 *   1. TRIGRAM AGREEMENT. Each Zhouyi page prints its own trigram decomposition
 *      (兌下坎上 — "dui below, kan above"). It must equal the `trigrams:` in our
 *      own hexagrams/NN.md. 64 assertions.
 *
 *   2. THE FIGURE, READ BACK OUT OF THE LINE LABELS. Classical line labels name
 *      each line's polarity — 九 is a solid line, 六 a broken one — so 初九 九二
 *      六三 六四 九五 上六 spells 110010 and nothing else. Reassembling the figure
 *      from the labels and comparing it to `lines:` checks all 384 line values
 *      against a source that has no idea what our table says. This is the check
 *      worth having: a transposed row cannot survive it.
 *
 * Legge is imported at two grades and they are never blurred. Hexagrams 1–32
 * come from the English Wikisource mainspace, proofread against the 1882
 * Clarendon scan by hand. 33–64 do not exist there, so they are extracted from
 * the OCR of that same scan — and the extractor is scored against the
 * proofread 1–32 before it is trusted with 33–64. The score is printed, and it
 * lands in each file's frontmatter as `transcription:`.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { load } from 'js-yaml'

const ROOT = resolve(__dirname, '..', '..')
const ICHING = join(ROOT, 'knowledge', 'iching')
const SOURCES = join(ICHING, 'sources')
const CACHE = join(SOURCES, '.cache')
const TAOTECHING = resolve(ROOT, '..', 'shalomormsby', 'taoteching')

const TODAY = new Date().toISOString().slice(0, 10)

const args = process.argv.slice(2)
const FETCH = args.includes('--fetch')
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : 'all'
const want = (name: string) => ONLY === 'all' || ONLY === name

let failures = 0
const fail = (m: string) => {
  console.log(`  ✗ ${m}`)
  failures++
}
const pass = (m: string) => console.log(`  ✓ ${m}`)

// ─────────────────────────────────────────────────────────────────────────────
// Our own table — the thing every import is checked against.
// ─────────────────────────────────────────────────────────────────────────────

type Hex = { number: number; chinese: string; lines: string; trigrams: { lower: string; upper: string } }

function ourHexagrams(): Hex[] {
  const dir = join(ICHING, 'hexagrams')
  const rows = readdirSync(dir)
    .filter(f => /^\d\d\.md$/.test(f))
    .map(f => {
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(join(dir, f), 'utf8'))
      if (!m) throw new Error(`${f}: no frontmatter`)
      return load(m[1]) as Hex
    })
    .sort((a, b) => a.number - b.number)
  if (rows.length !== 64) throw new Error(`expected 64 hexagrams, found ${rows.length}`)
  return rows
}

const HEX = ourHexagrams()

/**
 * 恆 / 恒 for hexagram 32. Our table carries the Kangxi form, Wikisource the
 * simplified-adjacent variant of the same character. Recorded rather than
 * normalised silently — an orthographic map that grows without being read is
 * how a genuine textual fork gets buried.
 */
const ORTHOGRAPHIC: Record<string, string> = { 恒: '恆' }

const TRIGRAM_BY_CHAR: Record<string, string> = {
  乾: 'qian', 兌: 'dui', 離: 'li', 震: 'zhen',
  巽: 'xun', 坎: 'kan', 艮: 'gen', 坤: 'kun',
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetching, with a cache, because the network is not part of the build.
// ─────────────────────────────────────────────────────────────────────────────

const UA = 'opencosmos-iching-importer/1.0 (https://opencosmos.ai; shalomormsby@gmail.com)'

/**
 * Han characters are not `\w`, so a naive sanitiser collapses all 64 hexagram
 * titles onto one filename. The hash keeps them distinct; the readable prefix
 * keeps the directory greppable.
 */
function cachePath(key: string) {
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 10)
  return join(CACHE, `${key.replace(/[^\w.-]/g, '_').slice(0, 60)}-${hash}.json`)
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function cached<T>(key: string, get: () => Promise<T>): Promise<T> {
  const path = cachePath(key)
  if (!FETCH && existsSync(path)) return JSON.parse(readFileSync(path, 'utf8')) as T
  if (!existsSync(path) && !FETCH) throw new Error(`not cached: ${key} — re-run with --fetch`)
  const value = await get()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value))
  await sleep(400) // courtesy to the Wikimedia API
  return value
}

async function mediawiki(site: string, params: Record<string, string>): Promise<any> {
  const url = `https://${site}/w/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const json = await res.json()
  if (json.error) throw new Error(`${json.error.code}: ${json.error.info}`)
  return json
}

/** Wikitext plus the revision id, so a vendored file can name the exact revision it came from. */
async function wikitext(site: string, title: string): Promise<{ text: string; revid: number }> {
  return cached(`${site}-wikitext-${title}`, async () => {
    const j = await mediawiki(site, { action: 'parse', page: title, prop: 'wikitext|revid' })
    return { text: j.parse.wikitext as string, revid: j.parse.revid as number }
  })
}

async function renderedHtml(site: string, title: string): Promise<{ html: string; revid: number }> {
  return cached(`${site}-html-${title}`, async () => {
    const j = await mediawiki(site, { action: 'parse', page: title, prop: 'text|revid' })
    return { html: j.parse.text as string, revid: j.parse.revid as number }
  })
}

async function archiveText(identifier: string, file: string): Promise<string> {
  const path = join(CACHE, `${identifier}.txt`)
  if (!FETCH && existsSync(path)) return readFileSync(path, 'utf8')
  if (!existsSync(path) && !FETCH) throw new Error(`not cached: ${identifier} — re-run with --fetch`)
  const res = await fetch(`https://archive.org/download/${identifier}/${file}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} archive.org/${identifier}`)
  const text = await res.text()
  mkdirSync(CACHE, { recursive: true })
  writeFileSync(path, text)
  return text
}

// ─────────────────────────────────────────────────────────────────────────────
// Wikitext cleaning.
//
// Chinese Wikisource wraps characters in -{…}- to suppress the site's automatic
// script conversion. The markers are display machinery and come out; the
// characters inside them are the text and stay. {{*|…}} is the transcription's
// own collation note — an editorial layer, so it is *marked* rather than kept
// silently or dropped, which is what the admission rules require.
// ─────────────────────────────────────────────────────────────────────────────

const unknownTemplates = new Set<string>()

/** Navigation and display chrome, verified by eye to carry no text. */
const CHROME_TEMPLATES = new Set(['header', 'Header', 'header2', 'Header2', 'Textquality', 'NoteTA', 'gap', '檢索', '周易注'])

function cleanWikitext(s: string): string {
  return s
    .replace(/-\{T\|[^}]*\}-/g, '')                         // title-conversion directive: display only
    .replace(/-\{(?:[A-Za-z-]+:)?([^|}]*?)\}-/g, '$1')      // -{无}- → 无
    .replace(/\{\{\*\|([^}]*)\}\}/g, '〔$1〕')                // collation note, marked
    .replace(/\{\{wj\}\}/g, '')                             // a zero-width word-join hint
    .replace(/\{\{\s*([^}|]+?)\s*(\|[^}]*)?\}\}/g, (_m, name) => { // anything else: report, do not swallow
      if (!CHROME_TEMPLATES.has(String(name).trim())) unknownTemplates.add(String(name).trim())
      return ''
    })
    .replace(/<\/?span[^>]*>/g, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .trim()
}

function stripHtml(h: string): string {
  return h
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[\s\S]*?<\/sup>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/(p|div|li|h\d)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/[​‎­]/g, '')
    .replace(/\b(?:note\d+|line|text) ##/g, '')  // unresolved section-transclusion labels
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// 周易 — the base text, one page per hexagram on Chinese Wikisource.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The transcription is not uniform about the separator: most pages print
 * 初九：, hexagram 12 prints 初九，. Both are the same editorial mark and both
 * are accepted, rather than losing a hexagram to a punctuation preference.
 */
const LINE_LABEL = /^(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六|用九|用六)\s*[：:，,]\s*(.*)$/

type Zhouyi = {
  number: number
  name: string
  lower: string
  upper: string
  judgment: string[]
  lineTexts: { label: string; text: string }[]
  extra: { label: string; text: string }[]  // 用九 / 用六 — not lines
  tuan: string[]
  daxiang: string
  xiaoxiang: string[]
  wenyan: string[]
}

function parseZhouyi(raw: string, expect: Hex): Zhouyi {
  const text = cleanWikitext(raw)
  const lines = text.split('\n')

  const nameLine = lines.find(l => /^;/.test(l))
  const name = nameLine ? nameLine.replace(/^;\s*/, '').trim() : ''

  const trigramLine = lines.find(l => /[乾兌離震巽坎艮坤]下[乾兌離震巽坎艮坤]上/.test(l))
  const tg = trigramLine?.match(/([乾兌離震巽坎艮坤])下([乾兌離震巽坎艮坤])上/)
  if (!tg) throw new Error(`hexagram ${expect.number}: no trigram line found`)

  // Sections are marked by their own opening formula.
  const section = (marker: string) => {
    const start = lines.findIndex(l => l.includes(marker))
    if (start < 0) return []
    const out: string[] = []
    for (let i = start + 1; i < lines.length; i++) {
      const l = lines[i]
      if (/^\*'''?(彖|象|文言)/.test(l) || /^\*(彖|象|文言)曰/.test(l)) break
      const body = l.replace(/^[*#:]+\s*/, '').trim()
      if (body) out.push(body)
    }
    return out
  }

  const jing = section('易經：')
  const judgment: string[] = []
  const lineTexts: Zhouyi['lineTexts'] = []
  const extra: Zhouyi['extra'] = []
  for (const entry of jing) {
    const m = LINE_LABEL.exec(entry)
    if (m) {
      const rec = { label: m[1], text: m[2].trim() }
      if (m[1] === '用九' || m[1] === '用六') extra.push(rec)
      else lineTexts.push(rec)
    } else {
      // Verbatim. The judgment line prints the hexagram's own name before the
      // oracle — 節：亨。苦節不可貞。 — and that is how the text reads, not a
      // label to be tidied off.
      judgment.push(entry)
    }
  }

  const xiang = section('象曰：')
  const tuan = section('彖曰：')
  const wenyan = section('文言曰：')

  return {
    number: expect.number,
    name,
    lower: TRIGRAM_BY_CHAR[tg[1]],
    upper: TRIGRAM_BY_CHAR[tg[2]],
    judgment,
    lineTexts,
    extra,
    tuan,
    daxiang: xiang[0] ?? '',
    xiaoxiang: xiang.slice(1),
    wenyan,
  }
}

/** 九 is a solid line, 六 a broken one. The labels spell the figure, bottom to top. */
function figureFromLabels(lineTexts: { label: string }[]): string {
  const order = ['初', '二', '三', '四', '五', '上']
  const bits: string[] = []
  for (let i = 0; i < 6; i++) {
    const want = order[i]
    const found = lineTexts.find(l => (i === 0 || i === 5 ? l.label.startsWith(want) : l.label.endsWith(want)))
    if (!found) return ''
    bits.push(found.label.includes('九') ? '1' : '0')
  }
  return bits.join('')
}

async function importZhouyi() {
  console.log('\n周易 — the base text  ·  zh.wikisource.org, mainspace')
  const out = join(SOURCES, 'zhouyi')
  mkdirSync(out, { recursive: true })

  let trigramOk = 0
  let figureOk = 0
  let lineCount = 0
  const orthographic: string[] = []

  for (const hex of HEX) {
    const title = `周易/${hex.chinese === '恆' ? '恒' : hex.chinese}`
    const { text, revid } = await wikitext('zh.wikisource.org', title)
    const z = parseZhouyi(text, hex)

    // Check 1 — the page's own trigram decomposition against ours.
    if (z.lower === hex.trigrams.lower && z.upper === hex.trigrams.upper) trigramOk++
    else fail(`hexagram ${hex.number}: source says ${z.lower}/${z.upper}, table says ${hex.trigrams.lower}/${hex.trigrams.upper}`)

    // Check 2 — the figure, reassembled from the classical line labels.
    const figure = figureFromLabels(z.lineTexts)
    if (figure === hex.lines) figureOk++
    else fail(`hexagram ${hex.number}: labels spell ${figure || '(incomplete)'}, table says ${hex.lines}`)

    if (z.lineTexts.length !== 6) fail(`hexagram ${hex.number}: ${z.lineTexts.length} line texts, expected 6`)
    lineCount += z.lineTexts.length

    const canonical = ORTHOGRAPHIC[z.name] ?? z.name
    if (canonical !== hex.chinese) fail(`hexagram ${hex.number}: source names it ${z.name}, table says ${hex.chinese}`)
    else if (z.name !== hex.chinese) orthographic.push(`${hex.number}: ${z.name} → ${hex.chinese}`)

    writeFileSync(join(out, `${String(hex.number).padStart(2, '0')}.md`), zhouyiFile(hex, z, title, revid))
  }

  pass(`trigram agreement — ${trigramOk}/64 pages decompose exactly as the table does`)
  pass(`figure agreement — ${figureOk}/64 figures reassembled from 九/六 labels, ${lineCount} line texts`)
  if (orthographic.length) console.log(`  · orthographic variants carried across: ${orthographic.join(', ')}`)
  console.log(`  → knowledge/iching/sources/zhouyi/01.md … 64.md`)
}

function yamlString(s: string) {
  return `"${s.replace(/"/g, '\\"')}"`
}

function zhouyiFile(hex: Hex, z: Zhouyi, title: string, revid: number): string {
  const fm = [
    '---',
    'work: "周易"',
    'section: "經"',
    `hexagram: ${hex.number}`,
    `name: ${yamlString(hex.chinese)}`,
    `figure: ${yamlString(hex.lines)}`,
    `trigrams: { lower: ${yamlString(z.lower)}, upper: ${yamlString(z.upper)} }`,
    'edition: "Chinese Wikisource mainspace transcription"',
    `obtained: "https://zh.wikisource.org/wiki/${title}"`,
    `revision: ${revid}`,
    'transcription: "human, mainspace"',
    'punctuation: "editorial, present"',
    'editorial_notes: "collation notes preserved, marked 〔…〕"',
    'rights: "public domain by age; a faithful transcription creates no new copyright"',
    `transcribed: ${TODAY}`,
    '---',
    '',
  ].join('\n')

  const char = (id: string) => Object.keys(TRIGRAM_BY_CHAR).find(k => TRIGRAM_BY_CHAR[k] === id)
  const body: string[] = [
    `# ${hex.chinese} — 周易第${hex.number}卦`,
    '',
    `${char(z.lower)}下${char(z.upper)}上　·　${hex.lines}，自下而上`,
    '',
  ]

  body.push('## 卦辭', '')
  for (const j of z.judgment) body.push(j, '')

  body.push('## 爻辭', '')
  for (const l of z.lineTexts) body.push(`${l.label}：${l.text}`, '')
  for (const l of z.extra) body.push(`${l.label}：${l.text}`, '')

  if (z.tuan.length) {
    body.push('## 彖傳', '')
    for (const t of z.tuan) body.push(t, '')
  }
  if (z.daxiang) body.push('## 大象傳', '', z.daxiang, '')
  if (z.xiaoxiang.length) {
    body.push('## 小象傳', '')
    for (const x of z.xiaoxiang) body.push(x, '')
  }
  if (z.wenyan.length) {
    body.push('## 文言傳', '')
    for (const w of z.wenyan) body.push(w, '')
  }

  return fm + body.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

// ─────────────────────────────────────────────────────────────────────────────
// 十翼 — the standalone Wings. 說卦 is the one the eight trigram files need.
// ─────────────────────────────────────────────────────────────────────────────

const WINGS: { title: string; slug: string; english: string; note: string }[] = [
  { title: '繫辭上', slug: 'xici-shang', english: 'The Great Treatise, part I', note: 'Wings 5. The philosophical core — where 太極, 陰陽 and the cast procedure itself are set out.' },
  { title: '繫辭下', slug: 'xici-xia', english: 'The Great Treatise, part II', note: 'Wings 6.' },
  { title: '說卦', slug: 'shuogua', english: 'Discussion of the Trigrams', note: 'Wings 8. **The source of every trigram image** — 乾為天, 坤為地 — and therefore the primary evidence for trigrams/*.md.' },
  { title: '序卦', slug: 'xugua', english: 'The Sequence of the Hexagrams', note: 'Wings 9. The text\'s own account of why King Wen order runs as it does.' },
  { title: '雜卦', slug: 'zagua', english: 'Miscellaneous Notes on the Hexagrams', note: 'Wings 10. One-line glosses, in pairs — the tersest gloss the tradition gives each hexagram, and the closest thing in the corpus to a `render`.' },
]

async function importWings() {
  console.log('\n十翼 — the standalone Wings  ·  zh.wikisource.org, mainspace')
  const out = join(SOURCES, 'wings')
  mkdirSync(out, { recursive: true })

  for (const wing of WINGS) {
    // 周易/說卦 and its siblings are redirects; 易傳/ is where the text lives.
    const title = `易傳/${wing.title}`
    const { text, revid } = await wikitext('zh.wikisource.org', title)
    const cleaned = cleanWikitext(text)
    const body = cleaned
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .filter(l => !/^\{\{|^\}\}|^\|/.test(l))
      .filter(l => !/^(previous|next|header2?|section|title|author|times|from|notes|type|[ymd])\s*=/i.test(l))
      // The chapter divisions are the transcription's, following the received
      // arrangement. They are how anyone cites this text, so they stay.
      .map(l => (/^==+\s*(.+?)\s*==+$/.test(l) ? `## ${l.replace(/^==+\s*|\s*==+$/g, '')}` : l.replace(/^[*#;:]+\s*/, '')))

    const chapters = body.filter(l => l.startsWith('## ')).length

    const fm = [
      '---',
      'work: "周易"',
      'section: "傳"',
      `wing: ${yamlString(wing.title)}`,
      `english: ${yamlString(wing.english)}`,
      'edition: "Chinese Wikisource mainspace transcription"',
      `obtained: "https://zh.wikisource.org/wiki/${title}"`,
      `revision: ${revid}`,
      'transcription: "human, mainspace"',
      'punctuation: "editorial, present"',
      `chapters: ${chapters}`,
      'rights: "public domain by age; a faithful transcription creates no new copyright"',
      `transcribed: ${TODAY}`,
      '---',
      '',
      `# ${wing.title} — ${wing.english}`,
      '',
      `> ${wing.note}`,
      '',
      '',
    ].join('\n')

    const md = body
      .map(l => (l.startsWith('## ') ? `\n${l}\n` : l))
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
    writeFileSync(join(out, `${wing.slug}.md`), fm + md.trim() + '\n')
    console.log(`  ✓ ${wing.title} — ${chapters} chapters, ${body.length - chapters} passages`)
  }
  console.log(`  → knowledge/iching/sources/wings/`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Legge 1882 — two grades, never blurred.
// ─────────────────────────────────────────────────────────────────────────────

const ROMAN = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
  'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL',
  'XLI', 'XLII', 'XLIII', 'XLIV', 'XLV', 'XLVI', 'XLVII', 'XLVIII', 'XLIX', 'L',
  'LI', 'LII', 'LIII', 'LIV', 'LV', 'LVI', 'LVII', 'LVIII', 'LIX', 'LX',
  'LXI', 'LXII', 'LXIII', 'LXIV',
]

type Legge = { heading: string; judgment: string; paragraphs: string[] }

/** Hexagrams 1 and 2 carry a seventh paragraph — Legge's rendering of 用九 / 用六. */
const expectedParagraphs = (n: number) => (n === 1 || n === 2 ? 7 : 6)

/**
 * The OCR reads LII. as "LI I." and LIII. as "LI 1 1." — the numeral letters
 * get spaced apart and I/1 confused. Matching the numeral literally loses two
 * hexagrams, so each letter is matched loosely instead.
 */
function romanPattern(n: number): string {
  return [...ROMAN[n]].map(c => (c === 'I' ? '[I1lι]' : c)).join('\\s*')
}

/**
 * The proofread grade: mainspace HTML with the transclusions resolved.
 *
 * Legge's notes sit below a printer's rule. Two complications: the hexagram
 * name is assembled out of nested tooltip spans, so it cannot be found in the
 * raw HTML at all; and hexagrams 1 and 2 carry a second decorative rule *above*
 * the heading. So the rule is turned into a text sentinel before the tags come
 * off, and the cut is made at the first sentinel that follows the heading.
 */
const RULE = ' RULE '

function parseLeggeProofread(html: string, n: number): Legge {
  const text = stripHtml(html.replace(/<hr\b[^>]*>/g, `\n${RULE}\n`))
  const headRe = new RegExp(`\\b${ROMAN[n]}\\.\\s+The\\s+[^.\\n]*Hexagram\\.`)
  const at = text.search(headRe)
  if (at < 0) throw new Error(`hexagram ${n}: heading not found in mainspace HTML`)
  const heading = text.match(headRe)![0]

  let body = text.slice(at + heading.length)
  const cut = body.indexOf(RULE)
  if (cut >= 0) body = body.slice(0, cut)

  const paras = body
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !/^[䷀-䷿]$/.test(l))   // the hexagram glyph itself

  const numbered: string[] = []
  const pre: string[] = []
  for (const p of paras) {
    // Legge labels the two authorial layers in hexagrams 1 and 2 only. They are
    // his headings, not his translation, and they do not belong in either field.
    if (/^Explanation of the /.test(p)) continue
    if (/^(\d+)\.\s/.test(p)) numbered.push(p)
    else if (numbered.length) numbered[numbered.length - 1] += ' ' + p
    else pre.push(p)
  }
  return { heading, judgment: pre.join(' ').trim(), paragraphs: numbered }
}

/**
 * The OCR grade. Legge's page sets the translation in full-size type above his
 * notes in small type, so a note line simply fits more characters than a text
 * line does. That, plus the numbered-paragraph formula, separates them.
 */
const OCR_TEXT_WIDTH = 64

function ocrParagraphs(block: string): { text: string; isNote: boolean }[] {
  return block
    .split(/\n\s*\n/)
    .map(p => p.split('\n').map(l => l.replace(/\s+$/, '')).filter(Boolean))
    .filter(p => p.length)
    // Running heads. The folio number is set in the same small caps as the
    // title and OCRs as letters as often as digits — page 110 comes back "IIO" —
    // so the number is matched as loosely as the words around it.
    .filter(p => !p.every(l =>
      /^\s*[\dIiLlOoSs]*\s*THE\s+Y.\s+KING/i.test(l) ||
      /^\s*(TEXT|SECT\.|APPENDIX)/i.test(l) ||
      /HEXAGRAM\.\s+\S*$/.test(l)))
    .map(p => {
      const widths = p.map(l => l.length).sort((a, b) => a - b)
      const median = widths[Math.floor(widths.length / 2)]
      return { text: joinOcrLines(p), isNote: median > OCR_TEXT_WIDTH }
    })
}

function joinOcrLines(lines: string[]): string {
  let s = ''
  for (const raw of lines) {
    const l = raw.trim()
    if (!s) { s = l; continue }
    if (/[-—]$/.test(s) && !/\s[-—]$/.test(s)) s = s.replace(/[-—]$/, '') + l
    else s += ' ' + l
  }
  return s.replace(/\s+/g, ' ').replace(/\s+([,;.!?])/g, '$1').trim()
}

function parseLeggeOcr(full: string, n: number): Legge | null {
  // The romanised names are mangled too — hexagram 53's Kien comes back
  // ".ATien", dot and all — so the name is matched as "anything up to Hexagram
  // on this line" rather than as a word.
  const heading = (k: number) => new RegExp(`^\\s*${romanPattern(k)}\\s*\\.\\s+The\\s+[^\\n]{1,40}?\\s+Hexagram\\.?\\s*$`, 'm')
  const head = heading(n)
  const next = n < 64 ? heading(n + 1) : null

  // The Text prints each hexagram once; the Appendixes discuss them again. Take
  // the first occurrence, which is the translation.
  const start = full.search(head)
  if (start < 0) return null
  const rest = full.slice(start)
  const matched = rest.match(head)![0]
  const after = rest.slice(matched.length)
  // Hexagram 64 has no successor to stop at; the Appendixes begin immediately
  // after it, and without this bound the last file swallows the start of them.
  const end = next ? after.search(next) : after.search(/^\s*THE\s+APPENDIXES/m)
  const block = end > 0 ? after.slice(0, end) : after.slice(0, 12000)

  // A line paragraph is routinely cut in half by a page break, with a column of
  // notes and a running header wedged into the gap, so paragraph boundaries in
  // the OCR mean nothing. Rejoin the translation into one run and then split it
  // on its own ordinals, in order — which is the structure Legge actually printed.
  const run = ocrParagraphs(block).filter(p => !p.isNote).map(p => p.text).join(' ')

  // "1." comes back from the scanner as "i." about as often as not; 2 through 7
  // have no lookalikes and are matched literally.
  const ordinal = (k: number) => (k === 1 ? '[1iIl]' : String(k))

  const marks: number[] = []
  let from = 0
  for (let k = 1; k <= expectedParagraphs(n); k++) {
    const at = run.slice(from).search(new RegExp(`(^|\\s)${ordinal(k)}\\.\\s+[A-Z(]`))
    if (at < 0) continue   // an unreadable numeral loses the break, not the text
    const abs = from + at + (run.slice(from + at).startsWith(' ') ? 1 : 0)
    marks.push(abs)
    from = abs + 2
  }
  if (!marks.length) return null

  // Printer's signature marks — the "N 2", "P 2" that tell a binder which sheet
  // is which. They sit in the bottom margin and are not part of any sentence.
  const designature = (s: string) => s.replace(/\s+[A-Z]\s+\d\s*$/, '').trim()

  const paragraphs = marks.map((start, i) => designature(run.slice(start, marks[i + 1] ?? run.length)))
  return { heading: matched.replace(/\s+/g, ' ').trim(), judgment: run.slice(0, marks[0]).trim(), paragraphs }
}

/** Bag-of-words agreement. Blunt on purpose: it measures whether the same text was extracted, not OCR letter accuracy. */
function agreement(a: string, b: string): number {
  const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2)
  const A = words(a), B = new Map<string, number>()
  for (const w of words(b)) B.set(w, (B.get(w) ?? 0) + 1)
  let hit = 0
  for (const w of A) {
    const c = B.get(w) ?? 0
    if (c > 0) { hit++; B.set(w, c - 1) }
  }
  return A.length ? hit / A.length : 0
}

async function importLegge() {
  console.log('\nThe Yî King — Legge 1882  ·  a reference, read with the overlay in view')
  const out = join(SOURCES, 'legge-1882')
  mkdirSync(out, { recursive: true })

  const proofread = new Map<number, { legge: Legge; revid: number; title: string }>()
  const defective: number[] = []
  for (let n = 1; n <= 32; n++) {
    const title = `Sacred Books of the East/Volume 16/Hexagram ${n}`
    const { html, revid } = await renderedHtml('en.wikisource.org', title)
    const legge = parseLeggeProofread(html, n)
    // A mainspace page whose transclusion is broken returns a fragment and, in
    // hexagram 32's case, the neighbouring hexagram's note. It looks like a
    // proofread text and is not one, so it is caught here rather than shipped.
    if (legge.paragraphs.length !== expectedParagraphs(n)) {
      defective.push(n)
      continue
    }
    proofread.set(n, { legge, revid, title })
  }
  pass(`proofread transcription — ${proofread.size} of hexagrams 1–32 from the English Wikisource mainspace`)
  if (defective.length) {
    console.log(`  · incomplete on Wikisource, falling back to the scan: ${defective.join(', ')}`)
  }

  const ocr = await archiveText('1922707.0016.002.umich.edu', '1922707.0016.002.umich.edu_djvu.txt')

  // Score the extractor on the stretch where a proofread answer exists, before
  // trusting it with the stretch where none does.
  let scored = 0
  let total = 0
  for (const [n, { legge: want }] of proofread) {
    const got = parseLeggeOcr(ocr, n)
    if (!got) { fail(`OCR extractor found no block for hexagram ${n}`); continue }
    const a = agreement([want.judgment, ...want.paragraphs].join(' '), [got.judgment, ...got.paragraphs].join(' '))
    scored += a
    total++
    if (got.paragraphs.length !== want.paragraphs.length) {
      console.log(`  · hexagram ${n}: OCR found ${got.paragraphs.length} numbered paragraphs, proofread has ${want.paragraphs.length}`)
    }
  }
  const score = total ? scored / total : 0
  const pct = (score * 100).toFixed(1)
  if (score < 0.9) fail(`OCR extractor agrees with the proofread text only ${pct}% of the time — not good enough to trust on 33–64`)
  else pass(`OCR extractor scored against the proofread 1–32: ${pct}% word agreement — trusted for 33–64`)

  let written = 0
  const short: number[] = []
  for (let n = 1; n <= 64; n++) {
    const p = proofread.get(n)
    const legge = p ? p.legge : parseLeggeOcr(ocr, n)
    if (!legge) { fail(`hexagram ${n}: no Legge text extracted`); continue }
    if (legge.paragraphs.length !== expectedParagraphs(n)) short.push(n)
    writeFileSync(join(out, `${String(n).padStart(2, '0')}.md`), leggeFile(n, legge, p ?? null, pct))
    written++
  }
  if (written === 64) pass('all 64 hexagrams have a Legge text')
  if (short.length) {
    console.log(`  · a numeral the scanner could not read, so one paragraph runs on into the next: ${short.join(', ')}`)
    console.log('    Flagged in those files\' frontmatter as `incomplete:`. No text is lost, only a boundary.')
  } else {
    pass('every file carries its full set of numbered paragraphs')
  }
  console.log(`  → knowledge/iching/sources/legge-1882/01.md … 64.md  (${written} files)`)
}

function leggeFile(n: number, legge: Legge, p: { revid: number; title: string } | null, pct: string): string {
  const hex = HEX[n - 1]
  const fm = [
    '---',
    'work: "The Yî King"',
    'translator: "James Legge"',
    'series: "The Sacred Books of the East, vol. XVI"',
    'editor: "F. Max Müller"',
    'publisher: "Clarendon Press, Oxford"',
    'year: 1882',
    `hexagram: ${n}`,
    `name: ${yamlString(hex.chinese)}`,
    p
      ? 'transcription: "human, proofread against the 1882 scan on English Wikisource"'
      : `transcription: "machine OCR of the 1882 scan, unproofread — extractor scored ${pct}% against the proofread 1–32"`,
    p
      ? `obtained: "https://en.wikisource.org/wiki/${encodeURI(p.title)}"`
      : 'obtained: "https://archive.org/details/1922707.0016.002.umich.edu"',
    ...(p ? [`revision: ${p.revid}`] : []),
    // What the page actually says at the top, mangling included. On the OCR
    // grade this is often wrong — hexagram 53 comes back "LI 1 1. The .ATien
    // Hexagram." — and a reader is owed the mangling rather than a tidied
    // version presented as the scan's own words.
    `scan_heading: ${yamlString(legge.heading)}`,
    `paragraphs: ${legge.paragraphs.length}`,
    ...(legge.paragraphs.length === expectedParagraphs(n)
      ? []
      : [`incomplete: "the scan yields ${legge.paragraphs.length} of ${expectedParagraphs(n)} numbered paragraphs; text of the missing one runs on into its neighbour"`]),
    'editorial_notes: "Legge\'s own footnotes are not vendored — see PROVENANCE"',
    'rights: "public domain by age; first published 1882"',
    'standing: "reference, not a source of English — see ../../method.md"',
    `transcribed: ${TODAY}`,
    '---',
    '',
  ].join('\n')

  const body = [
    `# Hexagram ${n} · ${hex.chinese} — Legge 1882`,
    '',
    '> Legge translated 天 as "Heaven", 君子 as "the superior man" and 王 as "the king".',
    '> Those are decisions made by a London Missionary Society scholar in 1882, and they',
    '> are locked against in this project. Read him for construal, never for English.',
    '',
    '## The judgment',
    '',
    legge.judgment,
    '',
    '## The lines',
    '',
    ...legge.paragraphs.flatMap(p => [p, '']),
  ]
  return fm + body.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

// ─────────────────────────────────────────────────────────────────────────────
// The locks — vendored from the Tao Te Ching glossary, and measured against
// this text so it is known how much of that glossary actually binds here.
// ─────────────────────────────────────────────────────────────────────────────

async function importLocks() {
  console.log('\nLocks — vendored from the Tao Te Ching glossary')
  const src = join(TAOTECHING, 'glossary', 'terms.yaml')
  if (!existsSync(src)) {
    fail(`taoteching glossary not found at ${src} — clone it beside this repo, or skip with --only`)
    return
  }
  const out = join(SOURCES, 'locks')
  mkdirSync(out, { recursive: true })
  const yaml = readFileSync(src, 'utf8')
  writeFileSync(join(out, 'terms.yaml'), yaml)

  const terms = load(yaml) as { term: string; pinyin: string; render: string; forbidden: string[]; status: string }[]

  // How much of the glossary reaches this book at all?
  //
  // The count is of the *term*, not of its characters: 天地 is counted as the
  // pair, not as 天 plus 地, or a two-character lock would come out commoner
  // than either of its halves. Entries written "無 & 有" name two separate
  // locks in one file and are counted as two.
  const zhouyiDir = join(SOURCES, 'zhouyi')
  let corpus = ''
  if (existsSync(zhouyiDir)) {
    for (const f of readdirSync(zhouyiDir).filter(f => f.endsWith('.md'))) {
      corpus += readFileSync(join(zhouyiDir, f), 'utf8').replace(/^---[\s\S]*?\n---\n/, '')
    }
  }
  const occurrences = (needle: string) => {
    if (!needle) return 0
    let n = 0
    for (let i = corpus.indexOf(needle); i !== -1; i = corpus.indexOf(needle, i + needle.length)) n++
    return n
  }
  const rows = terms.map(t => {
    const forms = t.term.split(/\s*&\s*/).map(f => f.trim()).filter(f => /\p{Script=Han}/u.test(f))
    return { ...t, hits: forms.reduce((sum, f) => sum + occurrences(f), 0) }
  })
  const binding = rows.filter(r => r.hits > 0).sort((a, b) => b.hits - a.hits)

  const md = [
    '# The locks — what the Tao Te Ching glossary already settles for this book',
    '',
    `*Generated by \`pnpm xenso:import-iching\` on ${TODAY}. \`terms.yaml\` beside this file is vendored verbatim from`,
    '[shalomormsby/taoteching](https://github.com/shalomormsby/taoteching) `glossary/terms.yaml`, which is itself generated',
    'from the frontmatter of that project\'s glossary entries. **Never edit either by hand** — fix it there, re-run here.*',
    '',
    `**${terms.length} locked terms in the glossary. ${binding.length} of them occur in the Zhouyi base text.**`,
    '',
    'A lock is not advice. Where one of these characters appears in a hexagram name, a judgment or a line text, the',
    'English is already decided, and a rendering that reaches for the forbidden word is a defect rather than a preference.',
    'This is the mechanism that makes drift between the two projects impossible rather than merely discouraged.',
    '',
    '| Character | Pinyin | Locked to | Forbidden | Occurrences in 周易 |',
    '|---|---|---|---|---|',
    ...binding.map(r => `| ${r.term} | ${r.pinyin} | ${r.render} | ${(r.forbidden ?? []).join(', ') || '—'} | ${r.hits} |`),
    '',
    '## What does not reach',
    '',
    `The remaining ${rows.length - binding.length} locked terms — ${rows.filter(r => r.hits === 0).map(r => r.term).join('、')} — do not occur in the base text.`,
    'They still bind any commentary rendered here, and they bind the prose around a rendering.',
    '',
  ].join('\n')
  writeFileSync(join(out, 'README.md'), md)

  pass(`${terms.length} locked terms vendored; ${binding.length} occur in the Zhouyi`)
  console.log(`  → knowledge/iching/sources/locks/`)
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// de Harlez 1889 — the second witness, and the one that disagrees.
//
// Charles de Harlez of Louvain published his Yih-king in French in 1889, and
// his preface opens by denying the premise Legge translates from: that the book
// is a divination manual at all. "Le Yih-king n'était point ce livre de
// divination bizarre … que certains lettrés de la Chine ont jadis présenté à
// leurs concitoyens." He reads it as an older, soberer text that the later
// literati turned into an oracle.
//
// That is the *other* side of the fork this project's deepest open question
// sits on — 貞, 亨 and 孚 — and it is why he is worth importing even though he
// is in French. Being in French is also, for this purpose, a feature: a source
// in another language cannot leak a phrase into an English rendering.
//
// One caution, and it is a real one: his subtitle is "TEXTE PRIMITIF RÉTABLI".
// He reorders and emends to recover what he believes the original was. So he is
// a *reading*, never a witness to the received text. sources/zhouyi/ is the
// witness; this is an argument about it.
// ─────────────────────────────────────────────────────────────────────────────

const HARLEZ_ITEM = 'yihking00harl'

/**
 * The scan spaces roman numerals apart and confuses I with H and with n —
 * "Koua XL VI.", "Koua XXVIH.", "Koua Vin.", "Koua LXIH 3." Decoding is
 * tolerant, and anything that will not decode canonically returns null rather
 * than guessing: the sequence position covers it, and the disagreement is
 * reported.
 */
function decodeKoua(raw: string): number | null {
  const s = raw.toUpperCase().replace(/[^IVXLHN]/g, '').replace(/[HN]/g, 'II')
  const n = ROMAN.indexOf(s)
  return n > 0 ? n : null
}

type Harlez = {
  name: string
  gloss: string
  judgment: string
  paragraphs: string[]
  commentary: string[]
  /** true when the line texts were found by ordinal run because the scan lost the "Texte II." heading */
  recovered: boolean
}

/**
 * Where his translation stops and his own apparatus starts. `Com. I` and
 * `Com. II` are his renderings of 彖傳 and 象傳; `Symbolisme` and `Note` are his
 * textual criticism, and often the most interesting thing on the page — the
 * note under hexagram 1 ends "Ceci est une interpolation." All of it is kept,
 * in its own section, because a reference base that silently drops the
 * commentator's reasoning is worth much less than one that labels it.
 */
const HARLEZ_APPARATUS = /^(Com\.\s*I|Symbolisme|Note\s*[.—–-]|Explication\s+de\s+l)/i

/**
 * His footnotes are numbered without a period — "1 Termes philosophiques …" —
 * while his line texts are numbered with one — "1. Le dragon caché …". On this
 * page that single character separates the translation from the apparatus far
 * more reliably than the line-width test used for Legge.
 */
function parseHarlezBlock(block: string): Harlez {
  const paras = block
    .split(/\n\s*\n/)
    .map(p => p.split('\n').map(l => l.trim()).filter(Boolean))
    .filter(p => p.length)
    .filter(p => !p.every(l => /^\d{1,3}$/.test(l) || /^LE\s+YIH[-\s]?K[I1U]NG\.?$/i.test(l)))
    .map(p => ({ text: joinOcrLines(p), footnote: /^\d+\s+[^.\d]/.test(p[0]) }))
    .filter(p => !p.footnote)
    .map(p => p.text)

  // The name and de Harlez's own one-line gloss of it. The hexagram figure sits
  // before the name and comes through the scanner as punctuation noise.
  let name = ''
  let gloss = ''
  const first = paras.find(p => !/^Texte/i.test(p) && p.includes(':'))
  if (first) {
    // The hexagram figure sits before the name and the scanner reads it as
    // stray marks, sometimes as a lone capital: "B Tsieh", "W Su".
    const cleaned = first.replace(/^[^A-Za-zÀ-ÿ]+/, '').replace(/^[A-Z]\s+(?=[A-ZÀ-Ü])/, '')
    const at = cleaned.indexOf(':')
    name = cleaned.slice(0, at).trim()
    gloss = cleaned.slice(at + 1).trim()
  }

  const body = paras.filter(p => !first || p !== first)

  // His sections do not run in a fixed order. Hexagram 1 is Texte I, Texte II,
  // Com. I; hexagram 6 is Texte I, Com. I, Symbolisme, Texte II. And the
  // scanner routinely folds a marker into the tail of the paragraph before it.
  // So the block is walked marker by marker rather than cut at a boundary.
  const MARKER =
    /(Texte\s+(II|IL|Il|I1|11|ll|IH|H|I|1)\s*[\dLlIi]?\s*\.?\s*[—–-]|Com\.\s*(?:II|IL|I1|11|[IÏïi1])\s*\d?\s*\.?\s*[—–-]|Symbolisme\s*\.?\s*[—–-]|Note\s*\.?\s*[—–-]|Explication\s+de\s+l[’'])/g

  const judgmentParts: string[] = []
  const linesRaw: string[] = []
  let commentary: string[] = []

  // Starts in `judgment`, not in a null state: hexagram 40 prints no "Texte I."
  // at all, and anything before the first marker is his judgment. Discarding it
  // for want of a label would lose the text silently.
  let mode: 'judgment' | 'lines' | 'apparatus' = 'judgment'

  // He interleaves. Hexagram 50 runs: Texte II, line 1, Com. II, Note, line 2,
  // line 3 … so an apparatus marker does not end the line texts, it interrupts
  // them. Once the lines have started, the next expected ordinal resumes them
  // wherever it appears — which is the only signal that survives the layout.
  let sawLines = false
  let nextOrdinal = 1

  const push = (text: string) => {
    let t = text.trim()
    if (!t) return

    if (mode === 'apparatus' && sawLines) {
      const at = t.search(new RegExp(`(^|\\s)${nextOrdinal}\\.\\s+[A-ZÀ-Ü(«]`))
      if (at >= 0) {
        const head = t.slice(0, at).trim()
        if (head) commentary.push(head)
        t = t.slice(at).trim()
        mode = 'lines'
      }
    }

    if (mode === 'judgment') judgmentParts.push(t)
    else if (mode === 'apparatus') commentary.push(t)
    else {
      linesRaw.push(t)
      sawLines = true
      for (const m of t.matchAll(/(?:^|\s)(\d+)\.\s+[A-ZÀ-Ü(«]/g)) {
        nextOrdinal = Math.max(nextOrdinal, Number(m[1]) + 1)
      }
    }
  }

  const joined = body.join('\n')
  let at = 0
  for (const m of joined.matchAll(MARKER)) {
    push(joined.slice(at, m.index))
    const marker = m[0]
    if (/^Texte/i.test(marker)) {
      const numeral = (m[2] ?? '').toUpperCase().replace(/[L1]/g, 'I').replace(/H/g, 'II')
      mode = numeral.length >= 2 ? 'lines' : 'judgment'
      if (mode === 'lines') sawLines = true
    } else {
      mode = 'apparatus'
      commentary.push(marker.trim())
    }
    at = m.index! + marker.length
  }
  push(joined.slice(at))

  // The line numbers run on inside a single OCR line, so the split happens
  // inside the text as well as between paragraphs.
  const paragraphs: string[] = []
  for (const chunk of linesRaw) {
    for (const piece of chunk.split(/(?=(?:^|\s)\d+\.\s+[A-ZÀ-Ü(])/)) {
      const t = piece.trim()
      if (!t) continue
      if (/^\d+\.\s/.test(t)) paragraphs.push(t)
      else if (paragraphs.length) paragraphs[paragraphs.length - 1] += ' ' + t
      else paragraphs.push(t)
    }
  }

  const tidy = (a: string[]) => a.map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean)
  let judgment = tidy(judgmentParts).join(' ')

  // Hexagrams 49, 59 and 62 lost their "Texte II." heading to the scanner
  // outright, so nothing marked the line texts off and they were filed as
  // commentary. They are still recognisable without the heading: three or more
  // ascending ordinals in a row is a line-text run and not prose. Recovering
  // them on that rule is a guess about the layout, never about the words, and
  // it beats filing five line texts under "his textual notes".
  let recovered = false
  if (!paragraphs.length) {
    const marks = [...joined.matchAll(/(?:^|\s)(\d)\.\s+[A-ZÀ-Ü(«]/g)]
    let runStart = -1
    for (let i = 0; i + 2 < marks.length; i++) {
      const [a, b, c] = [marks[i], marks[i + 1], marks[i + 2]].map(m => Number(m[1]))
      if (b === a + 1 && c === b + 1) { runStart = marks[i].index!; break }
    }
    if (runStart > 0) {
      recovered = true
      const region = joined.slice(runStart)
      for (const piece of region.split(/(?=(?:^|\s)\d+\.\s+[A-ZÀ-Ü(«])/)) {
        const t = piece.trim()
        if (!t) continue
        if (/^\d+\.\s/.test(t)) paragraphs.push(t)
        else if (paragraphs.length) paragraphs[paragraphs.length - 1] += ' ' + t
      }
      // Anything now inside the recovered run must not also stand as commentary.
      const inRun = (c: string) => region.includes(c.slice(0, Math.min(60, c.length)))
      commentary = commentary.filter(c => !inRun(c))
    }
  }

  return { name, gloss, judgment, paragraphs: tidy(paragraphs), commentary: tidy(commentary), recovered }
}

async function importHarlez() {
  console.log('\nLe Yih-king — de Harlez 1889  ·  the witness that denies the premise')
  const out = join(SOURCES, 'harlez-1889')
  mkdirSync(out, { recursive: true })

  const full = await archiveText(HARLEZ_ITEM, `${HARLEZ_ITEM}_djvu.txt`)

  const heads = [...full.matchAll(/^[ \t]*Koua\s+([A-Za-z][A-Za-z .]{0,12}?)\s*\d?\.?\s*$/gm)]
    .filter(m => m[0].trim().length < 22)

  if (heads.length !== 64) {
    fail(`found ${heads.length} Koua headings in the scan, expected 64 — assignment by position is unsafe, refusing to write`)
    return
  }
  pass('64 Koua headings found, in document order')

  // The numerals are an independent check on the ordering, not the ordering
  // itself. Where one decodes it must agree with its position; where the
  // scanner mangled it past recovery, the position stands and it is reported.
  let decoded = 0
  const unreadable: number[] = []
  heads.forEach((m, i) => {
    const n = decodeKoua(m[1])
    if (n === null) unreadable.push(i + 1)
    else if (n !== i + 1) fail(`the ${i + 1}th Koua heading reads "${m[1].trim()}" — decodes to ${n}`)
    else decoded++
  })
  pass(`${decoded} of 64 numerals decode and agree with their position`)
  if (unreadable.length) {
    console.log(`  · numeral too mangled to decode, position used instead: ${unreadable.map(i => `${i} ("${heads[i - 1][1].trim()}")`).join(', ')}`)
  }

  let written = 0
  const thin: number[] = []
  const recovered: number[] = []
  for (let n = 1; n <= 64; n++) {
    const start = heads[n - 1].index! + heads[n - 1][0].length
    const end = n < 64 ? heads[n].index! : Math.min(start + 14000, full.length)
    const h = parseHarlezBlock(full.slice(start, end))
    if (!h.judgment || h.paragraphs.length < 3) thin.push(n)
    if (h.recovered) recovered.push(n)
    writeFileSync(join(out, `${String(n).padStart(2, '0')}.md`), harlezFile(n, h))
    written++
  }
  if (thin.length) console.log(`  · thin extraction, check against the scan: ${thin.join(', ')}`)
  else pass('every hexagram yielded a judgment and its line texts')
  if (recovered.length) {
    console.log(`  · "Texte II." heading lost in the scan; line texts recovered by ordinal run: ${recovered.join(', ')}`)
    console.log('    Flagged in those files as `recovered_by:`.')
  }
  console.log(`  → knowledge/iching/sources/harlez-1889/01.md … 64.md  (${written} files)`)
}

function harlezFile(n: number, h: Harlez): string {
  const hex = HEX[n - 1]
  const fm = [
    '---',
    'work: "Yih-king: texte primitif rétabli, traduit et commenté"',
    'translator: "Charles de Harlez"',
    'series: "Mémoires de l\'Académie royale des sciences, des lettres et des beaux-arts de Belgique, t. XLVII"',
    'publisher: "F. Hayez, Bruxelles"',
    'year: 1889',
    'language: "fr"',
    `hexagram: ${n}`,
    `name: ${yamlString(hex.chinese)}`,
    `harlez_name: ${yamlString(h.name)}`,
    'transcription: "machine OCR of the 1889 printing, unproofread"',
    `obtained: "https://archive.org/details/${HARLEZ_ITEM}"`,
    `paragraphs: ${h.paragraphs.length}`,
    `commentary_paragraphs: ${h.commentary.length}`,
    ...(h.recovered
      ? ['recovered_by: "ordinal run — the scan lost this hexagram\'s \'Texte II.\' heading, so the line texts were found by their numbering"']
      : []),
    'editorial_notes: "his page footnotes are not vendored; his Com. I / Com. II / Note are, in their own section"',
    'rights: "public domain by age; first published 1889"',
    'standing: "a reading, never a witness — his text is reconstructed. See ../../method.md"',
    `transcribed: ${TODAY}`,
    '---',
    '',
  ].join('\n')

  const body = [
    `# Hexagram ${n} · ${hex.chinese} — de Harlez 1889`,
    '',
    '> **His subtitle is *texte primitif rétabli* — the primitive text restored.** He reorders and',
    '> emends toward what he believed the original was, and he denies outright that the book began',
    '> as a manual of divination. Read him as the argument against Legge\'s premise, not as a text.',
    '',
    ...(h.name || h.gloss ? [`**${h.name}** — ${h.gloss}`, ''] : []),
    '## Texte I — the judgment',
    '',
    h.judgment || '*(not extracted — check the scan)*',
    '',
    '## Texte II — the lines',
    '',
    ...h.paragraphs.flatMap(p => [p, '']),
    ...(h.commentary.length
      ? ['## Com. I / Com. II — his reading of the Wings, and his textual notes', '', ...h.commentary.flatMap(p => [p, ''])]
      : []),
  ]
  return fm + body.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

// ─────────────────────────────────────────────────────────────────────────────
// McClatchie 1876 — ingest and survey.
//
// The only digitisation is HathiTrust's, of a 1973 Ch'eng Wen facsimile, and
// babel.hathitrust.org sits behind a Cloudflare challenge no script can pass.
// So the text has to arrive by hand — see scripts/xenso/harvest-hathitrust.js.
//
// This stage does not parse into hexagrams, and that is deliberate. A parser
// written against a text nobody has read is a guess wearing a uniform; the
// other three importers were each built by looking at the source first. So this
// ingests whatever you have, normalises it, caches it, and prints what it can
// see — heading candidates, page count, and whether the Chinese came through.
// The hexagram parser gets written from that report.
// ─────────────────────────────────────────────────────────────────────────────

function textFromPdf(path: string): string {
  const { execFileSync } = require('node:child_process') as typeof import('node:child_process')
  try {
    return execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', path, '-'], {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    })
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      throw new Error(
        'pdftotext is not installed, and it is the only thing here that reads a PDF.\n' +
          '    Install it with:  brew install poppler\n' +
          '    Or OCR the scan — see scripts/xenso/ocr-pdf.swift — and pass the .txt.',
      )
    }
    throw e
  }
}

// ── page handling ────────────────────────────────────────────────────────────

type Page = { seq: number; conf: number; body: string }

function mcPages(text: string): Page[] {
  const out: Page[] = []
  const re = /\f\[seq=(\d+)(?: conf=([\d.]+))?\]\n/g
  const marks = [...text.matchAll(re)]
  marks.forEach((m, i) => {
    const start = m.index! + m[0].length
    const end = i + 1 < marks.length ? marks[i + 1].index! : text.length
    out.push({ seq: Number(m[1]), conf: Number(m[2] ?? 0), body: text.slice(start, end) })
  })
  return out
}

/**
 * The Chinese pages carry the running head "CHINESE TEXT." and nothing else the
 * scanner could read — the body is vertical columnar type, which Vision does not
 * do. The head itself OCRs every which way ("MININE TENT", "CININE TEXT"), so
 * the test is deliberately loose.
 */
function isChinesePage(body: string): boolean {
  return /C[HI1lN]{2,4}[NM][EI1]?[SN]E?\s+TE.T|MININE\s+TENT|CININE|^\s*TEAT\s*$/im.test(body)
}

const GOOGLE = /D[ig1íğl]{1,4}[il1]?[tz]{1,3}[ei]?d?\s+by\s*Google|by\s+Google\s*$/i

/** Running heads, folio numbers and the scanner's own watermark. None of it is text. */
function stripChrome(body: string, headingLine: string | null): string[] {
  return body
    .split('\n')
    .map(l => l.replace(/\s+$/, ''))
    .filter(l => l.trim())
    .filter(l => !GOOGLE.test(l))
    .filter(l => !/^\s*[\dIilvxVXG.,;:•\-—'"]{1,8}\s*$/.test(l))            // folio numbers and specks
    .filter(l => !/^\s*[\dIilG]{0,3}[.,]?\s*(THE|TRE|TIB|THF)\b.{0,28}$/i.test(l) || l === headingLine)
    .filter(l => !/^\s*(APPENDIX|PLATES|PREFACE|INTRODUCT)/i.test(l))
}

/**
 * Footnotes are set in small type, so a footnote line simply fits more
 * characters than a body line does — on these pages the split is clean, with
 * body lines running to about 60 and notes to 75 and beyond. The notes are also
 * where the OCR degrades worst, which is a second reason not to carry them.
 */
const MC_BODY_WIDTH = 68

/**
 * One page of body text, as a single run, with the footnotes taken off.
 *
 * The split is clean because the notes are set in small type: across the
 * translated body the 95th-percentile line is 62 characters and the 97th is 77,
 * with almost nothing in between. Footnotes also always sit at the foot, so the
 * first over-wide line marks where they start and everything below it goes —
 * including a note's own short last line, which a per-line width test would keep.
 */
function mcPageBody(page: Page, headings: Map<number, string>): string {
  const head = headings.get(page.seq) ?? null
  const lines = stripChrome(page.body, head).filter(l => l !== head)
  let cut = lines.length
  for (let i = 3; i < lines.length; i++) {
    if (lines[i].length > MC_BODY_WIDTH) { cut = i; break }
  }
  return joinOcrLines(lines.slice(0, cut))
}

function mcBodyParagraphs(pages: Page[], headings: Map<number, string>): string[] {
  return pages.map(p => mcPageBody(p, headings)).filter(Boolean)
}

/**
 * The shape of a section, recovered from McClatchie's own labels rather than
 * from his paragraph numbers.
 *
 * The numbers are the worst-scanned thing on the page — "4." comes back as "1.",
 * "5." as "ă.", "7." as "T." — but the labels beside them are words, and words
 * survive: he names every line "First-Nine", "Second-Six", "Topmost-Nine", and
 * introduces the two commentaries as "Wăn Wang says" (彖傳) and "Chow Kung says"
 * (大象傳, and again 小象 under each line). Splitting on those gives a section that
 * is labelled rather than merely numbered, and it yields a real check: six line
 * paragraphs, or seven for hexagrams 1 and 2.
 */
/**
 * A line paragraph is headed by its position and its polarity, hyphenated:
 * "First-Nine.", "Second-Six.", "Topmost-Nine." The **hyphen is what makes the
 * label findable** — "the number Nine" and "these Six" are prose and are not
 * hyphenated, while every real label is. That one character does more work here
 * than any amount of tolerance in the ordinal itself.
 */
const MC_LINE = /([A-Za-z'’ıl]{3,10})[-—–]\s?(N[il1][nu][eco]?|S[il1][xs]|Nix)\b/gi

/**
 * Which of the six positions a scanned ordinal is. The forms in this scan run
 * from "First" through "Sccond", "Thirl", "Fuurth", "Fiftlı", "Sixtli" to
 * "Seemud" and "Breal", so the test is on stems rather than on words, ordered so
 * that Sixth is decided before the catch-all for Second — both begin with S.
 * An ordinal that matches nothing returns -1 and takes whatever position is next
 * due, which is right: the hyphen already established that it is a label.
 */
function mcPosition(token: string): number {
  const t = token.toLowerCase()
  if (/ixt|opm/.test(t)) return 5
  if (/ift|ilth|ive/.test(t)) return 4
  if (/our|umt|oul|uurt|outl/.test(t)) return 3
  if (/hir|hre|hin|hril/.test(t)) return 2
  if (/irst/.test(t)) return 0
  if (/^[sab]/.test(t)) return 1
  return -1
}

// "Wăn Wang says", as the scanner has it: "Win Wang says", "Wãu Wang snys",
// "Włn Wing says", "Win Worg says". He prints the attribution on most sections
// but not all, so a section without one is not a parse failure — its 彖 simply
// stays inside the judgment, and `sections:` in the frontmatter says so.
const MC_TUAN = /W[aăäãeiouïłĭ]{1,2}[unm]?\s+W[aioe][nrg]{0,2}[gq]?\s+s[auiynv]{1,3}[ys]{0,2}\s*[:;]/i
// "Chow Kung says", and what the scanner makes of it: "Chuw Kung sayy",
// "('hun Kung siys", "Chow Kung say's". The initial consonant is sometimes gone
// altogether, so only "Kung" is required to be intact.
const MC_XIANG = /[('’]{0,2}[CGco0]?h?[o0u][wun]?\s*Kung\s+s[aáiy]['’]?[ys]{0,2}/i

type McSection = { judgment: string; tuan: string; daxiang: string; lines: { label: string; position: number; text: string }[] }

function mcSection(run: string): McSection {
  // He repeats a line's own label inside its 小象 — "Chow Kung says:—The
  // First-Six is observing in a childish fashion" — so the labels cannot simply
  // be counted. The positions run First, Second, Third, Fourth, Fifth, Sixth in
  // that order and never out of it, so a match is taken only when it is the next
  // position due. A repetition of the current one is commentary and is skipped.
  const lineMarks: { at: number; label: string; position: number }[] = []
  let expect = 0
  for (const m of run.matchAll(MC_LINE)) {
    if (expect > 5) break
    const guess = mcPosition(m[1])
    const position = guess < 0 ? expect : guess
    // A label earlier than the one due is the 小象 repeating its own line's name.
    // A label later than due means the one between was lost to the scanner, and
    // skipping to it keeps the rest of the section rather than discarding it.
    if (position < expect) continue
    lineMarks.push({ at: m.index!, label: `${m[1]}-${m[2]}`, position })
    expect = position + 1
  }
  const firstLine = lineMarks.length ? lineMarks[0].at : run.length

  const head = run.slice(0, firstLine)
  const tuanAt = head.search(MC_TUAN)
  const xiangAt = tuanAt >= 0 ? head.slice(tuanAt).search(MC_XIANG) : head.search(MC_XIANG)
  const xiangAbs = xiangAt < 0 ? -1 : (tuanAt >= 0 ? tuanAt + xiangAt : xiangAt)

  const judgment = head.slice(0, tuanAt >= 0 ? tuanAt : xiangAbs >= 0 ? xiangAbs : head.length)
  const tuan = tuanAt >= 0 ? head.slice(tuanAt, xiangAbs >= 0 ? xiangAbs : head.length) : ''
  const daxiang = xiangAbs >= 0 ? head.slice(xiangAbs) : ''

  // Every block ends carrying the *next* paragraph's number, orphaned in front
  // of a label the splitter has already moved past. It belongs to neither block.
  const tidy = (x: string) =>
    x
      .replace(/^\s*[\dIlTăaGoO]{1,2}\s*[.,:]\s*/, '')
      .replace(/\s+[\dIlTăaGoOă]{1,2}\s*[.,]\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim()

  const lines = lineMarks.map((m, i) => ({
    label: m.label,
    position: m.position,
    text: tidy(run.slice(m.at, lineMarks[i + 1]?.at ?? run.length)),
  }))

  return { judgment: tidy(judgment), tuan: tidy(tuan), daxiang: tidy(daxiang), lines }
}

/**
 * McClatchie sets trigram figures inline in his English — "Cheerfulness (☱) with
 * submission (☷)" — and the scanner renders every one of them as a parenthesised
 * scrap of capitals: (E), (EE), (ET), (GE), (E=). They are marked rather than
 * guessed at. The hexagram's actual trigrams are in this project's own table and
 * go in the frontmatter, beside the sentence rather than inside it.
 */
const INLINE_FIGURE = /\(\s*[EGTIF=\s]{1,4}\)|\bE\s*=\s*\)/g

function markFigures(s: string): { text: string; count: number } {
  let count = 0
  const text = s.replace(INLINE_FIGURE, () => { count++; return '⟦trigram figure⟧' })
  return { text, count }
}

// ── section detection ────────────────────────────────────────────────────────

/**
 * Numerals on these pages are as likely to come back as letters: hexagram 7
 * reads "E.", 9 reads "De", 49 reads "4D", 16 reads "IG". The map is generous
 * because a misread is caught downstream by the monotone fit, where a wrong
 * number simply fails to fit and is discarded.
 */
const MC_DIGITS: Record<string, string> = {
  I: '1', l: '1', i: '1', J: '1', O: '0', o: '0', Q: '0', S: '5',
  G: '6', B: '8', Z: '2', T: '7', E: '7', D: '9', A: '4', t: '4',
}
const mcNumber = (raw: string): number | null => {
  const digits = [...raw].map(c => MC_DIGITS[c] ?? c).join('')
  return /^\d{1,2}$/.test(digits) ? Number(digits) : null
}

/**
 * "19. THE Lin DIAGRAM." — and every mangling of it the scanner produced:
 * "IG. THE Yu DIAGAN.", "11. FIA Tue DIAGRASe.", "De THE Serone Chih-DIAGRAS.",
 * "33. TRE I'UN DINODAN." The word THE is too damaged to require, so the test is
 * structural instead: a numeral, then at most four short tokens, on a short line
 * ending in something that was once "Diagram". Paragraph 1 of a section is a
 * sentence and never passes it.
 */
const MC_HEADING = /^\s*([\dIlioOSGBZJTEDQAt]{1,2})\s*[.,:;eo]?((?:\s+\S+){1,4})\s*$/
const MC_DIAGRAM = /AGRA|IAGR|GRAM|GRAN|GRAS|ORAS|RAMS?\b|ACKAN|[ÓÖ]RAM|aRAM|ODAN|ciaN|DIAG/i

/** The first numbered paragraph on a page, or null. Section openings restart at 1. */
function firstParagraphNumber(body: string): number | null {
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line || GOOGLE.test(line)) continue
    const m = /^[:;.\s]*([\dIlio]{1,2})\s*[.,]\s+\S/.exec(line)
    if (m) return mcNumber(m[1])
  }
  return null
}

/** The longest run of headings whose printed numbers ascend. A misread cannot join it. */
function monotoneAnchors<T>(items: T[], value: (t: T) => number): T[] {
  const tails: number[] = []
  const tailIdx: number[] = []
  const parent = new Array(items.length).fill(-1)
  items.forEach((it, i) => {
    const v = value(it)
    let lo = 0, hi = tails.length
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tails[mid] < v) lo = mid + 1; else hi = mid }
    if (lo > 0) parent[i] = tailIdx[lo - 1]
    tails[lo] = v
    tailIdx[lo] = i
  })
  const chain: number[] = []
  for (let k = tailIdx[tails.length - 1]; k !== -1; k = parent[k]) chain.push(k)
  return chain.reverse().map(i => items[i])
}

async function importMcClatchie() {
  console.log('\nMcClatchie 1876 — the first English I Ching')

  const at = args.indexOf('--from')
  const given = at >= 0 ? args[at + 1] : undefined
  const cached = join(CACHE, 'mcclatchie-1876-ocr.txt')
  const path = given ? resolve(process.cwd(), given) : cached
  if (!existsSync(path)) {
    fail(`no OCR text at ${path}`)
    console.log('    Produce it with scripts/xenso/ocr-pdf.swift, or pass --from <file>.')
    return
  }
  const raw = /\.pdf$/i.test(path) ? textFromPdf(path) : readFileSync(path, 'utf8')
  if (path !== cached) writeFileSync(cached, raw)

  const pages = mcPages(raw.replace(/\r\n?/g, '\n'))
  if (!pages.length) { fail('no page markers found in the OCR text'); return }

  // Book I and II are the sixty-four; Book III is the Great Treatise, Book IV
  // the Shuogua, and then the Order of the Diagrams and the Appendix. Each gets
  // its own range, because running "the body" to the end of the volume would
  // hand the last hexagram three Wings as if they were its line texts.
  const BODY_FROM = 30, BODY_TO = 327
  const SECTIONS: { slug: string; title: string; chinese: string; from: number; to: number; note: string }[] = [
    { slug: 'book-3-great-treatise', title: 'Book III — Commentary by Confucius', chinese: '繫辭傳',
      from: 328, to: 393,
      note: 'The Great Treatise, Wings 5 and 6. Vendored in Chinese at ../wings/xici-shang.md and xici-xia.md.' },
    { slug: 'book-4-treatise-on-the-diagrams', title: 'Book IV — A Treatise on the Diagrams', chinese: '說卦傳',
      from: 394, to: 405,
      note: 'The Shuogua, Wings 8 — the source of every trigram image, and so the text the eight trigrams/*.md files answer to. Chinese at ../wings/shuogua.md.' },
    { slug: 'the-order-of-the-diagrams', title: 'The Order of the Diagrams', chinese: '序卦傳',
      from: 406, to: 416,
      note: 'Wings 9 — the text\'s own account of why King Wen order runs as it does. Chinese at ../wings/xugua.md.' },
  ]
  const chinese = pages.filter(p => p.seq >= BODY_FROM && p.seq <= BODY_TO && isChinesePage(p.body))
  const english = pages.filter(p => p.seq >= BODY_FROM && p.seq <= BODY_TO && !isChinesePage(p.body))
  pass(`${pages.length} pages OCR'd — ${english.length} English, ${chinese.length} Chinese, in the translated body`)

  // Candidate section openings, and the heading line each one sits on.
  const headings = new Map<number, string>()
  type Cand = { seq: number; n: number | null; line: string }
  const cands: Cand[] = []
  for (const p of english) {
    const lines = p.body.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 4)
    for (const line of lines) {
      if (line.length > 48) continue
      const m = MC_HEADING.exec(line)
      if (!m || !MC_DIAGRAM.test(m[2])) continue
      headings.set(p.seq, line)
      cands.push({ seq: p.seq, n: mcNumber(m[1]), line })
      break
    }
  }

  // The sixty-four sections come out of the scan in order; what the scanner
  // damages is the printed number beside each one, not their sequence. So the
  // order assigns the hexagram and the printed number *checks* it — the reverse
  // of the usual arrangement, and the right way round for this book.
  //
  // Where two consecutive openings sit much further apart than the four-to-six
  // pages a section runs to, a heading was lost outright. Those pages are found
  // instead by the one thing every section does: its paragraph numbering starts
  // again at 1.
  const NORMAL_GAP = 7
  const opening: number[] = []
  for (let k = 0; k < cands.length; k++) {
    opening.push(cands[k].seq)
    const next = k + 1 < cands.length ? cands[k + 1].seq : null
    if (next === null || next - cands[k].seq <= NORMAL_GAP) continue
    for (const p of english) {
      if (p.seq <= cands[k].seq || p.seq >= next) continue
      if (headings.has(p.seq)) continue
      if (firstParagraphNumber(p.body) === 1) { opening.push(p.seq); break }
    }
  }
  opening.sort((a, b) => a - b)

  if (opening.length !== 64) {
    fail(`found ${opening.length} section openings, expected 64 — refusing to assign hexagrams by an order that is not the book's`)
    console.log(`    openings: ${opening.join(', ')}`)
    return
  }
  pass('64 section openings found, in page order')

  const anchored = new Map<number, number>(opening.map((seq, i) => [i + 1, seq]))
  const bySeq = new Map(cands.map(c => [c.seq, c]))
  const agree: number[] = []
  const misread: string[] = []
  const headless: number[] = []
  opening.forEach((seq, i) => {
    const c = bySeq.get(seq)
    if (!c) { headless.push(i + 1); return }
    if (c.n === i + 1) agree.push(i + 1)
    else misread.push(`${i + 1} (seq ${seq} prints "${c.line.slice(0, 24)}")`)
  })
  pass(`${agree.length} of 64 printed numbers agree with the page order`)
  if (misread.length) console.log(`  · number damaged in the scan, order stands: ${misread.join(', ')}`)
  if (headless.length) console.log(`  · no heading survived; found by its paragraph numbering restarting at 1: ${headless.join(', ')}`)
  const inferred = [...headless, ...misread.map(m => Number(m.split(' ')[0]))]

  // ── write the hexagram files ──────────────────────────────────────────────
  const out = join(SOURCES, 'mcclatchie-1876')
  mkdirSync(out, { recursive: true })

  const ordered = [...anchored.entries()].sort((a, b) => a[0] - b[0])
  let figureTotal = 0
  let tuanFound = 0
  let xiangFound = 0
  const thin: number[] = []
  const inventory: string[] = []

  for (let i = 0; i < ordered.length; i++) {
    const [n, startSeq] = ordered[i]
    const endSeq = i + 1 < ordered.length ? ordered[i + 1][1] - 1 : BODY_TO
    const own = english.filter(p => p.seq >= startSeq && p.seq <= endSeq)
    const cn = chinese.filter(p => p.seq >= startSeq && p.seq <= endSeq).map(p => p.seq)

    const run = own.map(p => mcPageBody(p, headings)).filter(Boolean).join(' ')
    const marked = markFigures(run)
    figureTotal += marked.count
    const sec = mcSection(marked.text)
    if (sec.lines.length !== 6 || !sec.judgment) thin.push(n)
    if (sec.tuan) tuanFound++
    if (sec.daxiang) xiangFound++

    inventory.push(`  - hexagram: ${n}\n    english: [${own.map(p => p.seq).join(', ')}]\n    chinese: [${cn.join(', ')}]`)
    writeFileSync(
      join(out, `${String(n).padStart(2, '0')}.md`),
      mcclatchieFile(n, startSeq, own.map(p => p.seq), cn, headings.get(startSeq) ?? '', sec, inferred.includes(n)),
    )
  }

  const full = 64 - thin.length
  pass(`${full} of 64 yielded a judgment and all six line paragraphs`)
  if (thin.length) {
    console.log(`  · a line label lost to the scanner, so that line's text runs on into the one before it: ${thin.join(', ')}`)
    console.log('    Each such file carries `lines_found:` in its frontmatter. No text is lost, only a boundary.')
  }
  console.log(`  · 彖傳 split out in ${tuanFound} of 64, 大象傳 in ${xiangFound} — he does not print the attribution everywhere, and where it is missing the commentary stays inside the judgment. Each file's \`sections:\` says which it has.`)
  pass(`${figureTotal} inline trigram figures marked rather than left as OCR debris`)
  console.log(`  → knowledge/iching/sources/mcclatchie-1876/01.md … 64.md`)

  // ── the Wings, which McClatchie also translated ───────────────────────────
  for (const sec of SECTIONS) {
    const own = pages.filter(p => p.seq >= sec.from && p.seq <= sec.to && !isChinesePage(p.body))
    const paras = mcDivided(mcBodyParagraphs(own, new Map()).map(x => markFigures(x).text))
    writeFileSync(join(out, `${sec.slug}.md`), mcclatchieSection(sec, paras, own))
    console.log(`  ✓ ${sec.title} — ${paras.length} paragraphs, ${own.length} English pages`)
  }

  // ── the Appendix, which is the reason this book matters ───────────────────
  const appendix = pages.filter(p => p.seq >= 418 && p.seq <= 491 && !isChinesePage(p.body))
  const appParas = mcDivided(mcBodyParagraphs(appendix, new Map()).map(x => markFigures(x).text))
  writeFileSync(join(out, 'appendix.md'), mcclatchieAppendix(appParas, appendix))
  pass(`appendix vendored separately — ${appParas.length} paragraphs from ${appendix.length} pages`)

  // ── the plates, and the inventory of Chinese pages we did not transcribe ──
  writeFileSync(join(out, 'plates.yaml'), MC_PLATES)
  writeFileSync(
    join(out, 'chinese-pages.yaml'),
    [
      '# Which scan page holds the Chinese for which hexagram.',
      '#',
      '# The Chinese is NOT transcribed here and must not be. It is vertical',
      '# columnar type, which the OCR in scripts/xenso/ocr-pdf.swift cannot read,',
      '# and a transcription produced by a language model from these images would',
      '# be indistinguishable from that model\'s memory of the Yijing while wearing',
      '# the authority of an 1876 printing. sources/zhouyi/ is the text; this is a',
      '# pointer to a photograph of another witness, for checking it by eye.',
      '#',
      '# Open one with:',
      '#   swiftc -O scripts/xenso/page-ink.swift -o /tmp/page-ink -framework PDFKit -framework AppKit',
      '#   /tmp/page-ink knowledge/iching/sources/.cache/mcclatchie-1876.pdf --export <seq> --dir /tmp',
      '#',
      `# Generated ${TODAY}. ${chinese.length} Chinese pages across 64 hexagrams.`,
      '',
      'pages:',
      ...inventory,
      '',
    ].join('\n'),
  )
  console.log('  → appendix.md, plates.yaml, chinese-pages.yaml')
}

const MC_PLATES = `# The plates — McClatchie 1876, front matter (roman pages vii–x).
#
# Exported as PNG with:
#   swiftc -O scripts/xenso/page-ink.swift -o /tmp/page-ink -framework PDFKit -framework AppKit
#   /tmp/page-ink knowledge/iching/sources/.cache/mcclatchie-1876.pdf \\
#       --export 14,15,16,17 --dir knowledge/iching/sources/mcclatchie-1876/figures --scale 4
#
# The figures are kept out of git by default: they are photographs of a book we
# already hold, and the two that matter are formal objects this project can
# state as data, which is what \`encodes\` records.

plates:
  - id: plate-1
    seq: 14
    printed: vii
    title: "The Virtues of Khien, or Heaven and Man"
    subject: "元亨利貞 laid out as four cosmic phases"
    note: >
      Directly relevant to the open question on 元亨利貞. McClatchie renders the
      four as Origin, Luxuriance, Benefit and Completion, and this plate is his
      argument for reading them as a sequence in nature rather than as an
      oracle's verdict.
    encodes: null

  - id: plate-2
    seq: 15
    printed: viii
    title: "The Eight Diagrams — Fuh-He's Arrangement"
    subject: "先天八卦 — the Fu Xi, or Former Heaven, circular arrangement"
    note: >
      Each trigram with its compass direction and its place in the family —
      Father, Mother, Eldest son, Second daughter, and so on. The family
      relations are 說卦 chapter 10, which is vendored at ../wings/shuogua.md,
      so the plate can be checked against its own source.
    encodes:
      south: qian
      north: kun
      east: li
      west: kan

  - id: plate-3
    seq: 16
    printed: ix
    title: "The Eight Diagrams — Wăn Wang's Arrangement"
    subject: "後天八卦 — the King Wen, or Later Heaven, arrangement"
    note: >
      The other of the two standard arrangements. 說卦 chapter 5 — 帝出乎震，齊乎巽 —
      is its source, and is vendored at ../wings/shuogua.md.
    encodes:
      east: zhen
      southeast: xun
      south: li
      southwest: kun
      west: dui
      northwest: qian
      north: kan
      northeast: gen

  - id: plate-4
    seq: 17
    printed: x
    title: "The Five Colours"
    subject: "五色 against the compass points"
    encodes: null

# The errata on scan page 492 corrects a "PLATE VII", which is not in the front
# matter of this copy. Recorded rather than resolved: either the plate is absent
# from the 1973 reprint, or the errata is itself misnumbered.
`

function mcclatchieFile(
  n: number,
  startSeq: number,
  englishSeqs: number[],
  chineseSeqs: number[],
  heading: string,
  sec: McSection,
  inferred: boolean,
): string {
  const hex = HEX[n - 1]
  const fm = [
    '---',
    'work: "A translation of the Confucian 易經, or the \\"Classic of Change\\", with notes and appendix"',
    'translator: "Thomas McClatchie"',
    'publisher: "American Presbyterian Mission Press, Shanghai; Trübner & Co., London"',
    'year: 1876',
    'reprint: "Taipei: Ch\'eng Wen, 1973 — a facsimile, which is the copy digitised"',
    `hexagram: ${n}`,
    `name: ${yamlString(hex.chinese)}`,
    `trigrams: { lower: ${yamlString(hex.trigrams.lower)}, upper: ${yamlString(hex.trigrams.upper)} }`,
    `scan_heading: ${yamlString(heading)}`,
    `scan_pages: { english: [${englishSeqs.join(', ')}], chinese: [${chineseSeqs.join(', ')}] }`,
    ...(inferred
      ? ['located_by: "position between neighbouring sections — this hexagram\'s printed number did not survive the scan"']
      : []),
    `lines_found: ${sec.lines.length}`,
    `sections: [${['judgment', sec.tuan && 'tuan', sec.daxiang && 'daxiang', sec.lines.length && 'lines'].filter(Boolean).join(', ')}]`,
    'transcription: "machine OCR of the 1876 text via Apple Vision, unproofread"',
    'obtained: "https://babel.hathitrust.org/cgi/pt?id=mdp.39015085786880"',
    'editorial_notes: "footnotes not vendored; inline trigram figures marked ⟦trigram figure⟧"',
    'rights: "public domain by age; first published 1876"',
    'standing: "reference, not a source of English — see ../../method.md"',
    `transcribed: ${TODAY}`,
    '---',
    '',
  ].join('\n')

  const body = [
    `# Hexagram ${n} · ${hex.chinese} — McClatchie 1876`,
    '',
    '> He calls a hexagram a **Diagram**, renders 君子 as **"the Model Man"**, and attributes',
    '> 彖 to "Wăn Wang" and 象 to "Chow Kung". The Chinese faces this on scan ' +
      `page${chineseSeqs.length === 1 ? '' : 's'} ${chineseSeqs.join(', ') || '—'} and is not transcribed:` ,
    '> see `chinese-pages.yaml`.',
    '',
    '## The judgment',
    '',
    sec.judgment || '*(not extracted — check the scan)*',
    '',
    ...(sec.tuan ? ['## 彖傳 — "Wăn Wang says"', '', sec.tuan, ''] : []),
    ...(sec.daxiang ? ['## 大象傳 — "Chow Kung says"', '', sec.daxiang, ''] : []),
    '## The lines',
    '',
    ...sec.lines.flatMap(l => [`**${l.label}.** ${l.text.slice(l.label.length).replace(/^[.,\s]+/, '')}`, '']),
  ]
  return fm + body.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}


/**
 * The Wings and the Appendix carry their own divisions — "CHAPTER I.",
 * "NOTE A." — and the scanner keeps them, mangled but recognisable. Splitting on
 * them turns a wall of page-sized blocks into something citable, which for a
 * text nobody will read end-to-end is most of its usefulness.
 */
const MC_DIVISION = /\b(?:CH[IA][AI]?P[IT][EA]?R|CIIAPTER|CHAPIER)\s+([IVXL]{1,6}|[\dT]{1,2})\b[.,:]?|\bNOTE\s+([A-H])\b[.,:]?/gi

function mcDivided(paras: string[]): string[] {
  const run = paras.join('\n\n')
  const marks = [...run.matchAll(MC_DIVISION)]
  if (marks.length < 2) return paras
  const out: string[] = []
  const head = run.slice(0, marks[0].index!).trim()
  if (head) out.push(head)
  marks.forEach((m, i) => {
    const label = (m[1] ?? m[2] ?? '').toUpperCase()
    const kind = m[2] ? 'Note' : 'Chapter'
    const text = run.slice(m.index! + m[0].length, marks[i + 1]?.index ?? run.length).trim()
    out.push(`## ${kind} ${label}\n\n${text}`)
  })
  return out
}

function mcclatchieSection(
  sec: { slug: string; title: string; chinese: string; from: number; to: number; note: string },
  paras: string[],
  pages: Page[],
): string {
  const fm = [
    '---',
    'work: "A translation of the Confucian 易經"',
    'translator: "Thomas McClatchie"',
    'year: 1876',
    `section: ${yamlString(sec.title)}`,
    `chinese: ${yamlString(sec.chinese)}`,
    `scan_pages: [${sec.from}-${sec.to}]`,
    `paragraphs: ${paras.length}`,
    'transcription: "machine OCR via Apple Vision, unproofread"',
    'rights: "public domain by age; first published 1876"',
    'standing: "reference, not a source of English — see ../../method.md"',
    `transcribed: ${TODAY}`,
    '---',
    '',
    `# ${sec.title} — ${sec.chinese}`,
    '',
    `> ${sec.note}`,
    '>',
    '> McClatchie translated the Wings as well as the sixty-four, which none of the other',
    '> public-domain sources here does in English. Read for construal, never for a word.',
    '',
  ].join('\n')
  return fm + paras.join('\n\n') + '\n'
}

function mcclatchieAppendix(paras: string[], pages: Page[]): string {
  const fm = [
    '---',
    'work: "A translation of the Confucian 易經 — Appendix"',
    'author: "Thomas McClatchie"',
    'year: 1876',
    `scan_pages: [${pages[0]?.seq ?? 0}–${pages[pages.length - 1]?.seq ?? 0}]`,
    `paragraphs: ${paras.length}`,
    'transcription: "machine OCR via Apple Vision, unproofread"',
    'rights: "public domain by age; first published 1876"',
    'standing: "evidence for the overlay audit — not a translation"',
    `transcribed: ${TODAY}`,
    '---',
    '',
    '# Appendix — McClatchie 1876',
    '',
    '> **This is the overlay explaining itself, and it is why the book is worth having.**',
    '>',
    '> The Tao Te Ching project\'s overlay audit says the missionary translators "translated',
    '> with the only religious vocabulary they had, and that vocabulary carried a cosmology',
    '> inside it." McClatchie goes further: he argues the mapping is *correct*. Here he sets',
    '> the Yih King alongside Greek and Roman cosmogony — Θεός, Deus, the Demiurgus, Plato\'s',
    '> world-soul — and concludes that 神 "signifies… God, Gods" and "never means *Spirit* in',
    '> any Chinese book whatever, classical or otherwise."',
    '>',
    '> 神 is locked in the vendored glossary. Read this as the primary document of the thing',
    '> that lock exists to keep out, never as a reading of the text.',
    '',
  ].join('\n')
  return fm + paras.join('\n\n') + '\n'
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nimporting I Ching sources${FETCH ? ' (fetching)' : ' (from cache)'}`)
  mkdirSync(CACHE, { recursive: true })

  if (want('zhouyi')) await importZhouyi()
  if (want('wings')) await importWings()
  if (want('legge')) await importLegge()
  if (want('harlez')) await importHarlez()
  // Never part of an "all" run: it needs a file only a human can produce.
  if (ONLY === 'mcclatchie') await importMcClatchie()
  if (want('locks')) await importLocks()

  if (unknownTemplates.size) {
    console.log(`\n  · wikitext templates dropped, unrecognised: ${[...unknownTemplates].join(', ')}`)
    console.log('    Check each is display machinery and not text before ignoring this.')
  }

  console.log(failures === 0 ? '\n✓ import verified\n' : `\n✗ ${failures} failure(s)\n`)
  process.exit(failures ? 1 : 0)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
