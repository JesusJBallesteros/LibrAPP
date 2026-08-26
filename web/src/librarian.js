// What the LibrAPPrian has to say, and when.
//
// Every line is computed from the catalog the app already holds. The owl never
// states anything it cannot count, which is the whole reason it is allowed to
// speak at all: a friendly voice that occasionally invents a fact is worse than
// no voice.
//
// This module decides only which observation applies. The wording lives in the
// dictionaries and the drawing lives in the component, so a line can be
// retranslated or restyled without touching the rule that chose it.

import { onLoan, readState } from './lib.js'

/** A loan is worth mentioning once it has been out this long. */
export const LONG_LOAN_YEARS = 1

/**
 * The one thing worth saying here, or null.
 *
 * Ordered by how much it asks of the reader rather than by view. A book
 * belonging to somebody else outranks an unread pile, because one is an
 * obligation and the other is only an opportunity.
 *
 * Returns a key and its values rather than a sentence, so the tests can check
 * the rule without reading the dictionary, and `action` names where the line
 * would take you if followed.
 */
export function observe({ view, counts = null, books = [], hasCatalog = false } = {}) {
  if (!hasCatalog) return { key: 'empty', values: {}, action: { key: 'startPhoto', view: 'shelf' } }

  const long = (kind) =>
    onLoan(books, kind).filter((row) => row.age !== null && row.age >= LONG_LOAN_YEARS)

  if (view === 'catalog' || view === 'home') {
    const owed = long('borrowed')
    if (owed.length) {
      return {
        key: 'borrowedLong',
        values: { n: owed.length },
        action: { key: 'showBorrowed', view: 'catalog', focus: { loan: 'borrowed' } },
      }
    }
    const out = long('lent')
    if (out.length) {
      return {
        key: 'lentLong',
        values: { n: out.length },
        action: { key: 'showLent', view: 'catalog', focus: { loan: 'lent' } },
      }
    }
  }

  if (view === 'home') {
    return { key: 'welcome', values: { n: counts?.books ?? books.length }, action: null }
  }

  if (view === 'catalog') {
    const unread = counts?.unread ?? books.filter((b) => readState(b) === 'unread').length
    if (unread > 0) {
      return {
        key: 'unread',
        values: { n: unread },
        action: { key: 'showOldest', view: 'catalog', focus: { read: 'unread', sort: 'oldest' } },
      }
    }

    // No unread books is not the same as every book read. A catalog built from
    // a photograph records no read state at all, and calling that "all read"
    // would be the owl inventing the one fact it is not allowed to invent.
    const unknown = counts?.read_unknown ?? books.filter((b) => readState(b) === 'unknown').length
    if (unknown > 0) {
      return {
        key: 'unrecorded',
        values: { n: unknown },
        action: { key: 'showUnrecorded', view: 'catalog', focus: { read: 'unknown' } },
      }
    }

    const read = counts?.read ?? books.filter((b) => readState(b) === 'read').length
    if (read > 0) return { key: 'allRead', values: {}, action: null }
    return null
  }

  if (view === 'desk') return { key: 'desk', values: { n: counts?.books ?? books.length }, action: null }
  if (view === 'shelf') return { key: 'shelf', values: {}, action: null }
  if (view === 'list') return { key: 'list', values: {}, action: null }
  if (view === 'storage') return { key: 'storage', values: {}, action: null }

  // About has no owl, by decision: it is the page where the app explains
  // itself, and a character talking over that explanation reads badly.
  return null
}

/**
 * A line about something happening right now, which outranks the observation.
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
