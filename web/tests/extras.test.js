// The extras checklist, and the line it has to hold.
//
// An extra that is read from the photograph is evidence of the same kind as the
// title. An extra the model recalled is a claim about the world. The catalog
// records where every fact came from, so the two must not arrive looking alike.

import { describe, expect, it } from 'vitest'
import { EXTRAS, RECALLED_FLAG, extrasPrompt, recalledIn } from '../src/ai/extras.js'
import { loadTranscription } from '../src/ingest/shelf.js'
import { TRANSCRIPTION_SCHEMA, toGeminiSchema } from '../src/ai/providers.js'
import { normalise } from '../src/core/records.js'

const shelf = (book) => ({
  photo: 'shelf.jpg',
  shelves: [{ location: 'top', books: [{ title: 'Dune', confidence: 'high', ...book }] }],
})

describe('the list itself', () => {
  it('sorts every extra into read or recalled, and nothing else', () => {
    for (const extra of EXTRAS) expect(['read', 'recalled']).toContain(extra.kind)
  })

  it('offers no cover image, which could only ever be a link', () => {
    expect(EXTRAS.map((e) => e.id)).not.toContain('cover')
  })
})

describe('the prompt it builds', () => {
  it('adds nothing at all when nothing is ticked', () => {
    expect(extrasPrompt([])).toBe('')
  })

  it('asks for what was ticked and not for what was not', () => {
    const prompt = extrasPrompt(['publisher'])
    expect(prompt).toContain('publisher')
    expect(prompt).not.toContain('abstract')
  })

  it('keeps the two kinds under separate headings', () => {
    const prompt = extrasPrompt(['publisher', 'abstract'])
    expect(prompt).toContain('From the photograph itself')
    expect(prompt).toContain('From your own knowledge')
  })

  it('tells the model not to guess, and to flag what it recalled', () => {
    const prompt = extrasPrompt(['abstract'])
    expect(prompt).toContain('never guess')
    expect(prompt).toContain('recalled')
  })

  it('says nothing about knowledge when only readable extras are ticked', () => {
    expect(extrasPrompt(['publisher', 'series'])).not.toContain('From your own knowledge')
  })
})

describe('what comes back', () => {
  it('keeps a recalled field and flags the book carrying it', () => {
    const { records, stats } = loadTranscription(shelf({ abstract: 'A desert planet.' }))
    expect(records[0].abstract).toBe('A desert planet.')
    expect(records[0].flags).toContain(RECALLED_FLAG)
    expect(stats.recalled_details).toBe(1)
  })

  it('does not flag a book that carries none', () => {
    const { records, stats } = loadTranscription(shelf({}))
    expect(records[0].flags).not.toContain(RECALLED_FLAG)
    expect(stats.recalled_details).toBe(0)
  })

  it('derives the flag from the fields rather than trusting the model to set it', () => {
    // A model can claim it recalled nothing while returning an abstract, or
    // claim the reverse. Neither claim is taken at face value.
    const lying = loadTranscription(shelf({ abstract: 'Recalled.', flags: [] }))
    expect(lying.records[0].flags).toContain(RECALLED_FLAG)

    const boasting = loadTranscription(shelf({ flags: ['recalled'] }))
    expect(boasting.records[0].flags).not.toContain(RECALLED_FLAG)
  })

  it('refuses a rating or a year that is not a number', () => {
    const { records } = loadTranscription(shelf({ rating: 'four stars', published_year: '1965' }))
    expect(records[0].rating).toBeNull()
    expect(records[0].published_year).toBeNull()
  })

  it('keeps a real rating and a real year', () => {
    const { records } = loadTranscription(shelf({ rating: 4.2, published_year: 1965 }))
    expect(records[0].rating).toBe(4.2)
    expect(records[0].published_year).toBe(1965)
  })

  it('produces a record the contract accepts', () => {
    const { records } = loadTranscription(shelf({ abstract: 'A desert planet.' }))
    expect(() => normalise(records[0])).not.toThrow()
  })
})

describe('the schema handed to a model', () => {
  const book = TRANSCRIPTION_SCHEMA.properties.shelves.items.properties.books.items

  it('allows every recalled field to be null, since most books will not have one', () => {
    for (const field of ['abstract', 'published_year', 'rating', 'original_language']) {
      expect(book.properties[field].type, field).toContain('null')
    }
  })

  it('carries the recalled fields into the Gemini dialect too', () => {
    const gemini = toGeminiSchema(TRANSCRIPTION_SCHEMA)
    const geminiBook = gemini.properties.shelves.items.properties.books.items
    expect(geminiBook.properties.abstract).toEqual({ type: 'string', nullable: true })
  })
})

describe('reading which fields were recalled', () => {
  it('names them', () => {
    expect(recalledIn({ abstract: 'x', rating: 4 })).toEqual(['abstract', 'rating'])
  })

  it('names none for a book read straight off the shelf', () => {
    expect(recalledIn({ title: 'Dune', publisher: 'Chilton' })).toEqual([])
  })
})
