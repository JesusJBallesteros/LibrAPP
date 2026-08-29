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

// The shell on a phone.
//
// It was taking 663 of 844 pixels before a single book appeared: seven names,
// each two lines since the names gained their glosses, and the counts under
// them. Every one of those is still here, one press away.
describe('the shell folds up on a phone', () => {
  const app = read('App.jsx')
  // Carriage returns stripped: the stylesheet is stored with CRLF and any
  // anchor below that spans a line would miss.
  const css = read('styles.css').split(String.fromCharCode(13)).join('')


  it('has a control that says what it is doing', () => {
    expect(app).toContain('className="menu-button"')
    expect(app).toContain('aria-expanded={menuOpen}')
    expect(app).toContain('aria-controls="shell-nav"')
    expect(app).toContain('id="shell-nav"')
  })

  it('folds back up on the way to wherever it was pointed', () => {
    // Left open, the destination would arrive underneath the menu that opened
    // it.
    const go = app.slice(app.indexOf('const go = useCallback'), app.indexOf('if (lib.status ='))
    expect(go).toContain('setMenuOpen(false)')
  })

  it('hides the nav and the counts only while it is folded', () => {
    const narrow = css.slice(css.indexOf('@media (max-width: 820px) {\n  .shell'))
    expect(narrow).toContain('.sidebar .nav,')
    expect(narrow).toContain('.sidebar.open .nav { display: flex; }')
    expect(narrow).toContain('.sidebar.open .sidebar-foot { display: flex; }')
  })

  it('does not draw the control where there is room for the column', () => {
    // Above the breakpoint the shell is always open and the button has nothing
    // to do, so the state it reads is never consulted.
    expect(css).toContain('.menu-button { display: none; }')
  })
})

// What the front page is for.
//
// It ran 2,623px on a 390px screen with the first way in 1,304px down, because
// almost every control carried a paragraph explaining itself. The explanations
// were not wrong and they were not deleted: About and the README carry them,
// and the page links there.
describe('the front page states the action', () => {
  const landing = read('views/Landing.jsx')
  const en = read('i18n/en.js')

  it('sends the case for the app to the page that makes it', () => {
    expect(landing).toContain("onGo('about', 'privacy')")
    expect(en).toContain("'landing.privacyLink'")
  })

  it('no longer carries About on the front page', () => {
    // Two panels restating the privacy argument and the requirements, both of
    // which About says in full and better.
    for (const key of ['landing.privacy.body', 'landing.needs.storage', 'landing.subhead']) {
      expect(landing, key).not.toContain(key)
      expect(en, key).not.toContain(`'${key}'`)
    }
  })

  it('keeps the paragraph that says what leaves the device, on About', () => {
    // The claim itself must survive the move, or the link points at nothing.
    expect(en).toContain("'about.privacy.requests'")
    expect(en).toContain("'about.privacy.device'")
  })
})
