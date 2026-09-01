// Reading other people's files, which is where a catalog picks up its worst
// habits. A parser that guesses becomes a catalog that lies, so most of what is
// checked here is refusal and restraint: the date it will not invent, the
// wishlist it will not import as a library, the spine it will not pretend to
// have read.

import { describe, expect, it } from 'vitest'
import {
  COLUMNS,
  headerKey,
  isCollapsed,
  parseDate,
  parseFormats,
  missingFields,
  parseRead,
  readCsv,
  rowsToRecords,
} from '../src/ingest/table.js'
import { TranscriptionError, loadTranscription, suggestGrid, tileBoxes } from '../src/ingest/shelf.js'

// Which field a heading names, the way rowsToRecords works it out.
const fieldFor = (heading) => {
  const key = headerKey(heading)
  return Object.keys(COLUMNS).find((field) => COLUMNS[field].includes(key)) || null
}

describe('column headings', () => {
  it('recognises the same column in several languages', () => {
    // Somebody keeping a Spanish spreadsheet should not have to rename their
    // headings to be understood.
    for (const heading of ['Title', 'Título', 'Titel', 'Libro']) {
      expect(fieldFor(heading), heading).toBe('title')
    }
    expect(fieldFor('Autor')).toBe('authors')
    expect(fieldFor('Género')).toBe('genre')
    expect(fieldFor('Gelesen')).toBe('read')
  })

  it('ignores case, accents and punctuation', () => {
    expect(headerKey('  TÍTULO  ')).toBe('titulo')
    expect(headerKey('Series_Index')).toBe('series index')
  })

  it('does not claim a heading it has no field for', () => {
    // Calibre writes its user-defined columns as #something, and nothing here
    // can know what one means.
    expect(fieldFor('#rev')).toBeNull()
    expect(fieldFor('My Rating')).toBeNull()
  })

  it('claims the columns a real export turned out to be carrying', () => {
    // Each of these was present in a file somebody imported and dropped on the
    // floor. The date one cost the most: a whole library dated to nothing, and
    // the desk's waiting pile empty because it is ordered by that field.
    expect(fieldFor('ISBN')).toBe('isbn')
    expect(fieldFor('ISBN-13')).toBe('isbn')
    expect(fieldFor('ASIN')).toBe('asin')
    expect(fieldFor('timestamp')).toBe('acquired_on')
    expect(fieldFor('Date Added')).toBe('acquired_on')
    expect(fieldFor('pubdate')).toBe('published_year')
  })

  it('tells a date of publication from a date of acquisition', () => {
    // Calibre carries both. Swapped, a library is dated to the day it was
    // catalogued and every book claims to have been published then.
    expect(fieldFor('pubdate')).not.toBe('acquired_on')
    expect(fieldFor('timestamp')).not.toBe('published_year')
  })

  it('reads a Calibre custom column that happens to name a field it knows', () => {
    // #read is a column somebody added to Calibre by hand. The # is punctuation
    // and falls away, which is the right answer by luck rather than by design,
    // so it is pinned here.
    expect(fieldFor('#read')).toBe('read')
  })
})

describe('reading a value a person typed', () => {
  it('understands the ways people write yes', () => {
    expect(parseRead('yes')).toBe(true)
    expect(parseRead('sí')).toBe(true)
    expect(parseRead('x')).toBe(true)
    expect(parseRead('TRUE')).toBe(true)
  })

  it('understands the ways people write no', () => {
    expect(parseRead('no')).toBe(false)
    expect(parseRead('false')).toBe(false)
  })

  it('leaves a blank cell unknown rather than calling it unread', () => {
    // The distinction the whole catalog is built on: nobody said is not no.
    expect(parseRead('')).toBeNull()
    expect(parseRead(null)).toBeNull()
    expect(parseRead('maybe?')).toBeNull()
  })

  it('reads a date only when it is unambiguous', () => {
    expect(parseDate('2019-04-02')).toBe('2019-04-02')
    expect(parseDate('')).toBeNull()
    expect(parseDate('sometime in the spring')).toBeNull()
  })

  it('takes only formats it knows, and nothing else', () => {
    expect(parseFormats('ebook')).toEqual(['ebook'])
    expect(parseFormats('papyrus')).toEqual([])
  })
})

describe('a row standing for several books', () => {
  it('spots a row that names a range of volumes', () => {
    expect(isCollapsed('The Sandman, vols. 1-10', null)).toBe(true)
  })

  it('leaves an ordinary single volume alone', () => {
    expect(isCollapsed('Dune', 1)).toBe(false)
  })
})

describe('CSV', () => {
  it('reads quoted fields containing commas and newlines', () => {
    const rows = readCsv('title,author\n"Dune, Part One","Herbert, Frank"\n')
    expect(rows[1]).toEqual(['Dune, Part One', 'Herbert, Frank'])
  })

  it('reads an escaped quote inside a quoted field', () => {
    const rows = readCsv('title\n"He said ""no"""\n')
    expect(rows[1][0]).toBe('He said "no"')
  })
})

describe('cutting a photograph into tiles', () => {
  it('leaves a small photograph whole', () => {
    // A close-up of three books split into six pieces was a real failure: the
    // tiles held no whole spines at all.
    expect(suggestGrid(3072, 4096)).toEqual({ cols: 1, rows: 1 })
  })

  it('splits a photograph too large to read in one piece', () => {
    const grid = suggestGrid(12000, 4000)
    expect(grid.cols).toBeGreaterThan(1)
  })

  it('overlaps the tiles, so a book on a seam is whole in one of them', () => {
    const [first, second] = tileBoxes(4000, 1000, 2, 1)
    const [, , firstRight] = first.box
    const [secondLeft] = second.box
    expect(firstRight).toBeGreaterThan(secondLeft)
  })

  it('covers the whole photograph, edge to edge', () => {
    const boxes = tileBoxes(4000, 1000, 3, 1)
    expect(boxes[0].box[0]).toBe(0)
    expect(boxes[boxes.length - 1].box[2]).toBe(4000)
  })

  it('names and numbers every tile, so a person can point at one', () => {
    const boxes = tileBoxes(4000, 2000, 2, 2)
    expect(boxes).toHaveLength(4)
    expect(boxes.map((b) => b.tile)).toEqual([
      'tile-r1c1.jpg',
      'tile-r1c2.jpg',
      'tile-r2c1.jpg',
      'tile-r2c2.jpg',
    ])
  })
})

describe('a transcription coming back', () => {
  const good = {
    photo: 'shelf.jpg',
    shelves: [
      {
        location: 'top shelf, left',
        books: [
          { title: 'Dune', authors: ['Frank Herbert'], confidence: 'high' },
          { title: 'Blurred One', authors: [], confidence: 'low' },
        ],
      },
    ],
  }

  it('turns shelves of books into records', () => {
    const { records, stats } = loadTranscription(good)
    expect(records).toHaveLength(2)
    expect(stats.photo).toBe('shelf.jpg')
    expect(records[0].location).toBe('top shelf, left')
  })

  it('counts and flags the spines it could not read cleanly', () => {
    const { records, stats } = loadTranscription(good)
    expect(stats.uncertain_spines).toBe(1)
    expect(records[1].flags).toContain('illegible_spine')
  })

  it('refuses a file that is not a transcription at all', () => {
    expect(() => loadTranscription({ books: [] })).toThrow(TranscriptionError)
    expect(() => loadTranscription(null)).toThrow(/no "shelves" list/)
  })

  it('refuses an untitled book instead of importing a blank row', () => {
    expect(() =>
      loadTranscription({ shelves: [{ location: 'x', books: [{ title: '  ' }] }] }),
    ).toThrow(/has no title/)
  })

  it('refuses a confidence value it does not recognise', () => {
    // A model inventing its own vocabulary must stop here. Downstream, an
    // unknown confidence would silently rank as nothing at all.
    expect(() =>
      loadTranscription({ shelves: [{ books: [{ title: 'Dune', confidence: 'pretty sure' }] }] }),
    ).toThrow(/unknown confidence/)
  })

  it('records nothing a photograph cannot see', () => {
    // No purchase date, no reading history. A photograph shows a spine.
    const { records } = loadTranscription(good)
    expect(records[0].acquired_on).toBeUndefined()
    expect(records[0].read).toBeUndefined()
  })
})

// A spreadsheet with no read column silently empties half the desk: every book
// counts as not recorded, and the unread pile excludes those on purpose. The
// import used to say nothing about it, so the app looked broken instead of
// under-fed.
describe('what a list did not carry', () => {
  const rows = (over = {}) => [
    { title: 'Dune', authors: ['Frank Herbert'], read: true, acquired_on: '2020-01-01',
      genre: 'Science fiction', series: null, publisher: 'Ace', ...over },
  ]

  it('says nothing when the list carries everything', () => {
    expect(missingFields(rows()).filter((f) => f !== 'series')).toEqual([])
  })

  it('names a column that is not there at all', () => {
    expect(missingFields(rows({ read: null }))).toContain('read')
  })

  it('names a column that is there and empty in every row', () => {
    // Costs exactly what an absent column costs, and a reader looking at their
    // own file would call both "it's not in there".
    expect(missingFields(rows({ genre: '' }))).toContain('genre')
  })

  it('counts an empty author list as no authors', () => {
    expect(missingFields(rows({ authors: [] }))).toContain('authors')
  })

  it('does not name a column one row happens to fill', () => {
    const some = [...rows({ read: null }), ...rows({ title: 'Foundation', read: false })]
    expect(missingFields(some)).not.toContain('read')
  })

  it('treats false as a recorded value, since unread is an answer', () => {
    expect(missingFields(rows({ read: false }))).not.toContain('read')
  })

  it('has nothing to say about an empty file', () => {
    expect(missingFields([])).toEqual([])
    expect(missingFields(null)).toEqual([])
  })

  it('only mentions fields whose absence costs something', () => {
    // location and keywords are absent here and are deliberately not reported.
    expect(missingFields(rows())).not.toContain('location')
    expect(missingFields(rows())).not.toContain('keywords')
  })
})
