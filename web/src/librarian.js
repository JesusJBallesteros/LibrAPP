// What the LibrAPPrian has to say, and when.
//
// Every line is computed from the catalog the app already holds. The owl never
// states anything it cannot count, which is the whole reason it is allowed to
// speak at all: a friendly voice that occasionally invents a fact is worse than
// no voice.
//
// Each page gets up to three things, in one order: first what is true of this
// collection right now and worth acting on, then how the page works. The
// observations are computed and can be followed; the guidance is fixed and
// comes from the same documentation the README carries, so somebody who has
// never used the page can be told what to do without leaving it.
//
// This module decides only which lines apply. The wording lives in the
// dictionaries and the drawing lives in the component, so a line can be
// retranslated or restyled without touching the rule that chose it.

import { onLoan, readState } from './lib.js'

/** A loan is worth mentioning once it has been out this long. */
export const LONG_LOAN_YEARS = 1

/** Nobody reads a fourth bubble. Three is already generous. */
export const MOST = 3

/**
 * How each page works, in the order a beginner needs it.
 *
 * Fixed text rather than anything derived, so these carry no values and no
 * action: they are the manual, not a reading of the shelf. Kept here rather
 * than in the component so the whole of what the owl may say is in one file.
 */
const GUIDES = {
  home: ['home.1', 'home.2'],
  catalog: ['catalog.1', 'catalog.2'],
  shelf: ['shelf.1', 'shelf.2', 'shelf.3'],
  list: ['list.1', 'list.2', 'list.3'],
  desk: ['desk.1', 'desk.2'],
  storage: ['storage.1', 'storage.2', 'storage.3'],
}

const guide = (view) => (GUIDES[view] || []).map((key) => ({ key: `guide.${key}`, values: {}, action: null }))

/**
 * What is true of this collection and worth doing something about.
 *
 * Ordered by how much it asks of the reader rather than by view. A book
 * belonging to somebody else outranks an unread pile, because one is an
 * obligation and the other is only an opportunity.
 */
function readings({ view, counts, books }) {
  const out = []
  const long = (kind) =>
    onLoan(books, kind).filter((row) => row.age !== null && row.age >= LONG_LOAN_YEARS)

  if (view === 'catalog' || view === 'home') {
    const owed = long('borrowed')
    if (owed.length) {
      out.push({
        key: 'borrowedLong',
        values: { n: owed.length },
        action: { key: 'showBorrowed', view: 'catalog', focus: { loan: 'borrowed' } },
      })
    }
    const lent = long('lent')
    if (lent.length) {
      out.push({
        key: 'lentLong',
        values: { n: lent.length },
        action: { key: 'showLent', view: 'catalog', focus: { loan: 'lent' } },
      })
    }
  }

  if (view === 'home') {
    out.push({ key: 'welcome', values: { n: counts?.books ?? books.length }, action: null })
    return out
  }

  if (view === 'catalog') {
    const unread = counts?.unread ?? books.filter((b) => readState(b) === 'unread').length
    if (unread > 0) {
      out.push({
        key: 'unread',
        values: { n: unread },
        action: { key: 'showOldest', view: 'catalog', focus: { read: 'unread', sort: 'oldest' } },
      })
      return out
    }

    // No unread books is not the same as every book read. A catalog built from
    // a photograph records no read state at all, and calling that "all read"
    // would be the owl inventing the one fact it is not allowed to invent.
    const unknown = counts?.read_unknown ?? books.filter((b) => readState(b) === 'unknown').length
    if (unknown > 0) {
      out.push({
        key: 'unrecorded',
        values: { n: unknown },
        action: { key: 'showUnrecorded', view: 'catalog', focus: { read: 'unknown' } },
      })
      return out
    }

    const read = counts?.read ?? books.filter((b) => readState(b) === 'read').length
    if (read > 0) out.push({ key: 'allRead', values: {}, action: null })
    return out
  }

  if (view === 'desk') {
    out.push({ key: 'desk', values: { n: counts?.books ?? books.length }, action: null })
  }
  return out
}

/**
 * Everything the owl has to say here, most useful first, at most three.
 *
 * An empty catalog gets its own set: there is nothing to observe, so all of it
 * is how to begin.
 */
export function observations({ view, counts = null, books = [], hasCatalog = false } = {}) {
  // About has no owl, by decision: it is the page where the app explains
  // itself, and a character talking over that explanation reads badly.
  if (view === 'about') return []
  if (!GUIDES[view]) return []

  if (!hasCatalog) {
    return [
      { key: 'empty', values: {}, action: { key: 'startPhoto', view: 'shelf' } },
      { key: 'guide.empty.1', values: {}, action: null },
      { key: 'guide.empty.2', values: {}, action: null },
    ]
  }

  return [...readings({ view, counts, books }), ...guide(view)].slice(0, MOST)
}

/** The single most useful thing here, or null. */
export function observe(where) {
  return observations(where)[0] ?? null
}

/**
 * A line about something happening right now, which outranks everything else.
 *
 * These are cleared by whoever set them when the operation finishes, rather
 * than on a timer, so the owl never claims to still be reading a photograph
 * that was read a minute ago.
 */
export function announce(event) {
  if (!event) return null
  if (event.kind === 'reading') return { key: 'reading', values: { n: event.tiles ?? 0 } }
  if (event.kind === 'asking') return { key: 'asking', values: {} }
  if (event.kind === 'imported') {
    return { key: 'imported', values: { n: event.added ?? 0, known: event.known ?? 0 } }
  }
  return null
}
