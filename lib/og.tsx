// Link-preview tiles: the 1200×630 image a chat app or social site shows when
// a page is shared. Each opengraph-image.tsx composes these parts.
//
// The markup is inlined, not OpenGraphCard from @opencosmos/ui: the package
// bundle is "use client", so the component cannot render in a server image
// route (see app/xenso/opengraph-image.tsx). The look follows the favicons:
// the Character Atlas's light ink on dark, one mark, nothing else.
//
// Satori, which draws these, resolves no CSS variables (every colour is an
// explicit hex), and any element with more than one child needs display: flex.

import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const OG_SIZE = { width: 1200, height: 630 }

export const INK = '#F4F4F0'
export const GROUND = 'radial-gradient(circle at 30% 0%, #1E2024 0%, #0B0C0E 55%, #000000 100%)'

/**
 * Satori reads TTF, OTF and WOFF, but not WOFF2, which is all Google Fonts
 * serves a modern browser; an old User-Agent gets the TTF stylesheet. `text`
 * asks Google for just those glyphs, which keeps a CJK face to a few KB.
 * Returns null rather than throwing: a missing font should cost the tile its
 * typeface, never its existence.
 */
export async function googleFont(family: string, weight: number, text?: string): Promise<ArrayBuffer | null> {
  try {
    const params = new URLSearchParams({ family: `${family}:wght@${weight}` })
    if (text) params.set('text', text)
    const css = await fetch(`https://fonts.googleapis.com/css2?${params}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
      },
    })
    if (!css.ok) return null
    const url = (await css.text()).match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    if (!url) return null
    const font = await fetch(url)
    return font.ok ? await font.arrayBuffer() : null
  } catch {
    return null
  }
}

type Font = { name: string; data: ArrayBuffer; style: 'normal'; weight: 300 | 400 | 600 }

/** Inter stands in for the site's system UI face, which an image cannot load. */
export async function interFonts(): Promise<Font[]> {
  const [light, semibold] = await Promise.all([googleFont('Inter', 300), googleFont('Inter', 600)])
  const fonts: Font[] = []
  if (light) fonts.push({ name: 'Inter', data: light, style: 'normal', weight: 300 })
  if (semibold) fonts.push({ name: 'Inter', data: semibold, style: 'normal', weight: 600 })
  return fonts
}

/**
 * What to hand ImageResponse as `fonts`. An empty list is not "no fonts": it
 * replaces the default face ImageResponse carries, and Satori then throws "No
 * fonts are loaded" and fails the build when Google Fonts can't be reached.
 * Undefined keeps the default, so a failed fetch costs the tile its typeface
 * and nothing more.
 */
export function ogFonts<T>(fonts: T[]): T[] | undefined {
  return fonts.length ? fonts : undefined
}

/**
 * The glyph path from one of the site's favicon SVGs, so a tile's mark is the
 * favicon's mark exactly and there is one drawing of each, not two.
 */
export async function markPath(svgFile: string): Promise<string> {
  const svg = await readFile(path.join(process.cwd(), svgFile), 'utf8')
  const d = svg.match(/<path[^>]*\sd="([^"]+)"/)?.[1]
  if (!d) throw new Error(`No path in ${svgFile}`)
  return d
}

/** A favicon mark at any size. The favicons draw in a 64-unit box with the ink inside 9–55. */
export function Mark({ d, size }: { d: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="9 9 46 46">
      <path d={d} fill={INK} />
    </svg>
  )
}

/** The page every tile is drawn on: the ground, the ink, the typeface. */
export function Tile({ children, fonts }: { children: React.ReactNode; fonts: Font[] }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundImage: GROUND,
        color: INK,
        fontFamily: fonts.length ? 'Inter' : 'sans-serif',
      }}
    >
      {children}
    </div>
  )
}
