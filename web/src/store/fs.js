// Where a library lives, and the two ways it can live there.
//
// On a desktop the File System Access API can point LibrAPP at a real folder.
// Those files are readable with a text editor, backed up by whatever backs up
// that folder, and committable to a private repository, which is what a catalog
// described as local should mean.
//
// Android Chrome has no folder picker. It does have the origin private file
// system, which gives the same file semantics in browser-managed storage. Those
// files are invisible outside the app, so that path relies on export and import
// to move a library between devices.
//
// Both back ends expose the same four operations, so nothing above this file
// knows which one it is talking to.

import { idbDelete, idbGet, idbSet } from './idb.js'

const HANDLE_KEY = 'library-directory'
const KIND_KEY = 'library-kind'

// Which back end was chosen last time. Without this the app asks again on every
// launch, and on a phone, where browser storage is the only option, there is
// nothing to ask about.
export const rememberKind = (kind) => idbSet(KIND_KEY, kind)
export const recallKind = () => idbGet(KIND_KEY).catch(() => null)

export const canPickFolder = () => typeof globalThis.showDirectoryPicker === 'function'
export const hasOpfs = () => Boolean(navigator?.storage?.getDirectory)

class DirectoryBackend {
  constructor(root, kind) {
    this.root = root
    this.kind = kind // 'folder' | 'browser'
  }

  async #dir(path, create = false) {
    const parts = path.split('/').filter(Boolean)
    let handle = this.root
    for (const part of parts.slice(0, -1)) {
      handle = await handle.getDirectoryHandle(part, { create })
    }
    return [handle, parts[parts.length - 1]]
  }

  async readText(path) {
    try {
      const [dir, name] = await this.#dir(path)
      const file = await (await dir.getFileHandle(name)).getFile()
      return await file.text()
    } catch (err) {
      if (err?.name === 'NotFoundError') return null
      throw err
    }
  }

  async writeText(path, text) {
    const [dir, name] = await this.#dir(path, true)
    const handle = await dir.getFileHandle(name, { create: true })
    const writable = await handle.createWritable()
    await writable.write(text)
    await writable.close()
  }

  async list(path) {
    try {
      const parts = path.split('/').filter(Boolean)
      let dir = this.root
      for (const part of parts) dir = await dir.getDirectoryHandle(part)
      const names = []
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'file') names.push(name)
      }
      return names.sort()
    } catch (err) {
      if (err?.name === 'NotFoundError') return []
      throw err
    }
  }

  async remove(path) {
    const [dir, name] = await this.#dir(path)
    await dir.removeEntry(name)
  }
}

/** Ask for a folder and remember it. Desktop only. */
export async function chooseFolder() {
  const handle = await globalThis.showDirectoryPicker({ id: 'librapp', mode: 'readwrite' })
  await idbSet(HANDLE_KEY, handle)
  await rememberKind('folder')
  return new DirectoryBackend(handle, 'folder')
}

/** The browser's own storage. Always available, invisible outside the app. */
export async function browserStorage() {
  await rememberKind('browser')
  return new DirectoryBackend(await navigator.storage.getDirectory(), 'browser')
}

/**
 * Reopen the folder chosen last time, if permission still stands.
 *
 * A handle kept in IndexedDB survives a reload but its permission may not, and
 * asking for it again requires a click. Returning null means "ask the user",
 * not "something went wrong".
 */
export async function reopenFolder() {
  if (!canPickFolder()) return null
  const handle = await idbGet(HANDLE_KEY).catch(() => null)
  if (!handle) return null
  const options = { mode: 'readwrite' }
  if ((await handle.queryPermission?.(options)) === 'granted') {
    return new DirectoryBackend(handle, 'folder')
  }
  return { needsPermission: true, grant: async () => {
    if ((await handle.requestPermission(options)) !== 'granted') return null
    return new DirectoryBackend(handle, 'folder')
  } }
}

export const forgetFolder = async () => {
  await idbDelete(HANDLE_KEY)
  await idbDelete(KIND_KEY)
}

/** Roughly how much room the browser will give this origin. */
export async function storageEstimate() {
  if (!navigator?.storage?.estimate) return null
  const { usage, quota } = await navigator.storage.estimate()
  return { usage, quota }
}

/**
 * Ask the browser not to evict the library.
 *
 * Browser-managed storage can be cleared under pressure. On the phone, where
 * that is the only option, this is the difference between a catalog and a
 * cache.
 */
export async function requestPersistence() {
  if (!navigator?.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
