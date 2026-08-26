// Marking where one run of the sort ends and the next begins.
//
// The band has to be derived from the same key the list was sorted by, not from
// what the row happens to show. Sorting by author orders on the surname while
// the row prints the given name, so a band worked out from the visible text
// would disagree with the order it is supposed to explain.

import { describe, expect, it } from 'vitest'
import { sortBand, withBands } from '../src/lib.js'

// The catalog folds its sort keys: lower case, accents stripped.
const book = (over = {}) => ({ id: 'b', _title: 'a book', _author: 'author', ...over })

describe('which band a book falls in', () => {
  it('takes the title initial when sorting by title', () => {
    expect(sortBand(book({ _title: 'dune' }), 'title')).toBe('D')
  })

  it('takes the author initial when sorting by author', () => {
    // _author holds the folded sort name, so this is the surname.
    expect(sortBand(book({ _author: 'abercrombie, joe', _title: 'the blade itself' }), 'author'))
      .toBe('A')
  })

  it('does not read the band off the title when sorting by author', () => {
    const b = book({ _author: 'le guin, ursula k.', _title: 'the dispossessed' })
    expect(sortBand(b, 'author')).toBe('L')
    expect(sortBand(b, 'title')).toBe('T')
  })

  it('takes the year when sorting by date, either way round', () => {
    const b = book({ acquired_on: '2019-04-02' })
    expect(sortBand(b, 'acquired')).toBe('2019')
    expect(sortBand(b, 'oldest')).toBe('2019')
  })

  it('has no band for a book with no date, under a date sort', () => {
    expect(sortBand(book(), 'acquired')).toBe(null)
  })

  it('puts everything that does not start with a letter in one band', () => {
    // A band each for 1, 2, ¿ and " would be a column of dividers.
    for (const title of ['1984', '2001: a space odyssey', '¿quien?', '"quoted"']) {
      expect(sortBand(book({ _title: title }), 'title')).toBe('#')
    }
  })

  it('has no band for an empty key rather than an empty label', () => {
    expect(sortBand(book({ _title: '' }), 'title')).toBe(null)
    expect(sortBand(book({ _title: '   ' }), 'title')).toBe(null)
  })

  it('survives a book missing the key entirely', () => {
    expect(() => sortBand({}, 'title')).not.toThrow()
    expect(sortBand({}, 'title')).toBe(null)
  })
})

describe('laying the markers through a list', () => {
  const titled = (...titles) => titles.map((t, i) => book({ id: `b${i}`, _title: t }))

  it('puts a marker before the first of each run', () => {
    const out = withBands(titled('apple', 'anvil', 'brick'), 'title')
    expect(out.map((i) => i.band ?? i.book._title)).toEqual(['A', 'apple', 'anvil', 'B', 'brick'])
  })

  it('marks a run once, however long it is', () => {
    const out = withBands(titled('a1', 'a2', 'a3', 'a4'), 'title')
    expect(out.filter((i) => i.band)).toHaveLength(1)
  })

  it('keeps every book, and keeps them in order', () => {
    const books = titled('apple', 'brick', 'cedar')
    const out = withBands(books, 'title')
    expect(out.filter((i) => i.book).map((i) => i.book._title)).toEqual(['apple', 'brick', 'cedar'])
  })

  it('returns nothing for an empty list', () => {
    expect(withBands([], 'title')).toEqual([])
  })

  it('carries a book or a band, never both', () => {
    for (const item of withBands(titled('apple', 'brick'), 'title')) {
      expect(Boolean(item.band) !== Boolean(item.book)).toBe(true)
    }
  })

  it('still lists a book that has no band, without inventing one', () => {
    // A date sort over books where some have no date recorded.
    const books = [
      book({ id: '1', acquired_on: '2019-01-01' }),
      book({ id: '2' }),
      book({ id: '3', acquired_on: '2020-01-01' }),
    ]
    const out = withBands(books, 'acquired')
    expect(out.filter((i) => i.book)).toHaveLength(3)
    expect(out.filter((i) => i.band).map((i) => i.band)).toEqual(['2019', '2020'])
  })

  it('does not re-open a band that the run already carries', () => {
    // An undated book between two of the same year must not split the year in
    // two, since the sort did not split it either.
    const books = [
      book({ id: '1', acquired_on: '2019-01-01' }),
      book({ id: '2' }),
      book({ id: '3', acquired_on: '2019-06-01' }),
    ]
    expect(withBands(books, 'acquired').filter((i) => i.band)).toHaveLength(1)
  })
})
