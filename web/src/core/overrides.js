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
import { splitTags } from './build.js'

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
  'pages',
  'favourite',
  // Recalled by a model rather than read from a source, whether that happened
  // while reading a photograph or later at the desk. They belong here for the
  // same reason as the rest: a value somebody can see is a value somebody must
  // be able to correct, and until now a wrong rating could not be fixed at all.
  'abstract',
  'published_year',
  'rating',
  'original_language',
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

// Nothing recorded. Null is the app's word for unknown and an empty box in the
// editor means the same thing, so the two are one value here. False is not one
// of them: for a read state it means unread, which is an answer.
const blank = (value) => value === null || value === undefined || value === ''

/**
 * Whether a corrected value is the same as the one underneath it.
 *
 * Arrays are compared by their contents because authors and formats are lists,
 * and two lists of the same ids in the same order are the same list.
 */
export function sameValue(a, b) {
  if (blank(a) && blank(b)) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, i) => value === b[i])
  }
  return a === b
}

/**
 * What the sources say about one field of a book that may already be corrected.
 *
 * A book handed back from the catalog carries its corrections already applied,
 * so its own value is no guide to what is underneath. Where it was corrected it
 * also carries what it was before, which is.
 */
const beneath = (book, field) =>
  book?.overridden?.was && field in book.overridden.was ? book.overridden.was[field] : book?.[field]

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
    // Putting a value back to what the sources say is not a correction, it is
    // the absence of one. Starring a book and then unstarring it used to leave
    // the book listed among the corrections, saying favourite: false, which is
    // what it said before anybody touched it.
    //
    // Authors are exempt: a correction holds display names and a built book
    // holds ids, so the two cannot be compared here. The comparison at the
    // point of applying can, and does.
    if (field !== 'authors' && sameValue(value, beneath(book, field))) delete set[field]
    else set[field] = value
  }

  // Nothing left to say about this book. Removing the entry rather than storing
  // an empty one keeps the count of corrections honest and the file readable.
  const previousRemoved = previous.removed ?? false
  if (!Object.keys(set).length && !previousRemoved) return clearOverride(overrides, book.id)

  return {
    ...overrides,
    entries: {
      ...overrides.entries,
      [book.id]: {
        ...previous,
        set,
        removed: previousRemoved,
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
    // tags are not stored, they are cut from genre and keywords when the
    // catalog is built, and everything that counts genres reads them rather
    // than the field: the chart, the word cloud, the tag filter. An override
    // that set a genre therefore changed the book and not one of those, so a
    // genre added by hand or by the desk was visible on the card and nowhere
    // else. Whatever a correction touches, its derived form goes with it.
    if (fields.includes('genre') || fields.includes('keywords')) {
      next.tags = splitTags(next.genre, next.keywords)
    }

    // Which of them actually changed anything. A stored correction that agrees
    // with its source is a correction in name only: it should not mark the book,
    // should not be counted, and should not be listed as work somebody did.
    // Judged here rather than only where corrections are written, because this
    // is the one place the value underneath is in hand, and because files
    // written before this existed carry entries of exactly that kind.
    const changed = fields.filter((field) => !sameValue(next[field], book[field]))
    if (!changed.length) {
      books.push(book)
      continue
    }

    next.overridden = {
      fields: changed,
      was: Object.fromEntries(changed.map((field) => [field, was[field]])),
      at: override.at || null,
      why: override.why || null,
    }
    next.flags = [...new Set([...(book.flags || []), 'corrected'])].sort()
    books.push(next)
    corrected.push({ id: book.id, title: next.title, fields: changed })
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
