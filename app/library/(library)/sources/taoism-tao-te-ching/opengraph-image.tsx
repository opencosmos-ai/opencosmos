import { ImageResponse } from 'next/og'
import { INK, Mark, OG_SIZE, Tile, interFonts, markPath } from '@/lib/og'

export const alt = 'Tao Te Ching — the Open Tao Te Ching, in the OpenCosmos Library'
export const size = OG_SIZE
export const contentType = 'image/png'

/** The Tao Te Ching's own mark, as its favicon is: 道 in place of the ensō. */
export const DAO_SVG = 'app/library/(library)/sources/taoism-tao-te-ching/icon.svg'

export default async function Image() {
  const [fonts, dao] = await Promise.all([interFonts(), markPath(DAO_SVG)])

  return new ImageResponse(
    (
      <Tile fonts={fonts}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 104px', gap: 76 }}>
          <Mark d={dao} size={330} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 22, letterSpacing: '0.18em', opacity: 0.5, marginBottom: 22 }}>LAOZI</div>
            <div style={{ fontSize: 84, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1 }}>Tao Te Ching</div>
            <div style={{ marginTop: 28, fontSize: 31, fontWeight: 300, lineHeight: 1.4, color: INK, opacity: 0.72 }}>
              A new English translation, made directly from the classical Chinese and given to the public domain.
            </div>
          </div>
        </div>
        <Footer />
      </Tile>
    ),
    { ...OG_SIZE, fonts }
  )
}

/** Where the tile is from, quietly, at the foot. Shared with the chapter tiles. */
export function Footer({ left }: { left?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 104,
        right: 104,
        bottom: 52,
        display: 'flex',
        justifyContent: left ? 'space-between' : 'flex-end',
        fontSize: 22,
        letterSpacing: '0.04em',
        opacity: 0.45,
      }}
    >
      {left && <div>{left}</div>}
      <div>OpenCosmos Library</div>
    </div>
  )
}
