import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Optional file → string at build time. Returns '' if the file is missing or
// unreadable, so an absent digest never breaks the build (fail open).
function readOptional(relPath) {
  try {
    return readFileSync(join(__dirname, relPath), 'utf-8')
  } catch {
    return ''
  }
}

// Required file → string at build time. Throws if the file is missing or
// empty, so a lost module fails the build instead of shipping without it
// (fail closed). A bare readFileSync would still accept an empty file.
function readRequired(relPath) {
  const text = readFileSync(join(__dirname, relPath), 'utf-8')
  if (!text.trim()) throw new Error(`${relPath} is empty — refusing to build without it. If it was removed on purpose, remove its line from next.config.mjs too.`)
  return text
}

// Strip a leading YAML frontmatter block (--- … ---) so only the prose body of
// an exemplar is injected into the prompt — not its curation metadata.
function stripFrontmatter(md) {
  return md.replace(/^---\n[\s\S]*?\n---\n+/, '')
}

// Concatenate the curated Cosmo exemplars (kaizen/exemplars/cosmo/*.md, minus the
// README signpost) into one few-shot block, frontmatter stripped. Fails open: an
// empty or absent directory yields '' and the injection is simply skipped.
function readExemplars(relDir) {
  try {
    const dir = join(__dirname, relDir)
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .sort()
    const bodies = files
      .map((f) => stripFrontmatter(readFileSync(join(dir, f), 'utf-8')).trim())
      .filter(Boolean)
    return bodies.join('\n\n---\n\n')
  } catch {
    return ''
  }
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@opencosmos/ui'],
  env: {
    COSMO_SYSTEM_PROMPT: readFileSync(
      join(__dirname, '.content/cosmo/COSMO_SYSTEM_PROMPT.md'),
      'utf-8'
    ),
    COSMO_WIKI_INDEX: readFileSync(
      join(__dirname, '.content/knowledge/wiki/index.md'),
      'utf-8'
    ),
    // Cosmo's curated Operating Lessons digest — distilled from kaizen/feedback
    // and injected into every chat + inception turn. Optional: absent file → ''.
    COSMO_LESSONS: readOptional('.content/cosmo/kaizen/LESSONS.md'),
    // Curated few-shot exemplars — Cosmo at its best — injected to steer voice
    // and rhythm. Bodies concatenated, frontmatter stripped. Optional: none → ''.
    COSMO_EXEMPLARS: readExemplars('.content/cosmo/kaizen/exemplars/cosmo'),
    // Shalom-specific relational context (the Daily Mystic posture) — injected
    // only into admin sessions, never the base prompt. Optional: absent → ''.
    //
    // Deliberately absent from opencosmos-ai/cosmo, so unlike its neighbours it
    // is NOT fetched. It comes from a local file in development and from a
    // Vercel environment variable in deployment. The `process.env` arm is
    // load-bearing: entries in this `env` block are inlined at build, so
    // without it an absent file would bake '' over the top of the Vercel
    // variable and admin sessions would go quietly generic — no error, nothing
    // in a log, just Cosmo not knowing who it is talking to.
    COSMO_SHALOM_CONTEXT:
      readOptional('packages/ai/COSMO_SHALOM_CONTEXT.md') ||
      process.env.COSMO_SHALOM_CONTEXT ||
      '',
    // Xensō quest-guide module — injected only when a request arrives with
    // xensoMode: true. Adds the authorship rule, the five-question spine, the
    // three safety tiers, and the xenso-state protocol. Required: without it,
    // xenso mode would run as plain Cosmo with no error, so the build fails.
    // WHEN XENSŌ LEAVES THIS REPO: delete this line AND the matching check in
    // scripts/fetch-content.mjs (cosmo's verify), or every build will fail.
    XENSO_MODULE: readRequired('.content/cosmo/modules/XENSO_MODULE.md'),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
