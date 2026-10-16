import { ImageResponse } from 'next/og'
import { INK, Mark, OG_SIZE, Tile, googleFont, interFonts, markPath } from '@/lib/og'
import { chapterNumbers, getChapter } from '@/lib/tao-te-ching'
import { DAO_SVG, Footer } from '../opengraph-image'

export const alt = 'A chapter of the Open Tao Te Ching, its opening line in Chinese and English'
export const size = OG_SIZE
export const contentType = 'image/png'

export function generateStaticParams() {
  return chapterNumbers().map((n) => ({ chapter: String(n) }))
}

/** The English that fits: whole verse lines, as many as fit the budget, never none. */
function opening(stanza: string[], budget: number): string[] {
  const out: string[] = []
  let used = 0
  for (const line of stanza) {
    if (out.length && used + line.length > budget) break
    out.push(line)
    used += line.length
  }
  return out
}

/**
 * A shared chapter previews its own first words: the Chinese line it opens
 * with, the English that renders it, and nothing that is not Laozi's — no
 * title (ADR 0021).
 */
export default async function Image({ params }: { params: Promise<{ chapter: string }> }) {
  const n = Number((await params).chapter)
  const chapter = getChapter(n)
  const zh = chapter?.lines[0]?.zh ?? ''
  const en = chapter ? opening(chapter.stanzas[0] ?? [], 120) : []

  // Noto Serif TC, the open Song face the favicon's 道 is drawn from, cut to
  // just this line's characters.
  const [fonts, dao, han] = await Promise.all([
    interFonts(),
    markPath(DAO_SVG),
    zh ? googleFont('Noto Serif TC', 600, zh) : Promise.resolve(null),
  ])
  const all = han ? [...fonts, { name: 'Noto Serif TC', data: han, style: 'normal' as const, weight: 600 as const }] : fonts

  // Sized to the measure (992px between the margins). The Chinese always fits
  // one line, with its 0.08em tracking. An English verse line fits one line
  // where it can — Inter Light runs about 0.48em a character — and only one
  // too long for that wraps, at a size that still reads.
  const MEASURE = 960
  const zhSize = Math.min(64, Math.floor(MEASURE / (Math.max(1, [...zh].length) * 1.08)))
  const longest = Math.max(1, ...en.map((l) => l.length))
  const enSize = longest > 80 ? 34 : Math.min(40, Math.floor(MEASURE / (longest * 0.48)))

  return new ImageResponse(
    (
      <Tile fonts={all}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '64px 104px 110px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Mark d={dao} size={46} />
            <div style={{ fontSize: 22, letterSpacing: '0.18em', opacity: 0.55 }}>
              {`TAO TE CHING · CHAPTER ${n}`}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            {han && zh && (
              <div
                style={{
                  fontFamily: 'Noto Serif TC',
                  fontSize: zhSize,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  lineHeight: 1.2,
                  marginBottom: 36,
                }}
              >
                {zh}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: enSize * 0.35 }}>
              {en.map((line, i) => (
                <div key={i} style={{ fontSize: enSize, fontWeight: 300, lineHeight: 1.35, color: INK, opacity: 0.88 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer left="Laozi · the Open Tao Te Ching" />
      </Tile>
    ),
    { ...OG_SIZE, fonts: all }
  )
}
