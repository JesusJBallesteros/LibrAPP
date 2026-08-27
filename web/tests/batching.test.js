// Reading a shelf in several requests instead of one.
//
// A reply is one JSON document covering every tile in its request, so a long
// shelf asked for at once comes back truncated and unreadable. Splitting the
// tiles fixes that and introduces one problem of its own: the instruction to
// record an overlapping book once only reaches as far as the request it is in.
// Two requests cannot agree with each other, and the builder will not help,
// because it treats two rows from one source as two copies rather than as a
// duplicate. So the joining has to happen while this is still one read.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const adapter = { shelfContent: vi.fn(({ tiles }) => tiles), readShelf: vi.fn() }

vi.mock('../src/ai/anthropic.js', () => ({ anthropic: adapter, explain: (e) => e }))
vi.mock('../src/ai/rest.js', () => ({
  openai: adapter,
  google: adapter,
  KeyRejected: class extends Error {},
  ReplyTruncated: class extends Error {},
}))
vi.mock('../src/ai/key.js', () => ({
  usableConfig: async () => ({
    provider: { id: 'anthropic', family: 'anthropic' },
    apiKey: 'k',
    model: 'm',
  }),
}))

// Tiles are turned into base64 with a FileReader, which the browser has and
// node does not. The stub stands in for the browser rather than for the tile.
globalThis.FileReader = class {
  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,AAAA'
    queueMicrotask(() => this.onload?.())
  }
}

const { TILES_PER_BATCH, readShelf } = await import('../src/ai/model.js')

const tile = (n) => ({
  tile: `t${n}`,
  row: 1,
  column: n,
  blob: { arrayBuffer: async () => new ArrayBuffer(1) },
})
const tiles = (n) => Array.from({ length: n }, (_, i) => tile(i + 1))

const book = (title, over = {}) => ({ title, authors: ['Ursula K. Le Guin'], confidence: 'high', ...over })
const reply = (books, usage = { input_tokens: 10, output_tokens: 20 }) => ({
  transcription: { photo: 'shelf.jpg', shelves: [{ location: 'top', books }] },
  usage,
})

beforeEach(() => {
  adapter.readShelf.mockReset()
  adapter.shelfContent.mockClear()
})

const read = (n, opts = {}) =>
  readShelf({ tiles: tiles(n), photo: 'shelf.jpg', instructions: 'INSTRUCTIONS', ...opts })

describe('splitting the tiles', () => {
  it('sends one request when the tiles fit in one', async () => {
    adapter.readShelf.mockResolvedValue(reply([book('The Dispossessed')]))
    const out = await read(TILES_PER_BATCH)
    expect(adapter.readShelf).toHaveBeenCalledTimes(1)
    expect(out.batches).toBe(1)
  })

  it('sends more than one when they do not', async () => {
    adapter.readShelf.mockResolvedValue(reply([book('The Dispossessed')]))
    const out = await read(TILES_PER_BATCH * 2 + 1)
    expect(adapter.readShelf).toHaveBeenCalledTimes(3)
    expect(out.batches).toBe(3)
  })

  it('sends every tile exactly once', async () => {
    adapter.readShelf.mockResolvedValue(reply([]))
    await read(9)
    const sent = adapter.shelfContent.mock.calls.flatMap(([{ tiles: group }]) => group.map((t) => t.tile))
    expect(sent).toHaveLength(9)
    expect(new Set(sent).size).toBe(9)
  })

  it('gives every request the same instructions', async () => {
    adapter.readShelf.mockResolvedValue(reply([]))
    await read(9)
    const tails = adapter.shelfContent.mock.calls.map(([{ tail }]) => tail)
    expect(new Set(tails).size).toBe(1)
    expect(tails[0]).toContain('INSTRUCTIONS')
  })
})

describe('one book seen in two batches', () => {
  it('becomes one book', async () => {
    // The overlap the model was told to collapse, which it cannot do across
    // two requests that never saw each other.
    adapter.readShelf
      .mockResolvedValueOnce(reply([book('The Dispossessed')]))
      .mockResolvedValueOnce(reply([book('The Dispossessed')]))
    const out = await read(TILES_PER_BATCH + 1)
    const all = out.transcription.shelves.flatMap((s) => s.books)
    expect(all).toHaveLength(1)
  })

  it('matches on the folded title and author, not on the exact string', async () => {
    adapter.readShelf
      .mockResolvedValueOnce(reply([book('Crítica de la razón pura')]))
      .mockResolvedValueOnce(reply([book('critica de la razon pura')]))
    const out = await read(TILES_PER_BATCH + 1)
    expect(out.transcription.shelves.flatMap((s) => s.books)).toHaveLength(1)
  })

  it('keeps the more confident reading of the two', async () => {
    adapter.readShelf
      .mockResolvedValueOnce(reply([book('The Dispossessed', { confidence: 'low', notes: 'blurred' })]))
      .mockResolvedValueOnce(reply([book('The Dispossessed', { confidence: 'high' })]))
    const out = await read(TILES_PER_BATCH + 1)
    const [only] = out.transcription.shelves.flatMap((s) => s.books)
    expect(only.confidence).toBe('high')
  })

  it('keeps two different books by the same author apart', async () => {
    adapter.readShelf
      .mockResolvedValueOnce(reply([book('The Dispossessed')]))
      .mockResolvedValueOnce(reply([book('The Left Hand of Darkness')]))
    const out = await read(TILES_PER_BATCH + 1)
    expect(out.transcription.shelves.flatMap((s) => s.books)).toHaveLength(2)
  })

  it('keeps the same title by different authors apart', async () => {
    adapter.readShelf
      .mockResolvedValueOnce(reply([book('Ulysses', { authors: ['James Joyce'] })]))
      .mockResolvedValueOnce(reply([book('Ulysses', { authors: ['Alfred, Lord Tennyson'] })]))
    const out = await read(TILES_PER_BATCH + 1)
    expect(out.transcription.shelves.flatMap((s) => s.books)).toHaveLength(2)
  })

  it('drops a shelf left with nothing rather than returning an empty one', async () => {
    adapter.readShelf
      .mockResolvedValueOnce(reply([book('The Dispossessed')]))
      .mockResolvedValueOnce(reply([book('The Dispossessed')]))
    const out = await read(TILES_PER_BATCH + 1)
    expect(out.transcription.shelves.every((s) => s.books.length)).toBe(true)
  })
})

describe('adding up what it cost', () => {
  it('sums the usage across every request', async () => {
    adapter.readShelf.mockResolvedValue(reply([book('A')], { input_tokens: 100, output_tokens: 50 }))
    const out = await read(TILES_PER_BATCH * 3)
    expect(out.usage).toEqual({ input_tokens: 300, output_tokens: 150 })
  })

  it('survives a reply that reported no usage', async () => {
    adapter.readShelf.mockResolvedValue({ transcription: { shelves: [] } })
    const out = await read(TILES_PER_BATCH)
    expect(out.usage).toEqual({ input_tokens: 0, output_tokens: 0 })
  })
})

describe('when one batch fails', () => {
  it('keeps what the others read', async () => {
    adapter.readShelf
      .mockResolvedValueOnce(reply([book('The Dispossessed')]))
      .mockRejectedValueOnce(new Error('the reply was cut off'))
    const out = await read(TILES_PER_BATCH + 1)
    expect(out.transcription.shelves.flatMap((s) => s.books)).toHaveLength(1)
  })

  it('says which tiles are missing from the result', async () => {
    adapter.readShelf
      .mockResolvedValueOnce(reply([book('The Dispossessed')]))
      .mockRejectedValueOnce(new Error('the reply was cut off'))
    const out = await read(TILES_PER_BATCH + 1)
    expect(out.failures).toHaveLength(1)
    expect(out.failures[0].tiles).toEqual([`t${TILES_PER_BATCH + 1}`])
  })

  it('throws when nothing at all came back, rather than offering an empty shelf', async () => {
    // A silent empty result would be imported as though the shelf were empty.
    adapter.readShelf.mockRejectedValue(new Error('the key was rejected'))
    await expect(read(TILES_PER_BATCH * 2)).rejects.toThrow('the key was rejected')
  })

  it('stops at once when the read is cancelled, rather than paying for the rest', async () => {
    const aborted = Object.assign(new Error('aborted'), { name: 'AbortError' })
    adapter.readShelf.mockResolvedValueOnce(reply([book('A')])).mockRejectedValueOnce(aborted)
    await expect(read(TILES_PER_BATCH * 3)).rejects.toThrow('aborted')
    expect(adapter.readShelf).toHaveBeenCalledTimes(2)
  })
})

describe('saying how far along it is', () => {
  it('reports before and after each batch', async () => {
    adapter.readShelf.mockResolvedValue(reply([]))
    const seen = []
    await read(TILES_PER_BATCH * 2, { onProgress: (p) => seen.push(`${p.done}/${p.total}`) })
    expect(seen).toEqual(['0/2', '1/2', '1/2', '2/2'])
  })

  it('works without anybody listening', async () => {
    adapter.readShelf.mockResolvedValue(reply([]))
    await expect(read(TILES_PER_BATCH)).resolves.toBeTruthy()
  })
})
