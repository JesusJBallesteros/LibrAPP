// What the owl is allowed to say.
//
// The rule that matters is that every line is computable from the catalog. A
// friendly voice that occasionally invents a fact about someone's books is
// worse than no voice, so these tests are mostly about the owl staying quiet
// when it has nothing it can count.

import { describe, expect, it } from 'vitest'
import { LONG_LOAN_YEARS, MOST, announce, observations, observe } from '../src/librarian.js'
import { arrival } from '../src/views/ListImport.jsx'

const YEAR = 365.25 * 24 * 3600 * 1000
const ago = (years) => new Date(Date.now() - years * YEAR).toISOString().slice(0, 10)

const book = (over = {}) => ({ id: 'b1', title: 'A Book', read: null, ...over })

describe('when there is nothing to talk about', () => {
  it('points at the way to start when no catalog exists', () => {
    const said = observe({ view: 'catalog', hasCatalog: false })
    expect(said.key).toBe('empty')
    expect(said.action.view).toBe('shelf')
  })

  it('says nothing at all on About', () => {
    // The page where the app explains itself is not the place for a character
    // talking over the explanation.
    expect(observe({ view: 'about', hasCatalog: true, books: [book()] })).toBe(null)
  })

  it('says nothing on a view it has no line for', () => {
    expect(observe({ view: 'somewhere-new', hasCatalog: true, books: [book()] })).toBe(null)
  })
})

describe('what outranks what', () => {
  const borrowedLong = book({ id: 'owed', borrowed_from: 'Ana', borrowed_on: ago(3) })
  const lentLong = book({ id: 'out', lent_to: 'Bruno', lent_on: ago(2) })
  const unread = book({ id: 'new', read: false })

  it('puts an obligation above an opportunity', () => {
    // A book belonging to someone else is owed back. An unread book is not.
    const said = observe({
      view: 'catalog',
      hasCatalog: true,
      books: [unread, lentLong, borrowedLong],
      counts: { unread: 1 },
    })
    expect(said.key).toBe('borrowedLong')
  })

  it('mentions what is lent out when nothing is owed back', () => {
    const said = observe({ view: 'catalog', hasCatalog: true, books: [unread, lentLong], counts: { unread: 1 } })
    expect(said.key).toBe('lentLong')
    expect(said.action.focus).toEqual({ loan: 'lent' })
  })

  it('falls back to the unread pile when nothing is away', () => {
    const said = observe({ view: 'catalog', hasCatalog: true, books: [unread], counts: { unread: 1 } })
    expect(said.key).toBe('unread')
    expect(said.values.n).toBe(1)
    expect(said.action.focus).toEqual({ read: 'unread', sort: 'oldest' })
  })

  it('has something to say when everything has been read', () => {
    const said = observe({
      view: 'catalog',
      hasCatalog: true,
      books: [book({ read: true })],
      counts: { unread: 0, read_unknown: 0, read: 1 },
    })
    expect(said.key).toBe('allRead')
    expect(said.action).toBe(null)
  })
})

describe('not calling an unrecorded shelf a read one', () => {
  // A catalog built from a photograph carries no read state at all. Zero
  // unread books does not mean every book was read, and saying so would be the
  // owl inventing the one thing it must not invent.
  const unknown = [book({ id: '1', read: null }), book({ id: '2', read: null })]

  it('reports what is unrecorded rather than claiming it is read', () => {
    const said = observe({ view: 'catalog', hasCatalog: true, books: unknown })
    expect(said.key).toBe('unrecorded')
    expect(said.values.n).toBe(2)
    expect(said.action.focus).toEqual({ read: 'unknown' })
  })

  it('does the same when the counts say so', () => {
    const said = observe({
      view: 'catalog',
      hasCatalog: true,
      books: unknown,
      counts: { unread: 0, read_unknown: 2, read: 0 },
    })
    expect(said.key).toBe('unrecorded')
  })

  it('reads nothing from a shelf with neither a read book nor an unrecorded one', () => {
    // Nothing to observe. The page still explains itself, so what comes back
    // is guidance rather than nothing at all.
    const lines = observations({ view: 'catalog', hasCatalog: true, books: [], counts: { unread: 0 } })
    expect(lines.every((l) => l.key.startsWith('guide.'))).toBe(true)
  })

  it('mentions the unread pile before the unrecorded ones', () => {
    const mixed = [book({ id: '1', read: false }), book({ id: '2', read: null })]
    expect(observe({ view: 'catalog', hasCatalog: true, books: mixed }).key).toBe('unread')
  })
})

describe('counting a loan as long', () => {
  it('ignores a loan younger than the threshold', () => {
    const recent = book({ lent_to: 'Bruno', lent_on: ago(LONG_LOAN_YEARS - 0.2) })
    const said = observe({ view: 'catalog', hasCatalog: true, books: [recent], counts: { unread: 0 } })
    expect(said.key).toBe('unrecorded')
  })

  it('counts one that is older', () => {
    const old = book({ lent_to: 'Bruno', lent_on: ago(LONG_LOAN_YEARS + 0.2) })
    const said = observe({ view: 'catalog', hasCatalog: true, books: [old], counts: { unread: 0 } })
    expect(said.key).toBe('lentLong')
  })

  it('ignores a loan with no date rather than guessing how old it is', () => {
    // onLoan keeps undated loans, and they matter, but "more than a year" is a
    // claim about a date nobody recorded.
    const undated = book({ lent_to: 'Bruno' })
    const said = observe({ view: 'catalog', hasCatalog: true, books: [undated], counts: { unread: 0 } })
    expect(said.key).toBe('unrecorded')
  })

  it('counts every long loan, not just the first', () => {
    const books = [
      book({ id: '1', lent_to: 'Bruno', lent_on: ago(2) }),
      book({ id: '2', lent_to: 'Ana', lent_on: ago(4) }),
    ]
    expect(observe({ view: 'catalog', hasCatalog: true, books, counts: { unread: 0 } }).values.n).toBe(2)
  })
})

describe('counting without counts', () => {
  it('works out the unread total from the books when no summary was passed', () => {
    const books = [book({ id: '1', read: false }), book({ id: '2', read: false }), book({ id: '3', read: true })]
    expect(observe({ view: 'catalog', hasCatalog: true, books }).values.n).toBe(2)
  })

  it('does not count a book whose read state was never recorded as unread', () => {
    // null means unknown, and never means no.
    const books = [book({ id: '1', read: null })]
    expect(observe({ view: 'catalog', hasCatalog: true, books }).key).toBe('unrecorded')
  })
})

describe('the lines that belong to a view', () => {
  const books = [book()]
  it('greets on the front door', () => {
    expect(observe({ view: 'home', hasCatalog: true, books, counts: { books: 128 } })).toMatchObject({
      key: 'welcome',
      values: { n: 128 },
    })
  })

  it('opens with the count on the desk, which is the one reading it has there', () => {
    expect(observe({ view: 'desk', hasCatalog: true, books }).key).toBe('desk')
  })

  for (const view of ['shelf', 'list', 'storage']) {
    it(`opens with guidance on ${view}, where there is nothing to read off the shelf`, () => {
      expect(observe({ view, hasCatalog: true, books }).key).toMatch(/^guide\./)
    })
  }

  it('offers no action where there is nothing to act on', () => {
    for (const view of ['desk', 'shelf', 'list', 'storage']) {
      expect(observe({ view, hasCatalog: true, books }).action).toBe(null)
    }
  })
})

describe('announcing something in progress', () => {
  it('says nothing when nothing is happening', () => {
    expect(announce(null)).toBe(null)
    expect(announce({ kind: 'unknown-event' })).toBe(null)
  })

  it('reports the tile count it was given', () => {
    expect(announce({ kind: 'reading', tiles: 3 })).toEqual({ key: 'reading', values: { n: 3 } })
  })

  it('reports both figures from an import', () => {
    expect(announce({ kind: 'imported', added: 23, known: 4 })).toEqual({
      key: 'imported',
      values: { n: 23, known: 4 },
    })
  })

  it('falls back to zero rather than to undefined in the sentence', () => {
    expect(announce({ kind: 'imported' }).values).toEqual({ n: 0, known: 0 })
  })
})

// The import line reports two figures, and neither may be assumed. A source
// file carries no record of what the catalog already knew, so both are counted
// from the catalog totals either side of the import.
describe('counting what an import brought', () => {
  it('calls every record new when the catalog grew by all of them', () => {
    expect(arrival(10, 33, 23)).toEqual({ kind: 'imported', added: 23, known: 0 })
  })

  it('calls the difference already known', () => {
    expect(arrival(10, 29, 23)).toEqual({ kind: 'imported', added: 19, known: 4 })
  })

  it('calls every record known when the catalog did not grow', () => {
    expect(arrival(10, 10, 23)).toEqual({ kind: 'imported', added: 0, known: 23 })
  })

  it('never reports more new books than the file held', () => {
    // Another source could have been rebuilt at the same time. The file cannot
    // have contributed more than it contained.
    expect(arrival(10, 99, 23).added).toBe(23)
  })

  it('never reports a negative count', () => {
    expect(arrival(30, 10, 23)).toEqual({ kind: 'imported', added: 0, known: 23 })
  })

  it('says nothing when a total was not available to compare', () => {
    expect(arrival(undefined, 30, 23)).toBe(null)
    expect(arrival(10, undefined, 23)).toBe(null)
  })
})


// Each page carries up to three things: what is true of the collection here and
// worth acting on, then how the page works. The guidance is what somebody who
// has never used the page needs, which is why it exists at all.
describe('what a page has to say', () => {
  const shelf = [book({ id: '1', read: null })]
  const at = (view, over = {}) =>
    observations({ view, hasCatalog: true, books: shelf, ...over })

  it('never offers more than three', () => {
    for (const view of ['home', 'catalog', 'shelf', 'list', 'desk', 'storage']) {
      expect(at(view).length, view).toBeLessThanOrEqual(MOST)
    }
  })

  it('has something to say on every page that has an owl', () => {
    for (const view of ['home', 'catalog', 'shelf', 'list', 'desk', 'storage']) {
      expect(at(view).length, view).toBeGreaterThan(0)
    }
  })

  it('says nothing at all on About', () => {
    expect(observations({ view: 'about', hasCatalog: true, books: shelf })).toEqual([])
  })

  it('says nothing on a page it has no lines for', () => {
    expect(observations({ view: 'somewhere-new', hasCatalog: true, books: shelf })).toEqual([])
  })

  it('gives different lines on different pages', () => {
    const keys = (view) => at(view).map((l) => l.key).join('|')
    expect(keys('shelf')).not.toBe(keys('list'))
    expect(keys('storage')).not.toBe(keys('desk'))
    expect(keys('catalog')).not.toBe(keys('shelf'))
  })

  it('tells a beginner how the page works, on every page', () => {
    // Not only what the shelf contains. A page nobody has used before has to
    // explain itself.
    for (const view of ['home', 'catalog', 'shelf', 'list', 'desk', 'storage']) {
      const guides = at(view).filter((l) => l.key.startsWith('guide.'))
      expect(guides.length, view).toBeGreaterThan(0)
    }
  })

  it('puts what is worth acting on before the manual', () => {
    const lines = observations({
      view: 'catalog',
      hasCatalog: true,
      books: [book({ id: '1', read: false })],
      counts: { unread: 1 },
    })
    expect(lines[0].key).toBe('unread')
    expect(lines[1].key).toMatch(/^guide\./)
  })

  it('offers the action on the line it belongs to, not on the guidance', () => {
    const lines = observations({
      view: 'catalog',
      hasCatalog: true,
      books: [book({ id: '1', read: false })],
      counts: { unread: 1 },
    })
    expect(lines[0].action).toBeTruthy()
    expect(lines.slice(1).every((l) => l.action === null)).toBe(true)
  })

  it('gives an empty catalog nothing but how to begin', () => {
    const lines = observations({ view: 'catalog', hasCatalog: false })
    expect(lines[0].key).toBe('empty')
    expect(lines[0].action.view).toBe('shelf')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.slice(1).every((l) => l.key.startsWith('guide.'))).toBe(true)
  })

  it('gives the same lines on an empty catalog whatever page it is on', () => {
    // There is nothing to observe yet, so the page makes no difference.
    const a = observations({ view: 'catalog', hasCatalog: false }).map((l) => l.key)
    const b = observations({ view: 'storage', hasCatalog: false }).map((l) => l.key)
    expect(a).toEqual(b)
  })

  it('still answers with one line, for anything that wants only the first', () => {
    expect(observe({ view: 'shelf', hasCatalog: true, books: shelf })).toEqual(
      observations({ view: 'shelf', hasCatalog: true, books: shelf })[0],
    )
  })

  it('carries no values or action on a guidance line', () => {
    for (const line of at('shelf')) {
      if (!line.key.startsWith('guide.')) continue
      expect(line.values).toEqual({})
      expect(line.action).toBe(null)
    }
  })
})
