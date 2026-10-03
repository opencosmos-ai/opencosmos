#!/usr/bin/env tsx
/**
 * Verification for the Xensō `search_library` tool (lib/library-tool.ts).
 *
 * This repository has no test runner, so this follows the scripts/iching-check.ts
 * precedent: a script you run, that prints, and that exits non-zero when it should.
 *
 *   pnpm xenso:check-library          # offline: tool_result shaping and fail-soft paths
 *   pnpm xenso:check-library --live   # also one real query against Upstash Vector
 *                                     # (needs UPSTASH_VECTOR_REST_URL / _TOKEN)
 *
 * The contract checked offline: a search never throws, a failure of any kind
 * (bad input, index error, timeout) comes back as an is_error tool_result, and a
 * success carries formatRagChunks' citation tokens through verbatim.
 */

import { runLibrarySearch, LIBRARY_TOOL, LIBRARY_TOOL_NAME } from '../lib/library-tool'
import { searchLibrary, type RagChunk } from '../lib/rag'

let failures = 0
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`)
  if (!ok) {
    failures++
    if (detail !== undefined) console.log('     ', detail)
  }
}

const passage: RagChunk = {
  text: 'The highest good is like water.',
  source: 'knowledge/sources/tao-te-ching.md',
  chunk_id: 'knowledge/sources/tao-te-ching.md#chapter-8',
  title: 'Tao Te Ching',
  heading: 'Chapter 8',
  domain: 'philosophy',
  author: 'Laozi',
}
const quote: RagChunk = {
  text: 'The wound is the place where the Light enters you.',
  source: 'knowledge/quotes/rumi.yaml',
  title: 'Rumi',
  heading: 'wound-light',
  domain: 'quotes',
  chunk_type: 'quote',
  quote_id: 'wound-light',
  author: 'Rumi',
  provenance_status: 'attributed_unverified',
}

async function main() {
  check('tool name is search_library', LIBRARY_TOOL.name === LIBRARY_TOOL_NAME && LIBRARY_TOOL_NAME === 'search_library')
  check('query is the only required input', JSON.stringify(LIBRARY_TOOL.input_schema.required) === '["query"]')

  {
    let seen: [string, number | undefined] | null = null
    const { result, log } = await runLibrarySearch(
      { id: 'tu_1', input: { query: '  yielding as strength ', top_k: 2 } },
      async (q, k) => { seen = [q, k]; return [passage, quote] },
    )
    const content = typeof result.content === 'string' ? result.content : ''
    check('success: passes the trimmed query and top_k through', JSON.stringify(seen) === '["yielding as strength",2]', seen)
    check('success: not an error', !result.is_error)
    check('success: answers the right tool_use id', result.tool_use_id === 'tu_1')
    check('success: carries the [ref:] token verbatim', content.includes('[ref: knowledge/sources/tao-te-ching.md#chapter-8]'), content)
    check('success: carries the [quote:] token verbatim', content.includes('[quote: knowledge/quotes/rumi.yaml#wound-light]'), content)
    check('success: logs the chunk count', log.chunks === 2 && !log.error, log)
  }

  {
    const { result } = await runLibrarySearch({ id: 'tu_2', input: { query: 'x' } }, async () => [])
    check('empty: not an error, says nothing matched', !result.is_error && String(result.content).includes('No passages'))
  }

  {
    const { result, log } = await runLibrarySearch({ id: 'tu_3', input: { query: 'x' } }, async () => {
      throw new Error('UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN not configured')
    })
    check('index error: is_error, library unavailable', result.is_error === true && String(result.content).includes('unavailable'))
    check('index error: logged', !!log.error, log)
  }

  {
    const started = Date.now()
    const { result, log } = await runLibrarySearch(
      { id: 'tu_4', input: { query: 'x' } },
      () => new Promise<RagChunk[]>(() => {}), // never settles
      50,
    )
    check('timeout: resolves near the deadline', Date.now() - started < 1000)
    check('timeout: is_error with reason timeout', result.is_error === true && log.error === 'timeout', log)
  }

  for (const input of [{}, { query: '' }, { query: 42 }, null, 'nope']) {
    let called = false
    const { result } = await runLibrarySearch({ id: 'tu_5', input }, async () => { called = true; return [] })
    check(`invalid input ${JSON.stringify(input)}: is_error, search not run`, result.is_error === true && !called)
  }

  if (process.argv.includes('--live')) {
    const started = Date.now()
    try {
      const chunks = await searchLibrary('the Tao that can be told is not the eternal Tao', 3)
      console.log(`     live: ${chunks.length} chunks in ${Date.now() - started}ms`)
      for (const c of chunks) console.log(`       - ${c.title} / ${c.heading} (${c.chunk_id ?? c.quote_id})`)
      check('live: returns at most top_k chunks', chunks.length <= 3)
      check('live: returns no kaizen chunks', chunks.every(c => c.role !== 'kaizen'))
      check('live: returns something for a core text', chunks.length > 0)
    } catch (err) {
      check('live: query succeeded', false, err instanceof Error ? err.message : err)
    }
  }

  if (failures) {
    console.log(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('\nall checks passed')
}

main()
