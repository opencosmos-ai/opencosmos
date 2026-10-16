import { ImageResponse } from 'next/og'
import { INK, Mark, OG_SIZE, Tile, interFonts, markPath } from '@/lib/og'

export const alt = 'OpenCosmos — an ensō, drawn in one stroke'
export const size = OG_SIZE
export const contentType = 'image/png'

/**
 * The link preview for every page that has none of its own: the favicon's
 * ensō, large, beside the name and what the site says of itself.
 */
export default async function Image() {
  const [fonts, enso] = await Promise.all([interFonts(), markPath('app/icon.svg')])

  return new ImageResponse(
    (
      <Tile fonts={fonts}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 104px', gap: 76 }}>
          <Mark d={enso} size={330} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 84, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>OpenCosmos</div>
            <div
              style={{
                marginTop: 28,
                fontSize: 31,
                fontWeight: 300,
                lineHeight: 1.4,
                color: INK,
                opacity: 0.72,
              }}
            >
              A creative platform built on the recognition that we are not separate from the universe we inhabit.
            </div>
          </div>
        </div>
      </Tile>
    ),
    { ...OG_SIZE, fonts }
  )
}
