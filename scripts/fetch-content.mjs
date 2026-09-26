/**
 * Makes the content this app builds from available on disk at build time.
 *
 * Two sources, both in their own repositories so that adding a text or editing
 * a prompt does not mean cloning the site:
 *
 *   knowledge  opencosmos-ai/knowledge  the corpus behind /library
 *   cosmo      opencosmos-ai/cosmo      Cosmo's constitutional layer
 *
 * This app still needs both on disk. The Library pages are statically
 * generated, so the corpus is read at build time and baked out; Cosmo's prompts
 * are inlined into the bundle by next.config.mjs's `env` block. Neither is read
 * at runtime — retrieval goes through Upstash.
 *
 * Two modes per source, chosen automatically:
 *
 *   1. A local checkout, if one is found — copied in.
 *   2. Otherwise a shallow clone. This is what CI and Vercel do.
 *
 * It copies rather than symlinks, and that is not a preference. Turbopack
 * traverses directory references during its module graph build and rejects any
 * symlink whose target sits outside the project root:
 *
 *     Symlink .content/knowledge/quotes/README.md is invalid,
 *     it points out of the filesystem root
 *
 * So the content has to be real files under this app. The cost is that an edit
 * is not live in `next dev` — re-run `pnpm content` to pick it up.
 *
 * Resolution order for a local checkout, per source:
 *   $<NAME>_LOCAL_DIR      explicit override, absolute path
 *   ../<name>              sibling of the repository root, the convention
 *
 * Environment:
 *   KNOWLEDGE_LOCAL_DIR  use this checkout instead of cloning
 *   KNOWLEDGE_REPO       defaults to the public HTTPS URL below
 *   COSMO_LOCAL_DIR      as above, for the constitutional layer
 *   COSMO_REPO           as above
 *   CONTENT_REF          branch/tag/SHA to fetch; defaults to the default branch
 *   CONTENT_TOKEN        GitHub token, only needed while a source repo is private
 *
 * Builds fetch the tip of the default branch, so they are not byte-reproducible
 * by default. That is the deliberate trade for keeping push-to-publish: edit the
 * content, push, the site rebuilds. Set CONTENT_REF to pin a release.
 */

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const REF = process.env.CONTENT_REF || ''
const TOKEN = process.env.CONTENT_TOKEN || ''

/**
 * Each source declares how to find it, how to recognise it, and how to prove it
 * arrived intact. The `markers` are directories whose absence means "this is not
 * that repository"; `verify` runs after the copy or clone and must throw rather
 * than let a thin build through. Both exist because of the same lesson: an empty
 * input produces a green build and a broken site.
 */
const SOURCES = [
  {
    name: 'knowledge',
    repo: process.env.KNOWLEDGE_REPO || 'https://github.com/opencosmos-ai/knowledge.git',
    localEnv: 'KNOWLEDGE_LOCAL_DIR',
    sibling: 'knowledge',
    markers: ['sources', 'wiki'],
    verify(dest) {
      // Static generation would simply emit no Library routes, which looks like
      // a successful build and is the exact failure this check exists to catch.
      const docs = readdirSync(join(dest, 'sources')).filter((f) => f.endsWith('.md'))
      if (docs.length === 0) throw new Error(`corpus at ${dest} has no documents in sources/`)
      return `${docs.length} source documents`
    },
  },
  {
    name: 'cosmo',
    repo: process.env.COSMO_REPO || 'https://github.com/opencosmos-ai/cosmo.git',
    localEnv: 'COSMO_LOCAL_DIR',
    sibling: 'cosmo',
    markers: ['triad', 'kaizen'],
    verify(dest) {
      // If the system prompt is missing or empty, next.config.mjs bakes '' into
      // the bundle and Cosmo answers in a generic assistant voice without ever
      // erroring. That is the failure mode the migration plan warns about, so it
      // is refused here rather than discovered in conversation.
      const prompt = join(dest, 'COSMO_SYSTEM_PROMPT.md')
      if (!existsSync(prompt) || statSync(prompt).size === 0) {
        throw new Error(`cosmo at ${dest} has no COSMO_SYSTEM_PROMPT.md — refusing to build a voiceless Cosmo`)
      }
      // The same failure, one surface over: without the Xensō module, xenso
      // mode runs as plain Cosmo and nobody is told.
      // WHEN XENSŌ LEAVES THIS REPO: delete this check AND the XENSO_MODULE line
      // in next.config.mjs, or every build will fail.
      const xenso = join(dest, 'modules', 'XENSO_MODULE.md')
      if (!existsSync(xenso) || statSync(xenso).size === 0) {
        throw new Error(
          `cosmo at ${dest} has no modules/XENSO_MODULE.md — refusing to build Xensō without its module. ` +
          `If Xensō has been removed from opencosmos on purpose, delete the module check in scripts/fetch-content.mjs and the XENSO_MODULE line in next.config.mjs.`
        )
      }
      const triad = readdirSync(join(dest, 'triad')).filter((f) => f.endsWith('_SYSTEM_PROMPT.md'))
      return `${(readFileSync(prompt, 'utf-8').length / 1024).toFixed(1)} kB system prompt, ${triad.length} triad prompts, ${(readFileSync(xenso, 'utf-8').length / 1024).toFixed(1)} kB Xensō module`
    },
  },
]

const log = (msg) => console.log(`[content] ${msg}`)

/** Never print a token, even in an error path. */
const redact = (url) => url.replace(/\/\/[^@/]*@/, '//***@')

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim()
  } catch (err) {
    throw new Error(redact(err.stderr?.toString() || err.message))
  }
}

/** A directory that actually holds this source, or null. */
function validCheckout(dir, markers) {
  if (!dir || !existsSync(dir)) return null
  return markers.every((m) => existsSync(join(dir, m))) ? dir : null
}

function findLocalCheckout(src) {
  const explicit = process.env[src.localEnv]
  if (explicit) {
    const ok = validCheckout(resolve(explicit), src.markers)
    if (ok) return ok
    throw new Error(
      `${src.localEnv} is set to ${explicit}, but that is not a ${src.name} checkout ` +
      `(expected ${src.markers.join('/ and ')}/ inside it). Refusing to fall back to a clone — ` +
      `an explicit override that silently does something else is worse than an error.`,
    )
  }
  return validCheckout(resolve(REPO_ROOT, '..', src.sibling), src.markers)
}

function copyFrom(target, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  // `.git` is excluded: this is a build input, not a working copy, and copying
  // it would make the content look like a nested repository to tooling.
  // `node_modules` likewise — a sibling checkout may have its own, and copying
  // it in would put every dependency README under .content.
  cpSync(target, dest, {
    recursive: true,
    dereference: true,
    filter: (s) =>
      !s.includes(`${sep}.git${sep}`) && !s.endsWith(`${sep}.git`) &&
      !s.includes(`${sep}node_modules${sep}`) && !s.endsWith(`${sep}node_modules`),
  })
  log(`copied local checkout ← ${target}`)
}

function clone(src, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  // A token is only needed while a source repository is private. Injected into
  // the URL rather than a header so it never reaches a config file on disk.
  const url = TOKEN ? src.repo.replace('https://', `https://x-access-token:${TOKEN}@`) : src.repo
  const args = ['clone', '--depth', '1', '--quiet']
  if (REF) args.push('--branch', REF)
  args.push(url, dest)
  log(`cloning ${redact(src.repo)}${REF ? ` @ ${REF}` : ''}${TOKEN ? ' (authenticated)' : ''} …`)
  git(args)
  log(`cloned at ${git(['rev-parse', '--short', 'HEAD'], dest)} (${git(['log', '-1', '--format=%cs'], dest)})`)
}

function main() {
  for (const src of SOURCES) {
    const dest = join(REPO_ROOT, '.content', src.name)
    const local = findLocalCheckout(src)
    if (local) copyFrom(local, dest)
    else clone(src, dest)
    log(`${src.name} ready — ${src.verify(dest)}`)
  }
}

main()
