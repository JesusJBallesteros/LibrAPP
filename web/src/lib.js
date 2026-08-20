// Small shared helpers. The rules about what the catalog *means* live here so
// the views cannot quietly disagree with each other about them.

/** Comparison form: accents and punctuation removed. Never shown to anyone. */
export const fold = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** `read` is three-valued, and the third value is not a shade of "no". */
export const readState = (book) =>
  book.read === true ? 'read' : book.read === false ? 'unread' : 'unknown'

export const READ_LABEL = {
  read: 'read',
  unread: 'unread',
  unknown: 'not recorded',
}

export function authorNames(catalog) {
  const byId = new Map()
  for (const a of catalog?.authors || []) byId.set(a.id, a)
  return byId
}

export function byline(book, authors) {
  const names = (book.authors || []).map((id) => authors.get(id)?.display_name || id)
  if (names.length) return names.join(', ')
  return book.author_label || '—'
}

/** Surname first, for sorting people the way a shelf does. */
export function sortName(book, authors) {
  const first = (book.authors || [])[0]
  return fold(authors.get(first)?.sort_name || book.author_label || book.title)
}

export const yearsSince = (iso) => {
  if (!iso) return null
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return null
  return (Date.now() - then) / (365.25 * 24 * 3600 * 1000)
}

/**
 * Books bought and never opened, worst first.
 *
 * Mirrors `query.py forgotten`: only books *known* to be unread are eligible,
 * because a book nobody ever recorded reading is unknown, not unread - and
 * treating the two alike would bury the list under books already finished.
 * Age is weighted by evidence of intent at the time: filing a book into a
 * collection, or pushing it to several devices, is a record of wanting it that
 * a purchase date alone is not.
 */
export function forgotten(books, minYears = 2) {
  return books
    .filter((b) => b.read === false && b.acquired_on)
    .map((b) => {
      const age = yearsSince(b.acquired_on)
      const intent = 0.5 * (b.devices || 0) + 1.0 * (b.collections || 0)
      return { book: b, age, intent, score: (age || 0) * (1 + intent) }
    })
    .filter((row) => row.age !== null && row.age >= minYears)
    .sort((a, b) => b.score - a.score)
}

export function intentWhy({ book }) {
  const bits = []
  if (book.collections) {
    bits.push(`filed in ${book.collections} collection${book.collections > 1 ? 's' : ''}`)
  }
  if (book.devices) bits.push(`on ${book.devices} device${book.devices > 1 ? 's' : ''}`)
  return bits.join(', ')
}

export const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort()

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
