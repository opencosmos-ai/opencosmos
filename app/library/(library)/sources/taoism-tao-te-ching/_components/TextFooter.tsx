import Link from 'next/link'
import { Button, GitHubIcon } from '@opencosmos/ui'
import { TAOTECHING_URL } from '@/lib/tao-te-ching'

const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/'

/**
 * The foot of every Tao Te Ching page: whose site this is, the terms the text
 * is given under, and the repository it is made in.
 */
export default function TextFooter() {
  return (
    <footer className="mt-32 pt-10 border-t border-foreground/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <Link href="/" className="text-lg font-semibold text-foreground hover:text-foreground/80 transition-colors">
          OpenCosmos
        </Link>
        <p className="mt-1 mb-0 text-base leading-relaxed text-foreground/70">
          The Open Tao Te Ching is in the public domain under{' '}
          <a
            href={CC0_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-foreground/60 transition-colors"
          >
            CC0 1.0 Universal
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </div>
      <Button variant="outline" size="sm" asChild className="gap-2 shrink-0 self-start sm:self-auto text-foreground border-foreground/40">
        <a href={TAOTECHING_URL} target="_blank" rel="noopener noreferrer">
          <GitHubIcon className="w-3.5 h-3.5" aria-hidden="true" />
          GitHub
          <span className="sr-only"> (opens the repository in a new tab)</span>
        </a>
      </Button>
    </footer>
  )
}
