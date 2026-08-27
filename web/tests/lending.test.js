// Lending. A book can be out of the house in two ways, and the catalog has to
// tell them apart: a lent book is owned and away, a borrowed one is not owned.
//
// Both live in the override layer, because that is the layer that survives a
// rebuild and because a source file records what was ingested and is never
// written back to.

import { describe, expect, it } from 'vitest'
import { makeSource, normalise, readSource } from '../src/core/records.js'
import { build } from '../src/core/build.js'
import { applyOverrides, emptyOverrides, setOverride } from '../src/core/overrides.js'
import { readerProfile } from '../src/core/profile.js'
import { borrowed, lentOut, onLoan } from '../src/lib.js'

const source = (records) =>
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

const BOOKS = [
  { title: 'Dune', authors: ['Frank Herbert'], acquired_on: '2019-04-02' },
  { title: 'Neuromancer', authors: ['William Gibson'], acquired_on: '2020-01-05' },
]

const catalogOf = (records = BOOKS) => build([source(records)])
const pick = (catalog, needle) => catalog.books.find((b) => b.title.includes(needle))

const lend = (catalog, title, to, on) =>
  applyOverrides(
    catalogOf(),
    setOverride(emptyOverrides(), pick(catalog, title), { lent_to: to, lent_on: on }),
  )

describe('the record contract', () => {
  it('accepts the four loan fields and defaults them to unknown', () => {
    const out = normalise({ title: 'Dune' })
    expect(out.lent_to).toBeNull()
    expect(out.lent_on).toBeNull()
    expect(out.borrowed_from).toBeNull()
    expect(out.borrowed_on).toBeNull()
  })

  it('carries them through a source that sets them', () => {
    const [book] = source([{ title: 'Dune', lent_to: 'Ana', lent_on: '2026-03-14' }]).records
    expect(book.lent_to).toBe('Ana')
    expect(book.lent_on).toBe('2026-03-14')
  })

  it('reads an older source that predates the fields', () => {
    // An export written before this feature has no loan keys at all, and must
    // still import rather than being refused as unrecognised.
    const older = {
      librapp_source: 1,
      source: { name: 'old', kind: 'table', origin: 'old.json', format: 'physical', confidence: 'medium' },
      records: [{ title: 'Dune', authors: ['Frank Herbert'] }],
    }
    const [book] = readSource(older).records
    expect(book.lent_to).toBeNull()
    expect(book.borrowed_from).toBeNull()
  })
})

describe('recording a loan', () => {
  it('puts the book in another pair of hands and says whose', () => {
    const catalog = lend(catalogOf(), 'Dune', 'Ana', '2026-03-14')
    const dune = pick(catalog, 'Dune')
    expect(lentOut(dune)).toEqual({ who: 'Ana', since: '2026-03-14' })
    expect(borrowed(dune)).toBeNull()
  })

  it('survives a rebuild, like every other correction', () => {
    const overrides = setOverride(emptyOverrides(), pick(catalogOf(), 'Dune'), { lent_to: 'Ana' })
    const rebuilt = applyOverrides(catalogOf(), overrides)
    expect(pick(rebuilt, 'Dune').lent_to).toBe('Ana')
  })

  it('records a loan with no date, since the date is often forgotten', () => {
    const catalog = applyOverrides(
      catalogOf(),
      setOverride(emptyOverrides(), pick(catalogOf(), 'Dune'), { lent_to: 'Ana', lent_on: null }),
    )
    expect(lentOut(pick(catalog, 'Dune'))).toEqual({ who: 'Ana', since: null })
  })

  it('keeps a borrowed book distinct from a lent one', () => {
    const catalog = applyOverrides(
      catalogOf(),
      setOverride(emptyOverrides(), pick(catalogOf(), 'Neuromancer'), {
        borrowed_from: 'Luis',
        borrowed_on: '2026-02-01',
      }),
    )
    const book = pick(catalog, 'Neuromancer')
    expect(borrowed(book)).toEqual({ who: 'Luis', since: '2026-02-01' })
    expect(lentOut(book)).toBeNull()
  })
})

describe('what is away from the shelf', () => {
  const YEAR = 365.25 * 24 * 3600 * 1000
  const iso = (yearsAgo) => new Date(Date.now() - yearsAgo * YEAR).toISOString().slice(0, 10)

  it('lists only the books actually out', () => {
    const books = [
      { id: 'a', title: 'Gone', lent_to: 'Ana', lent_on: iso(1) },
      { id: 'b', title: 'Here' },
      { id: 'c', title: 'Theirs', borrowed_from: 'Luis' },
    ]
    expect(onLoan(books, 'lent').map((r) => r.book.title)).toEqual(['Gone'])
    expect(onLoan(books, 'borrowed').map((r) => r.book.title)).toEqual(['Theirs'])
  })

  it('puts the longest gone first', () => {
    const books = [
      { id: 'a', title: 'Recent', lent_to: 'Ana', lent_on: iso(0.5) },
      { id: 'b', title: 'Ancient', lent_to: 'Bea', lent_on: iso(4) },
    ]
    expect(onLoan(books).map((r) => r.book.title)).toEqual(['Ancient', 'Recent'])
  })

  it('keeps an undated loan rather than dropping it, and sorts it last', () => {
    const books = [
      { id: 'a', title: 'Undated', lent_to: 'Ana' },
      { id: 'b', title: 'Dated', lent_to: 'Bea', lent_on: iso(2) },
    ]
    const rows = onLoan(books)
    expect(rows.map((r) => r.book.title)).toEqual(['Dated', 'Undated'])
    expect(rows[1].age).toBeNull()
  })
})

describe('what the desk tells a model', () => {
  it('says which books are not in the house', () => {
    const catalog = lend(catalogOf(), 'Dune', 'Ana', '2026-03-14')
    const profile = readerProfile(catalog)
    expect(profile).toContain('Not on the shelf right now')
    expect(profile).toContain('lent to Ana')
  })

  it('says nothing at all when everything is where it should be', () => {
    expect(readerProfile(catalogOf())).not.toContain('Not on the shelf right now')
  })
})

// Loans are usually written by hand, and a correction reaches the entry after
// the build, which is why the desk showed them while the builder was dropping
// them. A source is allowed to carry them, and one that did was ignored.
describe('a loan recorded by a source', () => {
  const built = (record) =>
    build([
      readSource(
        makeSource({
          name: 'list',
          kind: 'table',
          origin: 'list.json',
          format: 'physical',
          confidence: 'high',
          records: [record],
        }),
        'list',
      ),
    ]).books[0]

  it('reaches the catalog rather than being dropped', () => {
    const book = built({ title: 'Piranesi', authors: ['Clarke'], lent_to: 'Marta', lent_on: '2025-11-03' })
    expect(book.lent_to).toBe('Marta')
    expect(book.lent_on).toBe('2025-11-03')
  })

  it('carries a borrowed book the same way', () => {
    const book = built({
      title: 'The Long Goodbye',
      authors: ['Chandler'],
      borrowed_from: 'Elena',
      borrowed_on: '2025-02-09',
    })
    expect(book.borrowed_from).toBe('Elena')
    expect(book.borrowed_on).toBe('2025-02-09')
  })

  it('leaves a book that is on its shelf alone', () => {
    const book = built({ title: 'Dune', authors: ['Herbert'] })
    expect(book.lent_to).toBeNull()
    expect(book.borrowed_from).toBeNull()
  })
})
