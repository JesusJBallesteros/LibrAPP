// Replies from the desk that the reader chose to keep.
//
// Every answer used to live in a box on the page and go when the page did. Most
// of them should: a synopsis of one book is worth reading once. A description of
// the whole collection is not, and there was nothing to keep it with except the
// clipboard.
//
// Their own file rather than the catalog. Nothing derives from them, a rebuild
// must not touch them, and deleting one is deleting a document rather than
// editing a book.

import { beforeEach, describe, expect, it } from 'vitest'
import { Library } from '../src/store/library.js'

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

const shelf = (titles) => ({
  kind: 'photo',
  origin: 'one.jpg',
  format: 'physical',
  confidence: 'medium',
  stats: { photo: 'one.jpg' },
  records: titles.map((title) => ({ title, authors: ['Someone'] })),
})

let library
beforeEach(() => {
  library = new Library(memoryBackend())
})

describe('keeping an answer', () => {
  it('starts with none', async () => {
    expect(await library.readAnswers()).toEqual([])
  })

  it('keeps what it was given, and when', async () => {
    const kept = await library.saveAnswer({
      ask: 'portrait',
      question: 'anything',
      text: 'A description of the shelf.',
    })
    expect(kept).toMatchObject({ ask: 'portrait', question: 'anything', text: 'A description of the shelf.' })
    expect(kept.at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(await library.readAnswers()).toHaveLength(1)
  })

  it('puts the newest first', async () => {
    await library.saveAnswer({ ask: 'synopsis', text: 'first' })
    await library.saveAnswer({ ask: 'recommend', text: 'second' })
    expect((await library.readAnswers()).map((a) => a.text)).toEqual(['second', 'first'])
  })

  it('gives each one an id of its own', async () => {
    await library.saveAnswer({ ask: 'synopsis', text: 'one' })
    await library.saveAnswer({ ask: 'synopsis', text: 'two' })
    const [a, b] = await library.readAnswers()
    expect(a.id).not.toBe(b.id)
  })

  it('keeps a question that was never asked as null rather than undefined', async () => {
    // The portrait answers with an empty box, and JSON.stringify drops an
    // undefined, which would make the field vanish from the file.
    const kept = await library.saveAnswer({ ask: 'portrait', text: 'no question' })
    expect(kept.question).toBeNull()
    expect(JSON.parse(library.backend.files.get('answers.json')).answers[0]).toHaveProperty('question')
  })

  it('deletes one and leaves the rest', async () => {
    await library.saveAnswer({ ask: 'synopsis', text: 'keep me' })
    const doomed = await library.saveAnswer({ ask: 'synopsis', text: 'not me' })
    await library.deleteAnswer(doomed.id)
    expect((await library.readAnswers()).map((a) => a.text)).toEqual(['keep me'])
  })

  it('reads an unreadable file as none rather than throwing', async () => {
    // A file that will not parse is not a reason to lose the page; the next
    // save replaces it.
    library.backend.files.set('answers.json', 'not json')
    expect(await library.readAnswers()).toEqual([])
  })
})

describe('what a kept answer is not part of', () => {
  it('survives a rebuild', async () => {
    await library.putSource({ name: 'shelf-one', ...shelf(['Dune']) })
    await library.saveAnswer({ ask: 'portrait', text: 'still here' })
    await library.rebuild()
    expect(await library.readAnswers()).toHaveLength(1)
  })

  it('is not swept up by a reset', async () => {
    // A reset forgets the books. The answers are about the books but are not
    // among them, and nobody asked for them to go.
    await library.putSource({ name: 'shelf-one', ...shelf(['Dune']) })
    await library.rebuild()
    await library.saveAnswer({ ask: 'portrait', text: 'written before the reset' })
    await library.resetCatalog()
    expect(await library.readAnswers()).toHaveLength(1)
  })

  it('does not travel in an export', async () => {
    // An export carries what a catalog is built from. An answer is not a
    // source, and a bundle holding one would import it as though it were.
    await library.putSource({ name: 'shelf-one', ...shelf(['Dune']) })
    await library.saveAnswer({ ask: 'portrait', text: 'mine' })
    const bundle = await library.exportBundle()
    expect(JSON.stringify(bundle)).not.toContain('mine')
  })
})
