// Section headings match DocViewer's h2, so a chapter page reads like every
// other Library document and the TableOfContents scroll offset still fits.
export const H2 = 'text-xl font-light text-foreground mt-12 mb-4 leading-snug scroll-mt-28'

/** The six sections of a chapter, in order (ADR 0020 §2). `listen` renders only when clips exist. */
export const SECTIONS = [
  { id: 'translation', text: 'Translation' },
  { id: 'original', text: 'Original' },
  { id: 'listen', text: 'Listen' },
  { id: 'terms', text: 'Terms' },
  { id: 'notes', text: 'Notes' },
  { id: 'discussion', text: 'Discussion' },
] as const
