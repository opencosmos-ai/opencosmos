import { Button, GitHubIcon } from '@opencosmos/ui'
import { Pencil } from 'lucide-react'
import { sourceHrefs } from '@/lib/corpus-href'

type Props = {
  /** Corpus path, e.g. `knowledge/sources/x.md` or `knowledge/quotes/x.yaml`. */
  docPath: string
  /** One sentence naming what a reader here is likely to have noticed. */
  prompt: string
}

/**
 * The way from reading a text to correcting it.
 *
 * The Library is built from opencosmos-ai/knowledge, and every page has a file
 * there. This names that file and opens GitHub's editor on it, which forks and
 * opens a pull request for any signed-in reader. Renders nothing when the path
 * does not resolve, never a dead link.
 */
export default function SourceLinks({ docPath, prompt }: Props) {
  const hrefs = sourceHrefs(docPath)
  if (!hrefs) return null

  return (
    <section
      aria-label="Improve this text"
      className="mt-12 pt-8 border-t border-foreground/10"
    >
      <p className="text-xs uppercase tracking-widest text-foreground/30 mb-3">
        This text lives in the commons
      </p>
      <p className="text-sm text-foreground/50 leading-relaxed mb-5 max-w-prose">
        {prompt} The source is public, and a correction reaches the Library once
        it has been reviewed.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <a href={hrefs.edit} target="_blank" rel="noopener noreferrer">
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            Suggest an edit
            <span className="sr-only"> (opens GitHub in a new tab)</span>
          </a>
        </Button>
        <a
          href={hrefs.view}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
        >
          <GitHubIcon className="w-3.5 h-3.5" aria-hidden="true" />
          View source
          <span className="sr-only"> (opens GitHub in a new tab)</span>
        </a>
      </div>
    </section>
  )
}
