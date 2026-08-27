// Corrections are where a person overrules the sources, and a wrong correction
// is unrecoverable unless it can be audited. Removing a book cannot delete it,
// because the next rebuild reads the same sources and puts it back, so removal
// is a tombstone. A tombstone that stops working looks like a book reappearing
// on its own.

import { describe, expect, it } from 'vitest'
import { makeSource, readSource } from '../src/core/records.js'
import { build } from '../src/core/build.js'
import {
  applyOverrides,
  clearOverride,
  emptyOverrides,
  readOverrides,
  setOverride,
  setRemoved,
} from '../src/core/overrides.js'

const shelf = (records) =>
  readSource(
    makeSource({
      name: 'list',
      kind: 'table',
      origin: 'books.xlsx',
      format: 'physical',
      confidence: 'medium',
      records,
    }),
    'list',
  )

const catalogOf = (records) => build([shelf(records)])

// Never by position. The catalog sorts by author, so books[0] depends on the
// fixtures rather than on what a test meant to name.
const pick = (catalog, needle) => catalog.books.find((b) => b.title.includes(needle))

const BOOKS = [
  { title: 'Crítica de la razón pura', authors: ['Immanuel Kant'], genre: 'Philosophy' },
  { title: 'Dune', authors: ['Frank Herbert'], genre: 'Science fiction' },
]

describe('recording a correction', () => {
  it('refuses to override a field that is not the reader to decide', () => {
    const book = pick(catalogOf(BOOKS), 'Crítica')
    expect(() => setOverride(emptyOverrides(), book, { sources: ['made up'] })).toThrow(
      /cannot be overridden/,
    )
  })

  it('keeps earlier corrections to the same book when a later one lands', () => {
    const book = pick(catalogOf(BOOKS), 'Crítica')
    let overrides = setOverride(emptyOverrides(), book, { genre: 'Metaphysics' })
    overrides = setOverride(overrides, book, { read: true })
    expect(overrides.entries[book.id].set).toEqual({ genre: 'Metaphysics', read: true })
  })
})

describe('applying corrections', () => {
  it('overrules what every source says', () => {
    const catalog = catalogOf(BOOKS)
    const book = pick(catalog, 'Crítica')
    const corrected = applyOverrides(catalog, setOverride(emptyOverrides(), book, { genre: 'Metaphysics' }))
    expect(pick(corrected, 'Crítica').genre).toBe('Metaphysics')
  })

  it('says so, and keeps what the sources had said', () => {
    // A correction indistinguishable from source data cannot be audited or
    // undone, and the whole catalog rests on being able to see where a value
    // came from.
    const catalog = catalogOf(BOOKS)
    const book = pick(catalog, 'Crítica')
    const corrected = applyOverrides(catalog, setOverride(emptyOverrides(), book, { genre: 'Metaphysics' }))
    const entry = pick(corrected, 'Crítica')
    expect(entry.overridden.fields).toEqual(['genre'])
    expect(entry.overridden.was.genre).toBe('Philosophy')
    expect(entry.flags).toContain('corrected')
  })

  it('takes a removed book out of the catalog and out of the counts', () => {
    const catalog = catalogOf(BOOKS)
    const book = pick(catalog, 'Crítica')
    const after = applyOverrides(catalog, setRemoved(emptyOverrides(), book, true))
    expect(after.books.map((b) => b.title)).not.toContain(book.title)
    expect(after.counts.books).toBe(catalog.counts.books - 1)
  })

  it('survives a rebuild, which is the whole point of a tombstone', () => {
    const overrides = setRemoved(emptyOverrides(), pick(catalogOf(BOOKS), 'Crítica'), true)
    // The sources have not changed, so the rebuilt catalog contains the book
    // again. The correction is what must keep removing it.
    const rebuilt = applyOverrides(catalogOf(BOOKS), overrides)
    expect(rebuilt.books).toHaveLength(BOOKS.length - 1)
    expect(rebuilt.review.removed_by_hand).toHaveLength(1)
  })

  it('brings a removed book back without discarding the edit on it', () => {
    // Two decisions, not one. Undoing a removal must not quietly undo a
    // correction the person made separately.
    const catalog = catalogOf(BOOKS)
    const book = pick(catalog, 'Crítica')
    let overrides = setOverride(emptyOverrides(), book, { genre: 'Metaphysics' })
    overrides = setRemoved(overrides, book, true)
    overrides = setRemoved(overrides, book, false)

    const after = applyOverrides(catalogOf(BOOKS), overrides)
    const restored = after.books.find((b) => b.id === book.id)
    expect(restored).toBeTruthy()
    expect(restored.genre).toBe('Metaphysics')
  })

  it('forgets everything when the correction is cleared', () => {
    const catalog = catalogOf(BOOKS)
    const book = pick(catalog, 'Crítica')
    const overrides = clearOverride(setOverride(emptyOverrides(), book, { genre: 'X' }), book.id)
    const after = applyOverrides(catalogOf(BOOKS), overrides)
    expect(after.books.find((b) => b.id === book.id).genre).toBe('Philosophy')
    expect(after.books.find((b) => b.id === book.id).overridden).toBeFalsy()
  })

  it('lists a correction that no longer matches any book instead of dropping it', () => {
    // An entry is identified by author and title, so a better source supplying
    // a fuller title changes the identity. Silence would look like the
    // correction had stopped mattering.
    const catalog = catalogOf(BOOKS)
    const overrides = setOverride(emptyOverrides(), { id: 'ghost-book', title: 'Ghost', authors: [] }, {
      genre: 'Nowhere',
    })
    const after = applyOverrides(catalog, overrides)
    expect(after.review.orphaned_overrides.map((o) => o.id)).toContain('ghost-book')
  })
})

describe('reading a corrections file', () => {
  it('accepts an empty one', () => {
    expect(readOverrides(emptyOverrides()).entries).toEqual({})
  })

  it('treats a missing file as no corrections, because that is what it means', () => {
    expect(readOverrides(null).entries).toEqual({})
    expect(readOverrides(undefined).entries).toEqual({})
  })

  it('refuses a file it does not recognise rather than assuming it is empty', () => {
    // Silently returning "no corrections" would drop every correction the
    // person has made, and the next save would write that emptiness back over
    // the file. Refusing is louder and keeps the data.
    expect(() => readOverrides({ nonsense: true })).toThrow(/not a LibrAPP overrides file/)
    expect(() => readOverrides({ librapp_overrides: 99 })).toThrow(/expected librapp_overrides 1/)
  })
})

// tags are not stored, they are cut from genre and keywords when the catalog is
// built. Everything that counts genres reads them rather than the field: the
// chart, the word cloud, the tag filter. So a correction that set a genre
// changed the book and none of those, and the genre showed on the card and
// nowhere else. It cost nothing to write and was invisible until somebody
// looked at the chart afterwards.
describe('a corrected genre reaches the things that count genres', () => {
  const book = (over = {}) => ({
    id: 'b1',
    title: 'The Dispossessed',
    genre: null,
    keywords: null,
    tags: [],
    authors: [],
    ...over,
  })
  const catalogOf = (books) => ({ books, authors: [], counts: {} })

  const corrected = (start, changes) =>
    applyOverrides(catalogOf([start]), setOverride(emptyOverrides(), start, changes)).books[0]

  it('puts the genre into the tags, not only into the field', () => {
    const out = corrected(book(), { genre: 'Science fiction' })
    expect(out.genre).toBe('Science fiction')
    expect(out.tags).toEqual([{ kind: 'genre', value: 'Science fiction', key: 'science fiction' }])
  })

  it('splits several genres the way the builder does', () => {
    const out = corrected(book(), { genre: 'Philosophy, Ethics' })
    expect(out.tags.map((t) => t.value)).toEqual(['Philosophy', 'Ethics'])
  })

  it('replaces the tags rather than adding to them', () => {
    // Correcting a wrong genre has to take the wrong one off the chart.
    const start = book({ genre: 'Cookery', tags: [{ kind: 'genre', value: 'Cookery', key: 'cookery' }] })
    const out = corrected(start, { genre: 'Philosophy' })
    expect(out.tags.map((t) => t.value)).toEqual(['Philosophy'])
  })

  it('clears the tags when a genre is corrected away', () => {
    const start = book({ genre: 'Cookery', tags: [{ kind: 'genre', value: 'Cookery', key: 'cookery' }] })
    expect(corrected(start, { genre: null }).tags).toEqual([])
  })

  it('leaves the tags alone when the correction was about something else', () => {
    const start = book({ genre: 'Philosophy', tags: [{ kind: 'genre', value: 'Philosophy', key: 'philosophy' }] })
    const out = corrected(start, { publisher: 'Gollancz' })
    expect(out.tags.map((t) => t.value)).toEqual(['Philosophy'])
  })

  it('keeps the keywords a source recorded when only the genre changed', () => {
    const start = book({
      genre: null,
      keywords: 'empire, revolution',
      tags: [
        { kind: 'keyword', value: 'empire', key: 'empire' },
        { kind: 'keyword', value: 'revolution', key: 'revolution' },
      ],
    })
    const out = corrected(start, { genre: 'Science fiction' })
    expect(out.tags.filter((t) => t.kind === 'keyword').map((t) => t.value)).toEqual([
      'empire',
      'revolution',
    ])
    expect(out.tags.filter((t) => t.kind === 'genre').map((t) => t.value)).toEqual(['Science fiction'])
  })
})
