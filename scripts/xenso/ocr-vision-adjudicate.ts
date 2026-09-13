/**
 * ocr-vision-adjudicate.ts — settle OCR disputes by looking at the scan.
 *
 * WHAT THIS IS ALLOWED TO DO, AND WHY THAT LINE IS WHERE IT IS.
 *
 * `principles/never-supply-what-the-source-withheld.md` forbids filling a gap
 * from a model's own knowledge of the text, and draws the line precisely:
 *
 *     Reading for verification is a different act, and it stays permitted …
 *     The claim "these agree" — falsifiable, and worth recording. The claim
 *     "here is what the page says" is a manufacture.
 *
 * So this asks a verification question and nothing else. For each disputed
 * position the model is shown the page and the two readings two OCR engines
 * produced, and must answer WHICH ONE THE PAGE BEARS — `tesseract`, `vision`,
 * or `neither`. It cannot return a third reading into the text. Whatever ends
 * up vendored was read off the page by an OCR engine, never composed.
 *
 * When it answers `neither`, it may say what the page appears to read. That is
 * "here is what the page says" and is therefore NOT substituted into the text:
 * it is written into `disputed.yaml` beside the source, attributed, for a human
 * to accept or reject. That is obligation 2 of the same principle — put what you
 * know beside the source, never inside it.
 *
 * RESOLUTION. The Messages API scales an image to 1568px on its long edge, which
 * would leave a whole page at ~24px of text height — unreadable for an 1876
 * letterpress facsimile. Each page therefore goes as two overlapping half-page
 * bands rendered at 600 DPI, arriving at ~44px.
 *
 * RUN
 *   pnpm xenso:ocr-adjudicate [--limit N] [--concurrency N] [--model ID] [--dry-run]
 *
 * Reads  .cache/mcclatchie-1876-unresolved.json  (written by xenso:import-iching)
 * Writes .cache/mcclatchie-1876-scan-calls.json  (read back by the same importer)
 *
 * Resumable: pages already in the output are skipped, and results are flushed
 * after every page, so an interrupted run loses at most one page of work.
 */

import Anthropic from '@anthropic-ai/sdk'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const CACHE = join(ROOT, 'knowledge/iching/sources/.cache')
const PDF = join(CACHE, 'mcclatchie-1876.pdf')
const UNRESOLVED = join(CACHE, 'mcclatchie-1876-unresolved.json')
const CALLS = join(CACHE, 'mcclatchie-1876-scan-calls.json')

type Unresolved = { seq: number; index: number; tesseract: string; vision: string; context: string }
type Call = { choice: 'tesseract' | 'vision' | 'neither'; reads?: string }

const args = process.argv.slice(2)
const flag = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const MODEL = flag('model', 'claude-opus-5')!
const LIMIT = Number(flag('limit', '0'))
const CONCURRENCY = Math.max(1, Number(flag('concurrency', '4')))
const DRY = args.includes('--dry-run')

/** Load ANTHROPIC_API_KEY out of .env without adding a dotenv dependency. */
function loadEnv() {
  if (process.env.ANTHROPIC_API_KEY) return
  const p = join(ROOT, '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/.exec(line)
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, '')
  }
}

let pageInk: string | null = null
function buildPageInk(): string {
  if (pageInk) return pageInk
  const out = join(mkdtempSync(join(tmpdir(), 'ocr-adj-')), 'page-ink')
  execFileSync('swiftc', ['-O', join(ROOT, 'scripts/xenso/page-ink.swift'), '-o', out,
    '-framework', 'PDFKit', '-framework', 'AppKit'], { stdio: 'pipe' })
  pageInk = out
  return out
}

/** Two overlapping half-page bands of one scan page, at 600 DPI, as base64 PNG. */
function bands(seq: number): string[] {
  const dir = mkdtempSync(join(tmpdir(), `page-${seq}-`))
  try {
    execFileSync(buildPageInk(), [PDF, '--export', String(seq), '--dir', dir, '--scale', '8.34', '--bands', '2'],
      { stdio: 'pipe' })
    return readdirSync(dir).sort()
      .filter(f => f.endsWith('.png'))
      .map(f => readFileSync(join(dir, f)).toString('base64'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const SYSTEM = `You are proofreading a scan of Thomas McClatchie's 1876 translation of the
Yih King (I Ching), printed in Shanghai and reproduced photographically in 1973. Two OCR
engines have read each page and disagree in places. Your job is to say which engine read
the page correctly.

Answer ONLY from what is visibly printed on the page image. You are not being asked what
the sentence ought to say, what the I Ching says, or what would read well — you are being
asked which of two candidate strings matches the ink.

For each numbered dispute, return exactly one of:
  "tesseract" — the page bears the tesseract reading
  "vision"    — the page bears the vision reading
  "neither"   — the page bears something else, or you cannot make it out

AN EXACT MATCH IS REQUIRED. Pick "tesseract" or "vision" only when that reading matches
the ink letter for letter. If one reading is merely CLOSER than the other, and neither is
exactly what is printed, the answer is "neither" — not the closer one. Both engines
misreading the same word is common, and saying so is the useful answer.

When you choose "neither" and can make the word out, put exactly what the page bears in
"reads". That is recorded as a note beside the text and is never substituted into it, so a
careful reading there is worth more than a confident guess above. Omit "reads" only if the
ink is genuinely illegible.

A wrong confident answer is far more costly here than an abstention: this text is vendored
as historical evidence, and an error that reads plausibly can never be found again.

Notes on this book: McClatchie writes "the Model Man" (君子), "Diagram" for hexagram,
"Luxuriance" (亨), and romanises as Khüen, Khwan, Wăn Wang, Chow Kung. Line labels are
hyphenated — "First-Nine", "Third-Six". Words like "undeflected" are his, not errors.`

const TOOL: Anthropic.Tool = {
  name: 'record_readings',
  description: 'Record which engine matches the page, for every disputed position.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['decisions'],
    properties: {
      decisions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['n', 'choice'],
          properties: {
            n: { type: 'integer', description: 'the dispute number as given' },
            choice: { type: 'string', enum: ['tesseract', 'vision', 'neither'] },
            reads: { type: 'string', description: 'only when choice is "neither" and the word is legible' },
          },
        },
      },
    },
  } as Anthropic.Tool.InputSchema,
}

let tokensIn = 0, tokensOut = 0

async function adjudicatePage(client: Anthropic, seq: number, items: Unresolved[]): Promise<Record<string, Call>> {
  const list = items.map((d, i) =>
    `${i + 1}. tesseract: "${d.tesseract}"   vision: "${d.vision}"\n   context: …${d.context}…`).join('\n')
  const images = bands(seq)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'record_readings' },
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: [
        ...images.map(data => ({
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: 'image/png' as const, data },
        })),
        { type: 'text', text: `Scan page ${seq}, shown as two overlapping halves (top, then bottom).\n\n`
          + `${items.length} disputed position(s):\n\n${list}\n\n`
          + `For each, say which reading the page bears.` },
      ],
    }],
  })

  tokensIn += response.usage.input_tokens
  tokensOut += response.usage.output_tokens

  const block = response.content.find(b => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') return {}
  const parsed = block.input as { decisions?: { n: number; choice: Call['choice']; reads?: string }[] }
  const out: Record<string, Call> = {}
  for (const d of parsed.decisions ?? []) {
    const item = items[d.n - 1]
    if (!item) continue
    out[`${item.seq}:${item.index}`] = d.reads ? { choice: d.choice, reads: d.reads } : { choice: d.choice }
  }
  return out
}

async function main() {
  loadEnv()
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set, and not found in .env')
    process.exit(1)
  }
  if (!existsSync(UNRESOLVED)) {
    console.error(`no ${UNRESOLVED} — run pnpm xenso:import-iching --only mcclatchie first`)
    process.exit(1)
  }

  const all = JSON.parse(readFileSync(UNRESOLVED, 'utf8')) as Unresolved[]
  const done: Record<string, Call> = existsSync(CALLS) ? JSON.parse(readFileSync(CALLS, 'utf8')) : {}

  const byPage = new Map<number, Unresolved[]>()
  for (const d of all) {
    if (done[`${d.seq}:${d.index}`]) continue
    if (!byPage.has(d.seq)) byPage.set(d.seq, [])
    byPage.get(d.seq)!.push(d)
  }
  let pages = [...byPage.keys()].sort((a, b) => a - b)
  if (LIMIT > 0) pages = pages.slice(0, LIMIT)

  console.log(`ocr-vision-adjudicate — ${MODEL}`)
  console.log(`  ${all.length} unresolved disputes, ${Object.keys(done).length} already called`)
  console.log(`  ${pages.length} page(s) to do, ${pages.reduce((t, s) => t + byPage.get(s)!.length, 0)} dispute(s)`)
  if (DRY) { console.log('  --dry-run: stopping before any API call'); return }

  const client = new Anthropic()
  let usedIn = 0, usedOut = 0, calls = 0
  const tally: Record<string, number> = { tesseract: 0, vision: 0, neither: 0 }

  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = pages.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(async seq => {
      try {
        return await adjudicatePage(client, seq, byPage.get(seq)!)
      } catch (err) {
        console.error(`  ! page ${seq}: ${(err as Error).message}`)
        return {}
      }
    }))
    for (const r of results) {
      for (const [k, v] of Object.entries(r)) { done[k] = v; tally[v.choice]++; calls++ }
    }
    writeFileSync(CALLS, JSON.stringify(done, null, 2))
    console.log(`  … ${Math.min(i + CONCURRENCY, pages.length)}/${pages.length} pages, ${calls} calls made`)
  }

  // Opus 5 list price, for a line in the run output rather than a surprise on a bill.
  const cost = tokensIn / 1e6 * 5 + tokensOut / 1e6 * 25
  console.log(`\n  tesseract ${tally.tesseract}   vision ${tally.vision}   neither ${tally.neither}`)
  console.log(`  ${(tokensIn / 1e3).toFixed(0)}K in / ${(tokensOut / 1e3).toFixed(0)}K out — about $${cost.toFixed(2)} at ${MODEL} list price`)
  console.log(`  → ${CALLS}`)
  console.log('  re-run pnpm xenso:import-iching --only mcclatchie to apply them')
}

main()
