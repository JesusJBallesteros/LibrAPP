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
  parseRead,
  readCsv,
  readXml,
  rowsToRecords,
  xmlSections,
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
    expect(fieldFor('ISBN')).toBeNull()
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

describe('XML', () => {
  const XML = `<?xml version="1.0"?>
    <library>
      <section name="Library">
        <book><title>Dune</title><author>Frank Herbert</author></book>
      </section>
      <section name="Wishlist">
        <book><title>Not Mine Yet</title><author>Someone</author></book>
      </section>
    </library>`

  it('lists the named sections a file holds', () => {
    expect(xmlSections(readXml(XML))).toEqual(expect.arrayContaining(['Library', 'Wishlist']))
  })

  it('imports only the section asked for', () => {
    // Importing a wishlist as a library is the mistake sections exist to
    // prevent.
    const mine = rowsToRecords(readXml(XML), 'Library')
    expect(mine.map((r) => r.title)).toEqual(['Dune'])
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
