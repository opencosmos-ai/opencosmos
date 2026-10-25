import { getSearchIndex } from '@/lib/tao-te-ching'

/**
 * Every English line of the Tao Te Ching with the Chinese it renders, for the
 * landing page's search. A build-time artifact, kept out of the page's payload
 * for the reason the Library's quote index is (app/library/(library)/search-index):
 * only readers who type in the box need it. The page requests it on first focus.
 */
export const dynamic = 'force-static'

export async function GET() {
  return Response.json(getSearchIndex(), {
    headers: {
      // The text only changes on redeploy, which changes the build.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable',
    },
  })
}
