// Which words the cloud draws. Layout is not tested; the selection is, because
// that is what decides whether the picture says anything.

import { describe, expect, it } from 'vitest'
import { summariseWords } from '../src/components/WordCloud.jsx'

const book = (id, keywords) => ({
  id,
  title: id,
  tags: keywords.map((value) => ({ kind: 'keyword', value, key: value.toLowerCase() })),
})

describe('choosing the words', () => {
  it('drops a keyword only one book uses', () => {
    const books = [book('a', ['war', 'once']), book('b', ['war'])]
    expect(summariseWords(books).words.map((w) => w.value)).toEqual(['war'])
  })

  it('counts how many books use each word', () => {
    const books = [book('a', ['war']), book('b', ['war']), book('c', ['war'])]
    expect(summariseWords(books).words[0].count).toBe(3)
  })

  it('puts the heaviest first', () => {
    const books = [
      book('a', ['war', 'exile']),
      book('b', ['war', 'exile']),
      book('c', ['war']),
    ]
    expect(summariseWords(books).words.map((w) => w.value)).toEqual(['war', 'exile'])
  })

  it('breaks a tie alphabetically, so the cloud does not reshuffle', () => {
    const books = [book('a', ['zeta', 'alpha']), book('b', ['zeta', 'alpha'])]
    const first = summariseWords(books).words.map((w) => w.value)
    const second = summariseWords([...books].reverse()).words.map((w) => w.value)
    expect(first).toEqual(['alpha', 'zeta'])
    expect(first).toEqual(second)
  })

  it('reports how many keywords exist beyond the ones drawn', () => {
    const books = [book('a', ['war', 'once', 'twice']), book('b', ['war'])]
    const out = summariseWords(books)
    expect(out.drawn).toBe(1)
    expect(out.distinct).toBe(3)
  })

  it('caps how many it draws', () => {
    const many = Array.from({ length: 60 }, (_, i) => `w${i}`)
    const books = [book('a', many), book('b', many)]
    expect(summariseWords(books, 40).words).toHaveLength(40)
  })

  it('ignores genres, which the pie already shows', () => {
    const books = [
      { id: 'a', tags: [{ kind: 'genre', value: 'Philosophy', key: 'philosophy' }] },
      { id: 'b', tags: [{ kind: 'genre', value: 'Philosophy', key: 'philosophy' }] },
    ]
    expect(summariseWords(books).words).toEqual([])
  })

  it('copes with a catalog that has no tags at all', () => {
    expect(summariseWords([{ id: 'a' }]).words).toEqual([])
    expect(summariseWords([]).words).toEqual([])
    expect(summariseWords(undefined).words).toEqual([])
  })
})
