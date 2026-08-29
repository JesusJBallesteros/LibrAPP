// Forgetting a library on purpose, and getting it back.
//
// Every test here is about the same worry: a reset is the one action in the app
// that destroys work, and it exists only because there is a way back from it.
// So the copy has to be made before anything is removed, a restore has to copy
// what it replaces, and a backup that turns out to be unreadable must not empty
// the library on its way to finding that out.
//
// A backup is an export bundle written into the library instead of downloaded,
// which is the property that lets one be carried to another device. That is
// tested here too, by importing one into a library that has never seen it.

import { beforeEach, describe, expect, it } from 'vitest'
import { Library } from '../src/store/library.js'
import { setOverride } from '../src/core/overrides.js'

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

const shelf = (photo, titles) => ({
  kind: 'photo',
  origin: photo,
  format: 'physical',
  confidence: 'medium',
  stats: { photo },
  records: titles.map((title) => ({ title, authors: ['Someone'] })),
})

// Null after a reset, which is what a library nobody has added to looks like.
const titlesIn = async (library) => {
  const catalog = await library.readCatalog()
  return catalog ? catalog.books.map((b) => b.title).sort() : []
}

let library
beforeEach(async () => {
  library = new Library(memoryBackend())
  await library.putSource({ name: 'shelf-one', ...shelf('one.jpg', ['Dune', 'Neuromancer']) })
  await library.putSource({ name: 'shelf-two', ...shelf('two.jpg', ['Solaris']) })
  await library.rebuild()
})

describe('making a copy', () => {
  it('writes one that says what it holds and why it was made', async () => {
    const file = await library.makeBackup('reset')
    expect(file).toMatch(/reset\.json$/)
    const [listed] = await library.readBackups()
    expect(listed).toMatchObject({ file, why: 'reset', sources: 2, books: 3, readable: true })
  })

  it('copies nothing when there is nothing to copy', async () => {
    // A library with no sources has nothing that could be lost, and a shelf of
    // empty backups is a list nobody can read.
    const empty = new Library(memoryBackend())
    expect(await empty.makeBackup('reset')).toBeNull()
    expect(await empty.readBackups()).toEqual([])
  })

  it('lists what it made', async () => {
    const first = await library.makeBackup('one')
    const second = await library.makeBackup('two')
    const names = (await library.readBackups()).map((b) => b.file)
    expect(names).toHaveLength(2)
    expect(new Set(names)).toEqual(new Set([first, second]))
  })

  it('lists one it cannot read, so it can still be deleted', async () => {
    library.backend.files.set('backups/broken.json', 'not json at all')
    const listed = await library.readBackups()
    const broken = listed.find((b) => b.file === 'broken.json')
    expect(broken).toMatchObject({ readable: false, books: null })
  })
})

describe('resetting', () => {
  it('keeps a copy, then forgets everything', async () => {
    const backup = await library.resetCatalog()
    expect(backup).toBeTruthy()
    expect(await library.sourceNames()).toEqual([])
    expect(await titlesIn(library)).toEqual([])
    // The same state as a library nobody has added to, rather than a library
    // holding a catalog of nothing.
    expect(await library.readCatalog()).toBeNull()
  })

  it('leaves the way back in place', async () => {
    // A reset that swept away the backups would be the one thing nobody could
    // undo, which is the whole reason this exists.
    await library.resetCatalog()
    expect(await library.backupNames()).toHaveLength(1)
  })

  it('forgets the corrections too', async () => {
    const catalog = await library.readCatalog()
    await library.writeOverrides(
      setOverride(await library.readOverrides(), catalog.books[0], { favourite: true }),
    )
    await library.resetCatalog()
    expect((await library.readOverrides()).entries).toEqual({})
  })
})

describe('recovering', () => {
  it('brings the books back', async () => {
    const backup = await library.resetCatalog()
    await library.restoreBackup(backup)
    expect(await titlesIn(library)).toEqual(['Dune', 'Neuromancer', 'Solaris'])
  })

  it('copies what it replaces before replacing it', async () => {
    const backup = await library.resetCatalog()
    await library.putSource({ name: 'shelf-three', ...shelf('three.jpg', ['Piranesi']) })
    await library.rebuild()

    const { replaced } = await library.restoreBackup(backup)
    expect(await titlesIn(library)).toEqual(['Dune', 'Neuromancer', 'Solaris'])

    // And the one book that was here a moment ago is still reachable.
    await library.restoreBackup(replaced)
    expect(await titlesIn(library)).toEqual(['Piranesi'])
  })

  it('does not leave corrections behind pointing at books that have gone', async () => {
    // Override ids are handed out by the builder. A correction that survived a
    // restore would attach itself to whichever book took its id next.
    const backup = await library.makeBackup('before')
    const catalog = await library.readCatalog()
    await library.writeOverrides(
      setOverride(await library.readOverrides(), catalog.books[0], { notes: 'written after' }),
    )
    await library.restoreBackup(backup)
    const notes = Object.values((await library.readOverrides()).entries).map((b) => b.set?.notes)
    expect(notes).not.toContain('written after')
  })

  it('refuses a backup that is not there, and changes nothing', async () => {
    await expect(library.restoreBackup('nothing.json')).rejects.toThrow(/no backup/)
    expect(await titlesIn(library)).toEqual(['Dune', 'Neuromancer', 'Solaris'])
  })

  it('refuses one it cannot read, and changes nothing', async () => {
    // The order matters: read first, remove second. Finding out a backup is
    // rubbish must not cost the library that was already here.
    library.backend.files.set('backups/broken.json', 'not json at all')
    await expect(library.restoreBackup('broken.json')).rejects.toThrow(/not readable/)
    expect(await titlesIn(library)).toEqual(['Dune', 'Neuromancer', 'Solaris'])
    expect(await library.sourceNames()).toHaveLength(2)
  })

  it('refuses a file that parses but is not an export, and changes nothing', async () => {
    library.backend.files.set('backups/other.json', '{"something": "else"}')
    await expect(library.restoreBackup('other.json')).rejects.toThrow(/not a LibrAPP export/)
    expect(await titlesIn(library)).toEqual(['Dune', 'Neuromancer', 'Solaris'])
  })
})

describe('a backup is a file another device can read', () => {
  it('imports into a library that has never seen it', async () => {
    // This is why a backup is an export bundle rather than a format of its own:
    // the file a reset leaves behind goes into the import that already exists.
    const file = await library.makeBackup('carried')
    const bundle = JSON.parse(library.backend.files.get(`backups/${file}`))

    const elsewhere = new Library(memoryBackend())
    await elsewhere.importBundle(bundle)
    await elsewhere.rebuild()
    expect(await titlesIn(elsewhere)).toEqual(['Dune', 'Neuromancer', 'Solaris'])
  })

  it('carries the corrections with it', async () => {
    const catalog = await library.readCatalog()
    await library.writeOverrides(
      setOverride(await library.readOverrides(), catalog.books[0], { favourite: true }),
    )
    const file = await library.makeBackup('carried')
    const bundle = JSON.parse(library.backend.files.get(`backups/${file}`))

    const elsewhere = new Library(memoryBackend())
    await elsewhere.importBundle(bundle)
    const marked = Object.values((await elsewhere.readOverrides()).entries)
    expect(marked.some((b) => b.set?.favourite === true)).toBe(true)
  })

  it('is still a plain bundle, with the extra facts alongside', async () => {
    const file = await library.makeBackup('reset')
    const bundle = JSON.parse(library.backend.files.get(`backups/${file}`))
    expect(bundle.librapp_bundle).toBe(1)
    expect(bundle.sources).toHaveLength(2)
    expect(bundle.made_because).toBe('reset')
    expect(bundle.held.books).toBe(3)
  })
})
