// The heuristics that decide whether two rows are the same book. They are the
// part of LibrAPP most likely to be quietly wrong: too loose and two books
// become one, too tight and a catalog fills with near-duplicates. Neither
// failure announces itself.

import { describe, expect, it } from 'vitest'
import {
  TITLE_MATCH_THRESHOLD,
  authorTokens,
  bestTitleScore,
  detectSeries,
  fold,
  slugify,
  splitCredits,
  titleHead,
  titleScore,
  tokenKey,
} from '../src/core/textmatch.js'
import { forgotten, readState, yearsSince } from '../src/lib.js'

describe('folding text for comparison', () => {
  it('ignores case, accents and spacing', () => {
    expect(fold('  Crítica  DE la Razón Pura ')).toBe(fold('critica de la razon pura'))
  })

  it('does not fold two different words together', () => {
    expect(fold('razón')).not.toBe(fold('razones'))
  })
})

describe('author names', () => {
  it('matches the same person written either way round', () => {
    expect(tokenKey(authorTokens('Immanuel Kant'))).toBe(tokenKey(authorTokens('Kant, Immanuel')))
  })

  it('survives an accent and a middle initial being dropped', () => {
    expect(tokenKey(authorTokens('Gabriel García Márquez'))).toBe(
      tokenKey(authorTokens('Garcia Marquez, Gabriel')),
    )
  })

  it('keeps two different people apart', () => {
    expect(tokenKey(authorTokens('Immanuel Kant'))).not.toBe(tokenKey(authorTokens('Hermann Kant')))
  })

  it('splits a credit listing several people', () => {
    expect(splitCredits('Deleuze, Gilles & Guattari, Félix').length).toBeGreaterThan(1)
  })
})

describe('titles', () => {
  it('scores a title against itself as a perfect match', () => {
    expect(titleScore('Dune', 'Dune')).toBe(1)
  })

  it('scores past the threshold across an accent and a case difference', () => {
    expect(titleScore('Crítica de la razón pura', 'critica de la razon pura')).toBeGreaterThan(
      TITLE_MATCH_THRESHOLD,
    )
  })

  it('scores two unrelated titles well below it', () => {
    expect(titleScore('Dune', 'Crítica de la razón pura')).toBeLessThan(TITLE_MATCH_THRESHOLD)
  })

  it('takes the subtitle off, so an edition that prints one still matches', () => {
    expect(titleHead('Heroínas: Cuentos en torno al 8 de marzo')).toBe(titleHead('Heroínas'))
  })

  it('lets a clipped spine match the whole title it was cut from', () => {
    // The failure that started this: a spine read as "…de la Muje" must find
    // the complete title, and must not be treated as a book of its own.
    expect(bestTitleScore('Crítica de la razón pu', 'Crítica de la razón pura')).toBeGreaterThan(
      TITLE_MATCH_THRESHOLD,
    )
  })
})

describe('series in a title', () => {
  // Deliberately narrow: it claims a series only where the title states one
  // plainly, in the parenthesised form editions actually print. Guessing wrong
  // is worse than not guessing, because a series and an index become part of
  // the entry's identity and split one book into two.
  it('reads the parenthesised form an edition prints', () => {
    expect(detectSeries('Los desposeídos (Ekumen 4)')).toEqual(['Ekumen', 4])
  })

  it('reads a roman numeral the same way', () => {
    expect(detectSeries('La Odisea (Clásicos III)')).toEqual(['Clásicos', 3])
  })

  it('drops the dangling word a publisher leaves behind', () => {
    expect(detectSeries('Solaris (Solaris ficción no 12)')).toEqual(['Solaris ficción', 12])
  })

  it('says nothing about a title that states no series', () => {
    expect(detectSeries('Dune')).toEqual([null, null])
    expect(detectSeries('')).toEqual([null, null])
    expect(detectSeries(null)).toEqual([null, null])
  })

  it('does not mistake a parenthesised aside for a series', () => {
    expect(detectSeries('Dune (a novel)')).toEqual([null, null])
  })
})

describe('identifiers', () => {
  it('makes the same id from the same parts every time', () => {
    expect(slugify('Immanuel Kant', 'Crítica de la razón pura')).toBe(
      slugify('Immanuel Kant', 'Crítica de la razón pura'),
    )
  })

  it('makes an id that is safe in a filename and a URL', () => {
    expect(slugify('Gabriel García Márquez', 'Cien años de soledad')).toMatch(/^[a-z0-9-]+$/)
  })

  it('makes different ids for different books', () => {
    expect(slugify('Kant', 'Crítica de la razón pura')).not.toBe(slugify('Kant', 'Crítica del juicio'))
  })
})

describe('what counts as read', () => {
  it('is three-valued, and the third value is not a shade of no', () => {
    expect(readState({ read: true })).toBe('read')
    expect(readState({ read: false })).toBe('unread')
    expect(readState({})).toBe('unknown')
    expect(readState({ read: null })).toBe('unknown')
  })
})

describe('books bought and never opened', () => {
  const YEAR = 365.25 * 24 * 3600 * 1000
  const iso = (yearsAgo) => new Date(Date.now() - yearsAgo * YEAR).toISOString().slice(0, 10)

  it('measures the wait in years', () => {
    expect(yearsSince(iso(3))).toBeCloseTo(3, 1)
    expect(yearsSince(null)).toBeNull()
  })

  it('lists only books known to be unread', () => {
    // Guessing that silence means unread would bury the list under books the
    // person finished years ago.
    const books = [
      { id: 'a', title: 'Waiting', read: false, acquired_on: iso(5) },
      { id: 'b', title: 'Finished', read: true, acquired_on: iso(5) },
      { id: 'c', title: 'Nobody Said', acquired_on: iso(5) },
    ]
    expect(forgotten(books, 2).map((r) => r.book.title)).toEqual(['Waiting'])
  })

  it('leaves out anything bought too recently to count', () => {
    const books = [{ id: 'a', title: 'New', read: false, acquired_on: iso(0.5) }]
    expect(forgotten(books, 2)).toEqual([])
  })

  it('leaves out a book with no purchase date, having nothing to measure', () => {
    expect(forgotten([{ id: 'a', title: 'Undated', read: false }], 2)).toEqual([])
  })
})
