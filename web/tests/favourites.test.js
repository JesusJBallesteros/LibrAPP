// The mark a reader puts on a book, and the words they write about it.
//
// Both are the reader's own, which is what separates them from everything else
// in a record. A title comes from a spine and an abstract comes from a model,
// but a favourite and a note come from nobody else, so they must survive a
// rebuild and must reach the librarian labelled as opinion rather than as
// catalog data.

import { describe, expect, it } from 'vitest'
import { EDITABLE, applyOverrides, emptyOverrides, setOverride } from '../src/core/overrides.js'
import { RECORD_FIELDS, makeSource, normalise, readSource } from '../src/core/records.js'
import { build } from '../src/core/build.js'
import { readerProfile } from '../src/core/profile.js'
import { hiddenActiveFilters } from '../src/lib.js'
import { toForm } from '../src/components/BookEditor.jsx'

const names = new Map([['ursula', { id: 'ursula', display_name: 'Ursula K. Le Guin' }]])

const catalogOf = (books) => ({
  books: books.map((b) => ({ authors: [], tags: [], ...b })),
  authors: [{ id: 'ursula', display_name: 'Ursula K. Le Guin' }],
  counts: { read: 0, unread: 0, read_unknown: books.length },
})

describe('the field itself', () => {
  it('exists on every record, defaulting to not a favourite', () => {
    expect(RECORD_FIELDS).toHaveProperty('favourite')
    expect(normalise({ title: 'A' }).favourite).toBe(false)
  })

  it('defaults to false rather than null', () => {
    // Elsewhere null means unknown. Nothing but the reader can mark a
    // favourite, so an unmarked book is not one, and there is no source that
    // could ever say otherwise.
    expect(RECORD_FIELDS.favourite).toBe(false)
  })

  it('can be corrected, so a mark can be taken back', () => {
    expect(EDITABLE).toContain('favourite')
    expect(EDITABLE).toContain('notes')
  })

  it('survives a rebuild by living in the override layer', () => {
    const book = { id: 'b1', title: 'The Dispossessed', favourite: false, notes: null }
    const corrected = applyOverrides(
      catalogOf([book]),
      setOverride(emptyOverrides(), book, { favourite: true, notes: 'The one I lend out.' }),
    )
    expect(corrected.books[0].favourite).toBe(true)
    expect(corrected.books[0].notes).toBe('The one I lend out.')
  })

  it('records what it was before, so the mark can be undone', () => {
    const book = { id: 'b1', title: 'A', favourite: false }
    const corrected = applyOverrides(
      catalogOf([book]),
      setOverride(emptyOverrides(), book, { favourite: true }),
    )
    expect(corrected.books[0].overridden.fields).toContain('favourite')
    expect(corrected.books[0].overridden.was.favourite).toBe(false)
  })
})

describe('the form', () => {
  it('carries the mark as a boolean the toggle can press', () => {
    expect(toForm({ title: 'A', favourite: true }, names).favourite).toBe(true)
    expect(toForm({ title: 'A' }, names).favourite).toBe(false)
  })

  it('treats a missing field as not marked rather than as unknown', () => {
    expect(toForm({ title: 'A', favourite: null }, names).favourite).toBe(false)
    expect(toForm({ title: 'A', favourite: undefined }, names).favourite).toBe(false)
  })
})

describe('filtering by it', () => {
  it('is named on screen when it is set while hidden', () => {
    expect(hiddenActiveFilters({ favourite: 'yes' })).toEqual(['favourite'])
  })

  it('is not named when it is off', () => {
    expect(hiddenActiveFilters({ favourite: 'all' })).toEqual([])
    expect(hiddenActiveFilters()).toEqual([])
  })

  it('is named alongside the others rather than instead of them', () => {
    expect(hiddenActiveFilters({ loan: 'lent', favourite: 'yes' })).toEqual(['loan', 'favourite'])
  })
})

describe('what the librarian is told', () => {
  it('lists the favourites, and says who marked them', () => {
    const profile = readerProfile(
      catalogOf([
        { id: '1', title: 'The Dispossessed', authors: ['ursula'], favourite: true },
        { id: '2', title: 'Another', authors: ['ursula'] },
      ]),
    )
    expect(profile).toContain('Marked as favourites by the reader')
    expect(profile).toContain('The Dispossessed')
  })

  it('leaves the section out entirely when nothing is marked', () => {
    // The profile is sent with every request, so an empty heading is paid for
    // on each one.
    const profile = readerProfile(catalogOf([{ id: '1', title: 'Another' }]))
    expect(profile).not.toContain('Marked as favourites')
  })

  it('passes a note through in the reader\'s own words', () => {
    const note = 'Bought in Lisbon, never got past chapter three.'
    const profile = readerProfile(catalogOf([{ id: '1', title: 'A Book', notes: note }]))
    expect(profile).toContain(note)
  })

  it('says a note is an opinion, so it is not read as a description', () => {
    const profile = readerProfile(catalogOf([{ id: '1', title: 'A Book', notes: 'Dull.' }]))
    expect(profile).toContain("The reader's own notes")
    expect(profile).toContain("the reader's words, not a description")
  })

  it('leaves the notes section out when no book carries one', () => {
    const profile = readerProfile(catalogOf([{ id: '1', title: 'A Book' }]))
    expect(profile).not.toContain("The reader's own notes")
  })

  it('names a missing author rather than printing a bare dash', () => {
    // The profile is read by a model, and a dash says nothing about why the
    // author is absent.
    const profile = readerProfile(catalogOf([{ id: '1', title: 'Beowulf', favourite: true }]))
    expect(profile).toContain('author not recorded')
    expect(profile).not.toContain('Beowulf  ·  —')
  })
})

// Marking a shelf one book at a time means a dialog per book, which for the
// tail nobody ever recorded is the difference between a job and an afternoon.
// The filters already say which books are meant, so that is what bulk marking
// applies to, and the three-valued read state has to move in both directions.
describe('marking many books at once', () => {
  const shelf = () =>
    build([
      readSource(
        makeSource({
          name: 'list',
          kind: 'table',
          origin: 'list.json',
          format: 'physical',
          confidence: 'high',
          records: [
            { title: 'One', authors: ['A'], read: null },
            { title: 'Two', authors: ['B'], read: null },
            { title: 'Three', authors: ['C'], read: true },
          ],
        }),
        'list',
      ),
    ])

  // What the view does: fold setOverride across the books on screen.
  const markAll = (books, value, overrides) =>
    books.reduce(
      (acc, book) => (book.read === value ? acc : setOverride(acc, book, { read: value }, 'bulk')),
      overrides,
    )

  it('marks every book it is given', () => {
    const catalog = shelf()
    const after = applyOverrides(shelf(), markAll(catalog.books, true, emptyOverrides()))
    expect(after.books.every((b) => b.read === true)).toBe(true)
  })

  it('can put books back to not recorded, which is not a shade of unread', () => {
    const catalog = shelf()
    const after = applyOverrides(shelf(), markAll(catalog.books, null, emptyOverrides()))
    expect(after.books.every((b) => b.read === null)).toBe(true)
  })

  it('leaves a book that already reads that way uncorrected', () => {
    // Three is already read, so marking the shelf as read must not record a
    // correction against it: the Library would then offer to undo a change
    // that never happened.
    const catalog = shelf()
    const overrides = markAll(catalog.books, true, emptyOverrides())
    expect(Object.keys(overrides.entries)).toHaveLength(2)
  })

  it('touches nothing but the read state', () => {
    const catalog = shelf()
    const before = catalog.books.find((b) => b.title === 'One')
    const after = applyOverrides(shelf(), markAll(catalog.books, false, emptyOverrides())).books.find(
      (b) => b.title === 'One',
    )
    expect(after.title).toBe(before.title)
    expect(after.authors).toEqual(before.authors)
    expect(after.favourite).toBe(before.favourite)
  })

  it('is a correction like any other, so each one can be undone', () => {
    const catalog = shelf()
    const overrides = markAll(catalog.books, true, emptyOverrides())
    const after = applyOverrides(shelf(), overrides)
    expect(after.books.filter((b) => b.overridden).length).toBe(2)
  })
})
