// Cutting the spines out of a shelf photograph, which is what turns the wall
// from coloured blocks into the shelf itself.
//
// The arithmetic matters more than it looks: a box is a fraction of a tile, the
// tile is a fraction of a photograph, and a crop taken from the wrong place
// shows the reader a different book than the one the row names. So the boxes
// that cannot be trusted are dropped rather than repaired, and these tests are
// mostly about what gets dropped.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cropSpine, cutSpines, loadTranscription, placement, tileKey } from '../src/ingest/shelf.js'
import { Library } from '../src/store/library.js'
import { build } from '../src/core/build.js'
import { makeSource, readSource } from '../src/core/records.js'

const box = (tile, b) => ({ title: 'A book', confidence: 'high', tile, box: b })

describe('placing a spine', () => {
  it('keeps a box that is four fractions enclosing an area', () => {
    const place = placement(box('r2c3', [0.3, 0.1, 0.36, 0.9]))
    expect(place.tile).toBe('r2c3')
    expect(place.box).toHaveLength(4)
  })

  it('pads the box, because a model places it approximately', () => {
    const [left, top, right, bottom] = placement(box('r1c1', [0.3, 0.1, 0.36, 0.9])).box
    expect(left).toBeCloseTo(0.28)
    expect(top).toBeCloseTo(0.08)
    expect(right).toBeCloseTo(0.38)
    expect(bottom).toBeCloseTo(0.92)
  })

  it('does not pad past the edge of the tile', () => {
    const [left, top, right, bottom] = placement(box('r1c1', [0, 0, 1, 1])).box
    expect(left).toBe(0)
    expect(top).toBe(0)
    expect(right).toBe(1)
    expect(bottom).toBe(1)
  })

  it('refuses a book with no tile', () => {
    expect(placement(box(null, [0.3, 0.1, 0.36, 0.9]))).toBeNull()
    expect(placement(box('  ', [0.3, 0.1, 0.36, 0.9]))).toBeNull()
  })

  it('refuses a box that is not four numbers', () => {
    expect(placement(box('r1c1', null))).toBeNull()
    expect(placement(box('r1c1', [0.1, 0.2, 0.3]))).toBeNull()
    expect(placement(box('r1c1', [0.1, 0.2, 0.3, 0.4, 0.5]))).toBeNull()
    expect(placement(box('r1c1', ['0.1', 0.2, 0.3, 0.4]))).toBeNull()
    expect(placement(box('r1c1', [Number.NaN, 0.2, 0.3, 0.4]))).toBeNull()
  })

  it('refuses a box outside the tile, which is a fraction of it or nothing', () => {
    expect(placement(box('r1c1', [-0.1, 0.2, 0.3, 0.4]))).toBeNull()
    expect(placement(box('r1c1', [0.1, 0.2, 1.4, 0.4]))).toBeNull()
  })

  it('refuses a box enclosing no area, which cannot be a spine', () => {
    expect(placement(box('r1c1', [0.4, 0.1, 0.4, 0.9]))).toBeNull()
    expect(placement(box('r1c1', [0.3, 0.9, 0.4, 0.1]))).toBeNull()
  })
})

describe('naming a tile', () => {
  it('reads the label the app writes', () => {
    expect(tileKey('r2c3')).toBe('r2c3')
  })

  it('reads a label a model repeated in longer form', () => {
    expect(tileKey('Tile r2c3')).toBe('r2c3')
    expect(tileKey('tile-r2c3.jpg')).toBe('r2c3')
    expect(tileKey('R2C3')).toBe('r2c3')
  })

  it('does not mistake a shelf name for a position', () => {
    expect(tileKey('top shelf')).toBeNull()
    expect(tileKey('')).toBeNull()
    expect(tileKey(null)).toBeNull()
  })
})

// A crop is drawn by the browser, which vitest does not have. These stubs
// record what was asked for, so the arithmetic can be checked without a canvas.
function stubCanvas({ width = 1000, height = 500 } = {}) {
  const drawn = []
  vi.stubGlobal('createImageBitmap', async () => ({ width, height, close() {} }))
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor(w, h) {
        this.width = w
        this.height = h
      }
      getContext() {
        return {
          imageSmoothingQuality: '',
          drawImage: (...args) => drawn.push(args.slice(1)),
        }
      }
      async convertToBlob() {
        return { size: 10, type: 'image/jpeg', width: this.width, height: this.height }
      }
    },
  )
  return drawn
}

describe('cutting a crop', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('cuts the fraction of the tile the box names', async () => {
    const drawn = stubCanvas({ width: 1000, height: 500 })
    await cropSpine({}, [0.2, 0.1, 0.3, 0.9])
    const [x, y, w, h] = drawn[0]
    expect(x).toBe(200)
    expect(y).toBe(50)
    expect(w).toBe(100)
    expect(h).toBe(400)
  })

  it('shrinks a wide crop but never enlarges a narrow one', async () => {
    stubCanvas({ width: 1000, height: 500 })
    const wide = await cropSpine({}, [0, 0, 1, 1], { width: 220 })
    expect(wide.width).toBe(220)
    expect(wide.height).toBe(110)

    const narrow = await cropSpine({}, [0, 0, 0.1, 1], { width: 220 })
    expect(narrow.width).toBe(100)
  })
})

describe('cutting a whole read', () => {
  beforeEach(() => vi.unstubAllGlobals())

  const tiles = [
    { tile: 'tile-r1c1.jpg', row: 1, column: 1, blob: {} },
    { tile: 'tile-r1c2.jpg', row: 1, column: 2, blob: {} },
  ]

  it('lines the crops up with the records they came from', async () => {
    stubCanvas()
    const crops = await cutSpines(
      [
        placement(box('r1c1', [0.1, 0.1, 0.2, 0.9])),
        null,
        placement(box('r1c2', [0.3, 0.1, 0.4, 0.9])),
      ],
      tiles,
    )
    expect(crops).toHaveLength(3)
    expect(crops[0]).toBeTruthy()
    expect(crops[1]).toBeNull()
    expect(crops[2]).toBeTruthy()
  })

  it('drops a box naming a tile that was not read', async () => {
    stubCanvas()
    const crops = await cutSpines([placement(box('r8c8', [0.1, 0.1, 0.2, 0.9]))], tiles)
    expect(crops).toEqual([null])
  })

  it('keeps the rest when one crop throws', async () => {
    stubCanvas()
    let calls = 0
    vi.stubGlobal('createImageBitmap', async () => {
      calls += 1
      if (calls === 1) throw new Error('not an image')
      return { width: 1000, height: 500, close() {} }
    })
    const crops = await cutSpines(
      [placement(box('r1c1', [0.1, 0.1, 0.2, 0.9])), placement(box('r1c2', [0.3, 0.1, 0.4, 0.9]))],
      tiles,
    )
    expect(crops[0]).toBeNull()
    expect(crops[1]).toBeTruthy()
  })

  it('has nothing to cut when every tile was set aside', async () => {
    stubCanvas()
    expect(await cutSpines([placement(box('r1c1', [0.1, 0.1, 0.2, 0.9]))], [])).toEqual([null])
  })
})

describe('a transcription carries where each book was seen', () => {
  it('returns placements lined up with the records', () => {
    const { records, placements } = loadTranscription({
      photo: 'shelf.jpg',
      shelves: [
        {
          location: 'top',
          books: [box('r1c1', [0.1, 0.1, 0.2, 0.9]), { title: 'Unplaced', confidence: 'low' }],
        },
      ],
    })
    expect(records).toHaveLength(2)
    expect(placements).toHaveLength(2)
    expect(placements[0].tile).toBe('r1c1')
    expect(placements[1]).toBeNull()
  })

  it('leaves the placement out of the record, which knows only the path', () => {
    const { records } = loadTranscription({
      photo: 'shelf.jpg',
      shelves: [{ location: 'top', books: [box('r1c1', [0.1, 0.1, 0.2, 0.9])] }],
    })
    expect(records[0].tile).toBeUndefined()
    expect(records[0].box).toBeUndefined()
  })
})

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
    async readBlob(path) {
      return files.get(path) ?? null
    },
    async writeBlob(path, blob) {
      files.set(path, blob)
    },
    async remove(path) {
      files.delete(path)
    },
  }
}

describe('keeping the crops', () => {
  let library

  beforeEach(() => {
    library = new Library(memoryBackend())
  })

  it('files a crop under the source that produced it', async () => {
    const path = await library.putSpine('shelf-shelf', '4', { size: 9 })
    expect(path).toBe('spines/shelf-shelf/4.jpg')
    expect(await library.readSpine(path)).toEqual({ size: 9 })
  })

  it('has no crop for a book that was never placed', async () => {
    expect(await library.readSpine(null)).toBeNull()
    expect(await library.readSpine('spines/shelf-shelf/9.jpg')).toBeNull()
  })

  it('reads nothing outside the crops folder', async () => {
    library.backend.files.set('overrides.json', 'kept elsewhere')
    expect(await library.readSpine('overrides.json')).toBeNull()
    expect(await library.readSpine('../overrides.json')).toBeNull()
    // Clears the prefix and still climbs out of the folder.
    expect(await library.readSpine('spines/../overrides.json')).toBeNull()
  })

  it('takes the crops away with the source', async () => {
    await library.putSource({
      name: 'shelf-shelf',
      kind: 'photo',
      origin: 'shelf.jpg',
      format: 'physical',
      confidence: 'medium',
      records: [{ title: 'A book', authors: [] }],
      stats: {},
    })
    await library.putSpine('shelf-shelf', '0', { size: 1 })
    await library.putSpine('shelf-shelf', '1', { size: 2 })

    await library.deleteSource('shelf-shelf.json')

    expect([...library.backend.files.keys()]).toEqual([])
  })

  it('leaves the crops of another source alone', async () => {
    await library.putSpine('shelf-one', '0', { size: 1 })
    await library.putSpine('shelf-two', '0', { size: 2 })
    await library.putSource({
      name: 'shelf-one',
      kind: 'photo',
      origin: 'one.jpg',
      format: 'physical',
      confidence: 'medium',
      records: [{ title: 'A book', authors: [] }],
      stats: {},
    })

    await library.deleteSource('shelf-one.json')

    expect(await library.readSpine('spines/shelf-two/0.jpg')).toEqual({ size: 2 })
  })
})

describe('the path reaches the catalog', () => {
  const photoSource = (records) => ({
    name: 'shelf-shelf',
    kind: 'photo',
    origin: 'shelf.jpg',
    format: 'physical',
    confidence: 'medium',
    records,
    stats: {},
  })

  it('survives the source envelope', () => {
    const source = makeSource(
      photoSource([{ title: 'A book', authors: ['Someone'], spine: 'spines/shelf-shelf/0.jpg' }]),
    )
    const [record] = readSource(source).records
    expect(record.spine).toBe('spines/shelf-shelf/0.jpg')
  })

  it('reaches the book the wall draws', () => {
    const catalog = build([
      photoSource([{ title: 'A book', authors: ['Someone'], spine: 'spines/shelf-shelf/0.jpg' }]),
    ])
    expect(catalog.books[0].spine).toBe('spines/shelf-shelf/0.jpg')
  })

  it('is null for a book that came from a list rather than a photograph', () => {
    const catalog = build([
      {
        name: 'kindle',
        kind: 'export',
        origin: 'kindle.xml',
        format: 'ebook',
        confidence: 'high',
        records: [{ title: 'A book', authors: ['Someone'] }],
        stats: {},
      },
    ])
    expect(catalog.books[0].spine).toBeNull()
  })
})
