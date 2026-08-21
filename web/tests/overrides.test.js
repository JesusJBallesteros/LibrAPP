// Corrections are the one place a person overrules the sources, and the one
// place where being wrong is unrecoverable if it is not auditable. Removing a
// book cannot delete it — the next rebuild reads the same sources and would put
// it back — so removal is a tombstone, and a tombstone that stops working looks
// exactly like a book returning from the dead.

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
