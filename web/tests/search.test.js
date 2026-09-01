// Filling a book in from its title and its author, which is the guess of the
// two lookups.
//
// The ISBN route asks about one edition and gets an answer about that edition.
// This one asks with words and gets whatever ranks highest for them, and it
// always returns something: a search for a book nobody has heard of comes back
// with five books somebody has. So most of what is checked here is refusal.
//
// The judging uses the catalog's own matching rules rather than new ones. If
// two records are not the same book to the clusterer, a search hit is not the
// same book either.

import { describe, expect, it, vi } from 'vitest'
import {
  SEARCH_CAP,
  bestMatch,
  searchMany,
  searchOne,
  searchUrl,
  searchable,
  toSearchRecord,
} from '../src/ingest/search.js'

const doc = (title, authors, extra = {}) => ({
  title,
  author_name: authors,
  edition_count: 1,
  ...extra,
})

describe('what is asked', () => {
  it('drops the edition out of a title before searching for the book', () => {
    // An ebook title carries its printing in brackets, and those words are
    // about the edition rather than about the book.
    expect(searchable('Artemisa (Spanish Edition)')).toBe('Artemisa')
    expect(searchable('Roadside Picnic (S.F. MASTERWORKS Book 115)')).toBe('Roadside Picnic')
    expect(searchable('Dune')).toBe('Dune')
  })

  it('sends the title and the author as separate terms', () => {
    const url = new URL(searchUrl('Dune (Spanish Edition)', 'Frank Herbert'))
    expect(url.searchParams.get('title')).toBe('Dune')
    expect(url.searchParams.get('author')).toBe('Frank Herbert')
  })

  it('asks for only the fields it uses', () => {
    const fields = new URL(searchUrl('Dune', '')).searchParams.get('fields')
    expect(fields).toContain('first_publish_year')
    expect(fields).not.toContain('ia_collection')
  })

  it('leaves the author out when the record has none', () => {
    expect(new URL(searchUrl('Beowulf', '')).searchParams.has('author')).toBe(false)
  })
})

describe('judging what came back', () => {
  const book = { title: 'Roadside Picnic', authors: ['Strugatsky, Arkady'] }

  it('takes a hit whose title and author both answer', () => {
    const hit = bestMatch([doc('Roadside Picnic', ['Arkady and Boris Strugatsky'])], book)
    expect(hit.doc.title).toBe('Roadside Picnic')
  })

  it('matches an author written the other way round', () => {
    // The file says Strugatsky, Arkady and the service says Arkady Strugatsky.
    // The catalog already treats those as one person.
    expect(bestMatch([doc('Roadside Picnic', ['Arkady Strugatsky'])], book)).not.toBeNull()
  })

  it('refuses a hit by a different author, however well the title scores', () => {
    // This is the failure the whole module exists to prevent: a real book,
    // confidently returned, about somebody else's shelf.
    expect(bestMatch([doc('Roadside Picnic', ['Someone Else Entirely'])], book)).toBeNull()
  })

  it('refuses a hit whose title is merely nearby', () => {
    expect(bestMatch([doc('Picnic at Hanging Rock', ['Arkady Strugatsky'])], book)).toBeNull()
  })

  it('returns nothing rather than the best of a bad lot', () => {
    const rubbish = [
      doc('A History of Picnics', ['Someone']),
      doc('Roadside Diners of America', ['Another']),
    ]
    expect(bestMatch(rubbish, book)).toBeNull()
  })

  it('wants the same title, not a near one, when there is no author to check', () => {
    // The clusterer scores Beowulf and Grendel at 0.97 against Beowulf, which
    // is right for two records off one shelf and wrong against every book ever
    // published. A subtitle is still the same work; another word is not.
    const nameless = { title: 'Beowulf', authors: [] }
    expect(bestMatch([doc('Beowulf', ['Anonymous'])], nameless)).not.toBeNull()
    expect(bestMatch([doc('Beowulf: A New Translation', ['Anon'])], nameless)).not.toBeNull()
    expect(bestMatch([doc('Beowulf and Grendel', ['Anon'])], nameless)).toBeNull()
    expect(bestMatch([doc('The Beowulf Manuscript', ['Anon'])], nameless)).toBeNull()
  })

  it('prefers the one the world has printed most often, among equals', () => {
    const hit = bestMatch(
      [
        doc('Dune', ['Frank Herbert'], { key: '/works/rare', edition_count: 1 }),
        doc('Dune', ['Frank Herbert'], { key: '/works/common', edition_count: 40 }),
      ],
      { title: 'Dune', authors: ['Frank Herbert'] },
    )
    expect(hit.doc.key).toBe('/works/common')
  })

  it('is not upset by an empty answer', () => {
    expect(bestMatch([], book)).toBeNull()
    expect(bestMatch(undefined, book)).toBeNull()
  })
})

describe('what is written', () => {
  const book = { title: 'Roadside Picnic (S.F. MASTERWORKS Book 115)', authors: ['Strugatsky, Arkady'] }
  const found = doc('Roadside Picnic', ['Arkady and Boris Strugatsky'], {
    first_publish_year: 1977,
    number_of_pages_median: 245,
    publisher: ['Macmillan', 'Pocket Books'],
    subject: ['Science fiction', 'Accessible book', 'Russian fiction'],
  })

  it('keeps the title and the author the reader already had', () => {
    // What the book is called on this shelf, and what makes this record join
    // the book it belongs to. A search is not evidence that a title was
    // written down wrong.
    const record = toSearchRecord(book, found)
    expect(record.title).toBe(book.title)
    expect(record.authors).toEqual(['Strugatsky, Arkady'])
  })

  it('brings back the facts a title cannot carry', () => {
    const record = toSearchRecord(book, found)
    expect(record.published_year).toBe(1977)
    expect(record.pages).toBe(245)
    expect(record.publisher).toBe('Macmillan')
  })

  it('takes subjects as keywords, minus the ones about a catalogue', () => {
    expect(toSearchRecord(book, found).keywords).toBe('Science fiction, Russian fiction')
  })

  it('claims no ISBN, because the answer was about a work and not an edition', () => {
    expect(toSearchRecord(book, found).isbn).toBeUndefined()
  })

  it('leaves a field null rather than guessing at it', () => {
    const thin = toSearchRecord(book, doc('Roadside Picnic', ['Arkady Strugatsky']))
    expect(thin.published_year).toBeNull()
    expect(thin.pages).toBeNull()
    expect(thin.publisher).toBeNull()
    expect(thin.keywords).toBeNull()
  })
})

describe('asking about many', () => {
  const answering = (docsFor) =>
    vi.fn(async (url) => {
      const title = new URL(url).searchParams.get('title')
      return { ok: true, json: async () => ({ docs: docsFor(title) }) }
    })

  it('asks once per book and reports progress', async () => {
    const fetcher = answering((title) => [doc(title, ['Frank Herbert'])])
    const seen = []
    const books = [
      { title: 'Dune', authors: ['Frank Herbert'] },
      { title: 'Dune Messiah', authors: ['Frank Herbert'] },
    ]
    const out = await searchMany(books, { fetcher, pace: 0, onProgress: (p) => seen.push(p.done) })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(out.found).toHaveLength(2)
    expect(seen).toEqual([1, 2])
  })

  it('puts a book it cannot place in missing rather than failing', async () => {
    const fetcher = answering(() => [doc('Something Else', ['Nobody'])])
    const out = await searchMany([{ title: 'Dune', authors: ['Frank Herbert'] }], { fetcher, pace: 0 })
    expect(out.found).toEqual([])
    expect(out.missing).toHaveLength(1)
  })

  it('loses one book rather than the whole run when a request fails', async () => {
    let calls = 0
    const fetcher = vi.fn(async (url) => {
      calls += 1
      if (calls === 1) throw new Error('network')
      return { ok: true, json: async () => ({ docs: [doc(new URL(url).searchParams.get('title'), ['A B'])] }) }
    })
    const out = await searchMany(
      [{ title: 'One', authors: ['A B'] }, { title: 'Two', authors: ['A B'] }],
      { fetcher, pace: 0 },
    )
    expect(out.missing).toHaveLength(1)
    expect(out.found).toHaveLength(1)
  })

  it('stops where it was asked to stop', async () => {
    const controller = new AbortController()
    const fetcher = vi.fn(async (url) => {
      controller.abort()
      return { ok: true, json: async () => ({ docs: [doc(new URL(url).searchParams.get('title'), ['A B'])] }) }
    })
    const books = Array.from({ length: 5 }, (_, i) => ({ title: `Book ${i}`, authors: ['A B'] }))
    const out = await searchMany(books, { fetcher, pace: 0, signal: controller.signal })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(out.found).toHaveLength(1)
  })

  it('refuses one book on a bad status rather than reading the body', async () => {
    const fetcher = vi.fn(async () => ({ ok: false, status: 503 }))
    await expect(searchOne({ title: 'Dune', authors: [] }, { fetcher })).rejects.toThrow(/503/)
  })

  it('has a cap somebody has to press through rather than one big run', () => {
    // One request per book against a free service. A run over a library of
    // twelve hundred should be a decision taken twelve times.
    expect(SEARCH_CAP).toBeGreaterThan(10)
    expect(SEARCH_CAP).toBeLessThanOrEqual(200)
  })
})
