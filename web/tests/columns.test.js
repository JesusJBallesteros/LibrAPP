// What a list file turned out to be carrying, and what was being dropped.
//
// Two real exports went through the reader and most of what they held fell on
// the floor: a Calibre library of 1164 books lost every acquisition date, every
// publication year and all 479 volume numbers, and a Kindle export lost every
// ASIN and 80 ISBNs. None of it was refused. It was read, not recognised, and
// dropped without a word — and afterwards the reader was told the file "had no
// date column" while carrying a date in all 1164 rows.
//
// So the numbers in here are the ones those files actually produced. They are
// pinned because the cost of getting them wrong is silent.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  FIELDS,
  cleanAsin,
  describeColumns,
  detectShape,
  keptIsbn,
  loadTable,
  parseIndex,
  parseYear,
  rowsToRecords,
} from '../src/ingest/table.js'
import { normalise } from '../src/core/records.js'
import en from '../src/i18n/en.js'

/** A Calibre export, headings and quirks as Calibre writes them. */
const CALIBRE = [
  'authors,publisher,tags,timestamp,isbn,pubdate,series,series_index,title,#rev',
  '"Greg Bear","Júcar","Ciencia ficción","2013-11-08T13:26:45+01:00","9788433440235",' +
    '"1989-12-15T16:09:14+01:00","","1.0","La Fragua de Dios","attic"',
  '"Orson Scott Card","Edicions B","LEER","2013-11-08T13:27:20+01:00","",' +
    '"0101-01-01T00:00:00+00:00","La saga del retorno","2.0","La Memoria de la tierra",""',
].join('\n')

/** The Kindle exporter's own columns, N/A included. */
const KINDLE = [
  'ASIN,Title,Authors,ISBN-13,ISBN-10',
  '"B0CW18VSCX","Anarquismo no fundacional","Ibáñez, Tomás","N/A","N/A"',
  '"B00JDQEC7Y","Roadside Picnic","Strugatsky, Arkady","N/A","0026151707"',
  '"B06WP5JK1D","Breve historia de la ética","Camps, Victoria","9788411320405","8411320405"',
].join('\n')

const read = (name, text) => loadTable({ name, text })

describe('a Calibre export', () => {
  it('keeps the date the book entered the library', async () => {
    // Calibre calls it timestamp. Under that name it was dropped, and with it
    // went the whole of "Bought, and never opened", which is ordered by it.
    const { records } = await read('c.csv', CALIBRE)
    expect(records.map((r) => r.acquired_on)).toEqual(['2013-11-08', '2013-11-08'])
  })

  it('keeps the publication year, and refuses the one that is a placeholder', async () => {
    // 0101-01-01 is what Calibre writes for a date nobody filled in, on 43 rows
    // of one real library. Taken at face value it dates a shelf to the second
    // century.
    const { records } = await read('c.csv', CALIBRE)
    expect(records.map((r) => r.published_year)).toEqual([1989, null])
  })

  it('reads a volume number written as a decimal', async () => {
    const { records } = await read('c.csv', CALIBRE)
    expect(records[1].series_index).toBe(2)
  })

  it('will not number a book that is in no series', async () => {
    // Calibre writes 1.0 in this column for every book it holds. Read on its
    // own it puts "volume 1" on every standalone book in the library.
    const { records } = await read('c.csv', CALIBRE)
    expect(records[0].series).toBeNull()
    expect(records[0].series_index).toBeNull()
  })

  it('keeps an ISBN, as thirteen digits', async () => {
    const { records } = await read('c.csv', CALIBRE)
    expect(records[0].isbn).toBe('9788433440235')
  })
})

describe('a Kindle export', () => {
  it('keeps the ASIN, which is the only handle some of these books have', async () => {
    const { records } = await read('k.csv', KINDLE)
    expect(records.map((r) => r.asin)).toEqual(['B0CW18VSCX', 'B00JDQEC7Y', 'B06WP5JK1D'])
  })

  it('does not read N/A as an ISBN', async () => {
    const { records } = await read('k.csv', KINDLE)
    expect(records[0].isbn).toBeNull()
  })

  it('falls back to the ISBN-10 column when the ISBN-13 one says nothing', async () => {
    // Both columns name the same field, and the first to hold anything usable
    // claims it. Taking N/A at face value would drop a real number that is
    // sitting in the next column along.
    const { records } = await read('k.csv', KINDLE)
    expect(records[1].isbn).toBe('9780026151702')
  })

  it('prefers the thirteen-digit column where the row has both', async () => {
    const { records } = await read('k.csv', KINDLE)
    expect(records[2].isbn).toBe('9788411320405')
  })
})

describe('what the reading says it did', () => {
  it('names every column, in the order the file writes them', async () => {
    const { columns } = await read('c.csv', CALIBRE)
    expect(columns.map((c) => c.header)).toEqual([
      'authors', 'publisher', 'tags', 'timestamp', 'isbn',
      'pubdate', 'series', 'series_index', 'title', '#rev',
    ])
  })

  it('says which field each one fed', async () => {
    const { columns } = await read('c.csv', CALIBRE)
    const field = (header) => columns.find((c) => c.header === header)?.field
    expect(field('timestamp')).toBe('acquired_on')
    expect(field('pubdate')).toBe('published_year')
    expect(field('tags')).toBe('keywords')
  })

  it('says plainly when a column fed nothing', async () => {
    // The difference between a column that is missing and one that is present
    // and unrecognised is the whole point of this. Told the first when it is
    // the second, a reader goes looking for a column that is already there.
    const { columns } = await read('c.csv', CALIBRE)
    const rev = columns.find((c) => c.header === '#rev')
    expect(rev.field).toBeNull()
    expect(rev.used).toBe(false)
  })

  it('carries a value out of the file, since a heading is not always enough', async () => {
    // "timestamp" says nothing. "timestamp, e.g. 2013-11-08" says everything.
    const { columns } = await read('c.csv', CALIBRE)
    expect(columns.find((c) => c.header === 'timestamp').sample).toMatch(/^2013-11-08/)
  })

  it('does not offer a placeholder as a sample of what a column holds', async () => {
    const { columns } = await read('k.csv', KINDLE)
    expect(columns.find((c) => c.header === 'ISBN-13').sample).toBe('9788411320405')
  })

  it('counts the records a column filled, not the cells it held', async () => {
    // Calibre writes a series index on every row and most are dropped for
    // having no series. A count of cells would credit the column with rows it
    // did not fill, which is the same kind of lie in the other direction.
    const { records, columns } = await read('c.csv', CALIBRE)
    const rows = (header) => columns.find((c) => c.header === header).rows
    expect(rows('series_index')).toBe(records.filter((r) => r.series_index !== null).length)
    expect(rows('pubdate')).toBe(records.filter((r) => r.published_year !== null).length)
    expect(rows('isbn')).toBe(records.filter((r) => r.isbn !== null).length)
  })

  it('credits both ISBN columns for the rows each of them filled', async () => {
    const { columns } = await read('k.csv', KINDLE)
    expect(columns.find((c) => c.header === 'ISBN-13').rows).toBe(1)
    expect(columns.find((c) => c.header === 'ISBN-10').rows).toBe(1)
  })

  it('agrees with the records, because both come from one reading', async () => {
    // Two rules for what a column means would drift, and the page would end up
    // describing a reading that did not happen.
    const { records, columns } = await read('k.csv', KINDLE)
    for (const column of columns.filter((c) => c.used)) {
      expect(records.some((r) => r[column.field] !== null)).toBe(true)
    }
  })
})

describe('the pieces on their own', () => {
  it('takes a year only where a year is plausible', () => {
    expect(parseYear('1989-12-15T16:09:14+01:00')).toBe(1989)
    expect(parseYear('0101-01-01')).toBeNull()
    expect(parseYear('')).toBeNull()
    expect(parseYear('not a date')).toBeNull()
    expect(parseYear(String(new Date().getFullYear() + 5))).toBeNull()
  })

  it('takes a volume number whole or fractional', () => {
    expect(parseIndex('1.0')).toBe(1)
    expect(parseIndex('2.5')).toBe(2.5)
    expect(parseIndex('')).toBeNull()
    expect(parseIndex('one')).toBeNull()
  })

  it('keeps only an ISBN whose own check digit agrees', () => {
    expect(keptIsbn('9788433440235')).toBe('9788433440235')
    expect(keptIsbn('978-84-334-4023-5')).toBe('9788433440235')
    expect(keptIsbn('9788433440231')).toBeNull()
    expect(keptIsbn('N/A')).toBeNull()
  })

  it('takes an ASIN only in the shape Amazon writes them', () => {
    expect(cleanAsin('B0CW18VSCX')).toBe('B0CW18VSCX')
    expect(cleanAsin('b0cw18vscx')).toBe('B0CW18VSCX')
    expect(cleanAsin('N/A')).toBeNull()
    expect(cleanAsin('too-short')).toBeNull()
  })

  it('describes columns from rows it is handed, without a file', () => {
    const rows = [{ title: 'Dune', asin: 'B000FC0PDA' }]
    const columns = describeColumns(['Title', 'ASIN'], rows, { fed: new Map([['asin', 1]]) })
    expect(columns.map((c) => [c.field, c.rows])).toEqual([
      ['title', 0],
      ['asin', 1],
    ])
  })
})

describe('the record contract', () => {
  it('accepts everything a list now produces', async () => {
    // The contract refuses a field it does not know, which is what stops an
    // ingester writing something the builder quietly ignores. A new field has
    // to be added there before it can be written here.
    const { records } = await read('c.csv', CALIBRE)
    expect(() => records.map(normalise)).not.toThrow()
    expect(normalise(records[0]).asin).toBeNull()
  })

  it('keeps an ASIN through it', async () => {
    const { records } = await read('k.csv', KINDLE)
    expect(normalise(records[0]).asin).toBe('B0CW18VSCX')
  })

  it('leaves a row with no title out, however much else it holds', () => {
    const kept = rowsToRecords([{ title: '', asin: 'B0CW18VSCX', isbn: '9788433440235' }])
    expect(kept).toEqual([])
  })
})

describe('which program wrote the file', () => {
  it('knows a Kindle export by its ASIN column', async () => {
    const { columns } = await read('k.csv', KINDLE)
    expect(detectShape(columns)).toBe('kindle')
  })

  it('knows a Calibre export by the pair of dates only it writes', async () => {
    const { columns } = await read('c.csv', CALIBRE)
    expect(detectShape(columns)).toBe('calibre')
  })

  it('says nothing rather than guessing at a file it does not recognise', async () => {
    // A hand-kept spreadsheet is the common case, and naming a program that did
    // not write it would be worse than saying nothing.
    const plain = ['Title,Author', '"Dune","Frank Herbert"'].join(String.fromCharCode(10))
    const { columns } = await read('mine.csv', plain)
    expect(detectShape(columns)).toBeNull()
  })

  it('is judged on columns alone, so a file renamed is still itself', async () => {
    const { columns } = await read('anything.txt', KINDLE)
    expect(detectShape(columns)).toBe('kindle')
  })
})

describe('a column pointed somewhere else', () => {
  const withMapping = (text, mapping) => loadTable({ name: 'c.csv', text, mapping })

  it('is read as the field it was pointed at', async () => {
    // Calibre's tags are the nearest thing that file has to a genre, and only
    // the person whose library it is can say whether they are.
    const { records } = await withMapping(CALIBRE, { tags: 'genre' })
    expect(records[0].genre).toBe('Ciencia ficción')
    expect(records[0].keywords).toBeNull()
  })

  it('is left out when pointed at nothing', async () => {
    const { records } = await withMapping(CALIBRE, { publisher: null })
    expect(records[0].publisher).toBeNull()
    expect(records[0].title).toBe('La Fragua de Dios')
  })

  it('says what it was pointed at, and what it would have been', async () => {
    // Both, so a correction can be shown as a correction and put back.
    const { columns } = await withMapping(CALIBRE, { tags: 'genre' })
    const tags = columns.find((c) => c.header === 'tags')
    expect(tags.field).toBe('genre')
    expect(tags.guessed).toBe('keywords')
  })

  it('counts what it filled under its new meaning', async () => {
    const { columns } = await withMapping(CALIBRE, { tags: 'genre' })
    expect(columns.find((c) => c.header === 'tags').rows).toBe(2)
    const off = await withMapping(CALIBRE, { tags: null })
    expect(off.columns.find((c) => c.header === 'tags').rows).toBe(0)
  })

  it('can be pointed at a field this app never guesses from a heading', async () => {
    // #rev is a Calibre custom column and means whatever its owner meant.
    const { records } = await withMapping(CALIBRE, { rev: 'location' })
    expect(records[0].location).toBe('attic')
  })
})

describe('the column table has a name for every field it offers', () => {
  it('names each of them in English', () => {
    // The select is built from FIELDS and its labels are looked up by variable,
    // which the key audit cannot see. A field added without a label would show
    // its own key to the reader.
    const source = readFileSync(new URL('../src/views/ListImport.jsx', import.meta.url), 'utf8')
    const block = source.slice(source.indexOf('const FIELD_LABEL'), source.indexOf('const FORMAT_FOR_SHAPE'))
    const labelled = new Map([...block.matchAll(/(\w+):\s*'([\w.]+)'/g)].map((m) => [m[1], m[2]]))
    for (const field of FIELDS) {
      expect(labelled.has(field), `no label for ${field}`).toBe(true)
      expect(en[labelled.get(field)], `no English for ${field}`).toBeTruthy()
    }
  })
})
