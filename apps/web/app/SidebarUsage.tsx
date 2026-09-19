'use client'

import { useEffect, useState } from 'react'
import { TokenGauge } from '@/components/TokenGauge'

type UsageState =
  | { kind: 'idle' }
  | { kind: 'unlimited' }                                      // BYOK — truly unlimited
  | { kind: 'tokens'; used: number; total: number }           // free tier

export function SidebarUsage() {
  const [state, setState] = useState<UsageState>({ kind: 'idle' })

  useEffect(() => {
    // Check localStorage immediately — if a BYOK key is present we know the user
    // is unlimited without waiting for the server response.
    if (localStorage.getItem('cosmo_api_key')) {
      setState({ kind: 'unlimited' })
      return
    }

    fetch('/api/byok-status')
      .then((r) => r.json())
      .then((data) => {
        if (data.hasByok) {
          setState({ kind: 'unlimited' })
          return
        }
        return fetch('/api/session')
          .then((r) => r.json())
          .then((s: { tokensUsed: number; tokenBudget: number }) => {
            setState({ kind: 'tokens', used: s.tokensUsed, total: s.tokenBudget })
          })
      })
      .catch(() => {})
  }, [])

  if (state.kind === 'idle') return null

  if (state.kind === 'unlimited') {
    return (
      <span className="text-sm font-light text-[var(--color-success)] select-none">∞</span>
    )
  }

  return <TokenGauge used={state.used} total={state.total} compact />
}
