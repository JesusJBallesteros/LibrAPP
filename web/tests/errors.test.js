// Where a failure appears.
//
// A message the person never sees is the same as no message: the press looks
// like it did nothing, and the next thing they try is pressing it again. This
// came in from a phone, where keeping a page of scanned books puts the button
// near the bottom and put the failure off the top of the screen.
//
// These are source checks rather than rendered ones. What regresses here is not
// the logic but the wiring: someone adds a lib.run for a new button and the
// error quietly goes back to the banner nobody can see.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')

// Every page where the control that writes is a long way from the top of the
// page, or behind an overlay that covers it.
const FAR_FROM_THE_TOP = [
  'components/IsbnLookup.jsx',
  'components/BookPanel.jsx',
  'views/ListImport.jsx',
  'views/Shelf.jsx',
]

describe('a failure lands beside the control that caused it', () => {
  for (const path of FAR_FROM_THE_TOP) {
    it(`${path} routes every write it makes`, () => {
      const src = read(path)
      const runs = (src.match(/lib\??\.run\(/g) || []).length
      const routed = (src.match(/onError:/g) || []).length
      expect(runs).toBeGreaterThan(0)
      expect(routed).toBe(runs)
    })

  }

  // BookPanel renders nothing itself: it hands the message to whichever of the
  // two it is showing, and both of those sit inside an overlay that covers the
  // page banner completely.
  it('carries an overlay failure down to the panel being shown', () => {
    expect(read('components/BookPanel.jsx').match(/saveError=\{saveError\}/g)).toHaveLength(2)
    for (const child of ['components/BookDetail.jsx', 'components/BookEditor.jsx']) {
      expect(read(child)).toContain('saveError')
      expect(read(child)).toContain('role="alert"')
    }
  })

  for (const path of ['components/IsbnLookup.jsx', 'views/ListImport.jsx', 'views/Shelf.jsx']) {
    it(`${path} has somewhere to put it`, () => {
      expect(read(path)).toContain('role="alert"')
    })
  }

  it('hands the caller the message instead of the banner, never both', () => {
    const src = read('store/useLibrary.js')
    expect(src).toContain('if (onError) onError(err.message)')
    expect(src).toContain('else setError(err.message)')
  })

  it('brings the banner into view when it is the only place left', () => {
    // The fallback for a control with no room beside it, a star at the foot of
    // a long shelf. Not smooth: smooth scrolling is skipped when the page is
    // not being composited.
    const src = read('App.jsx')
    expect(src).toContain("banner.current?.scrollIntoView({ block: 'center' })")
    expect(src).not.toContain("behavior: 'smooth'")
  })
})
