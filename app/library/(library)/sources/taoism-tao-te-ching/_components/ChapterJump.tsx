import Link from 'next/link'
import { taoTeChingHref } from '@/lib/corpus-href'
import { chapterNumbers } from '@/lib/tao-te-ching'

/** Every chapter by number, in the chapter page's sidebar, so a reader can move between chapters without going back to the landing page. */
export default function ChapterJump({ current }: { current: number }) {
  return (
    <nav aria-label="Jump to chapter" className="mt-8">
      <p className="text-xs uppercase tracking-widest text-foreground/30 mb-3 font-medium px-2">
        Chapters
      </p>
      <ul className="grid grid-cols-9 gap-0.5">
        {chapterNumbers().map((n) => (
          <li key={n}>
            <Link
              href={taoTeChingHref(n)}
              aria-current={n === current ? 'page' : undefined}
              className={`block text-center text-xs py-1 rounded transition-colors ${
                n === current
                  ? 'text-white font-medium bg-foreground/10'
                  : 'text-foreground/40 hover:text-foreground/70'
              }`}
            >
              {n}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
