/**
 * The `search_library` tool: deliberate retrieval from the OpenCosmos Library.
 *
 * Xensō skips the ambient top-8 injection /dialog gets on every turn (see the
 * comment on ragPromise in app/api/chat/route.ts) — its resource discipline is
 * one resource, at the moment of relevance, never a menu. This tool is the other
 * half of that decision: Cosmo reaches for the library only when a teaching,
 * text, or tradition is actually called for, with a query it writes itself.
 *
 * It is a custom (client) tool, executed by our server inside the chat route's
 * stream loop — the iOS app never sees a tool call, only one continuous text
 * stream.
 */

import type Anthropic from '@anthropic-ai/sdk'
import {
  searchLibrary,
  formatRagChunks,
  LIBRARY_SEARCH_DEFAULT_TOPK,
  LIBRARY_SEARCH_MAX_TOPK,
  type RagChunk,
} from '@/lib/rag'

export const LIBRARY_TOOL_NAME = 'search_library'

/** Same budget as the ambient retrieval race in the chat route. */
export const LIBRARY_SEARCH_TIMEOUT_MS = 4000

/** At most this many library searches answered per player turn. */
export const MAX_LIBRARY_SEARCHES_PER_TURN = 3

// Module-scope and never mutated: the tool definition is part of the cached
// request prefix (tools render before system), so it must be byte-identical
// across requests or every xenso turn rewrites the whole prefix.
export const LIBRARY_TOOL: Anthropic.Beta.Messages.BetaTool = {
  name: LIBRARY_TOOL_NAME,
  description:
    'Search the OpenCosmos Library — primary texts, scriptures, philosophical works, wiki syntheses, and attributed quotes — by meaning. ' +
    'Returns the most relevant passages, each with its title, author or tradition, and an exact citation token. ' +
    'Write a focused query naming the teaching, theme, or text you are looking for (for example "Taoist teaching on yielding as strength" or "Rumi on welcoming difficult guests"), not the player\'s words verbatim. ' +
    'Nothing from the library is in front of you unless you search; never quote it from memory as though you had.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What to look for, in natural language.',
      },
      top_k: {
        type: 'integer',
        minimum: 1,
        maximum: LIBRARY_SEARCH_MAX_TOPK,
        description: `How many passages to return (default ${LIBRARY_SEARCH_DEFAULT_TOPK}). Ask for few: you will offer at most one.`,
      },
    },
    required: ['query'],
  },
}

export type LibrarySearchLog = {
  query: string
  chunks: number
  ms: number
  error?: string
}

type Search = (query: string, topK?: number) => Promise<RagChunk[]>

/**
 * Run one `search_library` call and shape the tool_result. Never throws: a bad
 * input, a missing index, an Upstash error, or a timeout all come back as an
 * is_error result telling Cosmo the library is unavailable, so a failed search
 * costs the player a passage, never the reply.
 *
 * `search` is injectable for tests; production uses searchLibrary.
 */
export async function runLibrarySearch(
  toolUse: { id: string; input: unknown },
  search: Search = searchLibrary,
  timeoutMs: number = LIBRARY_SEARCH_TIMEOUT_MS,
): Promise<{ result: Anthropic.Beta.Messages.BetaToolResultBlockParam; log: LibrarySearchLog }> {
  const started = Date.now()
  const input = (toolUse.input ?? {}) as { query?: unknown; top_k?: unknown }
  const query = typeof input.query === 'string' ? input.query.trim() : ''
  const topK = typeof input.top_k === 'number' && Number.isFinite(input.top_k) ? input.top_k : undefined

  const fail = (error: string, content: string) => ({
    result: { type: 'tool_result' as const, tool_use_id: toolUse.id, is_error: true, content },
    log: { query, chunks: 0, ms: Date.now() - started, error },
  })

  if (!query) {
    return fail('invalid_input', 'search_library needs a non-empty "query" string.')
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const chunks = await Promise.race([
      search(query, topK),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
      }),
    ])
    const ms = Date.now() - started
    if (chunks.length === 0) {
      return {
        result: {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: 'No passages in the library matched that search. Respond from what you hold, without presenting anything as a quotation from the library.',
        },
        log: { query, chunks: 0, ms },
      }
    }
    return {
      result: { type: 'tool_result', tool_use_id: toolUse.id, content: formatRagChunks(chunks) },
      log: { query, chunks: chunks.length, ms },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return fail(
      message === 'timeout' ? 'timeout' : message,
      'The library is unavailable right now. Do not quote or cite it from memory as though you had retrieved it; continue from what you hold, or simply without it.',
    )
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Tells Cosmo the tool exists and how Xensō wants it used. Appended right after
 * XENSO_MODULE, with no cache_control — it is static text, so it rides inside
 * the prefix like any other uncached block.
 */
export const LIBRARY_TOOL_GUIDANCE = `# The library

You have a \`search_library\` tool. It searches the OpenCosmos Library — the primary texts, scriptures, philosophical works, and attributed quotes that the wiki index above maps. In Xensō no passages are put in front of you automatically; the library reaches you only when you search it.

Reach for it when a teaching, a text, or a tradition would genuinely serve this player at this moment: they ask what a tradition says, or a single passage is the one resource the moment calls for. Not on every turn, and never to decorate a reply — most turns need no library at all. Resource discipline holds: offer at most one passage, never a list of them.

The searching is invisible to the player, so keep it that way: call the tool before you write anything, and never comment on a search — no "let me look", no "that missed", no "found it". If one search misses, you may quietly search again; then speak as someone who simply has the passage in hand. When you draw on a result, use its exact words if you quote, and append its citation token exactly as given (\`[ref: …]\` or \`[quote: …]\`). Never fabricate or reconstruct a quotation, and never cite something you did not retrieve. If the search fails or nothing fits, simply go on from what you hold.

A passage the player takes up is a resource with source "corpus". The state block rule is unchanged: when one is due, it still ends your reply, after any search.`
