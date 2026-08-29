// Drawing a book as a spine, and marking a card.
//
// Both are decoration, which is exactly why they need tests: decoration that
// drifts starts to look like data. A spine that changed colour when a filter
// changed would suggest the colour meant something, and a call number built
// from a title would look like a classification the app never made.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  byline,
  callNumber,
  spineHash,
  spineHeight,
  spineMeasured,
  spineTint,
  spineWidth,
} from '../src/lib.js'

const authors = new Map([
  ['a1', { id: 'a1', display_name: 'Frank Herbert', sort_name: 'Herbert, Frank' }],
  ['a2', { id: 'a2', display_name: 'Ursula K. Le Guin', sort_name: 'Le Guin, Ursula K.' }],
])

describe('the colour a spine keeps', () => {
  it('gives the same id the same slot every time', () => {
    const first = spineHash('book-42', 8)
    for (let i = 0; i < 50; i++) expect(spineHash('book-42', 8)).toBe(first)
  })

  it('stays inside the range it was asked for', () => {
    for (let i = 0; i < 400; i++) {
      const slot = spineHash(`book-${i}`, 8)
      expect(slot).toBeGreaterThanOrEqual(0)
      expect(slot).toBeLessThan(8)
    }
  })

  it('does not put every book in one slot', () => {
    // A hash that collapsed would make a wall of one colour and still pass
    // every test above.
    const seen = new Set()
    for (let i = 0; i < 200; i++) seen.add(spineHash(`book-${i}`, 8))
    expect(seen.size).toBe(8)
  })

  it('numbers the tints from one, matching the --spine-N properties', () => {
    for (let i = 0; i < 200; i++) {
      const tint = spineTint({ id: `book-${i}` })
      expect(tint).toBeGreaterThanOrEqual(1)
      expect(tint).toBeLessThanOrEqual(8)
    }
  })

  it('survives a book with no id rather than throwing', () => {
    expect(() => spineTint({})).not.toThrow()
    expect(spineTint({})).toBeGreaterThanOrEqual(1)
  })
})

// Thickness is the one measurement on a shelf that is a fact about the book, so
// it is the one the page count drives. Three bands, because a shelf is read by
// eye and nobody is telling 260 pages from 280.
describe('how thick a spine is', () => {
  it('draws a short book thinner than a long one', () => {
    expect(spineWidth({ pages: 100 })).toBeLessThan(spineWidth({ pages: 500 }))
  })

  it('puts each band where it says it does', () => {
    expect(spineWidth({ pages: 1 })).toBe(34)
    expect(spineWidth({ pages: 150 })).toBe(34)
    expect(spineWidth({ pages: 151 })).toBe(42)
    expect(spineWidth({ pages: 300 })).toBe(42)
    expect(spineWidth({ pages: 301 })).toBe(52)
    expect(spineWidth({ pages: 4000 })).toBe(52)
  })

  it('is wide enough at its thinnest for a line of title', () => {
    // One line at 17px with a 1.15 line height is about 20px across the spine,
    // and the thinnest band has to hold it with room to sit in.
    expect(spineWidth({ pages: 1 })).toBeGreaterThanOrEqual(20)
  })

  it('draws a book with no page count at the middle width', () => {
    // Not because it is average, but because nothing is known. Drawing it thin
    // would be the app inventing a fact about the book.
    for (const pages of [null, undefined, 0, -20, 'many', NaN]) {
      expect(spineWidth({ title: 'A', pages })).toBe(42)
    }
    expect(spineWidth({})).toBe(42)
  })

  it('reads a count that arrived as a string, since a form field gives one', () => {
    expect(spineWidth({ pages: '500' })).toBe(spineWidth({ pages: 500 }))
  })

  it('no longer takes any notice of the format', () => {
    // Thickness used to come from whether the book was physical, which said
    // nothing about the book and only about how it was catalogued.
    expect(spineWidth({ formats: ['physical'], pages: 100 })).toBe(
      spineWidth({ formats: ['ebook'], pages: 100 }),
    )
  })

  it('says whether a thickness was measured or defaulted', () => {
    expect(spineMeasured({ pages: 320 })).toBe(true)
    expect(spineMeasured({ title: 'A' })).toBe(false)
    expect(spineMeasured({ pages: 0 })).toBe(false)
  })
})

describe('how tall a spine is', () => {
  it('stays inside the band whatever the title', () => {
    for (const title of ['', 'It', 'a'.repeat(400), 'Dune']) {
      const h = spineHeight({ title })
      expect(h).toBeGreaterThanOrEqual(150)
      expect(h).toBeLessThanOrEqual(250)
    }
  })

  it('makes a longer title a taller spine', () => {
    expect(spineHeight({ title: 'Dune' })).toBeLessThan(
      spineHeight({ title: 'The Left Hand of Darkness' }),
    )
  })

  it('stops growing once the title is very long, so one book cannot tower', () => {
    expect(spineHeight({ title: 'a'.repeat(60) })).toBe(spineHeight({ title: 'a'.repeat(400) }))
  })

  it('gives the same book the same height every time', () => {
    const book = { title: 'The Dispossessed' }
    expect(spineHeight(book)).toBe(spineHeight(book))
  })
})

describe('the shelf mark on the card', () => {
  it('builds it from the author sort name and the year acquired', () => {
    expect(callNumber({ authors: ['a1'], acquired_on: '2019-04-02' }, authors)).toBe('HER 2019')
  })

  it('drops the year when nothing recorded one', () => {
    expect(callNumber({ authors: ['a2'] }, authors)).toBe('LEG')
  })

  it('skips the punctuation and spacing in a sort name', () => {
    expect(callNumber({ authors: ['a2'], acquired_on: '2021-01-01' }, authors)).toBe('LEG 2021')
  })

  it('uses the author label when the book has no author record', () => {
    expect(callNumber({ author_label: 'Anonymous', acquired_on: '2020-06-01' }, authors)).toBe(
      'ANO 2020',
    )
  })

  it('gives no mark at all when nobody is recorded', () => {
    // sortName would fall back to the title here. A mark derived from a title
    // would read as a real classification and be nothing of the kind, so the
    // card goes without one.
    expect(callNumber({ title: 'A Book With No Author', acquired_on: '2020-06-01' }, authors)).toBe(
      null,
    )
  })

  it('gives no mark when the name carries no letters to take', () => {
    expect(callNumber({ author_label: '???' }, authors)).toBe(null)
  })
})

describe('naming the gap where an author would be', () => {
  it('returns null rather than a dash, so the caller can name it', () => {
    expect(byline({ title: 'Beowulf' }, authors)).toBe(null)
  })

  it('still returns the label a source recorded', () => {
    expect(byline({ author_label: 'Anonymous' }, authors)).toBe('Anonymous')
  })

  it('returns the names when there are names', () => {
    expect(byline({ authors: ['a1', 'a2'] }, authors)).toBe('Frank Herbert, Ursula K. Le Guin')
  })
})

// The spine palette is fixed and so is the lettering on it, which means the
// contrast between them can be checked once, here, rather than trusted. Half
// the fills are light enough that pale lettering on them read at under 2:1
// before each fill was given its own ink.
describe('the lettering on every spine fill', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
  // Parsed by hand rather than by regex: the pattern needs a backslash escape,
  // and a mistyped one here would silently match nothing and pass every test.
  const value = (name) => {
    const at = css.indexOf(`--${name}:`)
    if (at < 0) return null
    const hash = css.indexOf('#', at)
    const end = css.indexOf(';', at)
    if (hash < 0 || end < 0 || hash > end) return null
    return css.slice(hash, end).trim()
  }
  const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const luminance = (hex) => {
    const [r, g, b] = channels(hex).map((v) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  for (let tint = 1; tint <= 8; tint++) {
    it(`reads at 4.5:1 or better on --spine-${tint}`, () => {
      const fill = value(`spine-${tint}`)
      const ink = value(`spine-${tint}-ink`)
      expect(fill, `--spine-${tint} missing`).toBeTruthy()
      expect(ink, `--spine-${tint}-ink missing`).toBeTruthy()
      expect(contrast(fill, ink)).toBeGreaterThanOrEqual(4.5)
    })
  }

  it('gives every tint the hash can return an ink', () => {
    // spineTint returns 1..8. A ninth fill with no ink would fall back to an
    // inherited colour and could land anywhere.
    const tints = new Set()
    for (let i = 0; i < 400; i++) tints.add(spineTint({ id: `book-${i}` }))
    for (const tint of tints) expect(value(`spine-${tint}-ink`)).toBeTruthy()
  })
})

// Height is decoration and says so: a taller spine means a longer name, not a
// bigger book. It used to come from the page count, which put the one real
// measurement on the axis nobody reads a shelf by.
describe('height no longer comes from the page count', () => {
  it('ignores the page count entirely', () => {
    const title = 'The Dispossessed'
    const plain = spineHeight({ title })
    for (const pages of [1, 100, 900, 12000]) {
      expect(spineHeight({ title, pages })).toBe(plain)
    }
  })

  it('a long book with a short name is a short spine, and a thick one', () => {
    const doorstop = { title: 'It', pages: 1138 }
    const slim = { title: 'The Left Hand of Darkness', pages: 120 }
    expect(spineHeight(doorstop)).toBeLessThan(spineHeight(slim))
    expect(spineWidth(doorstop)).toBeGreaterThan(spineWidth(slim))
  })

  it('keeps every spine inside the band whatever it is given', () => {
    const wall = [
      { id: '1', title: 'Dune', pages: 412 },
      { id: '2', title: 'The Left Hand of Darkness' },
      { id: '3', title: 'It', pages: 1138 },
      { id: '4', title: 'a'.repeat(400), pages: 12000 },
      { id: '5', title: '' },
    ]
    for (const book of wall) {
      expect(spineHeight(book)).toBeGreaterThanOrEqual(150)
      expect(spineHeight(book)).toBeLessThanOrEqual(250)
    }
  })

  it('draws a wall that mixes measured and unmeasured thicknesses', () => {
    const wall = [
      { id: '1', title: 'Dune', pages: 412 },
      { id: '2', title: 'The Left Hand of Darkness' },
      { id: '3', title: 'It', pages: 1138 },
    ]
    expect(wall.map(spineMeasured)).toEqual([true, false, true])
    expect(wall.map(spineWidth)).toEqual([52, 42, 52])
  })
})

// The stamp at the foot of a read spine. It is drawn, not coloured: replacing
// the eight fills with two would have cost the wall the one thing that makes a
// book recognisable across a re-sort, so read state is a mark on top instead.
describe('the read stamp', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
  const mark = readFileSync(new URL('../src/components/ReadMark.jsx', import.meta.url), 'utf8')
  const catalog = readFileSync(new URL('../src/views/Catalog.jsx', import.meta.url), 'utf8')

  // Pulled out of the declarations rather than duplicated here, so the test
  // fails when one of the three numbers moves without the others.
  const px = (rule, prop) => {
    const at = css.indexOf(rule)
    expect(at).toBeGreaterThan(-1)
    const block = css.slice(at, css.indexOf('}', at))
    const key = block.indexOf(prop + ':')
    expect(key).toBeGreaterThan(-1)
    return Number(block.slice(key + prop.length + 1, block.indexOf(';', key)).replace('px', '').trim())
  }

  const size = px('.spine-mark {', 'width')
  const foot = px('.spine-mark {', 'bottom')
  const reserve = px('.spine.read {', 'padding-bottom')

  it('reserves enough of the spine that the lettering clears it', () => {
    // The title's max-height is 100% of the content box, so this padding is the
    // only thing keeping a long name off the stamp.
    expect(reserve).toBeGreaterThanOrEqual(size + foot)
  })

  it('fits across the thinnest spine there is', () => {
    expect(size).toBeLessThan(spineWidth({ pages: 100 }))
  })

  it('is drawn in the ink the spine already picked', () => {
    // Every stroke is currentColor, which is the per-fill ink proved at 4.5:1
    // above. A colour of its own would need eight more contrast checks and
    // would be the first thing to go stale when the palette moved.
    const strokes = [...mark.matchAll(/stroke="([^"]+)"/g)].map((m) => m[1])
    expect(strokes.length).toBeGreaterThan(0)
    for (const stroke of strokes) expect(stroke).toBe('currentColor')
    expect(mark).not.toMatch(/fill="(?!none)/)
  })

  it('marks read and nothing else', () => {
    // Unread and unrecorded are different answers and neither is one a stamp
    // can give, so only the true case draws anything.
    expect(catalog).toContain("readState(book) === 'read'")
    expect(catalog).toContain('{done && <ReadMark />}')
  })

  it('does not take the click away from the spine', () => {
    const at = css.indexOf('.spine-mark {')
    expect(css.slice(at, css.indexOf('}', at))).toContain('pointer-events: none')
  })
})
