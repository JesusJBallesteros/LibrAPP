// Choosing which books to name in the profile.
//
// The sample is the difference between a model seeing a shelf and a model
// seeing the last two years of buying it. These tests are mostly about the
// sample staying proportional, staying deterministic, and never dropping the
// books the reader spoke about.

import { describe, expect, it } from 'vitest'
import { allocate, representative, signal } from '../src/core/sample.js'

const book = (id, over = {}) => ({ id, title: `Book ${id}`, tags: [], ...over })
const inGenre = (id, genre, over = {}) =>
  book(id, { tags: [{ kind: 'genre', value: genre }], ...over })

const many = (n, genre) => Array.from({ length: n }, (_, i) => inGenre(`${genre}-${i}`, genre))

describe('splitting the slots', () => {
  it('gives everything to one bucket when there is only one', () => {
    expect(allocate(new Map([['a', 10]]), 4).get('a')).toBe(4)
  })

  it('adds up to exactly the budget', () => {
    const sizes = new Map([['a', 50], ['b', 30], ['c', 13], ['d', 7]])
    const share = allocate(sizes, 20)
    const total = [...share.values()].reduce((a, b) => a + b, 0)
    expect(total).toBe(20)
  })

  it('splits in proportion, not evenly', () => {
    const share = allocate(new Map([['big', 90], ['small', 10]]), 20)
    expect(share.get('big')).toBeGreaterThan(share.get('small'))
  })

  it('never gives a bucket more than it holds', () => {
    const sizes = new Map([['big', 90], ['tiny', 2]])
    const share = allocate(sizes, 40)
    expect(share.get('tiny')).toBeLessThanOrEqual(2)
    expect([...share.values()].reduce((a, b) => a + b, 0)).toBe(40)
  })

  it('gives a small bucket at least one slot, so a genre does not vanish', () => {
    // A genre allocated zero reads to a model as a genre that is not there.
    const share = allocate(new Map([['big', 500], ['rare', 1]]), 20)
    expect(share.get('rare')).toBe(1)
  })

  it('runs out of slots gracefully when there are more buckets than slots', () => {
    const sizes = new Map(Array.from({ length: 30 }, (_, i) => [`g${i}`, 5]))
    const share = allocate(sizes, 10)
    expect([...share.values()].reduce((a, b) => a + b, 0)).toBe(10)
  })

  it('gives nothing away when asked for nothing', () => {
    const share = allocate(new Map([['a', 5]]), 0)
    expect(share.get('a')).toBe(0)
  })

  it('survives an empty catalog', () => {
    expect([...allocate(new Map(), 10).values()]).toEqual([])
  })
})

describe('how much a book says about its reader', () => {
  it('ranks a marked book above an untouched one', () => {
    expect(signal(book('a', { favourite: true }))).toBeGreaterThan(signal(book('b')))
  })

  it('ranks a book with a note above one with only a read flag', () => {
    expect(signal(book('a', { notes: 'Loved it.' }))).toBeGreaterThan(
      signal(book('b', { read: true })),
    )
  })

  it('counts a recorded rating and page count for something', () => {
    expect(signal(book('a', { rating: 4 }))).toBeGreaterThan(signal(book('b')))
    expect(signal(book('a', { pages: 300 }))).toBeGreaterThan(signal(book('b')))
  })
})

describe('the cross-section', () => {
  it('returns everything when the shelf is smaller than the limit', () => {
    const books = many(5, 'history')
    expect(representative(books, 40)).toHaveLength(5)
  })

  it('never returns more than the limit', () => {
    expect(representative(many(500, 'history'), 40)).toHaveLength(40)
  })

  it('gives the same answer every time', () => {
    const books = [...many(60, 'history'), ...many(40, 'fiction')]
    const first = representative(books, 25).map((b) => b.id)
    for (let i = 0; i < 5; i++) {
      expect(representative(books, 25).map((b) => b.id)).toEqual(first)
    }
  })

  it('keeps the genres in proportion rather than taking the first it finds', () => {
    const books = [...many(90, 'history'), ...many(10, 'poetry')]
    const picked = representative(books, 20)
    const poetry = picked.filter((b) => b.tags[0].value === 'poetry').length
    const history = picked.filter((b) => b.tags[0].value === 'history').length
    expect(poetry).toBeGreaterThan(0)
    expect(history).toBeGreaterThan(poetry)
  })

  it('always includes a book the reader marked, however large the shelf', () => {
    const starred = inGenre('starred', 'poetry', { favourite: true })
    const books = [...many(400, 'history'), starred]
    expect(representative(books, 20).map((b) => b.id)).toContain('starred')
  })

  it('always includes a book the reader wrote about', () => {
    const noted = inGenre('noted', 'history', { notes: 'The one I keep lending.' })
    const books = [...many(400, 'history'), noted]
    expect(representative(books, 20).map((b) => b.id)).toContain('noted')
  })

  it('puts what the reader said first, before what was counted', () => {
    const books = [...many(100, 'history'), inGenre('starred', 'history', { favourite: true })]
    expect(representative(books, 20)[0].id).toBe('starred')
  })

  it('still fits the limit when the marked books alone would fill it', () => {
    const starred = Array.from({ length: 50 }, (_, i) =>
      inGenre(`star-${i}`, 'history', { favourite: true }),
    )
    const picked = representative([...starred, ...many(200, 'fiction')], 20)
    expect(picked).toHaveLength(20)
    expect(picked.every((b) => b.favourite)).toBe(true)
  })

  it('files books with no genre rather than dropping them', () => {
    const books = Array.from({ length: 100 }, (_, i) => book(`u${i}`))
    expect(representative(books, 10)).toHaveLength(10)
  })

  it('prefers the books that say more, inside a genre', () => {
    const plain = many(40, 'history')
    const rated = inGenre('rated', 'history', { rating: 5, read: true, pages: 300 })
    const picked = representative([...plain, rated], 12)
    expect(picked.map((b) => b.id)).toContain('rated')
  })
})
