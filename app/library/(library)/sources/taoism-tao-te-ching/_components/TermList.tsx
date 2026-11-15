// A list of glossary entries with how often each stands: a chapter's Key Terms,
// and the chapter panel on the Key Terms page. No hooks, so it renders on the
// server and inside client components alike.

import { Badge } from '@opencosmos/ui'
import { ExternalLink } from 'lucide-react'

export type TermRow = {
  slug: string
  term: string
  pinyin: string
  render: string
  status: string
  href: string
  count: number
}

function times(n: number): string {
  return n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`
}

export default function TermList({ terms }: { terms: TermRow[] }) {
  return (
    <ul className="list-none p-0 m-0 divide-y divide-foreground/10 border-y border-foreground/10">
      {terms.map((t) => (
        <li key={t.slug}>
          <a
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-baseline gap-3 py-3 px-2 -mx-2 rounded hover:bg-foreground/10 transition-colors"
          >
            <span lang="zh-Hant" className="font-han text-2xl text-foreground w-20 shrink-0">{t.term}</span>
            <span className="italic text-foreground/60 w-28 shrink-0 hidden sm:inline!">{t.pinyin}</span>
            <span className="text-foreground/80 flex-1 min-w-0">
              <span className="italic text-foreground/60 sm:hidden">{t.pinyin} · </span>
              {t.render}
            </span>
            <span
              className="text-sm tabular-nums text-foreground/50 w-10 shrink-0 text-right"
              title={`Appears ${times(t.count)} in this chapter`}
            >
              <span aria-hidden="true">{t.count}×</span>
              <span className="sr-only">Appears {times(t.count)} in this chapter</span>
            </span>
            {t.status && t.status !== 'locked' && (
              <Badge variant="outline" className="text-foreground/50 shrink-0">{t.status}</Badge>
            )}
            <ExternalLink
              className="w-3.5 h-3.5 text-foreground group-hover:text-primary! transition-colors shrink-0 self-center"
              aria-hidden="true"
            />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
