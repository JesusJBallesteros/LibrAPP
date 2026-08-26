// Filling the edit form from a book.
//
// authorNames() maps an id to the whole author record, because byline reads
// display_name off it and sortName reads sort_name. The editor once used the
// record itself, which put "[object Object]" in the authors field of every book
// whose author the catalog actually knew.

import { describe, expect, it } from 'vitest'
import { toForm } from '../src/components/BookEditor.jsx'
import { authorNames, byline } from '../src/lib.js'

const catalog = {
  authors: [
    { id: 'immanuel-kant', display_name: 'Immanuel Kant', sort_name: 'Kant, Immanuel' },
    { id: 'gilles-deleuze', display_name: 'Gilles Deleuze', sort_name: 'Deleuze, Gilles' },
  ],
}
const names = authorNames(catalog)

describe('the authors field', () => {
  it('shows the name, not the record it came from', () => {
    const form = toForm({ title: 'Crítica', authors: ['immanuel-kant'] }, names)
    expect(form.authors).toBe('Immanuel Kant')
    expect(form.authors).not.toContain('object Object')
  })

  it('joins several authors the way the field expects them back', () => {
    const form = toForm({ title: 'Mille Plateaux', authors: ['gilles-deleuze', 'immanuel-kant'] }, names)
    expect(form.authors).toBe('Gilles Deleuze, Immanuel Kant')
  })

  it('falls back to the id when the catalog has no record of that author', () => {
    // Better a raw slug than a blank field: a blank one looks like a book with
    // no author, and saving it would erase the credit.
    const form = toForm({ title: 'Orphan', authors: ['nobody-here'] }, names)
    expect(form.authors).toBe('nobody-here')
  })

  it('is empty for a work with no personal author', () => {
    const form = toForm({ title: 'Diccionario', authors: [], author_label: 'Varios' }, names)
    expect(form.authors).toBe('')
  })

  it('is empty for a new book', () => {
    expect(toForm(null, names).authors).toBe('')
    expect(toForm(undefined, names).authors).toBe('')
  })

  it('survives being handed no author map at all', () => {
    expect(toForm({ title: 'X', authors: ['immanuel-kant'] }, undefined).authors).toBe('immanuel-kant')
  })

  it('agrees with what the rest of the app displays', () => {
    // The form and the byline read the same map, so they must not disagree
    // about who wrote a book.
    const book = { title: 'Crítica', authors: ['immanuel-kant'] }
    expect(toForm(book, names).authors).toBe(byline(book, names))
  })
})

describe('the rest of the form', () => {
  it('carries the loan fields', () => {
    const form = toForm({ title: 'Dune', lent_to: 'Ana', lent_on: '2026-03-14' }, names)
    expect(form.lent_to).toBe('Ana')
    expect(form.lent_on).toBe('2026-03-14')
  })

  it('turns three-valued read into the three the select offers', () => {
    expect(toForm({ read: true }, names).read).toBe('read')
    expect(toForm({ read: false }, names).read).toBe('unread')
    expect(toForm({}, names).read).toBe('unknown')
  })

  it('never puts null or undefined into a field', () => {
    // React shouts when a controlled input is handed null, and shows the word
    // "undefined" when it is handed that. Every field must therefore carry a
    // real value. The favourite toggle is a boolean rather than text, since it
    // is a button with a pressed state and not something typed into.
    const form = toForm({ title: 'Bare' }, names)
    const toggles = ['favourite']
    for (const [key, value] of Object.entries(form)) {
      if (Array.isArray(value)) continue
      expect(value, key).not.toBe(null)
      expect(value, key).not.toBe(undefined)
      expect(typeof value, key).toBe(toggles.includes(key) ? 'boolean' : 'string')
    }
  })
})

// The page count is the second numeric field in the form, and the first one
// added since the string comparison in changedOnly was written. A number
// arriving as a string from an input is exactly what that comparison gets
// wrong, so it is worth pinning.
describe('the page count in the form', () => {
  it('comes out of a book as its own value, not a string', () => {
    expect(toForm({ title: 'Dune', pages: 412 }, names).pages).toBe(412)
  })

  it('is blank rather than null for a book with none recorded', () => {
    // A null in a controlled input makes React shout about uncontrolled fields.
    expect(toForm({ title: 'Dune' }, names).pages).toBe('')
    expect(toForm({ title: 'Dune', pages: null }, names).pages).toBe('')
  })

  it('survives a round trip through the form unchanged', () => {
    const book = { title: 'Dune', pages: 412 }
    expect(toForm(book, names).pages).toBe(book.pages)
  })
})
