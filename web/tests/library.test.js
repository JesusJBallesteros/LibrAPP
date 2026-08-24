// Where a library is kept, and the one rule that matters most: an import must
// never quietly destroy an earlier one.
//
// The name of a source is the name of its file, so two imports agreeing on a
// name are one file, and the second wins. That was the bug reported as "any new
// shelf photo analysis overwrites a previous catalog" — every photograph was
// called `shelf`.
//
// The backend below is a Map. The real ones are a folder you picked and the
// origin's private file system; neither adds anything these tests are about.

import { beforeEach, describe, expect, it } from 'vitest'
import { Library, safeName, stemOf } from '../src/store/library.js'
import { build } from '../src/core/build.js'

function memoryBackend() {
  const files = new Map()
  return {
    kind: 'memory',
    files,
    async list(dir) {
      const prefix = `${dir}/`
      return [...files.keys()]
        .filter((path) => path.startsWith(prefix))
        .map((path) => path.slice(prefix.length))
        .sort()
    },
    async readText(path) {
      return files.get(path) ?? null
    },
    async writeText(path, text) {
      files.set(path, text)
    },
    async remove(path) {
      files.delete(path)
    },
  }
}

const shelfPhoto = (photo, titles) => ({
  kind: 'photo',
  origin: photo,
  format: 'physical',
  confidence: 'medium',
  stats: { photo },
  records: titles.map((title) => ({ title, authors: ['Someone'] })),
})

describe('naming a source', () => {
  let library

  beforeEach(() => {
    library = new Library(memoryBackend())
  })

  it('takes the name asked for when nothing holds it', async () => {
    expect(await library.nameFor('shelf-kitchen', 'kitchen.jpg')).toBe('shelf-kitchen')
  })

  it('gives the same name back for the same material, so re-reading replaces', async () => {
    // Reading one photograph again after adjusting the grid is a correction,
    // not a second shelf.
    const photo = shelfPhoto('kitchen.jpg', ['Dune'])
    await library.putSource({ name: await library.nameFor('shelf-kitchen', 'kitchen.jpg'), ...photo })
    expect(await library.nameFor('shelf-kitchen', 'kitchen.jpg')).toBe('shelf-kitchen')
  })

  it('steps aside for different material that wants the same name', async () => {
    await library.putSource({ name: 'list', ...shelfPhoto('a.jpg', ['Dune']) })
    expect(await library.nameFor('list', 'b.jpg')).toBe('list-2')
  })

  it('keeps stepping aside rather than giving up', async () => {
    await library.putSource({ name: 'list', ...shelfPhoto('a.jpg', ['A']) })
    await library.putSource({ name: 'list-2', ...shelfPhoto('b.jpg', ['B']) })
    expect(await library.nameFor('list', 'c.jpg')).toBe('list-3')
  })
})

describe('two photographs of two shelves', () => {
  it('keeps both, which is the bug this file exists for', async () => {
    const library = new Library(memoryBackend())

    const first = shelfPhoto('shelf-one.jpg', ['Dune', 'Neuromancer'])
    await library.putSource({
      name: await library.nameFor(`shelf-${stemOf(first.origin)}`, first.origin),
      ...first,
    })

    const second = shelfPhoto('shelf-two.jpg', ['Crítica de la razón pura'])
    await library.putSource({
      name: await library.nameFor(`shelf-${stemOf(second.origin)}`, second.origin),
      ...second,
    })

    const sources = await library.readSources()
    expect(sources).toHaveLength(2)

    const catalog = build(sources)
    expect(catalog.books.map((b) => b.title).sort()).toEqual([
      'Crítica de la razón pura',
      'Dune',
      'Neuromancer',
    ])
  })

  it('replaces rather than duplicates when the same photograph is read twice', async () => {
    const library = new Library(memoryBackend())
    const photo = 'shelf-one.jpg'

    for (const titles of [['Dune'], ['Dune', 'Neuromancer']]) {
      const source = shelfPhoto(photo, titles)
      await library.putSource({
        name: await library.nameFor(`shelf-${stemOf(photo)}`, photo),
        ...source,
      })
    }

    const sources = await library.readSources()
    expect(sources).toHaveLength(1)
    // The second read is the one that stands: it is a correction of the first.
    expect(sources[0].records.map((r) => r.title)).toEqual(['Dune', 'Neuromancer'])
  })
})

describe('turning a filename into a name', () => {
  it('drops the extension', () => {
    expect(stemOf('IMG_20260823_101500.jpg')).toBe('IMG_20260823_101500')
  })

  it('copes with a filename that has no extension, or none at all', () => {
    expect(stemOf('shelf')).toBe('shelf')
    expect(stemOf(null)).toBe('')
    expect(stemOf(undefined)).toBe('')
  })

  it('is trimmed before it becomes a filename of its own', () => {
    expect(stemOf('x'.repeat(200)).length).toBeLessThanOrEqual(32)
  })

  it('survives the punctuation a camera or a phone puts in a name', () => {
    expect(safeName(`shelf-${stemOf('my shelf (2).jpeg')}`)).toBe('shelf-my-shelf-2')
  })

  it('never produces an empty filename', () => {
    expect(safeName(`shelf-${stemOf('')}`)).toBe('shelf')
    expect(safeName('')).toBe('source')
  })
})
