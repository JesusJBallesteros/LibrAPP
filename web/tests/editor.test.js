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

  it('never puts null or undefined into a text input', () => {
    const form = toForm({ title: 'Bare' }, names)
    for (const [key, value] of Object.entries(form)) {
      if (Array.isArray(value)) continue
      expect(typeof value, key).toBe('string')
    }
  })
})
