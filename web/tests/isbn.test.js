// Looking a book up by its own barcode number.
//
// The checksum carries more weight here than it looks. Open Library answers an
// ISBN it does not hold with a real record belonging to a different book rather
// than with an error, so a mistyped digit does not fail, it succeeds wrongly and
// hands back a plausible title with a publisher and a page count attached. The
// check digit is the only thing standing between a typo and a confident lie.

import { describe, expect, it, vi } from 'vitest'
import {
  BATCH,
  LookupError,
  cleanIsbn,
  lookup,
  lookupUrl,
  parseCodes,
  publishedYear,
  toIsbn13,
  toRecord,
  validIsbn,
} from '../src/ingest/isbn.js'
import { KINDS, makeSource, readSource } from '../src/core/records.js'
import { build } from '../src/core/build.js'

describe('reading a code', () => {
  it('takes the hyphens and spaces out', () => {
    expect(cleanIsbn('978-0-441-01359-3')).toBe('9780441013593')
    expect(cleanIsbn(' 0 441 01359 8 ')).toBe('0441013598')
  })

  it('keeps the X an ISBN-10 can end with', () => {
    expect(cleanIsbn('043942089X')).toBe('043942089X')
  })

  it('survives nothing at all', () => {
    expect(cleanIsbn(null)).toBe('')
    expect(cleanIsbn(undefined)).toBe('')
  })
})

describe('whether a code checks out', () => {
  it('accepts a real ISBN-13', () => {
    expect(validIsbn('9780441013593')).toBe(true)
    expect(validIsbn('978-0-547-92822-7')).toBe(true)
  })

  it('accepts a real ISBN-10, X and all', () => {
    expect(validIsbn('0441013597')).toBe(true)
    expect(validIsbn('043942089X')).toBe(true)
  })

  it('refuses a mistyped digit', () => {
    expect(validIsbn('9780441013594')).toBe(false)
  })

  it('refuses a transposed pair, which is what hand-copying does', () => {
    expect(validIsbn('9780441013953')).toBe(false)
  })

  it('refuses a length that is not ten or thirteen', () => {
    expect(validIsbn('978044101359')).toBe(false)
    expect(validIsbn('97804410135933')).toBe(false)
    expect(validIsbn('')).toBe(false)
  })

  it('refuses a 13 that does not start with a book prefix', () => {
    // 979 and 978 are books. 5901234123457 is a barcode, and a valid one, but
    // not of a book.
    expect(validIsbn('5901234123457')).toBe(false)
  })

  it('refuses an X anywhere but the end of a ten', () => {
    expect(validIsbn('04X9420891')).toBe(false)
    expect(validIsbn('978044101359X')).toBe(false)
  })
})

describe('the same book as a thirteen', () => {
  it('converts a ten', () => {
    expect(toIsbn13('0441013597')).toBe('9780441013593')
  })

  it('converts one ending in X', () => {
    expect(validIsbn(toIsbn13('043942089X'))).toBe(true)
  })

  it('leaves a thirteen alone', () => {
    expect(toIsbn13('9780441013593')).toBe('9780441013593')
  })
})

describe('pulling codes out of whatever was pasted', () => {
  it('reads one per line', () => {
    const { codes } = parseCodes('9780441013593\n9780547928227\n')
    expect(codes).toEqual(['9780441013593', '9780547928227'])
  })

  it('reads them out of a spreadsheet row', () => {
    const { codes } = parseCodes('Dune,Frank Herbert,978-0-441-01359-3,read\n')
    expect(codes).toEqual(['9780441013593'])
  })

  it('gives back one thirteen for a ten, so a list can mix the two', () => {
    const { codes } = parseCodes('0441013597\n9780441013593')
    expect(codes).toEqual(['9780441013593'])
  })

  it('drops a repeat rather than looking it up twice', () => {
    const { codes } = parseCodes('9780441013593 9780441013593')
    expect(codes).toHaveLength(1)
  })

  it('hands back what it refused, rather than dropping it in silence', () => {
    // Somebody who pasted fifty codes and got forty-eight books needs to know
    // which two and why.
    const { codes, rejected } = parseCodes('9780441013593\n9780441013594')
    expect(codes).toEqual(['9780441013593'])
    expect(rejected).toEqual(['9780441013594'])
  })

  it('has nothing to say about text with no codes in it', () => {
    expect(parseCodes('a shelf of books').codes).toEqual([])
    expect(parseCodes('').codes).toEqual([])
    expect(parseCodes(null).codes).toEqual([])
  })
})

describe('turning an answer into a record', () => {
  const dune = {
    title: 'Dune',
    authors: [{ name: 'Frank Herbert' }],
    publishers: [{ name: 'Ace Books' }],
    publish_date: 'August 2, 2005',
    number_of_pages: 528,
    subjects: [
      { name: 'Science fiction' },
      { name: 'Dune (Imaginary place)' },
      { name: 'Accessible book' },
      { name: 'New York Times reviewed' },
      { name: 'American literature' },
    ],
  }

  it('takes the parts a catalog has fields for', () => {
    const r = toRecord('9780441013593', dune)
    expect(r.title).toBe('Dune')
    expect(r.authors).toEqual(['Frank Herbert'])
    expect(r.publisher).toBe('Ace Books')
    expect(r.published_year).toBe(2005)
    expect(r.pages).toBe(528)
    expect(r.isbn).toBe('9780441013593')
  })

  it('joins a subtitle onto the title, the way a spine prints it', () => {
    expect(toRecord('9780441013593', { ...dune, subtitle: 'a novel' }).title).toBe('Dune: a novel')
  })

  it('files subjects as keywords, never as a genre', () => {
    // Twenty to ninety of them per book, and picking one to call the genre
    // would be the app choosing rather than recording.
    const r = toRecord('9780441013593', dune)
    expect(r.keywords).toContain('Science fiction')
    expect(r.genre).toBeUndefined()
  })

  it('drops the subjects that describe the record rather than the book', () => {
    const r = toRecord('9780441013593', dune)
    expect(r.keywords).not.toContain('Accessible book')
    expect(r.keywords).not.toContain('New York Times reviewed')
  })

  it('caps how many subjects it takes, so one book cannot flood the cloud', () => {
    const many = { ...dune, subjects: Array.from({ length: 90 }, (_, i) => ({ name: `s${i}` })) }
    expect(toRecord('9780441013593', many, { subjects: 8 }).keywords.split(', ')).toHaveLength(8)
  })

  it('leaves a field null rather than guessing at it', () => {
    const r = toRecord('9780441013593', { title: 'A Book' })
    expect(r.publisher).toBeNull()
    expect(r.published_year).toBeNull()
    expect(r.pages).toBeNull()
    expect(r.keywords).toBeNull()
  })

  it('is nothing at all for an empty answer', () => {
    expect(toRecord('9780441013593', undefined)).toBeNull()
    expect(toRecord('9780441013593', {})).toBeNull()
  })
})

describe('reading a year out of a date', () => {
  it('finds it wherever it sits', () => {
    expect(publishedYear('August 2, 2005')).toBe(2005)
    expect(publishedYear('2005')).toBe(2005)
    expect(publishedYear('c1998')).toBe(1998)
    expect(publishedYear('1979-06')).toBe(1979)
  })

  it('gives nothing rather than a wrong number', () => {
    expect(publishedYear('no date')).toBeNull()
    expect(publishedYear(null)).toBeNull()
  })
})

describe('looking a list up', () => {
  const answer = (codes) =>
    Object.fromEntries(
      codes.map((c) => [`ISBN:${c}`, { title: `Book ${c}`, authors: [{ name: 'Someone' }] }]),
    )

  const fakeFetch = (body, ok = true, status = 200) =>
    vi.fn(async () => ({ ok, status, json: async () => body }))

  it('asks for every code and brings back a record each', async () => {
    const codes = ['9780441013593', '9780547928227']
    const fetcher = fakeFetch(answer(codes))
    const { found, missing } = await lookup(codes, { fetcher })
    expect(found).toHaveLength(2)
    expect(missing).toEqual([])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('splits a long list into batches rather than one enormous request', async () => {
    const codes = Array.from({ length: BATCH * 2 + 1 }, (_, i) => `code${i}`)
    const fetcher = fakeFetch({})
    await lookup(codes, { fetcher })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('says how far it has got, because a long shelf is several requests', async () => {
    const codes = Array.from({ length: BATCH + 5 }, (_, i) => `code${i}`)
    const seen = []
    await lookup(codes, { fetcher: fakeFetch({}), onProgress: (p) => seen.push(p.done) })
    expect(seen).toEqual([BATCH, BATCH + 5])
  })

  it('reports a code nobody knows rather than failing the lot', async () => {
    const codes = ['9780441013593', '9780547928227']
    const fetcher = fakeFetch(answer([codes[0]]))
    const { found, missing } = await lookup(codes, { fetcher })
    expect(found).toHaveLength(1)
    expect(missing).toEqual([codes[1]])
  })

  it('explains a refusal in terms of the connection it needed', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('network down')
    })
    await expect(lookup(['9780441013593'], { fetcher })).rejects.toThrow(LookupError)
  })

  it('turns a bad status into the same kind of explanation', async () => {
    await expect(
      lookup(['9780441013593'], { fetcher: fakeFetch({}, false, 503) }),
    ).rejects.toThrow(LookupError)
  })

  it('lets a cancellation through untouched, so stopping is not an error', async () => {
    const fetcher = vi.fn(async () => {
      throw Object.assign(new Error('stopped'), { name: 'AbortError' })
    })
    await expect(lookup(['9780441013593'], { fetcher })).rejects.toThrow('stopped')
  })

  it('sends the codes and nothing else', async () => {
    // The whole privacy argument for this feature rests on this being true.
    const url = lookupUrl(['9780441013593', '9780547928227'])
    expect(url).toContain('9780441013593')
    expect(url).toContain('9780547928227')
    expect(url.startsWith('https://openlibrary.org/api/books?bibkeys=')).toBe(true)
    expect(url).not.toMatch(/title|author|shelf|user|token/i)
  })
})

// A looked-up record is a source like any other, and the merge that already
// exists is what attaches it to a book you have. Nothing new was written to do
// that, which is the point: the ISBN path adds a way in, not a second catalog.
describe('a lookup joins the shelf it belongs to', () => {
  const shelf = (records, kind, confidence) =>
    readSource(
      makeSource({
        name: kind,
        kind,
        origin: `${kind}.json`,
        format: 'physical',
        confidence,
        records,
      }),
      kind,
    )

  it('is a kind a source is allowed to declare', () => {
    expect(KINDS.has('lookup')).toBe(true)
  })

  it('fills a book that was already there rather than adding a second', () => {
    const catalog = build([
      shelf([{ title: 'Dune', authors: ['Frank Herbert'] }], 'photo', 'medium'),
      shelf(
        [
          {
            title: 'Dune',
            authors: ['Frank Herbert'],
            publisher: 'Ace Books',
            published_year: 2005,
            pages: 528,
            isbn: '9780441013593',
          },
        ],
        'lookup',
        'high',
      ),
    ])
    expect(catalog.books).toHaveLength(1)
    const [book] = catalog.books
    expect(book.pages).toBe(528)
    expect(book.publisher).toBe('Ace Books')
    expect(book.isbn).toBe('9780441013593')
  })

  it('adds a book nothing on the shelf matched', () => {
    const catalog = build([
      shelf([{ title: 'Dune', authors: ['Frank Herbert'] }], 'photo', 'medium'),
      shelf([{ title: 'The Hobbit', authors: ['J.R.R. Tolkien'], isbn: '9780547928227' }], 'lookup', 'high'),
    ])
    expect(catalog.books).toHaveLength(2)
  })

  it('wins on facts, because a published record outranks a read spine', () => {
    const catalog = build([
      shelf([{ title: 'Dune', authors: ['Frank Herbert'], publisher: 'Guessed' }], 'photo', 'medium'),
      shelf(
        [{ title: 'Dune', authors: ['Frank Herbert'], publisher: 'Ace Books', isbn: '9780441013593' }],
        'lookup',
        'high',
      ),
    ])
    expect(catalog.books[0].publisher).toBe('Ace Books')
  })

  it('carries the number itself, so the same book is not looked up twice', () => {
    const catalog = build([
      shelf([{ title: 'Dune', authors: ['Frank Herbert'], isbn: '9780441013593' }], 'lookup', 'high'),
    ])
    expect(catalog.books[0].isbn).toBe('9780441013593')
  })
})
