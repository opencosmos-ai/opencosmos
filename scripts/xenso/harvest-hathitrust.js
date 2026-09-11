/**
 * harvest-hathitrust.js — pull a full-view HathiTrust volume's page text into a
 * single .txt file, from inside your own browser session.
 *
 * WHY THIS EXISTS. babel.hathitrust.org sits behind a Cloudflare managed
 * challenge that requires JavaScript, so nothing server-side can fetch it —
 * not curl, not the importer, not an agent. Your browser has already passed
 * that challenge. This runs there.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BEFORE YOU RUN IT. HathiTrust's Terms of Use prohibit automated or systematic
 * downloading of content, and walking every page of a volume is what that
 * phrase describes — regardless of the work being public domain. Two things
 * follow, and they are yours to weigh, not mine:
 *
 *   1. Look for "Download whole book (PDF)" on the volume page first. Where it
 *      is offered it is the sanctioned route, it is one click, and the importer
 *      accepts the PDF directly. Use this if you can.
 *   2. If you use this script instead, it is your account and your institutional
 *      relationship. The default delay is deliberately slow. Do not lower it.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW TO RUN
 *
 *   1. Open the volume in your browser and get past any Cloudflare check:
 *        https://babel.hathitrust.org/cgi/pt?id=mdp.39015085786880
 *   2. Open the developer console (⌥⌘J in Chrome, ⌥⌘K in Firefox).
 *   3. Paste this whole file in and press return. Nothing happens yet.
 *   4. Run a single page first and read what comes back:
 *
 *        await probe(131)
 *
 *      If that prints the text of printed page 98, the selectors are right.
 *      If it prints navigation chrome or nothing, stop and send me what it
 *      printed — the extractor needs the real DOM, and guessing costs more
 *      than asking.
 *   5. Then harvest:
 *
 *        await harvest()                       // whole volume, from seq 1
 *        await harvest({ from: 120, to: 200 }) // a range, to test first
 *
 *   6. A .txt file downloads when it finishes. Drop it anywhere and run:
 *
 *        pnpm xenso:import-iching --only mcclatchie --from ~/Downloads/<file>.txt
 *
 * IT IS RESUMABLE. Progress lives in `window.__harvest`. If the tab is closed
 * or the run dies, `await harvest({ from: window.__harvest.lastSeq + 1 })`
 * continues, and `save()` writes out whatever has been collected so far.
 */

;(function () {
  const ID = new URLSearchParams(location.search).get('id') || 'mdp.39015085786880'

  const state = (window.__harvest = window.__harvest || {
    id: ID,
    pages: new Map(), // seq -> text
    lastSeq: 0,
  })

  /**
   * The accessible-text view. It is a plain page built for screen readers,
   * which is exactly why it is the right endpoint: no canvas, no image tiles,
   * just the OCR.
   */
  const ssdUrl = seq => `https://babel.hathitrust.org/cgi/ssd?id=${encodeURIComponent(state.id)};seq=${seq}`

  /**
   * Pull the page text out of the returned document. HathiTrust has moved this
   * container more than once, so several are tried in order and the last resort
   * is the body with the known chrome stripped. `probe()` exists so that you
   * can see which branch fired before trusting it with four hundred pages.
   */
  function extract(doc) {
    const selectors = ['#mdpPage', '#page-text', '.ssd-page', '#text', 'main', '#mdpMainContent']
    for (const sel of selectors) {
      const el = doc.querySelector(sel)
      const text = el && el.innerText ? el.innerText.trim() : ''
      if (text.length > 40) return { text, via: sel }
    }
    const body = (doc.body && doc.body.innerText) || ''
    const cleaned = body
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^(skip to|home|about|collections|help|log in|search|go to page|previous page|next page|page navigation|full view|hathitrust)/i.test(l))
      .join('\n')
      .trim()
    return { text: cleaned, via: 'body (fallback — check this)' }
  }

  async function fetchPage(seq) {
    const res = await fetch(ssdUrl(seq), { credentials: 'include' })
    if (!res.ok) throw new Error(`seq ${seq}: HTTP ${res.status}`)
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return extract(doc)
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms))

  window.probe = async function probe(seq = 1) {
    const { text, via } = await fetchPage(seq)
    console.log(`seq ${seq} — matched via: ${via}`)
    console.log(`${text.length} characters`)
    console.log('─'.repeat(60))
    console.log(text.slice(0, 1500))
    return text
  }

  window.save = function save(name) {
    const parts = [...state.pages.keys()]
      .sort((a, b) => a - b)
      .map(seq => `\f[seq=${seq}]\n${state.pages.get(seq)}`)
    const blob = new Blob([parts.join('\n\n')], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name || `${state.id.replace(/[^\w.-]/g, '_')}.txt`
    a.click()
    console.log(`saved ${state.pages.size} pages`)
  }

  window.harvest = async function harvest(opts = {}) {
    const { from = 1, to = null, delayMs = 1500, stopAfterBlank = 6 } = opts
    let blanks = 0

    for (let seq = from; to === null || seq <= to; seq++) {
      let page
      try {
        page = await fetchPage(seq)
      } catch (e) {
        // A 403 mid-run usually means the Cloudflare cookie expired. Reload the
        // volume page in another tab, then resume from where this stopped.
        console.warn(`${e.message} — stopping. Resume with: await harvest({ from: ${seq} })`)
        break
      }

      state.lastSeq = seq
      if (page.text.length < 20) {
        blanks++
        if (blanks >= stopAfterBlank) {
          console.log(`${blanks} blank pages in a row at seq ${seq} — assuming end of volume.`)
          break
        }
      } else {
        blanks = 0
        state.pages.set(seq, page.text)
      }

      if (seq % 10 === 0) console.log(`… seq ${seq}, ${state.pages.size} pages held`)
      await sleep(delayMs)
    }

    console.log(`done — ${state.pages.size} pages. Saving.`)
    window.save()
  }

  console.log(
    [
      `harvest-hathitrust ready for ${state.id}`,
      '',
      'Check one page first:   await probe(131)',
      'Then harvest:           await harvest()',
      'Range, to test:         await harvest({ from: 120, to: 200 })',
      'Write out early:        save()',
      '',
      'Read the header comment about HathiTrust’s terms before you start.',
    ].join('\n'),
  )
})()
