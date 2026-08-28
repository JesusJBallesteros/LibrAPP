// The catalog hides three of its six filters behind a disclosure.
//
// A filter that is on while its control is hidden narrows the list with nothing
// on screen to explain it, and the person has no way to find out why. The view
// answers that by naming every hidden filter that is active, so these tests are
// about the rule that decides what to name.

import { describe, expect, it } from 'vitest'
import { hiddenActiveFilters } from '../src/lib.js'

describe('naming the filters that are hidden and on', () => {
  it('names none when nothing hidden is set', () => {
    expect(hiddenActiveFilters()).toEqual([])
  })

  it('names one', () => {
    expect(hiddenActiveFilters({ format: 'physical' })).toEqual(['format'])
  })

  it('names every one of them, rather than only the first', () => {
    // Reporting "1 filter" when three are on would be its own kind of wrong.
    expect(hiddenActiveFilters({ format: 'ebook', source: 'kindle', loan: 'lent' })).toEqual([
      'format',
      'source',
      'loan',
    ])
  })

  it('ignores the filters that stay on screen', () => {
    // Read and Group are visible, so they explain themselves and must not be
    // reported as hidden.
    expect(hiddenActiveFilters({ read: 'unread', group: 'series' })).toEqual([])
  })

  it('treats "all" as off for every one of them', () => {
    expect(hiddenActiveFilters({ format: 'all', source: 'all', loan: 'all' })).toEqual([])
  })

  it('counts a loan filter of "home" as on, since it does narrow the list', () => {
    expect(hiddenActiveFilters({ loan: 'home' })).toEqual(['loan'])
  })
})

// Grouping the catalog by author used to take the whole view down. byline
// returns null for a book nobody is credited on, so that null became a bucket
// key, and sorting the keys called localeCompare on it. Any real catalog has
// such a book, so the crash was one click away on most shelves.
describe('grouping books that have no author or no series', () => {
  // What the view does: bucket by a key, then sort the keys with the two
  // catch-alls last.
  const UNCREDITED = '\u0000uncredited'
  const STANDALONE = 'Standalone'
  const last = (key) => key === STANDALONE || key === UNCREDITED
  const order = (keys) =>
    [...keys].sort((a, b) => last(a) - last(b) || (last(a) ? 0 : a.localeCompare(b)))

  it('sorts named groups alphabetically', () => {
    expect(order(['Le Guin', 'Chiang', 'Herbert'])).toEqual(['Chiang', 'Herbert', 'Le Guin'])
  })

  it('puts the uncredited bucket last rather than throwing on it', () => {
    expect(order([UNCREDITED, 'Le Guin', 'Chiang']).at(-1)).toBe(UNCREDITED)
  })

  it('puts standalones after every real series', () => {
    expect(order([STANDALONE, 'Discworld', 'Earthsea']).at(-1)).toBe(STANDALONE)
  })

  it('survives a list that is nothing but catch-alls', () => {
    expect(() => order([UNCREDITED, STANDALONE])).not.toThrow()
  })

  it('never compares a catch-all as though it were a name', () => {
    // The marker starts with a NUL so it can never collide with a real author,
    // and it is never shown: the view swaps in a translated label.
    expect(UNCREDITED.startsWith('\u0000')).toBe(true)
    expect(() => order([UNCREDITED])).not.toThrow()
  })
})
