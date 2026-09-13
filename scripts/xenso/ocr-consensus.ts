/**
 * ocr-consensus.ts — diff two or more independent OCR passes over the same scan
 * and report where they disagree.
 *
 * WHY. Apple Vision reports a mean confidence of 0.98 on the McClatchie pages
 * while getting roughly one word in eight wrong; its self-report is worthless as
 * a quality signal. Two engines that were trained separately are not worthless:
 * where Vision and Tesseract independently read the same word, the error rate on
 * this book measures at 2.8%, against 13.7% and 8.7% for either engine alone.
 *
 * So this does not vote, and it does not repair. It classifies — corroborated
 * text on one side, a finite list of spans that need a human eye on the other.
 * Choosing a reading is `never-supply-what-the-source-withheld`'s business and
 * belongs to a person looking at the scan, not to this file.
 *
 * RUN
 *   pnpm xenso:ocr-consensus primary=<file> other=<file> [other2=<file>] \
 *        [--out <file.json>] [--from N] [--to N]
 *
 * Each input is the `\f[seq=N conf=…]` page format that ocr-pdf.swift and
 * harvest-hathitrust.js both emit. The first witness is the primary — the text
 * that will be vendored — and every other witness is corroboration for it.
 */

import { readFileSync, writeFileSync } from 'node:fs'

type Witness = { name: string; pages: Map<number, string> }
type Token = { raw: string; norm: string; at: number }
/**
 * `word` — both engines read a word here and disagreed. This is the worklist.
 * `debris` — one engine saw only a scrap where the other saw nothing. Mostly
 *   McClatchie's inline trigram diagrams, which one engine renders as stray
 *   letters and dashes and the other skips; the importer marks them anyway.
 * `omission` — one engine read real words the other missed entirely.
 * `punct` — the same letters under different punctuation.
 */
type Kind = 'word' | 'debris' | 'omission' | 'punct'

/** The sentinels this file writes for "the other witness had nothing here". */
const ABSENT = /^⟨nothing⟩$/
const EXTRA = /^⟨extra⟩\s*/

const letters = (s: string) => s.replace(/[^a-zA-Z]/g, '')

function classify(readings: Record<string, string>): Kind {
  const vals = Object.values(readings).map(v => v.replace(EXTRA, ''))
  const present = vals.filter(v => v && !ABSENT.test(v))
  const absent = vals.length - present.length

  if (absent > 0) {
    // Nothing on one side. A scrap of two letters or less is diagram debris;
    // anything longer is a genuine omission and needs looking at.
    return present.every(v => letters(v).length <= 2) ? 'debris' : 'omission'
  }
  if (new Set(present.map(v => letters(v).toLowerCase())).size === 1) return 'punct'
  return 'word'
}

/** Splits an OCR file into pages on the form feed + `[seq=N]` marker. */
function parsePages(path: string): Map<number, string> {
  const raw = readFileSync(path, 'utf8')
  const pages = new Map<number, string>()
  for (const chunk of raw.split('\f')) {
    const m = /^\[seq=(\d+)[^\]]*\]/.exec(chunk)
    if (!m) continue
    pages.set(Number(m[1]), chunk.slice(m[0].length))
  }
  return pages
}

/**
 * Words only, with their position kept so a dispute can be quoted in context.
 * Comparison is on `norm` — case and surrounding punctuation are not the kind of
 * disagreement a proofreader needs a worklist for.
 */
function tokenize(text: string): Token[] {
  const out: Token[] = []
  const re = /[^\s]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const norm = m[0].toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    if (norm) out.push({ raw: m[0], norm, at: m.index })
  }
  return out
}

/**
 * Longest common subsequence over token streams, returned as difflib-style
 * opcodes. O(n·m); pages run to ~1500 tokens, so this is well inside budget.
 */
function opcodes(a: Token[], b: Token[]): [string, number, number, number, number][] {
  const n = a.length, m = b.length
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i].norm === b[j].norm ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops: [string, number, number, number, number][] = []
  let i = 0, j = 0
  const push = (tag: string, i1: number, i2: number, j1: number, j2: number) => {
    const last = ops[ops.length - 1]
    if (last && last[0] === tag) { last[2] = i2; last[4] = j2 } else ops.push([tag, i1, i2, j1, j2])
  }
  while (i < n && j < m) {
    if (a[i].norm === b[j].norm) { push('equal', i, i + 1, j, j + 1); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('replace', i, i + 1, j, j); i++ }
    else { push('replace', i, i, j, j + 1); j++ }
  }
  if (i < n || j < m) push('replace', i, n, j, m)
  return ops
}

function main() {
  const args = process.argv.slice(2)
  const witnesses: Witness[] = []
  let out = 'ocr-consensus.json'
  let from = 0, to = Number.MAX_SAFE_INTEGER
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--out') { out = args[++i]; continue }
    if (a === '--from') { from = Number(args[++i]); continue }
    if (a === '--to') { to = Number(args[++i]); continue }
    const eq = a.indexOf('=')
    if (eq < 0) { console.error(`unrecognised argument: ${a}`); process.exit(2) }
    witnesses.push({ name: a.slice(0, eq), pages: parsePages(a.slice(eq + 1)) })
  }
  if (witnesses.length < 2) {
    console.error('usage: ocr-consensus primary=<file> other=<file> [other2=<file>] [--out f.json] [--from N] [--to N]')
    process.exit(2)
  }

  const [primary, ...others] = witnesses
  const seqs = [...primary.pages.keys()].filter(s => s >= from && s <= to).sort((x, y) => x - y)

  let slots = 0, agreed = 0
  const byKind: Record<Kind, number> = { word: 0, debris: 0, omission: 0, punct: 0 }
  const report: Record<number, { disputed: { at: number; kind: Kind; context: string; readings: Record<string, string> }[] }> = {}

  for (const seq of seqs) {
    const pa = tokenize(primary.pages.get(seq)!)
    if (!pa.length) continue
    // A token is corroborated only if EVERY other witness read it the same way.
    const doubt = new Map<number, Record<string, string>>()
    let sawAny = false
    for (const w of others) {
      const text = w.pages.get(seq)
      if (text === undefined) continue
      sawAny = true
      const pb = tokenize(text)
      for (const [tag, i1, i2, j1, j2] of opcodes(pa, pb)) {
        if (tag === 'equal') continue
        for (let i = i1; i < i2; i++) {
          const rec = doubt.get(i) ?? {}
          rec[w.name] = pb.slice(j1, j2).map(t => t.raw).join(' ') || '⟨nothing⟩'
          doubt.set(i, rec)
        }
        if (i1 === i2) {
          // The other witness saw words here that the primary did not.
          const rec = doubt.get(i1) ?? {}
          rec[w.name] = `⟨extra⟩ ${pb.slice(j1, j2).map(t => t.raw).join(' ')}`
          doubt.set(i1, rec)
        }
      }
    }
    if (!sawAny) continue

    slots += pa.length
    agreed += pa.length - doubt.size
    const disputed = [...doubt.entries()].sort((x, y) => x[0] - y[0]).map(([i, readings]) => {
      const all = { [primary.name]: pa[i]?.raw ?? '⟨nothing⟩', ...readings }
      const kind = classify(all)
      byKind[kind]++
      return {
        at: i,
        kind,
        context: pa.slice(Math.max(0, i - 5), i + 6).map((t, k) =>
          k === Math.min(i, 5) ? `«${t.raw}»` : t.raw).join(' '),
        readings: all,
      }
    })
    if (disputed.length) report[seq] = { disputed }
  }

  const disputedTotal = slots - agreed
  const summary = {
    generated: new Date().toISOString().slice(0, 10),
    witnesses: witnesses.map(w => w.name),
    primary: primary.name,
    pages: seqs.length,
    tokens: slots,
    corroborated: agreed,
    disputed: disputedTotal,
    disputed_by_kind: byKind,
    corroborated_pct: slots ? +(100 * agreed / slots).toFixed(2) : 0,
    word_disputes_pct: slots ? +(100 * byKind.word / slots).toFixed(2) : 0,
  }
  writeFileSync(out, JSON.stringify({ summary, pages: report }, null, 2))

  console.log(`ocr-consensus — ${witnesses.map(w => w.name).join(' vs ')}`)
  console.log(`  pages compared : ${seqs.length}`)
  console.log(`  tokens         : ${slots}`)
  console.log(`  corroborated   : ${agreed} (${summary.corroborated_pct}%)`)
  console.log(`  disputed       : ${disputedTotal} across ${Object.keys(report).length} pages`)
  console.log(`    · word       : ${byKind.word} — both read a word and disagreed; the worklist`)
  console.log(`    · omission   : ${byKind.omission} — one engine missed real words the other found`)
  console.log(`    · debris     : ${byKind.debris} — a scrap against nothing, mostly inline trigram diagrams`)
  console.log(`    · punct      : ${byKind.punct} — same letters, different punctuation`)
  console.log(`  → ${out}`)
}

main()
