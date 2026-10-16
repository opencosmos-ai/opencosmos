'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { taoTeChingChapterFromAnchor, taoTeChingHref } from '@/lib/corpus-href'

/**
 * `/library/sources/taoism-tao-te-ching#twelve` → chapter 12.
 *
 * Until this reader, the whole book was one page with a heading per chapter,
 * and links into it carried the heading as a fragment. A fragment never
 * reaches the server, so the landing page forwards it here. Citations do not
 * need this — `docHref` maps them before they become links — but bookmarks,
 * shared links and pages elsewhere on the web do. PERMANENT, like the mapping.
 */
export default function LegacyAnchorRedirect() {
  const router = useRouter()
  useEffect(() => {
    const n = taoTeChingChapterFromAnchor(decodeURIComponent(window.location.hash.slice(1)))
    if (n) router.replace(taoTeChingHref(n))
  }, [router])
  return null
}
