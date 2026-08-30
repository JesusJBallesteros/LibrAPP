// Which service the app may use, whose key it uses, and the three states a key
// can be in.
//
// LibrAPP works with no key at all. Every ingester, the whole catalog and the
// desk's prompt composer run without one. A key lets the app read shelf
// photographs and answer questions itself instead of preparing tiles and text
// to be pasted elsewhere.
//
// Three states rather than two, because "stored" and "in use" are different
// questions. Switching a key off keeps it for later without letting the app
// spend anything; deleting it removes it entirely.
//
//   absent    no key has been given for the chosen service
//   active    a key is stored and the app may use it
//   off       a key is stored and the app must not use it
//
// Keys are kept one per service, so trying a second provider does not discard
// the first, and switching back needs no pasting. They live in this origin's
// IndexedDB, next to the pointer to the library. A key is sent to its own
// service and nowhere else. It is never logged, never written into a source
// file, and never included in an export.

import { idbDelete, idbGet, idbSet } from '../store/idb.js'
import { PROVIDERS, providerById } from './providers.js'

const CHOICE = 'ai-choice'
const keyFor = (providerId) => `ai-key:${providerId}`

// Before there was a choice to make, there was one key under one name.
const LEGACY = 'anthropic-key'

/** Which service and model to use. Anthropic by default, because it was first. */
export async function readChoice() {
  const stored = await idbGet(CHOICE).catch(() => null)
  const provider = providerById(stored?.provider)
  return {
    provider: provider.id,
    model: stored?.model || provider.defaultModel,
    baseUrl: (provider.editableBaseUrl ? stored?.baseUrl : provider.baseUrl) || provider.baseUrl || '',
  }
}

export async function saveChoice(next) {
  const current = await readChoice()
  await idbSet(CHOICE, { ...current, ...next })
}

/** Moving to an unused service offers that service's own default model. */
export async function chooseProvider(providerId) {
  const provider = providerById(providerId)
  const stored = await idbGet(CHOICE).catch(() => null)
  const remembered = stored?.perProvider?.[provider.id]
  await idbSet(CHOICE, {
    ...(stored || {}),
    provider: provider.id,
    model: remembered?.model || provider.defaultModel,
    baseUrl: remembered?.baseUrl || provider.baseUrl || '',
  })
}

/** Remember this service's model and address, so switching back needs no retyping. */
export async function rememberForProvider(providerId, patch) {
  const stored = (await idbGet(CHOICE).catch(() => null)) || {}
  const perProvider = { ...(stored.perProvider || {}) }
  perProvider[providerId] = { ...(perProvider[providerId] || {}), ...patch }
  await idbSet(CHOICE, { ...stored, ...patch, perProvider })
}

/** A rough shape check, so an obvious paste error is caught before a request. */
export const looksLikeKey = (providerId, value) =>
  providerById(providerId).keyPattern.test((value || '').trim())

/** Enough of the key to recognise it, never enough to use it. */
export function maskKey(value) {
  const key = (value || '').trim()
  if (key.length < 12) return '••••'
  return `${key.slice(0, 8)}…${key.slice(-4)}`
}

/** `{ key, active, savedAt }` for one service, or null when none has been stored. */
export async function readKey(providerId) {
  try {
    const stored = await idbGet(keyFor(providerId))
    if (stored?.key) return stored
    if (providerId !== 'anthropic') return null
    // The single key from before providers existed still belongs to Anthropic.
    const legacy = await idbGet(LEGACY)
    if (!legacy?.key) return null
    await idbSet(keyFor('anthropic'), legacy)
    await idbDelete(LEGACY)
    return legacy
  } catch {
    return null
  }
}

/**
  * The state the interface should show, for the service currently chosen.
  *
  * `usable` answers the question a view asks: may the app make a request now.
  * That is not the same as holding a key. A model running on the user's own
  * machine has nobody to bill and needs none, so gating a button on a stored
  * key would put that service permanently out of reach.
  */
export async function keyState() {
  const choice = await readChoice()
  const stored = await readKey(choice.provider)
  return {
    ...choice,
    state: !stored ? 'absent' : stored.active ? 'active' : 'off',
    masked: stored ? maskKey(stored.key) : null,
    usable: Boolean(await usableConfig()),
  }
}

/**
 * Everything a request needs, or null if the app is not allowed to make one.
 *
 * A service at a hand-typed address may legitimately want no key, since a model
 * running on the user's own machine has nobody to bill.
 */
export async function usableConfig({ needModel = true } = {}) {
  const choice = await readChoice()
  const provider = providerById(choice.provider)
  const stored = await readKey(provider.id)
  const apiKey = stored?.active ? stored.key : null
  if (!apiKey && !provider.optionalKey) return null
  // Asking a service which models it offers is the one request that can be made
  // without knowing one, and is how a reader gets out of holding a name the
  // service has retired.
  if (needModel && !choice.model) return null
  if (provider.editableBaseUrl && !choice.baseUrl) return null
  return {
    provider,
    apiKey,
    model: choice.model,
    baseUrl: choice.baseUrl || provider.baseUrl || '',
    host: provider.host || hostOf(choice.baseUrl),
  }
}

export function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return url || 'that service'
  }
}

export async function saveKey(providerId, value) {
  const key = (value || '').trim()
  if (!key) throw new Error('No key given.')
  await idbSet(keyFor(providerId), { key, active: true, savedAt: new Date().toISOString() })
}

export async function setActive(providerId, active) {
  const stored = await readKey(providerId)
  if (!stored) return
  await idbSet(keyFor(providerId), { ...stored, active: Boolean(active) })
}

export const deleteKey = (providerId) => idbDelete(keyFor(providerId))

/** Which services already hold a key, so the picker can say so. */
export async function providersWithKeys() {
  const found = []
  for (const provider of PROVIDERS) {
    const stored = await readKey(provider.id)
    if (stored) found.push(provider.id)
  }
  return found
}
