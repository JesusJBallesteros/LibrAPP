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
