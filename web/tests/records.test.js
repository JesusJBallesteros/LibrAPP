// The source envelope is the contract every ingester writes to and the builder
// reads. If it lets something through that it should not, the damage lands in
// the catalog days later, where nothing can tell whether a wrong publisher came
// from a bad OCR read or a bad parser. So the refusals are the point of these
// tests, not the successes.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  RETIRED_FIELDS,
  SourceError,
  makeSource,
  normalise,
  readSource,
} from '../src/core/records.js'

const record = (extra = {}) => ({ title: 'Some Book', ...extra })

const envelope = (records, meta = {}) =>
  makeSource({
    name: 'list',
    kind: 'table',
    origin: 'books.xlsx',
    format: 'physical',
    confidence: 'medium',
    records,
    ...meta,
  })

describe('normalise', () => {
  it('fills every field in, so nothing downstream has to guess a default', () => {
    const out = normalise(record())
    expect(out.authors).toEqual([])
    expect(out.read).toBeNull()
    expect(out.formats).toEqual([])
    expect(out.flags).toEqual([])
  })

  it('leaves unknown apart from false', () => {
    expect(normalise(record({ read: false })).read).toBe(false)
    expect(normalise(record()).read).toBeNull()
  })

  it('refuses a field it does not recognise rather than dropping it', () => {
    // A typo in an ingester would otherwise lose data silently.
    expect(() => normalise(record({ pubisher: 'Akal' }))).toThrow(SourceError)
  })

  it('refuses a format that is not one of the three', () => {
    expect(() => normalise(record({ formats: ['papyrus'] }))).toThrow(/unknown format/)
  })

  it('refuses a confidence outside high, medium and low', () => {
    expect(() => normalise(record({ confidence: 'quite sure' }))).toThrow(/unknown confidence/)
  })

  it('collapses whitespace and drops empty authors', () => {
    const out = normalise(record({ title: '  Two   Spaces ', authors: ['  Kant ', '', '  '] }))
    expect(out.title).toBe('Two Spaces')
    expect(out.authors).toEqual(['Kant'])
  })

  it('deduplicates formats and orders them the same way every time', () => {
    expect(normalise(record({ formats: ['physical', 'ebook', 'physical'] })).formats).toEqual([
      'ebook',
      'physical',
    ])
  })
})

describe('makeSource', () => {
  it('refuses an untitled record and says where it was', () => {
    expect(() => envelope([record(), { title: '' }])).toThrow(/no title.*\[1\]/s)
  })

  it('refuses a kind, format or confidence it does not know', () => {
    expect(() => envelope([record()], { kind: 'vibes' })).toThrow(/kind must be one of/)
    expect(() => envelope([record()], { format: 'scroll' })).toThrow(/format must be one of/)
    expect(() => envelope([record()], { confidence: 'total' })).toThrow(/confidence must be one of/)
  })
})

describe('readSource', () => {
  it('refuses a file that is not a source envelope', () => {
    expect(() => readSource({ records: [] })).toThrow(/not a LibrAPP source file/)
    expect(() => readSource(null)).toThrow(SourceError)
  })

  it('refuses an envelope missing any part of its own description', () => {
    const payload = envelope([record()])
    delete payload.source.origin
    expect(() => readSource(payload)).toThrow(/missing source.origin/)
  })

  it('gives a record the format of its source when it names none', () => {
    const [book] = readSource(envelope([record()])).records
    expect(book.formats).toEqual(['physical'])
  })

  it('lets a record lower its own confidence but never raise it', () => {
    // One illegible spine among many clear ones is worth recording. A model
    // claiming certainty a photograph cannot support is not.
    const source = envelope([record({ confidence: 'low' }), record({ confidence: 'high' })])
    const [lowered, raised] = readSource(source).records
    expect(lowered.confidence).toBe('low')
    expect(raised.confidence).toBe('medium')
  })

  it('stamps each record with the source it came from', () => {
    const [book] = readSource(envelope([record()])).records
    expect(book._source).toBe('list')
  })
})

// A file this app wrote must stay readable by the next version of it. The
// unknown-field check is strict so that an ingester cannot quietly write a
// field the builder ignores, and that strictness turned on the reader the one
// time a field shipped and was then withdrawn: every shelf read during that
// window wrote records the next build refused to open, with an error naming a
// field the reader had never heard of and could do nothing about.
describe('a file written by a version whose fields have since gone', () => {
  // A shelf source exactly as the withdrawn crop feature wrote it.
  const asWritten = {
    librapp_source: 1,
    source: {
      name: 'shelf-2026-08-27T10-14-02',
      kind: 'photo',
      origin: 'shelf.jpg',
      format: 'physical',
      confidence: 'medium',
    },
    records: [
      { title: 'Book lying flat', authors: ['A. Reader'], spine: 'spines/shelf-1-03.webp' },
      { title: 'Dune', authors: ['Frank Herbert'], pages: 412, spine: 'spines/shelf-1-04.webp' },
    ],
  }

  it('opens', () => {
    const source = readSource(asWritten, 'shelf-2026-08-27.json')
    expect(source.records.map((r) => r.title)).toEqual(['Book lying flat', 'Dune'])
  })

  it('leaves the retired field behind rather than carrying it', () => {
    // Dropped, not kept under another name. The builder names every field it
    // keeps, so a value smuggled through here would be dead weight in the file
    // the next save writes.
    for (const record of readSource(asWritten, 'x').records) {
      expect(record).not.toHaveProperty('spine')
    }
  })

  it('still refuses a field nobody ever wrote', () => {
    expect(() => normalise({ title: 'X', sprine: 'a typo' })).toThrow(/sprine/)
  })

  it('refuses a typo standing next to a retired field', () => {
    // The retirement is a named exception, not a relaxation of the check.
    expect(() => normalise({ title: 'X', spine: 'a', nonsense: 1 })).toThrow(/nonsense/)
  })

  it('names every retired field with a reason in the source', () => {
    // A set that grows without explanation becomes the place unknown fields go
    // to be forgotten. Each one needs its story next to it.
    const src = readFileSync(new URL('../src/core/records.js', import.meta.url), 'utf8')
    for (const field of RETIRED_FIELDS) {
      expect(src).toContain(` * ${field}: `)
    }
  })
})
