// Merging is what LibrAPP is for. Anyone can list books; the reason to
// photograph a shelf *and* import a Kindle export is that the same book arriving
// twice should end up as one entry that knows both.
//
// These are end-to-end over build(): sources in, catalog out. Testing the
// clustering helpers in isolation would pin the current implementation rather
// than the promise, and the promise is what must not regress.

import { describe, expect, it } from 'vitest'
import { makeSource, readSource } from '../src/core/records.js'
import { build } from '../src/core/build.js'

const source = ({ name, kind = 'table', format = 'physical', confidence = 'medium' }, records) =>
  readSource(
    makeSource({ name, kind, origin: `${name}.json`, format, confidence, records }),
    name,
  )

const titles = (catalog) => catalog.books.map((b) => b.title)
const find = (catalog, needle) => catalog.books.find((b) => b.title.includes(needle))

describe('one book from two places', () => {
  it('merges the same title from two sources into a single entry', () => {
    const catalog = build([
      source({ name: 'list' }, [{ title: 'Crítica de la razón pura', authors: ['Immanuel Kant'] }]),
      source({ name: 'shelf', kind: 'photo' }, [
        { title: 'Critica de la razon pura', authors: ['Kant, Immanuel'] },
      ]),
    ])
    expect(catalog.books).toHaveLength(1)
    expect(catalog.books[0].sources.sort()).toEqual(['list', 'shelf'])
    expect(catalog.counts.in_multiple_sources).toBe(1)
  })

  it('keeps two different books by the same author apart', () => {
    const catalog = build([
      source({ name: 'list' }, [
        { title: 'Crítica de la razón pura', authors: ['Immanuel Kant'] },
        { title: 'Crítica del juicio', authors: ['Immanuel Kant'] },
      ]),
    ])
    expect(catalog.books).toHaveLength(2)
  })

  it('does not merge the same title by different authors', () => {
    // Shared titles are common. The author gate is what stops a catalog
    // quietly deciding two books are one.
    const catalog = build([
      source({ name: 'a' }, [{ title: 'Metamorphosis', authors: ['Franz Kafka'] }]),
      source({ name: 'b' }, [{ title: 'Metamorphosis', authors: ['Ovid'] }]),
    ])
    expect(catalog.books).toHaveLength(2)
  })

  it('carries the union of formats when the same book is held twice over', () => {
    const catalog = build([
      source({ name: 'shelf', kind: 'photo' }, [{ title: 'Dune', authors: ['Frank Herbert'] }]),
      source({ name: 'kindle', kind: 'store-export', format: 'ebook', confidence: 'high' }, [
        { title: 'Dune', authors: ['Frank Herbert'] },
      ]),
    ])
    expect(catalog.books).toHaveLength(1)
    expect(catalog.books[0].formats.sort()).toEqual(['ebook', 'physical'])
  })
})

describe('who wins when sources disagree', () => {
  it('prefers the fact from the more trusted source', () => {
    const catalog = build([
      source({ name: 'guess', confidence: 'low' }, [
        { title: 'Dune', authors: ['Frank Herbert'], publisher: 'Wrong House' },
      ]),
      source({ name: 'export', kind: 'store-export', confidence: 'high' }, [
        { title: 'Dune', authors: ['Frank Herbert'], publisher: 'Chilton Books' },
      ]),
    ])
    expect(catalog.books).toHaveLength(1)
    expect(catalog.books[0].publisher).toBe('Chilton Books')
  })

  it('takes a judgement from whoever actually recorded one', () => {
    // Confidence ranks facts. "Have I read this" is not a fact about the book,
    // so a high-confidence source that never asked must not outvote a
    // low-confidence one that did.
    const catalog = build([
      source({ name: 'export', kind: 'store-export', confidence: 'high' }, [
        { title: 'Dune', authors: ['Frank Herbert'] },
      ]),
      source({ name: 'mine', confidence: 'low' }, [
        { title: 'Dune', authors: ['Frank Herbert'], read: true },
      ]),
    ])
    expect(catalog.books[0].read).toBe(true)
  })
})

describe('what the catalog counts', () => {
  it('counts unread and not-recorded separately', () => {
    const catalog = build([
      source({ name: 'list' }, [
        { title: 'Read One', authors: ['A'], read: true },
        { title: 'Unread One', authors: ['B'], read: false },
        { title: 'Silent One', authors: ['C'] },
      ]),
    ])
    expect(catalog.counts.read).toBe(1)
    expect(catalog.counts.unread).toBe(1)
    expect(catalog.counts.read_unknown).toBe(1)
  })

  it('produces a stable order that does not depend on the order sources arrive', () => {
    const a = source({ name: 'a' }, [{ title: 'Zeta', authors: ['Beta Writer'] }])
    const b = source({ name: 'b' }, [{ title: 'Alpha', authors: ['Alpha Writer'] }])
    expect(titles(build([a, b]))).toEqual(titles(build([b, a])))
  })
})

describe('what the catalog admits it does not know', () => {
  it('flags a book with no genre so the gap is visible rather than absent', () => {
    const catalog = build([source({ name: 'list' }, [{ title: 'Untagged', authors: ['A'] }])])
    expect(catalog.books[0].flags).toContain('no_genre')
    expect(catalog.review.no_genre).toContain('Untagged')
  })

  it('keeps a clipped title flagged when no source has the whole of it', () => {
    const catalog = build([
      source({ name: 'shelf', kind: 'photo' }, [
        { title: 'Heroínas: Cuentos en torno al 8 de', authors: ['VV AA'], title_clipped: true },
      ]),
    ])
    expect(catalog.books[0].flags).toContain('title_clipped')
    expect(catalog.review.clipped_titles).toHaveLength(1)
  })

  it('lets a fuller title from elsewhere repair a clipped one', () => {
    const catalog = build([
      source({ name: 'shelf', kind: 'photo' }, [
        { title: 'Crítica de la razón pu', authors: ['Immanuel Kant'], title_clipped: true },
      ]),
      source({ name: 'list', confidence: 'high' }, [
        { title: 'Crítica de la razón pura', authors: ['Immanuel Kant'] },
      ]),
    ])
    expect(catalog.books).toHaveLength(1)
    expect(catalog.books[0].title).toBe('Crítica de la razón pura')
  })

  it('keeps a collapsed series row when nothing expands it', () => {
    // A row reading "the Sandman, vols 1-10" stands for ten books no source
    // lists individually. Dropping it loses a whole shelf.
    const catalog = build([
      source({ name: 'list' }, [
        {
          title: 'The Sandman',
          authors: ['Neil Gaiman'],
          collapsed: true,
          listed_volumes: 'Preludes and Nocturnes, The Doll House',
        },
      ]),
    ])
    expect(find(catalog, 'Sandman').flags).toContain('series_not_expanded')
    expect(catalog.review.series_not_expanded).toHaveLength(1)
  })
})

describe('an empty build', () => {
  it('produces a catalog rather than throwing', () => {
    const catalog = build([])
    expect(catalog.books).toEqual([])
    expect(catalog.counts.books).toBe(0)
    expect(catalog.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

// The extras checklist asks a model for details no spine carries, and the
// reader pays for the answer. Those fields have to survive the merge, or the
// whole checklist charges for something the catalog throws away. They did not:
// buildEntry names the fields it keeps, and these five were absent from that
// list while the recalled_details flag beside them was carried, so a book could
// claim to hold recalled details and show none.
describe('what a model recalled reaches the catalog', () => {
  const RECALLED = {
    abstract: 'Two or three sentences about the book.',
    published_year: 1974,
    rating: 4.2,
    original_language: 'English',
    pages: 341,
  }

  const shelf = (over = {}) =>
    source({ name: 'shelf', kind: 'photo' }, [
      {
        title: 'The Dispossessed',
        authors: ['Ursula K. Le Guin'],
        flags: ['recalled_details'],
        ...RECALLED,
        ...over,
      },
    ])

  it('keeps every recalled field', () => {
    const book = find(build([shelf()]), 'Dispossessed')
    for (const [field, value] of Object.entries(RECALLED)) {
      expect(book[field], field).toBe(value)
    }
  })

  it('does not flag a book as carrying recalled details while dropping them', () => {
    // The flag and the fields have to agree. One arriving without the other is
    // the catalog saying two different things about the same book.
    const book = find(build([shelf()]), 'Dispossessed')
    expect(book.flags).toContain('recalled_details')
    expect(Object.keys(RECALLED).some((f) => book[f] != null)).toBe(true)
  })

  it('leaves them unset for a book nobody asked about', () => {
    const catalog = build([
      source({ name: 'list' }, [{ title: 'Plain Entry', authors: ['Nobody'] }]),
    ])
    const book = find(catalog, 'Plain Entry')
    for (const field of Object.keys(RECALLED)) expect(book[field], field).toBe(null)
  })

  it('prefers the more trusted source when two disagree', () => {
    const catalog = build([
      source({ name: 'guess', kind: 'photo', confidence: 'low' }, [
        { title: 'The Dispossessed', authors: ['Ursula K. Le Guin'], published_year: 1999 },
      ]),
      source({ name: 'sure', kind: 'photo', confidence: 'high' }, [
        { title: 'The Dispossessed', authors: ['Ursula K. Le Guin'], published_year: 1974 },
      ]),
    ])
    expect(find(catalog, 'Dispossessed').published_year).toBe(1974)
  })

  it('takes a recalled field from whichever source has one', () => {
    // A photograph read with extras and a spreadsheet without: the merged entry
    // should carry what the photograph recalled.
    const catalog = build([
      source({ name: 'list' }, [{ title: 'The Dispossessed', authors: ['Ursula K. Le Guin'] }]),
      shelf(),
    ])
    expect(catalog.books).toHaveLength(1)
    expect(find(catalog, 'Dispossessed').pages).toBe(341)
  })
})

// A source says how far it is to be trusted, and every row in it used to
// inherit that wholesale: a tidy spreadsheet declared high, so a row reading
// "[...] and Philosophy" by "Reference" was high too. The container is still
// what a source can vouch for, so these checks only ever lower a record.
describe('a floor under what a tidy file can claim', () => {
  const trusted = (records) => build([source({ name: 'list', confidence: 'high' }, records)])

  it('catches a stand-in that carries on into a real-looking title', () => {
    // The old rule only matched a title that was nothing but a bracketed note,
    // so this one read as a real title and kept its source's confidence.
    const book = find(trusted([{ title: '[...] and Philosophy', authors: ['Meyer'] }]), 'Philosophy')
    expect(book.flags).toContain('placeholder')
    expect(book.confidence).toBe('low')
  })

  it('still catches a title that is nothing but a note', () => {
    const book = find(trusted([{ title: '[spine partly legible]' }]), 'spine')
    expect(book.flags).toContain('placeholder')
    expect(book.confidence).toBe('low')
  })

  it('demotes a book whose author column holds a stand-in word', () => {
    const book = find(trusted([{ title: 'Alemán para Dummies', author_label: 'Reference' }]), 'Dummies')
    expect(book.flags).toContain('placeholder_author')
    expect(book.confidence).toBe('medium')
  })

  it('catches a stand-in among the author names, not only the label', () => {
    const book = find(trusted([{ title: 'An Anthology', authors: ['Various Authors'] }]), 'Anthology')
    expect(book.flags).toContain('placeholder_author')
  })

  it('reads the Spanish stand-ins too, since a shelf is not all English', () => {
    for (const name of ['VV.AA.', 'AA. VV.', 'Varios autores', 'Desconocido']) {
      const book = find(trusted([{ title: `Libro de ${name}`, author_label: name }]), 'Libro')
      expect(book.flags).toContain('placeholder_author')
    }
  })

  it('leaves a real author alone', () => {
    for (const name of ['Ursula K. Le Guin', 'Anonymous Sources Ltd', 'Reference Press']) {
      const book = find(trusted([{ title: `A Book by ${name}`, authors: [name] }]), 'A Book')
      expect(book.flags).not.toContain('placeholder_author')
      expect(book.confidence).toBe('high')
    }
  })

  it('leaves a real title carrying brackets alone', () => {
    const book = find(
      trusted([{ title: 'A Fire Upon the Deep (S.F. MASTERWORKS Book 166) [Kindle]', authors: ['Vinge'] }]),
      'A Fire',
    )
    expect(book.flags).not.toContain('placeholder')
    expect(book.confidence).toBe('high')
  })

  it('does not raise a record that was already lower', () => {
    // A photograph declares medium. Finding nothing wrong must not promote it.
    const catalog = build([
      source({ name: 'shelf', kind: 'photo', confidence: 'medium' }, [
        { title: 'A Perfectly Good Title', authors: ['Someone'] },
      ]),
    ])
    expect(find(catalog, 'Perfectly').confidence).toBe('medium')
  })

  it('does not raise a placeholder title out of low', () => {
    const catalog = build([
      source({ name: 'shelf', kind: 'photo', confidence: 'medium' }, [
        { title: '[two volumes, spines not legible]', confidence: 'low' },
      ]),
    ])
    expect(find(catalog, 'two volumes').confidence).toBe('low')
  })

  it('does not confuse having no author with having a stand-in one', () => {
    // A reference work honestly has no personal author. That is recorded, and
    // is not on its own a reason to doubt the row.
    const book = find(trusted([{ title: 'The Oxford Companion to Wine' }]), 'Oxford')
    expect(book.flags).toContain('no_personal_author')
    expect(book.flags).not.toContain('placeholder_author')
    expect(book.confidence).toBe('high')
  })
})

// The rest of the plausibility checks. Each one demotes rather than refuses,
// because a value that looks wrong is still the value the source gave and
// throwing it away would lose more than it saves.
describe('more of what a tidy file cannot claim', () => {
  const trusted = (records) => build([source({ name: 'list', confidence: 'high' }, records)])

  it('catches the catalogue abbreviations for an unnamed author', () => {
    for (const name of ['s.n.', 's. n.', 'S.A.', 'sine nomine']) {
      const book = find(trusted([{ title: `Book by ${name}`, author_label: name }]), 'Book by')
      expect(book.flags).toContain('placeholder_author')
      expect(book.confidence).toBe('medium')
    }
  })

  it('catches the publisher standing in the author column', () => {
    const book = find(
      trusted([{ title: 'A Guide', authors: ['Dorling Kindersley'], publisher: 'Dorling Kindersley' }]),
      'A Guide',
    )
    expect(book.flags).toContain('author_is_publisher')
    expect(book.confidence).toBe('medium')
  })

  it('compares the two by their comparison form, not letter by letter', () => {
    const book = find(
      trusted([{ title: 'A Guide', authors: ['ÉDITIONS DU SEUIL'], publisher: 'Éditions du Seuil' }]),
      'A Guide',
    )
    expect(book.flags).toContain('author_is_publisher')
  })

  it('leaves an author who merely has a publisher alone', () => {
    const book = find(
      trusted([{ title: 'Dune', authors: ['Frank Herbert'], publisher: 'Ace Books' }]),
      'Dune',
    )
    expect(book.flags).not.toContain('author_is_publisher')
    expect(book.confidence).toBe('high')
  })

  it('catches a book first published after this year', () => {
    const book = find(
      trusted([{ title: 'From The Future', authors: ['Someone'], published_year: 3000 }]),
      'From The Future',
    )
    expect(book.flags).toContain('impossible_year')
    expect(book.confidence).toBe('medium')
  })

  it('allows next year, because a book can be announced', () => {
    const soon = new Date().getFullYear() + 1
    const book = find(trusted([{ title: 'Announced', authors: ['Someone'], published_year: soon }]), 'Announced')
    expect(book.flags).not.toContain('impossible_year')
    expect(book.confidence).toBe('high')
  })

  it('leaves an ancient work alone, because that is what the field means', () => {
    // The field is when the work first appeared. A floor at the invention of
    // printing is the obvious check to write and would demote Plato.
    for (const year of [-375, -340, 180, 1320]) {
      const book = find(trusted([{ title: `Work of ${year}`, authors: ['Someone'], published_year: year }]), 'Work of')
      expect(book.flags).not.toContain('impossible_year')
      expect(book.confidence).toBe('high')
    }
  })

  it('demotes once however many things are wrong with a row', () => {
    const book = find(
      trusted([{ title: 'Odd', authors: ['Various'], publisher: 'Various', published_year: 4000 }]),
      'Odd',
    )
    expect(book.confidence).toBe('medium')
    expect(book.flags).toContain('placeholder_author')
  })
})
