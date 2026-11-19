// Section headings match DocViewer's h2, so a chapter page reads like every
// other Library document and the TableOfContents scroll offset still fits.
export const H2 = 'text-2xl font-light text-foreground mt-14 mb-6 leading-snug scroll-mt-28'

/** The line under a section heading that says what the section is, one style for every section. */
export const DESC = 'text-base leading-relaxed text-foreground/70'

/** The sections of a chapter, in order (ADR 0020 §2). `listen` renders only when clips exist. */
export const SECTIONS = [
  { id: 'translation', text: 'Translation' },
  { id: 'original', text: 'Original' },
  { id: 'listen', text: 'Listen' },
  { id: 'terms', text: 'Key Terms' },
  { id: 'notes', text: 'Notes' },
  { id: 'sources', text: 'Sources' },
  { id: 'discussion', text: 'Discussion' },
] as const

export const SOURCE_LINK = 'underline underline-offset-4 decoration-foreground/45 hover:decoration-inherit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]'
