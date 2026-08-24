// Corrections that outrank every source.
//
// The catalog is rebuilt from its sources every time, so a change written into
// catalog.json is gone on the next rebuild. Corrections live in their own file
// and are applied after the merge, never mixed into it, for three reasons:
//
//   1. A rebuild regenerates the catalog and would discard anything in it.
//   2. An override is a different kind of claim from a source record. It is a
//      person overruling the evidence, and that distinction survives.
//   3. One small file records what has been changed by hand.
//
// Removal needs more care. Deleting an entry removes nothing, because the next
// rebuild reads the same sources and puts it back, so removal is recorded as a
// suppression. The key is the entry id, a slug of author and title, which
// changes when a better source supplies a fuller title. An override keyed on id
// alone would stop working at exactly that point, so each one also stores the
// title and authors it was made against, and anything that no longer resolves
// is reported rather than dropped.

import { authorTokens, fold, slugify, tokenKey } from './textmatch.js'

export const OVERRIDES_VERSION = 1

/** Fields a person may correct. Everything else is derived or structural. */
export const EDITABLE = [
  'title',
  'authors',
  'series',
  'series_index',
  'genre',
  'read',
  'acquired_on',
  'location',
  'publisher',
  'notes',
  'formats',
  // Not corrections to a source, but facts only the owner knows. They live here
  // because this is the layer that survives a rebuild, and because a source
  // file records what was ingested and is never written back to.
  'lent_to',
  'lent_on',
  'borrowed_from',
  'borrowed_on',
]

export const emptyOverrides = () => ({ librapp_overrides: OVERRIDES_VERSION, entries: {} })

export function readOverrides(payload) {
  if (!payload) return emptyOverrides()
  if (payload.librapp_overrides !== OVERRIDES_VERSION) {
    throw new Error(
      `not a LibrAPP overrides file (expected librapp_overrides ${OVERRIDES_VERSION})`,
    )
  }
  return { ...emptyOverrides(), ...payload, entries: payload.entries || {} }
}

/**
 * Record a correction against one entry.
 *
 * The title and authors are stored alongside so the override can still be
 * described if its id stops resolving.
 */
export function setOverride(overrides, book, changes, why = null) {
  const previous = overrides.entries[book.id] || {}
  const set = { ...(previous.set || {}) }
  for (const [field, value] of Object.entries(changes)) {
    if (!EDITABLE.includes(field)) throw new Error(`${field} cannot be overridden`)
    set[field] = value
  }
  return {
    ...overrides,
    entries: {
      ...overrides.entries,
      [book.id]: {
        ...previous,
        set,
        removed: previous.removed ?? false,
        why: why ?? previous.why ?? null,
        at: new Date().toISOString().slice(0, 10),
        title: book.title,
        authors: book.authors || [],
      },
    },
  }
}

/** Suppress an entry, or bring it back. */
export function setRemoved(overrides, book, removed, why = null) {
  const previous = overrides.entries[book.id] || {}
  return {
    ...overrides,
    entries: {
      ...overrides.entries,
      [book.id]: {
        ...previous,
        set: previous.set || {},
        removed: Boolean(removed),
        why: why ?? previous.why ?? null,
        at: new Date().toISOString().slice(0, 10),
        title: book.title ?? previous.title,
        authors: book.authors ?? previous.authors ?? [],
      },
    },
  }
}

/** Drop a correction entirely, returning the entry to what the sources say. */
export function clearOverride(overrides, id) {
  const entries = { ...overrides.entries }
  delete entries[id]
  return { ...overrides, entries }
}

/**
 * Resolve author display names to ids, inventing an author where none matches.
 *
 * Editing a book's authors is the one correction that reaches outside the
 * entry, because authors are a shared list. A name that matches an existing
 * author by tokens reuses it, so correcting a spelling does not fork a person
 * in two.
 */
function resolveAuthors(names, authors) {
  const byTokens = new Map(authors.map((a) => [tokenKey(authorTokens(a.display_name)), a]))
  const ids = []
  for (const name of names) {
    const clean = String(name || '').trim()
    if (!clean) continue
    const key = tokenKey(authorTokens(clean))
    const existing = byTokens.get(key)
    if (existing) {
      if (!ids.includes(existing.id)) ids.push(existing.id)
      continue
    }
    const parts = clean.split(' ').filter(Boolean)
    const entry = {
      id: slugify(clean),
      display_name: clean,
      sort_name: parts.length > 1 ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}` : clean,
      aliases: [],
      invented_by_override: true,
    }
    authors.push(entry)
    byTokens.set(key, entry)
    if (!ids.includes(entry.id)) ids.push(entry.id)
  }
  return ids
}

/**
 * Apply corrections to a freshly built catalog.
 *
 * Returns a new catalog. Every corrected entry says so and carries what the
 * sources had said. A correction indistinguishable from source data could
 * neither be audited nor undone, and the catalog depends on every value having
 * a traceable origin.
 */
export function applyOverrides(catalog, overrides) {
  const entries = overrides?.entries || {}
  if (!Object.keys(entries).length) return catalog

  const authors = [...(catalog.authors || [])]
  const books = []
  const removed = []
  const corrected = []
  const seen = new Set()

  for (const book of catalog.books) {
    const override = entries[book.id]
    if (!override) {
      books.push(book)
      continue
    }
    seen.add(book.id)

    if (override.removed) {
      removed.push({
        id: book.id,
        title: book.title,
        authors: book.authors,
        why: override.why || null,
        at: override.at || null,
      })
      continue
    }

    const set = override.set || {}
    const fields = Object.keys(set).filter((f) => EDITABLE.includes(f))
    if (!fields.length) {
      books.push(book)
      continue
    }

    const was = {}
    const next = { ...book }
    for (const field of fields) {
      was[field] = book[field]
      if (field === 'authors') {
        next.authors = resolveAuthors(set.authors || [], authors)
        next.author_label = next.authors.length ? null : book.author_label
      } else {
        next[field] = set[field]
      }
    }
    next.overridden = { fields, was, at: override.at || null, why: override.why || null }
    next.flags = [...new Set([...(book.flags || []), 'corrected'])].sort()
    books.push(next)
    corrected.push({ id: book.id, title: next.title, fields })
  }

  // An override whose id no longer resolves is reported, never dropped: the id
  // is a slug of author and title, so it changes exactly when a better source
  // improves the entry, and silence there would look like the correction had
  // simply stopped mattering.
  const orphaned = Object.entries(entries)
    .filter(([id]) => !seen.has(id))
    .map(([id, entry]) => ({
      id,
      title: entry.title || null,
      authors: entry.authors || [],
      removed: Boolean(entry.removed),
      at: entry.at || null,
    }))

  const counts = {
    ...catalog.counts,
    books: books.length,
    authors: authors.length,
    by_format: Object.fromEntries(
      [...new Set(books.flatMap((b) => b.formats || []))]
        .sort()
        .map((f) => [f, books.filter((b) => (b.formats || []).includes(f)).length]),
    ),
    read: books.filter((b) => b.read === true).length,
    unread: books.filter((b) => b.read === false).length,
    read_unknown: books.filter((b) => b.read === null || b.read === undefined).length,
    corrected: corrected.length,
    removed: removed.length,
  }

  return {
    ...catalog,
    counts,
    books,
    authors,
    review: {
      ...catalog.review,
      corrected,
      removed_by_hand: removed,
      orphaned_overrides: orphaned,
    },
  }
}

/** A one-line description of a correction, for showing in a list. */
export const describeOverride = (entry) =>
  entry.removed ? 'removed' : `changed ${Object.keys(entry.set || {}).join(', ')}`

export { fold }
