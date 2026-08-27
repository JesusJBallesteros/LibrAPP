// The library somebody can look around before building one.
//
// Two things matter here and neither is cosmetic. It has to be safe: a visitor
// who opens the demo and starts editing must not be able to reach anything that
// was already on the device. And it has to be populated: a demo whose unread
// pile is empty and whose chart has two slices demonstrates the cold start
// rather than the product, which is the state this was built to answer.

import { describe, expect, it } from 'vitest'
import { demoSize, memoryBackend, openDemo } from '../src/store/demo.js'
import { forgotten, onLoan } from '../src/lib.js'
import { summarise } from '../src/components/GenrePie.jsx'

describe('the demo cannot reach real storage', () => {
  it('keeps its files in memory and nowhere else', async () => {
    const backend = memoryBackend()
    await backend.writeText('sources/a.json', '{}')
    expect(await backend.readText('sources/a.json')).toBe('{}')
    expect(backend.kind).toBe('demo')
  })

  it('starts empty every time, so nothing carries between visits', async () => {
    expect(await memoryBackend().list('sources')).toEqual([])
  })

  it('answers a blob read with nothing rather than reaching for a file', async () => {
    expect(await memoryBackend().readBlob('spines/x/0.jpg')).toBeNull()
  })

  it('is marked as a demo, which is what the banner keys on', async () => {
    const library = await openDemo()
    expect(library.kind).toBe('demo')
  })
})

describe('the demo has something to show', () => {
  it('builds a catalog of the size the button offers', async () => {
    const catalog = await (await openDemo()).readCatalog()
    expect(catalog.books.length).toBeGreaterThan(80)
    expect(demoSize()).toBeGreaterThanOrEqual(catalog.books.length)
  })

  it('has books read, unread, and not recorded either way', async () => {
    const { counts } = await (await openDemo()).readCatalog()
    expect(counts.read).toBeGreaterThan(0)
    expect(counts.unread).toBeGreaterThan(0)
    // The third state is the one a thin demo loses, and the one the desk's
    // unread pile has to exclude to mean anything.
    expect(counts.read_unknown).toBeGreaterThan(0)
  })

  it('has a pile bought and never opened, with years on it', async () => {
    const { books } = await (await openDemo()).readCatalog()
    const waiting = forgotten(books, 2)
    expect(waiting.length).toBeGreaterThan(10)
    expect(waiting[0].age).toBeGreaterThan(2)
  })

  it('has books away from the shelf in both directions', async () => {
    const { books } = await (await openDemo()).readCatalog()
    expect(onLoan(books, 'lent').length).toBeGreaterThan(0)
    expect(onLoan(books, 'borrowed').length).toBeGreaterThan(0)
  })

  it('has books the reader marked, which is a correction and not a source', async () => {
    const library = await openDemo()
    const { books } = await library.readCatalog()
    const marked = books.filter((b) => b.favourite)
    expect(marked.length).toBeGreaterThan(3)
    expect(marked.some((b) => b.notes)).toBe(true)
    // Favourites are marked by the reader, never by a source, so they have to
    // arrive the way a reader's own would.
    const overrides = await library.readOverrides()
    expect(Object.keys(overrides.entries).length).toBe(marked.length)
  })

  it('has a chart worth drawing rather than one wedge of "other"', async () => {
    const { books } = await (await openDemo()).readCatalog()
    const pie = summarise(books)
    const other = pie.slices.find((s) => s.isOther)
    expect(pie.distinct).toBeGreaterThan(10)
    // The named slices have to carry most of the shelf. A demo chart that is
    // mostly "other" would be showing off the problem, not the feature.
    expect(other ? 1 - other.share : 1).toBeGreaterThan(0.5)
  })

  it('has page counts, so the shelf shows thick books and thin ones', async () => {
    const { books } = await (await openDemo()).readCatalog()
    const measured = books.filter((b) => b.pages > 0)
    expect(measured.length).toBe(books.length)
    expect(Math.min(...measured.map((b) => b.pages))).toBeLessThan(150)
    expect(Math.max(...measured.map((b) => b.pages))).toBeGreaterThan(300)
  })

  it('has more than one author to its name', async () => {
    const { authors } = await (await openDemo()).readCatalog()
    expect(authors.length).toBeGreaterThan(40)
  })
})
