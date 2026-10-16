import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/**
 * The Library's breadcrumb. Next.js Link-based so navigation back to the
 * Library stays a soft route change: the shared @opencosmos/ui Breadcrumbs
 * renders a plain <a href>, which triggers a full reload and remounts the chat
 * sidebar.
 */
export default function LibraryBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-10">
      <ol className="flex items-center flex-nowrap list-none m-0 p-0 text-sm overflow-x-auto scrollbar-hide">
        {items.map((item, i, arr) => {
          const isLast = i === arr.length - 1
          return (
            <li key={i} className="flex items-center flex-shrink-0">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[var(--color-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] font-medium px-1.5 py-1.5 -mx-1.5 -my-1.5 rounded transition-colors duration-150 active:scale-95"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="text-[var(--color-text-primary)] font-semibold"
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="mx-2 select-none text-[var(--color-border)] font-bold">
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
