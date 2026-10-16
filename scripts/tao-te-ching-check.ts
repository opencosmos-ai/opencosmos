#!/usr/bin/env tsx
/**
 * Verification for the Tao Te Ching reader (ADR 0020).
 *
 * This repository has no test runner, so this follows the iching-check.ts
 * precedent: a script you run, that prints, and that exits non-zero when it
 * should.
 *
 *   pnpm check:tao-te-ching
 *
 * What it guards, in order of what breaking it would cost:
 *
 *   1. Stored citations. Conversations hold `…taoism-tao-te-ching.md#twelve`
 *      (the old headings) and will hold `#chapter-12` and `#notes-on-chapter-12`. Every one of the 81 word
 *      forms, 81 numeric forms and 81 notes forms must land on its chapter, through all three
 *      callers of lib/corpus-href: the chat renderer (docHref), the
 *      constellation (nodeHref) and the landing page's fragment redirect.
 *   2. Discussion titles: `Ch 1` must never collect `Ch 12`.
 *   3. The export, when `pnpm content` has fetched it: chapters pair lines
 *      exactly where, and only where, their line counts agree.
 */

import fs from 'fs'
import path from 'path'
import {
  TAO_TE_CHING_BASE,
  TAO_TE_CHING_DOC,
  chapterWord,
  docHref,
  taoTeChingChapterFromAnchor,
} from '../lib/corpus-href'
import { nodeHref } from '../app/library/graph/nodeHref'
import { corpusHeadingFor, getChapter, getChapterTerms, titleNamesChapter, tokenize } from '../lib/tao-te-ching'

let failures = 0
let passes = 0
const fail = (m: string) => {
  console.log(`  ✗ ${m}`)
  failures++
}
const check = (label: string, ok: boolean, detail?: unknown) => {
  if (ok) passes++
  else fail(`${label}${detail === undefined ? '' : ` — got ${JSON.stringify(detail)}`}`)
}

// ── 1. Citations ──────────────────────────────────────────────────────────────

console.log('\ncitations')

// The words, as github-slugger made them from the old `## Twenty-One` headings.
const spot: Record<number, string> = {
  1: 'one', 12: 'twelve', 19: 'nineteen', 20: 'twenty', 21: 'twenty-one',
  40: 'forty', 44: 'forty-four', 70: 'seventy', 81: 'eighty-one',
}
for (const [n, word] of Object.entries(spot)) check(`chapterWord(${n}) is ${word}`, chapterWord(Number(n)) === word, chapterWord(Number(n)))

const words = new Set<string>()
for (let n = 1; n <= 81; n++) {
  const word = chapterWord(n)
  words.add(word)
  const want = `${TAO_TE_CHING_BASE}/${n}`
  check(`#${word} → /${n}`, docHref(`${TAO_TE_CHING_DOC}#${word}`) === want, docHref(`${TAO_TE_CHING_DOC}#${word}`))
  check(`#chapter-${n} → /${n}`, docHref(`${TAO_TE_CHING_DOC}#chapter-${n}`) === want)
  check(`#notes-on-chapter-${n} → /${n}#notes`, docHref(`${TAO_TE_CHING_DOC}#notes-on-chapter-${n}`) === `${want}#notes`)
  // The Feng–English file wrote `## Eighty-one`; slugs are lowercase either way.
  check(`#${word.toUpperCase()} → ${n}`, taoTeChingChapterFromAnchor(word.toUpperCase()) === n)
  const node = nodeHref(`${TAO_TE_CHING_DOC}#${word}`, 'section')
  check(`constellation section #${word} → /${n}`, node.kind === 'route' && node.href === want, node)
}
check('81 distinct words', words.size === 81, words.size)

for (const anchor of ['', 'curators-note', 'curator-s-note', 'intro', 'lao-tsu-and-taoism', 'eighty-two', 'chapter-0', 'chapter-82', 'notes-on-chapter-82', 'zero', 'one-hundred']) {
  const ref = anchor ? `${TAO_TE_CHING_DOC}#${anchor}` : TAO_TE_CHING_DOC
  check(`#${anchor || '(none)'} → the landing page`, docHref(ref) === TAO_TE_CHING_BASE, docHref(ref))
}
const work = nodeHref('sources/taoism-tao-te-ching', 'work')
check('constellation work node → the landing page', work.kind === 'route' && work.href === TAO_TE_CHING_BASE, work)

// Nothing else changes.
check('other documents keep their anchors',
  docHref('knowledge/sources/buddhism-the-dhammapada.md#1-choices') === '/library/sources/buddhism-the-dhammapada#1-choices')

// ── 2. Discussion titles ──────────────────────────────────────────────────────

console.log('discussion titles')
const titles: [string, number, boolean][] = [
  ['Ch 1 — the opening line', 1, true],
  ['Ch 12 — five colours', 1, false],
  ['Ch 12 — five colours', 12, true],
  ['Ch 1: 道 (dào — the Tao) as a verb', 1, true],
  ['Ch. 52 — Seeing the small', 52, true],
  ['Ch52: no space', 52, true],
  ['ch 6 — lowercase', 6, true],
  ['Ch 10–12 — a sweep', 10, true],
  ['Ch 10–12 — a sweep', 11, false],
  ['Chapter 1 — not the convention', 1, false],
  ['柔 (róu — soft): its own entry', 1, false],
  ['Fix Ch 1 typo', 1, false],
]
for (const [title, n, want] of titles) check(`"${title}" names ch ${n}: ${want}`, titleNamesChapter(title, n) === want)

// ── Pinyin pairing and Cosmo's heading ────────────────────────────────────────

console.log('pinyin and context')
const toks = tokenize('谷神不死，', 'Gǔ shén bù sǐ,')
check('one syllable per character, lowercased', JSON.stringify(toks.filter((t) => t.kind === 'han').map((t) => t.kind === 'han' && t.p)) === '["gǔ","shén","bù","sǐ"]', toks)
check('punctuation stays text', toks[toks.length - 1]?.kind === 'text')
const off = tokenize('道可道', 'Dào kě')
check('a count mismatch yields no reading, never a guess', off.every((t) => t.kind !== 'han' || t.p === null), off)
check('stopgap heading', corpusHeadingFor(21, '## One\n\n## Twenty-One\n') === 'Twenty-One')
check('generated heading wins', corpusHeadingFor(21, '## Chapter 21\n## Twenty-One\n') === 'Chapter 21')
check('no corpus → Chapter N', corpusHeadingFor(5, null) === 'Chapter 5')

// ── 3. The export ─────────────────────────────────────────────────────────────

const EXPORT = path.join(process.cwd(), '.content', 'taoteching', 'data', 'atlas-export.json')
if (!fs.existsSync(EXPORT)) {
  console.log('export\n  – skipped: run `pnpm content` first')
} else {
  console.log('export')
  const x = JSON.parse(fs.readFileSync(EXPORT, 'utf-8'))
  let exact = 0
  for (let n = 1; n <= 81; n++) {
    const ch = getChapter(n)!
    const verseCount = ch.stanzas.flat().length
    if (ch.exact) exact++
    check(`ch ${n} is exact iff its counts agree`, ch.exact === (verseCount === ch.lines.length), { exact: ch.exact, verse: verseCount, lines: ch.lines.length })
    check(`ch ${n} has verse and lines`, verseCount > 0 && ch.lines.length > 0)
    if (!ch.exact) check(`ch ${n} links nothing`, ch.lines.every((l) => l.verse.length === 0))
    check(`ch ${n}: every character has a panel`, ch.lines.every((l) => l.tokens.every((t) => t.kind !== 'han' || ch.chars[t.c])))
  }
  check('chapter 6, the ADR’s example, is not linked', getChapter(6)!.exact === false)
  const wei = Object.entries(x.lines as Record<string, [string, string]>).find(([, [zh]]) => zh.includes('為'))
  check('為 keeps the translation’s reading', wei !== undefined && getChapter(Number(wei[0].split('.')[0]))!.lines.some((l) => l.tokens.some((t) => t.kind === 'han' && t.c === '為' && t.p === 'wéi')))
  check('chapter 1 has the 道 (dào) entry among its terms', getChapterTerms(1).some((t) => t.slug === 'dao-道'))
  console.log(`  ${exact} of 81 chapters pair their lines exactly`)
}

console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures ? 1 : 0)
