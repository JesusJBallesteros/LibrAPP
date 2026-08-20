// Where the API key lives, and the three states it can be in.
//
// LibrAPP works with no key at all — every ingester, the whole catalog and the
// desk's prompt composer run without one. A key only buys the app permission to
// read your shelf photographs and answer your questions itself, instead of
// handing you tiles and text to paste elsewhere.
//
// Three states rather than two, because "stored" and "in use" are different
// questions. Switching a key off keeps it for later without letting the app
// spend anything; deleting it removes it entirely.
//
//   absent    no key has been given
//   active    a key is stored and the app may use it
//   off       a key is stored and the app must not use it
//
// The key is kept in this origin's IndexedDB, next to the pointer to your
// library. It is sent to api.anthropic.com and nowhere else. It is never
// logged, never written into a source file, and never included in an export.

import { idbDelete, idbGet, idbSet } from '../store/idb.js'

const KEY = 'anthropic-key'

/** A rough shape check, so an obvious paste error is caught before a request. */
export const looksLikeKey = (value) => /^sk-ant-[\w-]{20,}$/.test((value || '').trim())

/** Enough of the key to recognise it, never enough to use it. */
export function maskKey(value) {
  const key = (value || '').trim()
  if (key.length < 12) return '••••'
  return `${key.slice(0, 11)}…${key.slice(-4)}`
}

/** `{ key, active, savedAt }`, or null when none has been stored. */
export async function readKey() {
  try {
    const stored = await idbGet(KEY)
    return stored?.key ? stored : null
  } catch {
    return null
  }
}

/** The state the interface should show: 'absent' | 'active' | 'off'. */
export async function keyState() {
  const stored = await readKey()
  if (!stored) return { state: 'absent', masked: null }
  return { state: stored.active ? 'active' : 'off', masked: maskKey(stored.key) }
}

/** The key to use for a request, or null if there is none or it is switched off. */
export async function usableKey() {
  const stored = await readKey()
  return stored?.active ? stored.key : null
}

export async function saveKey(value) {
  const key = (value || '').trim()
  if (!key) throw new Error('No key given.')
  await idbSet(KEY, { key, active: true, savedAt: new Date().toISOString() })
}

export async function setActive(active) {
  const stored = await readKey()
  if (!stored) return
  await idbSet(KEY, { ...stored, active: Boolean(active) })
}

export const deleteKey = () => idbDelete(KEY)
