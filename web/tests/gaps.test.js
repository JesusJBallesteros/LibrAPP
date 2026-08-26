// Asking a model to fill in what the catalog does not know.
//
// Everything this produces is recalled rather than read, so the parser is the
// safety rail: nothing reaches the catalog that the reader has not seen, and
// nothing overwrites a value that came from a source. These tests are mostly
// about what gets thrown away.

import { describe, expect, it } from 'vitest'
import {
  FILLABLE,
  GapsError,
  booksNeeding,
  buildRequest,
  gapsByField,
  parseReply,
} from '../src/ai/gaps.js'
import { EDITABLE } from '../src/core/overrides.js'

const book = (id, over = {}) => ({ id, title: `Book ${id}`, authors: [], ...over })
const names = new Map([['ursula', 'Ursula K. Le Guin']])

describe('what can be filled', () => {
  it('offers only the recalled half of the extras checklist', () => {
    expect(FILLABLE).toContain('abstract')
    expect(FILLABLE).toContain('pages')
    // Publisher is read off a spine, so it is not something to recall.
    expect(FILLABLE).not.toContain('publisher')
  })

  it('can write every field it offers', () => {
    // A field the override layer refuses would let the request be sent, the
    // money be spent, and the write fail at the last step.
    for (const field of FILLABLE) expect(EDITABLE, field).toContain(field)
  })
})

describe('counting the gaps', () => {
  it('counts a field as missing when it is null or blank', () => {
    const books = [book('1', { pages: 300 }), book('2', { pages: null }), book('3', { pages: '' })]
    expect(gapsByField(books, ['pages']).pages).toBe(2)
  })

  it('counts zero as recorded, since zero is a value somebody set', () => {
    expect(gapsByField([book('1', { rating: 0 })], ['rating']).rating).toBe(0)
  })
})

describe('choosing the books to ask about', () => {
  it('takes only those missing something asked for', () => {
    const books = [book('1', { pages: 300 }), book('2')]
    expect(booksNeeding(books, ['pages']).map((b) => b.id)).toEqual(['2'])
  })

  it('takes a book missing any one of the chosen fields', () => {
    const books = [book('1', { pages: 300, rating: 4 }), book('2', { pages: 300 })]
    expect(booksNeeding(books, ['pages', 'rating']).map((b) => b.id)).toEqual(['2'])
  })

  it('puts the books the reader spoke about first', () => {
    const books = [book('a'), book('z', { favourite: true }), book('m', { notes: 'Good.' })]
    expect(booksNeeding(books, ['pages']).map((b) => b.id)).toEqual(['z', 'm', 'a'])
  })

  it('caps the request, so a large shelf cannot be sent by accident', () => {
    const books = Array.from({ length: 400 }, (_, i) => book(`b${i}`))
    expect(booksNeeding(books, ['pages'], { limit: 60 })).toHaveLength(60)
  })

  it('picks the same books every time, so running it twice works through the shelf', () => {
    const books = Array.from({ length: 100 }, (_, i) => book(`b${i}`))
    const first = booksNeeding(books, ['pages'], { limit: 10 }).map((b) => b.id)
    expect(booksNeeding(books, ['pages'], { limit: 10 }).map((b) => b.id)).toEqual(first)
  })
})

describe('the request', () => {
  const built = () =>
    buildRequest([book('b1', { authors: ['ursula'] })], ['pages', 'rating'], names, 'PROMPT')

  it('carries the id, so the reply can be matched without guessing from a title', () => {
    expect(built()).toContain('id: b1')
  })

  it('names the author the catalog holds', () => {
    expect(built()).toContain('Ursula K. Le Guin')
  })

  it('says which fields are missing for that book', () => {
    expect(built()).toContain('missing: pages, rating')
  })

  it('names the gap when no author is recorded', () => {
    const text = buildRequest([book('b1')], ['pages'], names, 'PROMPT')
    expect(text).toContain('not recorded')
  })

  it('asks only for fields it could write', () => {
    // Every book line carries the word "title", so the check has to be on the
    // asked-for list rather than on the whole request.
    const text = buildRequest([book('b1')], ['pages', 'title'], names, 'PROMPT')
    const asked = text.split('## Fields asked for\n\n')[1].split('\n')[0]
    expect(asked).toBe('pages')
    expect(text).toContain('missing: pages')
  })
})

describe('reading the reply', () => {
  const books = [book('b1'), book('b2', { pages: 400 })]
  const parse = (text, fields = ['pages', 'rating', 'published_year']) =>
    parseReply(text, { books, fields })

  it('takes a value for a field that was empty', () => {
    const { proposals } = parse('{"books":[{"id":"b1","pages":320}]}')
    expect(proposals).toEqual([{ id: 'b1', title: 'Book b1', set: { pages: 320 } }])
  })

  it('finds the object inside any chatter around it', () => {
    const { proposals } = parse('Here you are:\n```json\n{"books":[{"id":"b1","pages":320}]}\n```\n')
    expect(proposals).toHaveLength(1)
  })

  it('never overwrites a value that is already recorded', () => {
    // This fills gaps. A value already there came from somewhere, and this is
    // not the thing to replace it.
    const { proposals, ignored } = parse('{"books":[{"id":"b2","pages":999}]}')
    expect(proposals).toHaveLength(0)
    expect(ignored).toBe(1)
  })

  it('drops a book the catalog does not have', () => {
    const { proposals, ignored } = parse('{"books":[{"id":"nope","pages":100}]}')
    expect(proposals).toHaveLength(0)
    expect(ignored).toBe(1)
  })

  it('drops a field nobody asked for', () => {
    const { proposals } = parseReply('{"books":[{"id":"b1","pages":320,"rating":5}]}', {
      books,
      fields: ['pages'],
    })
    expect(proposals[0].set).toEqual({ pages: 320 })
  })

  it('drops a value of the wrong type rather than storing it', () => {
    const { proposals } = parse('{"books":[{"id":"b1","pages":"about three hundred"}]}')
    expect(proposals).toHaveLength(0)
  })

  it('refuses a rating outside the scale', () => {
    expect(parse('{"books":[{"id":"b1","rating":11}]}').proposals).toHaveLength(0)
  })

  it('refuses a year that is not one', () => {
    expect(parse('{"books":[{"id":"b1","published_year":1974.5}]}').proposals).toHaveLength(0)
    expect(parse('{"books":[{"id":"b1","published_year":-40}]}').proposals).toHaveLength(0)
  })

  it('refuses a page count that could not be a book', () => {
    expect(parse('{"books":[{"id":"b1","pages":0}]}').proposals).toHaveLength(0)
    expect(parse('{"books":[{"id":"b1","pages":900000}]}').proposals).toHaveLength(0)
  })

  it('rounds a rating to one decimal place', () => {
    expect(parse('{"books":[{"id":"b1","rating":4.26}]}').proposals[0].set.rating).toBe(4.3)
  })

  it('treats an empty array as a valid and honest answer', () => {
    expect(parse('{"books":[]}').proposals).toEqual([])
  })

  it('says so when the reply is not JSON at all', () => {
    expect(() => parse('I could not identify any of these books.')).toThrow(GapsError)
  })

  it('says so when the reply is JSON but not the shape asked for', () => {
    expect(() => parse('{"answer":"none"}')).toThrow(GapsError)
  })

  it('keeps the good rows from a reply that also holds bad ones', () => {
    const { proposals, ignored } = parse(
      '{"books":[{"id":"b1","pages":320},{"id":"nope","pages":1},{"id":"b2","pages":5}]}',
    )
    expect(proposals.map((p) => p.id)).toEqual(['b1'])
    expect(ignored).toBe(2)
  })
})
