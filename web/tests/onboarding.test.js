// The two ways in that were reported broken from a phone.
//
// Neither is logic, so these are source checks: what regresses is the wiring,
// and both bugs were a line that looked right.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')

describe('opening the demo', () => {
  const app = read('App.jsx')
  const onDemo = app.slice(app.indexOf('onDemo={'), app.indexOf('onDemo={') + 900)

  it('does not route through the guard that was swallowing it', () => {
    // go() reads lib.status from the render its closure was built in. Straight
    // after useDemo() resolves that still says no library is open, so go files
    // the destination as pending and returns, and nothing collects it: the
    // pending view is only read while the storage question is on screen, and
    // the demo never asks it. The books loaded and the page did not move.
    expect(onDemo).toContain("setView('catalog')")
    expect(onDemo).not.toContain("go('catalog')")
  })

  it('clears any destination the guard had already filed', () => {
    expect(onDemo).toContain('setPendingView(null)')
  })
})

describe('photographing a shelf', () => {
  const shelf = read('views/Shelf.jsx')
  const zone = read('components/DropZone.jsx')

  it('offers taking a picture, not only choosing one', () => {
    // The box said "take or choose" and could only choose: a plain file input
    // opens the gallery, and taking a picture needs capture.
    expect(shelf).toContain('capture="environment"')
  })

  it('keeps the two on separate inputs', () => {
    // capture on the box itself would take the gallery away, which is the
    // commoner case: most people photograph the shelf first and open the app
    // afterwards.
    expect(zone).not.toContain('capture')
  })

  it('offers it only where it does anything', () => {
    // A desktop browser ignores capture and opens the same dialog the box
    // opens, so the button would be a second way to do the one thing.
    expect(shelf).toContain("'(pointer: coarse)'")
    expect(shelf).toContain('HAS_CAMERA &&')
  })

  it('no longer promises taking in the box that cannot', () => {
    const en = readFileSync(new URL('../src/i18n/en.js', import.meta.url), 'utf8')
    expect(en).toContain("'shelf.dropPhoto': 'Choose a photograph'")
    expect(en).toContain("'shelf.takePhoto': 'Take a photograph'")
  })
})
