#!/usr/bin/env tsx
/**
 * Verification for the Xensō quest canvas: lib/quest-canvas.ts here, and
 * section 10 of the Xensō module (cosmo modules/XENSO_MODULE.md), which teaches
 * Cosmo to change the canvas through a questGraph in its xenso-state block.
 *
 * This repository has no test runner, so this follows the scripts/iching-check.ts
 * precedent: a script you run, that prints, and that exits non-zero when it should.
 *
 *   pnpm xenso:check-canvas          # offline: the canvas block is bounded and clean
 *   pnpm xenso:check-canvas --live   # also real Cosmo turns against the module
 *                                    # (needs ANTHROPIC_API_KEY; reads .env.local)
 *
 * Live turns use the system prompt and module from .content/cosmo, or from
 * XENSO_MODULE_PATH / COSMO_PROMPT_PATH, so a module change can be checked before
 * it is merged. What they check is the authorship rule made checkable: the
 * player's words go in exactly and marked `said`; Cosmo's own ideas stay unsaid,
 * at most one a turn; nothing is removed unasked; no positions; and keys never
 * reach the words the player hears.
 */

import { readFileSync, existsSync } from 'fs'
import Anthropic from '@anthropic-ai/sdk'
import { formatQuestCanvas, QUEST_CANVAS_LIMITS, type QuestCanvas } from '../lib/quest-canvas'
import { MODEL_GENERAL } from '../lib/ai-models'

let failures = 0
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`)
  if (!ok) {
    failures++
    if (detail !== undefined) console.log('     ', typeof detail === 'string' ? detail : JSON.stringify(detail, null, 1))
  }
}

// ---------------------------------------------------------------- offline

function offline() {
  check('nothing on the canvas is no block', formatQuestCanvas(undefined) === null && formatQuestCanvas({ things: [] }) === null)

  const block = formatQuestCanvas({
    things: [
      { key: '3FA2', kind: 'quest', words: "Telling my team I'm leaving" },
      { key: 'ab-12!', kind: 'dragon', words: 'odd' },
      { key: 'c9', kind: 'quality', words: 'Steadiness', draft: true },
      { key: '', kind: 'step', words: 'no key' },
    ],
    links: [
      { from: '3fa2', to: 'c9', draft: true },
      { from: '3fa2', to: 'zzzz' },
      { from: '3fa2', to: '3fa2' },
      { from: '3fa2', to: 'ab12', flow: true, label: 'begins with' },
    ],
  }) ?? ''
  check('keys are lowercased and reduced to letters and digits', block.includes('`3fa2`') && block.includes('`ab12`'), block)
  check('an unknown kind reads as a note', block.includes('`ab12` note'), block)
  check('a thing without a key is dropped', !block.includes('no key'), block)
  check('drafts are marked as Cosmo\'s suggestions', block.includes('`c9` quality (your suggestion, not yet accepted)'), block)
  check('links to unknown things, and to themselves, are dropped', !block.includes('zzzz') && !block.includes('`3fa2` — `3fa2`'), block)
  check('a flow and its label come through', block.includes('`3fa2` → `ab12` "begins with"'), block)
  check('words are quoted, so they read as the player\'s', block.includes('"Telling my team I\'m leaving"'), block)

  const many = formatQuestCanvas({
    things: Array.from({ length: 400 }, (_, i) => ({ key: `k${i}`, kind: 'step', words: 'x'.repeat(5000) })),
  }) ?? ''
  check('things are capped', many.includes(`## Things (${QUEST_CANVAS_LIMITS.things})`))
  check('words are clipped', !many.includes('x'.repeat(QUEST_CANVAS_LIMITS.words + 1)))
}

// ---------------------------------------------------------------- live

type Graph = {
  things?: Array<{ key: string; kind?: string; words?: string; said?: boolean; [k: string]: unknown }>
  links?: Array<{ from: string; to: string; said?: boolean; flow?: boolean; [k: string]: unknown }>
  removed?: Array<string | { key: string; said?: boolean }>
}

function questGraph(reply: string): Graph | null {
  const at = reply.lastIndexOf('```xenso-state')
  if (at < 0) return null
  let json = reply.slice(at + '```xenso-state'.length)
  const end = json.indexOf('```')
  if (end >= 0) json = json.slice(0, end)
  try {
    return (JSON.parse(json.trim()) as { questGraph?: Graph }).questGraph ?? null
  } catch {
    return null
  }
}

function spoken(reply: string): string {
  const at = reply.indexOf('```xenso-state')
  return at < 0 ? reply : reply.slice(0, at)
}

const squeeze = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

function readEnvKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  if (!existsSync('.env.local')) return undefined
  const line = readFileSync('.env.local', 'utf-8').split('\n').find(l => l.startsWith('ANTHROPIC_API_KEY='))
  return line?.slice('ANTHROPIC_API_KEY='.length).trim().replace(/^["']|["']$/g, '')
}

type Case = {
  name: string
  canvas: QuestCanvas
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  judge: (graph: Graph | null, words: string) => void
}

const quest: QuestCanvas['things'] = [{ key: '3fa2', kind: 'quest', words: "Telling my team I'm leaving" }]

const cases: Case[] = [
  {
    name: 'the player names an obstacle',
    canvas: { things: quest, links: [] },
    messages: [{ role: 'user', content: "Honestly the thing in my way is that I'm scared of letting them down." }],
    judge: (g, words) => {
      const said = (g?.things ?? []).filter(t => t.said === true)
      const fear = said.find(t => squeeze(t.words ?? '').includes('scared of letting them down'))
      check('  it is placed, in the player\'s words, as said', !!fear, g)
      check('  its words are the player\'s own, not a paraphrase', !!fear && squeeze("Honestly the thing in my way is that I'm scared of letting them down.").includes(squeeze(fear.words ?? '')), fear)
      check('  it joins the quest', (g?.links ?? []).some(l => [l.from, l.to].includes('3fa2') && [l.from, l.to].includes(fear?.key ?? '?')), g)
      check('  nothing is removed', !(g?.removed ?? []).length, g)
      check('  keys never reach the player', !/\b3fa2\b|questGraph|json/i.test(words), words)
    },
  },
  {
    name: 'the player asks to change a thing\'s kind',
    canvas: { things: [...quest, { key: '7c10', kind: 'note', words: 'Talk to Maya first' }], links: [{ from: '3fa2', to: '7c10' }] },
    messages: [{ role: 'user', content: 'Make "talk to Maya first" a step.' }],
    judge: g => {
      const step = (g?.things ?? []).find(t => t.key === '7c10')
      check('  the same thing changes, by its key', !!step, g)
      check('  to a step, as said', step?.kind === 'step' && step?.said === true, step)
      check('  nothing new is invented', (g?.things ?? []).every(t => t.key === '7c10' || t.said !== true), g)
    },
  },
  {
    name: 'the player is unsure what comes next',
    canvas: { things: [...quest, { key: '9e44', kind: 'obstacle', words: "I'm scared of letting them down" }], links: [{ from: '3fa2', to: '9e44' }] },
    messages: [{ role: 'user', content: "I don't know what to do next. I'm kind of stuck." }],
    judge: g => {
      const things = g?.things ?? []
      check('  nothing goes in as the player\'s that they didn\'t say', things.every(t => t.said !== true), g)
      check('  at most one suggestion', things.filter(t => t.said !== true).length <= 1, g)
      check('  nothing is removed', !(g?.removed ?? []).length, g)
    },
  },
  {
    name: 'the player accepts a suggestion',
    canvas: { things: [...quest, { key: 'b5d0', kind: 'quality', words: 'Steadiness', draft: true }], links: [{ from: '3fa2', to: 'b5d0', draft: true }] },
    messages: [
      { role: 'assistant', content: "I've offered one thing of my own, steadiness, faintly. It's yours to keep or let go." },
      { role: 'user', content: 'Yes, keep steadiness.' },
    ],
    judge: g => {
      const kept = (g?.things ?? []).find(t => t.key === 'b5d0')
      check('  the suggestion is accepted by its key, as said', kept?.said === true, g)
      check('  it is not duplicated under a new key', !(g?.things ?? []).some(t => t.key !== 'b5d0' && squeeze(t.words ?? '') === 'steadiness'), g)
    },
  },
  {
    name: 'every block keeps to the shape',
    canvas: { things: quest, links: [] },
    messages: [{ role: 'user', content: 'What this serves is a life of honest work. And I want to start by writing the handover doc.' }],
    judge: g => {
      const things = g?.things ?? []
      check('  no positions, sizes, or colors', things.every(t => !('x' in t) && !('y' in t) && !('position' in t) && !('color' in t)), g)
      check('  kinds are from the list', things.every(t => !t.kind || ['northStar', 'quest', 'step', 'obstacle', 'resource', 'gem', 'quality', 'person', 'note'].includes(t.kind)), g)
      check('  the North Star goes in, as said', things.some(t => t.kind === 'northStar' && t.said === true && squeeze(t.words ?? '').includes('honest work')), g)
    },
  },
]

async function live() {
  const apiKey = readEnvKey()
  if (!apiKey) {
    check('live: ANTHROPIC_API_KEY is available', false)
    return
  }
  const promptPath = process.env.COSMO_PROMPT_PATH ?? '.content/cosmo/COSMO_SYSTEM_PROMPT.md'
  const modulePath = process.env.XENSO_MODULE_PATH ?? '.content/cosmo/modules/XENSO_MODULE.md'
  const module = readFileSync(modulePath, 'utf-8')
  check('live: the module has section 10', module.includes('## 10. The quest canvas'), modulePath)
  const prompt = readFileSync(promptPath, 'utf-8')
  const client = new Anthropic({ apiKey })

  for (const c of cases) {
    console.log(`\n${c.name}`)
    const canvas = formatQuestCanvas(c.canvas) ?? ''
    const response = await client.messages.create({
      model: MODEL_GENERAL,
      max_tokens: 2400,
      system: [
        { type: 'text', text: prompt },
        { type: 'text', text: module },
        { type: 'text', text: canvas },
      ],
      messages: c.messages,
    })
    const reply = response.content.map(b => (b.type === 'text' ? b.text : '')).join('')
    if (process.argv.includes('--show')) console.log(reply)
    check(`  the reply finished (${response.stop_reason})`, response.stop_reason === 'end_turn', response.stop_reason)
    c.judge(questGraph(reply), spoken(reply))
  }
}

async function main() {
  offline()
  if (process.argv.includes('--live')) await live()
  console.log(failures ? `\n${failures} failed` : '\nall passed')
  process.exit(failures ? 1 : 0)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
