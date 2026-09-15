// The two ways in that were reported broken from a phone.
//
// Neither is logic, so these are source checks: what regresses is the wiring,
// and both bugs were a line that looked right.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')

describe('opening the demo', () => {
  const app = read('App.jsx')
  const onDemo = app.slice(app.indexOf('onDemo: async'), app.indexOf('onDemo: async') + 900)

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

// The shell at three widths.
//
// The old sidebar took 663 of 844 pixels on a phone before a single book
// appeared. The six places are now a bar along the foot of a phone and a rail
// down the left of anything wider; the counts get a column of their own only
// where there is room for one.
describe('the shell', () => {
  const app = read('App.jsx')
  // Carriage returns stripped: the stylesheet is stored with CRLF and any
  // anchor below that spans a line would miss.
  const css = read('styles.css').split(String.fromCharCode(13)).join('')

  it('names six places and marks the current one', () => {
    const nav = app.slice(app.indexOf('const NAV = ['), app.indexOf(']', app.indexOf('const NAV = [')))
    for (const key of ['home', 'catalog', 'add', 'desk', 'stacks', 'about']) {
      expect(nav, key).toContain(`key: '${key}'`)
    }
    expect(app).toContain("aria-current={(id === 'shelf' ? inAdd : view === id) ? 'page' : undefined}")
  })

  it('gives every icon a word beside it', () => {
    expect(app).toContain('<Icon aria-hidden="true" focusable="false" />')
    expect(app).toContain("{t(`nav.short.${key}`)}")
  })

  it('is a bar along the foot of a phone and a rail from 640px', () => {
    const rail = css.slice(css.indexOf('.rail {'), css.indexOf('}', css.indexOf('.rail {')))
    expect(rail).toContain('position: fixed')
    expect(rail).toContain('bottom: 0')
    const wide = css.slice(css.indexOf('@media (min-width: 640px) {\n  .shell'))
    expect(wide).toContain('grid-template-columns: 82px minmax(0, 1fr)')
    expect(wide).toContain('position: sticky')
  })

  it('keeps the page clear of the bar on a phone', () => {
    expect(css).toContain('.shell { min-height: 100vh; padding-bottom: 76px; }')
    expect(css).toContain('.librarian { right: 16px; bottom: 88px;')
  })

  it('gives the counts a column from 1040px, and the stacks page below that', () => {
    expect(css).toContain('grid-template-columns: 82px minmax(0, 1fr) 292px')
    expect(css).toContain(".shell[data-view='storage'] .margin {")
    expect(app).toContain('data-view={view}')
  })

  it('draws the four ways in on the ring the desk uses', () => {
    const add = read('views/Add.jsx')
    for (const id of ['shelf', 'list', 'barcode', 'kindle']) expect(add, id).toContain(`id: '${id}'`)
    expect(add).toContain('<Ring')
    expect(app).toContain('<Add view={view} onGo={go}>')
  })
})

// A Tell me how says how to do the thing beside it. The reasons belong on About
// and in the docs.
describe('the tell me how texts', () => {
  const en = read('i18n/en.js')
  const how = [...en.matchAll(/'(shelf\.[\w.]*\.how)':\s*'([^']*)'/g)]

  it('are all found', () => {
    expect(how.length).toBe(5)
  })

  it('give steps, not reasons', () => {
    for (const [, key, text] of how) {
      expect(text, key).not.toMatch(/\bbecause\b|\bso that\b|\bdecides\b/)
      expect(text.length, key).toBeLessThan(200)
    }
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

// The catalog opens on books, not on the controls for narrowing which books.
describe('the filters fold away', () => {
  const catalog = read('views/Catalog.jsx')

  it('starts closed', () => {
    expect(catalog).toContain('const [searchOpen, setSearchOpen] = useState(false)')
  })

  it('leaves the way in and the choice of how to draw them', () => {
    // The view mode is not a filter: it decides how the same books are drawn,
    // so it stays out where it can be reached.
    const headAt = catalog.indexOf('className="toolbar-head"')
    const head = catalog.slice(headAt, catalog.indexOf('{searchOpen &&', headAt))
    expect(head).toContain("t('catalog.search')")
    expect(head).toContain('view-mode')
    expect(head).toContain('aria-controls="catalog-filters"')
  })

  it('says how many things are narrowing the list while it is closed', () => {
    // A shelf with two thirds of it missing and no visible reason is the one
    // thing folding these away could cost.
    expect(catalog).toContain('const narrowing =')
    expect(catalog).toContain('{!searchOpen && narrowing > 0 &&')
  })

  it('opens itself for anything that arrives narrowing the list', () => {
    // The rule the inner disclosure already followed: nothing narrows the list
    // with its own control out of sight.
    const effect = catalog.slice(catalog.indexOf('if (focus?.tag)'), catalog.indexOf('}, [focus])'))
    for (const arriving of ['tag', 'read', 'favourite', 'loan']) {
      expect(effect, arriving).toContain(`focus?.${arriving}`)
    }
    // Four narrowing filters, each opening it; sorting is not one of them.
    expect(effect.match(/setSearchOpen\(true\)/g)).toHaveLength(4)
    const sorting = effect.slice(effect.indexOf('focus?.sort'))
    expect(sorting.slice(0, 60)).not.toContain('setSearchOpen')
  })
})

// Choosing where the catalog lives, and knowing what is set up.
describe('picking a folder', () => {
  const setup = read('views/Setup.jsx')
  const store = read('store/useLibrary.js')
  const app = read('App.jsx')

  it('shows which folder was picked instead of taking it', () => {
    // A picker is easy to answer with the wrong directory, and nothing said
    // which one had been answered with.
    expect(setup).toContain('if (chosen) {')
    expect(setup).toContain("t('setup.chosen.next')")
    expect(setup).toContain("t('setup.chosen.change')")
  })

  it('hands the adopted library back rather than only storing it', () => {
    // The caller names the folder, and the state it would read for that
    // belongs to the render it was called from. That is the trap that
    // swallowed the demo button.
    const useFolder = store.slice(store.indexOf('const useFolder'), store.indexOf('const useDemo'))
    expect(useFolder).toContain('return library')
    expect(app).toContain('const library = await lib.useFolder()')
    expect(app).toContain('setPicked(library?.where ?? null)')
  })

  it('asks the library where it is rather than reaching into the backend', () => {
    expect(read('store/library.js')).toContain('get where()')
  })
})

describe('what is set up so far', () => {
  const strip = read('components/SetUpSoFar.jsx')

  it('says nothing to somebody who has not started', () => {
    // Before a library exists every line reads as not done, which is a wall of
    // empty boxes in front of somebody who has not begun, and the ways in
    // below are the whole of what there is to do anyway.
    expect(strip).toContain("if (lib.status !== 'ready' || !lib.library) return null")
  })

  it('gathers the three answers that live in three places', () => {
    // The keys are built from the row id, so the literals are not in the
    // source and the key audit in i18n.test.js cannot see them either.
    for (const id of ['storage', 'books', 'key']) {
      expect(strip, id).toContain("id: '" + id + "'")
    }
    const en = read('i18n/en.js')
    for (const id of ['storage', 'books', 'key']) {
      expect(en, id).toContain("'setUp." + id + "':")
    }
  })

  it('offers a way on only where something is missing', () => {
    expect(strip).toContain('{!row.done && (')
  })
})
