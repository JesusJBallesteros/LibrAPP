// Discarding one row of an import without throwing the batch away.
//
// Every way in ends with a list to check, and until this the list was all or
// nothing: one DVD case read as a book off a photograph, one header row that
// parsed as a title, one wrong barcode among twenty right ones, and the only
// answer was to discard the lot and do it again.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { bookKey, loadTranscription, withoutDropped } from '../src/ingest/shelf.js'

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')

const transcription = {
  photo: 'shelf.jpg',
  shelves: [
    {
      location: 'Top',
      books: [
        { title: 'Dune', authors: ['Frank Herbert'], confidence: 'high' },
        { title: 'A lamp, not a book', authors: [], confidence: 'low' },
        { title: 'Neuromancer', authors: ['William Gibson'], confidence: 'high' },
      ],
    },
    { location: 'Bottom', books: [{ title: 'Solaris', authors: ['Lem'], confidence: 'medium' }] },
  ],
}

const titles = (t) => t.shelves.flatMap((s) => s.books.map((b) => b.title))

describe('taking books out of a transcription', () => {
  it('keeps everything when nothing was set aside', () => {
    expect(titles(withoutDropped(transcription, new Set()))).toEqual([
      'Dune', 'A lamp, not a book', 'Neuromancer', 'Solaris',
    ])
  })

  it('takes out the one that was set aside and leaves the rest in order', () => {
    const kept = withoutDropped(transcription, new Set([bookKey(0, 1)]))
    expect(titles(kept)).toEqual(['Dune', 'Neuromancer', 'Solaris'])
  })

  it('keys by position, so the same title twice is two decisions', () => {
    // Nothing in a transcription is unique. Two copies of a book on two shelves
    // are two books, and discarding one must not discard the other.
    const doubled = {
      shelves: [
        { location: 'A', books: [{ title: 'Dune', confidence: 'high' }] },
        { location: 'B', books: [{ title: 'Dune', confidence: 'high' }] },
      ],
    }
    const kept = withoutDropped(doubled, new Set([bookKey(0, 0)]))
    expect(kept.shelves).toHaveLength(1)
    expect(kept.shelves[0].location).toBe('B')
  })

  it('drops a shelf whose books were all set aside', () => {
    // An emptied location is not something the photograph showed.
    const kept = withoutDropped(transcription, new Set([bookKey(1, 0)]))
    expect(kept.shelves.map((s) => s.location)).toEqual(['Top'])
  })

  it('leaves the rest of the transcription alone', () => {
    expect(withoutDropped(transcription, new Set([bookKey(0, 0)])).photo).toBe('shelf.jpg')
  })

  it('produces something the loader still accepts', () => {
    // The filtered copy goes straight into loadTranscription, so it has to
    // survive the same checks the original does.
    const kept = withoutDropped(transcription, new Set([bookKey(0, 1)]))
    expect(loadTranscription(kept).records.map((r) => r.title)).toEqual([
      'Dune', 'Neuromancer', 'Solaris',
    ])
  })

  it('refuses an empty transcription rather than writing nothing', () => {
    // Discarding everything leaves no shelves at all. The button is disabled at
    // zero, and this is the floor under that.
    const all = new Set([bookKey(0, 0), bookKey(0, 1), bookKey(0, 2), bookKey(1, 0)])
    expect(() => loadTranscription(withoutDropped(transcription, all))).toThrow(/shelves/)
  })
})

describe('every list offers the control, and stops at nothing kept', () => {
  const LISTS = [
    ['components/IsbnLookup.jsx', 'keeping.length'],
    ['views/ListImport.jsx', 'keptRows.length'],
    ['views/Shelf.jsx', 'keptCount'],
  ]

  for (const [path, counter] of LISTS) {
    it(`${path} draws a discard on every row`, () => {
      expect(read(path)).toContain('<KeepToggle')
      expect(read(path)).toContain('<KeepSummary')
    })

    it(`${path} counts what survives, not what arrived`, () => {
      expect(read(path)).toContain(counter)
    })

    it(`${path} will not write an empty batch`, () => {
      // The label counts the kept ones, so at zero the button reads "0" and
      // must not be pressable.
      expect(read(path)).toContain(`!${counter}`)
    })
  }

  it('keeps by default and names the other thing on the button', () => {
    const src = read('components/Keep.jsx')
    expect(src).toContain("useState(() => new Set())")
    expect(src).toContain("dropped ? t('keep.restore') : t('keep.discard')")
  })

  it('tells the reader through the owl on all three ways in', () => {
    const src = read('librarian.js')
    for (const view of ['shelf', 'list', 'barcode']) {
      const at = src.indexOf(view + ': [')
      expect(at).toBeGreaterThan(-1)
      expect(src.slice(at, src.indexOf(']', at))).toContain("'discard'")
    }
  })
})
