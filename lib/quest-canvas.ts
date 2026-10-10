/**
 * The Xensō quest canvas, as Cosmo sees it each turn.
 *
 * The iOS quest builder sends the canvas open now — every thing by a short key,
 * with its kind and the player's words, and the connections between them — in
 * xensoContext.questCanvas. Cosmo reads it here and answers with a questGraph in
 * its xenso-state block (cosmo modules/XENSO_MODULE.md § 10). The client owns the
 * canvas and merges Cosmo's changes under the authorship rules
 * (xenso docs/quest-builder.md § Building with Cosmo, by voice).
 *
 * This is client-supplied text that lands in the prompt, so everything is bounded
 * and keys are reduced to the characters a key can have.
 */

export type QuestCanvas = {
  things?: Array<{ key: string; kind: string; words?: string; draft?: boolean }>
  links?: Array<{ from: string; to: string; flow?: boolean; label?: string; draft?: boolean }>
}

export const QUEST_CANVAS_LIMITS = { things: 150, links: 300, words: 300, label: 60 } as const

const KINDS = new Set(['northStar', 'quest', 'step', 'obstacle', 'resource', 'gem', 'quality', 'person', 'note'])

const key = (k: unknown) => String(k ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32)
const clip = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

/** The canvas as a system block, or null when there's nothing on it. */
export function formatQuestCanvas(canvas: QuestCanvas | undefined): string | null {
  if (!canvas || typeof canvas !== 'object') return null
  const things = (Array.isArray(canvas.things) ? canvas.things : [])
    .slice(0, QUEST_CANVAS_LIMITS.things)
    .map(t => ({ key: key(t?.key), kind: KINDS.has(String(t?.kind)) ? String(t.kind) : 'note', words: clip(t?.words, QUEST_CANVAS_LIMITS.words), draft: t?.draft === true }))
    .filter(t => t.key)
  if (!things.length) return null
  const known = new Set(things.map(t => t.key))
  const links = (Array.isArray(canvas.links) ? canvas.links : [])
    .slice(0, QUEST_CANVAS_LIMITS.links)
    .map(l => ({ from: key(l?.from), to: key(l?.to), flow: l?.flow === true, label: clip(l?.label, QUEST_CANVAS_LIMITS.label), draft: l?.draft === true }))
    .filter(l => known.has(l.from) && known.has(l.to) && l.from !== l.to)

  const thingLines = things.map(t =>
    `- \`${t.key}\` ${t.kind}${t.draft ? ' (your suggestion, not yet accepted)' : ''}: ${t.words ? JSON.stringify(t.words) : '(not yet named)'}`)
  const linkLines = links.map(l =>
    `- \`${l.from}\` ${l.flow ? '→' : '—'} \`${l.to}\`${l.label ? ` ${JSON.stringify(l.label)}` : ''}${l.draft ? ' (your suggestion)' : ''}`)

  return [
    '# The quest canvas',
    'The canvas open now, as it stands this turn: the player may have changed it by hand since you last spoke. Build on it as section 10 of your Xensō module describes. Name things by their keys in your questGraph; never mention keys to the player.',
    `## Things (${things.length})\n\n${thingLines.join('\n')}`,
    links.length ? `## Connections (${links.length})\n\n${linkLines.join('\n')}` : '## Connections\n\nNone yet.',
  ].join('\n\n')
}
