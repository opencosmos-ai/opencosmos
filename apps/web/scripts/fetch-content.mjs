/**
 * Makes the knowledge corpus available to this app at build time.
 *
 * The corpus lives in its own repository (opencosmos-ai/knowledge) so that
 * adding a text or correcting a transcription does not mean cloning a
 * five-application monorepo. This app still needs it on disk: the Library
 * pages are statically generated, so the corpus is read at build time and
 * baked out. It is never read at runtime — retrieval goes through Upstash.
 *
 * Two modes, chosen automatically:
 *
 *   1. A local checkout, if one is found — copied in.
 *   2. Otherwise a shallow clone. This is what CI and Vercel do.
 *
 * It copies rather than symlinks, and that is not a preference. Turbopack
 * traverses directory references during its module graph build and rejects any
 * symlink whose target sits outside the project root:
 *
 *     Symlink apps/web/.content/knowledge/quotes/README.md is invalid,
 *     it points out of the filesystem root
 *
 * So the corpus has to be real files under this app. The cost is that a corpus
 * edit is not live in `next dev` — re-run `pnpm content` to pick it up.
 *
 * Resolution order for a local checkout:
 *   $KNOWLEDGE_LOCAL_DIR   — explicit override, absolute path
 *   ../knowledge           — sibling of the repository root, the convention
 *
 * Environment:
 *   KNOWLEDGE_LOCAL_DIR  use this checkout instead of cloning
 *   KNOWLEDGE_REPO       defaults to the public HTTPS URL below
 *   CONTENT_REF          branch/tag/SHA to fetch; defaults to the default branch
 *
 * Builds fetch the tip of the default branch, so they are not byte-reproducible
 * by default. That is the deliberate trade for keeping push-to-publish: edit the
 * corpus, push, the site rebuilds. Set CONTENT_REF to pin a release.
 */

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = resolve(APP_DIR, '..', '..')
const DEST = join(APP_DIR, '.content', 'knowledge')

const REPO = process.env.KNOWLEDGE_REPO || 'https://github.com/opencosmos-ai/knowledge.git'
const REF = process.env.CONTENT_REF || ''

const log = (msg) => console.log(`[content] ${msg}`)

function git(args, cwd) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim()
}

/** A directory that actually holds the corpus, or null. */
function validCheckout(dir) {
  if (!dir || !existsSync(dir)) return null
  // `sources/` and `wiki/` are load-bearing: their absence means this is not
  // the corpus, and a silent empty build is worse than a loud failure.
  const looksRight = existsSync(join(dir, 'sources')) && existsSync(join(dir, 'wiki'))
  return looksRight ? dir : null
}

function findLocalCheckout() {
  const explicit = process.env.KNOWLEDGE_LOCAL_DIR
  if (explicit) {
    const ok = validCheckout(resolve(explicit))
    if (ok) return ok
    throw new Error(
      `KNOWLEDGE_LOCAL_DIR is set to ${explicit}, but that is not a corpus checkout ` +
      `(expected sources/ and wiki/ inside it). Refusing to fall back to a clone — ` +
      `an explicit override that silently does something else is worse than an error.`,
    )
  }
  return validCheckout(resolve(REPO_ROOT, '..', 'knowledge'))
}

function copyFrom(target) {
  mkdirSync(dirname(DEST), { recursive: true })
  rmSync(DEST, { recursive: true, force: true })
  // `.git` is excluded: this is a build input, not a working copy, and copying
  // it would make the corpus look like a nested repository to tooling.
  cpSync(target, DEST, {
    recursive: true,
    dereference: true,
    filter: (src) => !src.includes(`${sep}.git${sep}`) && !src.endsWith(`${sep}.git`),
  })
  log(`copied local checkout ← ${target}`)
}

function clone() {
  mkdirSync(dirname(DEST), { recursive: true })
  rmSync(DEST, { recursive: true, force: true })
  const args = ['clone', '--depth', '1', '--quiet']
  if (REF) args.push('--branch', REF)
  args.push(REPO, DEST)
  log(`cloning ${REPO}${REF ? ` @ ${REF}` : ''} …`)
  git(args)
  const sha = git(['rev-parse', '--short', 'HEAD'], DEST)
  const when = git(['log', '-1', '--format=%cs'], DEST)
  log(`cloned at ${sha} (${when})`)
}

function main() {
  const local = findLocalCheckout()
  if (local) copyFrom(local)
  else clone()

  // Never let a build proceed on an empty corpus. Static generation would
  // simply emit no Library routes, which looks like a successful build and
  // is the exact failure this check exists to make loud.
  const docs = readdirSync(join(DEST, 'sources')).filter((f) => f.endsWith('.md'))
  if (docs.length === 0) throw new Error(`corpus at ${DEST} has no documents in sources/`)
  log(`ready — ${docs.length} source documents`)
}

main()
