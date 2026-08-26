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

describe('how wide a spine is', () => {
  it('draws a physical book wider than one that is only a file', () => {
    expect(spineWidth({ formats: ['physical'] })).toBe(34)
    expect(spineWidth({ formats: ['ebook'] })).toBe(26)
  })

  it('counts physical when the book is both', () => {
    expect(spineWidth({ formats: ['ebook', 'physical'] })).toBe(34)
  })

  it('treats a book with no format recorded as not physical', () => {
    expect(spineWidth({})).toBe(26)
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

// A page count is the honest input for a spine's height, and a book has one only
// where somebody ticked the box while reading a photograph. A wall therefore
// mixes measured spines with ones sized from the title, and the caption says so.
describe('drawing a spine from a page count', () => {
  it('uses the count when one was recorded', () => {
    const thin = spineHeight({ title: 'A', pages: 100 })
    const thick = spineHeight({ title: 'A', pages: 800 })
    expect(thin).toBeLessThan(thick)
  })

  it('lets the count beat the title, rather than averaging the two', () => {
    // A short title on a long book must draw tall. If the title still had a
    // say, this would land somewhere in between and mean nothing.
    const shortTitleLongBook = spineHeight({ title: 'It', pages: 900 })
    const longTitleNoCount = spineHeight({ title: 'a'.repeat(60) })
    expect(shortTitleLongBook).toBeGreaterThanOrEqual(longTitleNoCount)
  })

  it('stays inside the same band as a title-sized spine', () => {
    for (const pages of [1, 80, 300, 900, 12000]) {
      const h = spineHeight({ title: 'A Book', pages })
      expect(h).toBeGreaterThanOrEqual(150)
      expect(h).toBeLessThanOrEqual(250)
    }
  })

  it('falls back to the title for a count that is not a usable number', () => {
    const fallback = spineHeight({ title: 'The Dispossessed' })
    for (const pages of [null, undefined, 0, -20, 'many', NaN]) {
      expect(spineHeight({ title: 'The Dispossessed', pages })).toBe(fallback)
    }
  })

  it('reads a count that arrived as a string, since a form field gives one', () => {
    expect(spineHeight({ title: 'A', pages: '800' })).toBe(spineHeight({ title: 'A', pages: 800 }))
  })

  it('says which rule drew each spine', () => {
    expect(spineMeasured({ title: 'A', pages: 320 })).toBe(true)
    expect(spineMeasured({ title: 'A' })).toBe(false)
    expect(spineMeasured({ title: 'A', pages: 0 })).toBe(false)
  })

  it('draws a wall that mixes both rules without either escaping the band', () => {
    const wall = [
      { id: '1', title: 'Dune', pages: 412 },
      { id: '2', title: 'The Left Hand of Darkness' },
      { id: '3', title: 'It', pages: 1138 },
    ]
    for (const book of wall) {
      expect(spineHeight(book)).toBeGreaterThanOrEqual(150)
      expect(spineHeight(book)).toBeLessThanOrEqual(250)
    }
    expect(wall.map(spineMeasured)).toEqual([true, false, true])
  })
})
