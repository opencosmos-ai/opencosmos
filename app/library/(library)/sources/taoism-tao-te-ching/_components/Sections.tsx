// The server-rendered sections of a chapter page: Listen, Terms, Notes,
// Discussion. Translation and Original are in ChapterText, which is a client
// component because they share highlight state.

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { Badge, Button, GitHubIcon } from '@opencosmos/ui'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import {
  discussionHrefs,
  type Discussion as DiscussionData,
  type TermView,
} from '@/lib/tao-te-ching'
import { TAO_TE_CHING_CHAPTERS, taoTeChingHref } from '@/lib/corpus-href'
import { H2 } from './styles'

const external = { target: '_blank', rel: 'noopener noreferrer' } as const

/**
 * The Chinese read aloud (ADR 0020 §6). No clips exist and the voice is
 * undecided, so today this always renders nothing — and the page leaves Listen
 * out of its contents list for the same reason.
 */
export function Listen({ clips }: { clips: { seq: number; src: string }[] }) {
  if (clips.length === 0) return null
  return (
    <section aria-labelledby="listen">
      <h2 id="listen" className={H2}>Listen</h2>
      <ol className="list-none p-0 m-0 space-y-2">
        {clips.map((clip) => (
          <li key={clip.seq} className="flex items-center gap-3">
            <span className="text-xs text-foreground/40 w-6 text-right">{clip.seq}</span>
            <audio controls preload="none" src={clip.src} className="h-8" />
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Terms({ terms }: { terms: TermView[] }) {
  return (
    <section aria-labelledby="terms">
      <h2 id="terms" className={H2}>Terms</h2>
      {terms.length === 0 ? (
        <p className="text-foreground/50">No glossary entry stands in this chapter yet.</p>
      ) : (
        <>
          <p className="text-sm text-foreground/50 mb-4 max-w-prose">
            The glossary entries for words in this chapter: how this translation renders each one, and why.
            Each opens in the Character Atlas.
          </p>
          <ul className="list-none p-0 m-0 divide-y divide-foreground/10 border-y border-foreground/10">
            {terms.map((t) => (
              <li key={t.slug}>
                <a
                  href={t.href}
                  {...external}
                  className="flex items-baseline gap-3 py-3 px-2 -mx-2 rounded hover:bg-foreground/5 transition-colors"
                >
                  <span lang="zh-Hant" className="font-han text-2xl text-foreground w-20 shrink-0">{t.term}</span>
                  <span className="italic text-foreground/60 w-28 shrink-0 hidden sm:inline!">{t.pinyin}</span>
                  <span className="text-foreground/80 flex-1 min-w-0">
                    <span className="italic text-foreground/60 sm:hidden">{t.pinyin} · </span>
                    {t.render}
                  </span>
                  {t.status && t.status !== 'locked' && (
                    <Badge variant="outline" className="text-foreground/50 shrink-0">{t.status}</Badge>
                  )}
                  <ExternalLink className="w-3.5 h-3.5 text-foreground/30 shrink-0 self-center" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/**
 * The translator's reasoning, set apart from the verse so a note is never read
 * as scripture (ADR 0017): a bounded panel in the body face, smaller and
 * quieter than the poem it explains.
 */
export function Notes({ markdown }: { markdown: string }) {
  return (
    <section aria-labelledby="notes">
      <h2 id="notes" className={H2}>Notes</h2>
      {!markdown ? (
        <p className="text-foreground/50">The translator has no notes on this chapter yet.</p>
      ) : (
        <aside
          aria-label="The translator's notes"
          className="rounded-lg border border-foreground/10 bg-foreground/[0.03] px-5 py-5 sm:px-7 sm:py-6"
        >
          <p className="text-xs uppercase tracking-widest text-foreground/40 mb-4">
            From the translator — why the English reads as it does
          </p>
          <div className="text-[0.94rem] leading-relaxed text-foreground/70">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                h3: ({ children }) => <h3 className="text-base font-medium text-foreground mt-6 mb-2">{children}</h3>,
                h4: ({ children }) => <h4 className="text-sm font-medium text-foreground mt-5 mb-2">{children}</h4>,
                ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5">{children}</ol>,
                strong: ({ children }) => <strong className="font-semibold text-foreground/90">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-foreground/20 pl-4 my-4 text-foreground/60">{children}</blockquote>
                ),
                code: ({ children }) => (
                  <code className="font-mono text-xs px-1 py-0.5 rounded bg-foreground/5">{children}</code>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm text-left border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="py-1.5 pr-4 font-medium text-foreground/60">{children}</th>,
                td: ({ children }) => <td className="py-1.5 pr-4 border-b border-foreground/5">{children}</td>,
                a: ({ href, children }) => (
                  <a href={href} {...external} className="underline underline-offset-2 hover:text-foreground">{children}</a>
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </aside>
      )}
    </section>
  )
}

export function Discussion({ n, data }: { n: number; data: DiscussionData }) {
  const hrefs = discussionHrefs(n)
  return (
    <section aria-labelledby="discussion">
      <h2 id="discussion" className={H2}>Discussion</h2>
      <p className="text-sm text-foreground/50 mb-4 max-w-prose">
        The translation is edited in the open. Questions and proposals about this chapter are issues and pull
        requests titled “Ch {n} —” in its repository.
      </p>
      {data.ok && data.items.length > 0 && (
        <ul className="list-none p-0 m-0 mb-5 space-y-2">
          {data.items.map((item) => (
            <li key={item.number}>
              <a
                href={item.url}
                {...external}
                className="flex items-baseline gap-3 text-foreground/80 hover:text-foreground transition-colors"
              >
                <Badge variant="outline" className="text-foreground/50 shrink-0">
                  {item.pr ? 'Pull request' : 'Issue'}
                </Badge>
                <span className="min-w-0">{item.title}</span>
                <span className="text-foreground/30 text-sm shrink-0">#{item.number}</span>
                <span className="sr-only"> (opens GitHub in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {data.ok && data.items.length === 0 && (
        <p className="text-foreground/60 mb-5">Nothing open about this chapter right now.</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <a href={hrefs.newIssue} {...external}>
            <GitHubIcon className="w-3.5 h-3.5" aria-hidden="true" />
            Raise a line that doesn’t land
            <span className="sr-only"> (opens GitHub in a new tab)</span>
          </a>
        </Button>
        <a
          href={hrefs.list}
          {...external}
          className="text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
        >
          {data.ok && data.complete ? 'All discussion of this chapter' : 'See what is open about this chapter'} →
          <span className="sr-only"> (opens GitHub in a new tab)</span>
        </a>
      </div>
    </section>
  )
}

export function ChapterNav({ n }: { n: number }) {
  return (
    <nav aria-label="Chapters" className="mt-16 grid grid-cols-3 items-center gap-3">
      {n > 1 ? (
        <Button variant="ghost" size="sm" asChild className="gap-2 justify-self-start">
          <Link href={taoTeChingHref(n - 1)}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Chapter {n - 1}
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <Link href={taoTeChingHref()} className="justify-self-center text-sm text-foreground/50 hover:text-foreground/80 transition-colors">
        All chapters
      </Link>
      {n < TAO_TE_CHING_CHAPTERS ? (
        <Button variant="ghost" size="sm" asChild className="gap-2 justify-self-end">
          <Link href={taoTeChingHref(n + 1)}>
            Chapter {n + 1}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  )
}
