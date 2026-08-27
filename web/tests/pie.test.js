// What the collection is made of, and how much of it the chart names.
//
// The tag vocabulary is uncontrolled, so a real catalog has a long tail of
// genres used once or twice. The chart names the few that carry the collection
// and folds the rest into one slice, and "show more" widens that limit without
// abandoning it. These tests pin both settings, and the rule that decides when
// naming a leftover beats calling it "other".

import { describe, expect, it } from 'vitest'
import { summarise } from '../src/components/GenrePie.jsx'

// One book per count, each carrying a single genre tag.
const shelf = (counts) =>
  Object.entries(counts).flatMap(([genre, n]) =>
    Array.from({ length: n }, () => ({ tags: [{ kind: 'genre', value: genre }] })),
  )

const labels = (result) => result.slices.map((s) => (s.isOther ? 'other' : s.label))

describe('what the chart names', () => {
  it('has nothing to show for a shelf with no genres', () => {
    const result = summarise([{ tags: [] }, { tags: [{ kind: 'author', value: 'Someone' }] }])
    expect(result.slices).toEqual([])
    expect(result.total).toBe(0)
    expect(result.distinct).toBe(0)
  })

  it('counts only genre tags', () => {
    const result = summarise([
      { tags: [{ kind: 'genre', value: 'History' }, { kind: 'author', value: 'Someone' }] },
    ])
    expect(result.total).toBe(1)
    expect(labels(result)).toEqual(['History'])
  })

  it('orders the slices largest first', () => {
    const result = summarise(shelf({ Small: 1, Huge: 30, Middling: 8 }))
    expect(labels(result)).toEqual(['Huge', 'Middling', 'Small'])
  })

  it('names no more than five before folding the rest into one', () => {
    const result = summarise(shelf({ A: 20, B: 18, C: 16, D: 14, E: 12, F: 10, G: 8, H: 6 }))
    const named = result.slices.filter((s) => !s.isOther)
    expect(named).toHaveLength(5)
    expect(labels(result)).toEqual(['A', 'B', 'C', 'D', 'E', 'other'])
    expect(result.slices.at(-1).covers).toBe(3)
  })

  it('stops early once the named slices carry most of the shelf', () => {
    // One genre is four fifths of everything, so naming more adds nothing.
    const result = summarise(shelf({ Dominant: 80, B: 5, C: 5, D: 5, E: 5 }))
    expect(labels(result)).toEqual(['Dominant', 'other'])
  })

  it('names a single leftover rather than calling one genre "other"', () => {
    const result = summarise(shelf({ A: 20, B: 18, C: 16, D: 14, E: 12, F: 10 }))
    expect(result.slices.some((s) => s.isOther)).toBe(false)
    expect(labels(result)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
  })

  it('reports how many distinct genres there are, named or not', () => {
    const result = summarise(shelf({ A: 20, B: 18, C: 16, D: 14, E: 12, F: 10, G: 8, H: 6 }))
    expect(result.distinct).toBe(8)
  })

  it('gives every slice a share that adds up to the whole', () => {
    const result = summarise(shelf({ A: 3, B: 1 }))
    const sum = result.slices.reduce((n, s) => n + s.share, 0)
    expect(sum).toBeCloseTo(1)
  })

  it('numbers the slots from one, so each slice picks its own colour', () => {
    const result = summarise(shelf({ A: 5, B: 4, C: 3 }))
    expect(result.slices.map((s) => s.slot)).toEqual([1, 2, 3])
  })
})

// Tags carry a folded key beside their value, and one genre is often written
// two ways across a shelf. The chart counted labels rather than keys, which put
// "Comic fantasy" and "comic fantasy" in the legend as two adjacent genres.
describe('one genre written two ways', () => {
  const tagged = (pairs) =>
    pairs.map(([value, key]) => ({ tags: [{ kind: 'genre', value, key }] }))

  it('counts both spellings as one genre', () => {
    const result = summarise(
      tagged([
        ['Satire', 'satire'],
        ['satire', 'satire'],
        ['satire', 'satire'],
      ]),
    )
    expect(result.slices).toHaveLength(1)
    expect(result.slices[0].count).toBe(3)
    expect(result.distinct).toBe(1)
  })

  it('names it by the spelling the shelf uses most', () => {
    const result = summarise(
      tagged([
        ['satire', 'satire'],
        ['satire', 'satire'],
        ['Satire', 'satire'],
      ]),
    )
    expect(result.slices[0].label).toBe('satire')
  })

  it('breaks a tie the same way whichever order the books arrive in', () => {
    // Which spelling wins a tie matters less than that it is always the same
    // one: a legend that renamed a genre on re-import would look like a change
    // in the shelf. Collation puts lower case first, so the tie goes there.
    const one = summarise(tagged([['Satire', 'satire'], ['satire', 'satire']]))
    const other = summarise(tagged([['satire', 'satire'], ['Satire', 'satire']]))
    expect(one.slices[0].label).toBe('satire')
    expect(other.slices[0].label).toBe('satire')
  })

  it('folds accents and punctuation, not only case', () => {
    const result = summarise(
      tagged([
        ['Ciencia ficción', 'ciencia ficcion'],
        ['ciencia ficcion', 'ciencia ficcion'],
      ]),
    )
    expect(result.slices).toHaveLength(1)
    expect(result.slices[0].count).toBe(2)
  })

  it('keeps genuinely different genres apart', () => {
    const result = summarise(
      tagged([
        ['Fantasy', 'fantasy'],
        ['Comic fantasy', 'comic fantasy'],
      ]),
    )
    expect(result.distinct).toBe(2)
  })

  it('falls back to folding the value when a tag carries no key', () => {
    // A catalog built before tags carried one.
    const result = summarise([
      { tags: [{ kind: 'genre', value: 'Satire' }] },
      { tags: [{ kind: 'genre', value: 'satire' }] },
    ])
    expect(result.slices).toHaveLength(1)
    expect(result.slices[0].count).toBe(2)
  })
})

describe('asking the chart to name more', () => {
  const wide = { share: 0.98, maxNamed: 11 }
  const many = shelf({
    A: 30, B: 26, C: 22, D: 18, E: 15, F: 12, G: 10, H: 8, I: 6, J: 5, K: 4, L: 3, M: 2,
  })

  it('names five by default and eleven when widened', () => {
    expect(summarise(many).slices.filter((s) => !s.isOther)).toHaveLength(5)
    expect(summarise(many, wide).slices.filter((s) => !s.isOther)).toHaveLength(11)
  })

  it('never asks for a colour the ramp does not have', () => {
    // Eleven named plus one "other" is the whole of --series-wide-1..12.
    const slots = summarise(many, wide).slices.map((s) => s.slot)
    expect(Math.max(...slots)).toBeLessThanOrEqual(12)
  })

  it('still folds whatever is left after eleven', () => {
    const result = summarise(many, wide)
    const last = result.slices.at(-1)
    expect(last.isOther).toBe(true)
    expect(last.covers).toBe(2)
  })

  it('leaves nothing folded when the shelf has no more to give', () => {
    const few = shelf({ A: 10, B: 8, C: 6 })
    const result = summarise(few, wide)
    expect(result.slices.some((s) => s.isOther)).toBe(false)
    expect(labels(result)).toEqual(['A', 'B', 'C'])
  })

  it('accounts for the same books either way', () => {
    expect(summarise(many).total).toBe(summarise(many, wide).total)
    expect(summarise(many).distinct).toBe(summarise(many, wide).distinct)
  })

  it('widening is what lets the tail be named at all', () => {
    // The default stops at four fifths; the widened share does not, which is
    // the point of asking for more.
    const skewed = shelf({ Dominant: 80, B: 5, C: 5, D: 5, E: 5 })
    expect(labels(summarise(skewed))).toEqual(['Dominant', 'other'])
    expect(labels(summarise(skewed, wide))).toEqual(['Dominant', 'B', 'C', 'D', 'E'])
  })
})
