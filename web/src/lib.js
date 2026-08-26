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

export function authorNames(catalog) {
  const byId = new Map()
  for (const a of catalog?.authors || []) byId.set(a.id, a)
  return byId
}

/**
 * Who wrote it, or null when nothing says.
 *
 * Null rather than a dash, so the caller can name the gap in the reader's own
 * language instead of printing a mark that could mean anything.
 */
export function byline(book, authors) {
  const names = (book.authors || []).map((id) => authors.get(id)?.display_name || id)
  if (names.length) return names.join(', ')
  return book.author_label || null
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

/** A book that is out of the house, or null. */
export const lentOut = (book) =>
  book?.lent_to ? { who: book.lent_to, since: book.lent_on ?? null } : null

/** A book that belongs to somebody else, or null. */
export const borrowed = (book) =>
  book?.borrowed_from ? { who: book.borrowed_from, since: book.borrowed_on ?? null } : null

/**
 * Books away from their shelf, longest gone first.
 *
 * Undated loans sort last rather than being dropped. Knowing a book is with
 * someone matters even when the date was never recorded.
 */
export function onLoan(books, kind = 'lent') {
  const read = kind === 'lent' ? lentOut : borrowed
  return books
    .map((book) => {
      const loan = read(book)
      return loan && { book, who: loan.who, age: yearsSince(loan.since) }
    })
    .filter(Boolean)
    .sort((a, b) => (b.age ?? -1) - (a.age ?? -1))
}

/**
 * Which of the filters behind the catalog disclosure are narrowing the list.
 *
 * Group, Read and Sort stay on screen and explain themselves. Sort narrows
 * nothing. A tag filter arrives from the desk rather than from the toolbar and
 * is reported on its own.
 */
export const hiddenActiveFilters = ({
  format = 'all',
  source = 'all',
  loan = 'all',
  favourite = 'all',
} = {}) =>
  [
    ['format', format !== 'all'],
    ['source', source !== 'all'],
    ['loan', loan !== 'all'],
    ['favourite', favourite !== 'all'],
  ]
    .filter(([, on]) => on)
    .map(([name]) => name)

/* -------------------------------------------------------------- spines -- */

/**
 * A number in 0..(range-1) that a given id always maps to.
 *
 * The point is that a spine keeps its colour. Anything derived from position
 * would reshuffle the wall every time a filter changes, which would make the
 * colours look meaningful when they are not.
 */
export function spineHash(id, range) {
  let h = 2166136261
  for (const ch of String(id ?? '')) {
    h ^= ch.codePointAt(0)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % range
}

/** 1..8, matching the --spine-N custom properties. */
export const spineTint = (book) => spineHash(book?.id, 8) + 1

/** A physical book gets a wider spine, because on a shelf it would. */
export const spineWidth = (book) => ((book?.formats || []).includes('physical') ? 34 : 26)

/**
 * How tall to draw the spine, in pixels.
 *
 * A page count is the honest input, and a book has one only where somebody
 * asked for it while reading a photograph. Where there is none the height comes
 * from the length of the title instead, which is decoration rather than data.
 * A wall can therefore mix the two, which is why its caption says both rules
 * apply rather than claiming one.
 *
 * Both scales are clamped to the same band, so a long book and a long title
 * never make a spine that towers over the shelf.
 */
export function spineHeight(book, { min = 150, max = 250 } = {}) {
  const pages = Number(book?.pages)
  if (Number.isFinite(pages) && pages > 0) {
    const span = Math.min(Math.max(pages, 80), 900)
    return Math.round(min + ((span - 80) / 820) * (max - min))
  }
  const length = String(book?.title || '').length
  const span = Math.min(Math.max(length, 4), 60)
  return Math.round(min + ((span - 4) / 56) * (max - min))
}

/** Whether a spine's height came from a recorded page count or from its title. */
export const spineMeasured = (book) => {
  const pages = Number(book?.pages)
  return Number.isFinite(pages) && pages > 0
}

/**
 * A shelf mark for the detail card, or null.
 *
 * Built from the author's sort name and the year the book was acquired, both
 * of them recorded rather than invented. A book with no author recorded gets
 * no mark: sortName falls back to the title, and a call number derived from a
 * title would look like a real classification and be nothing of the kind.
 */
export function callNumber(book, authors) {
  const first = (book?.authors || [])[0]
  const name = authors?.get?.(first)?.sort_name || book?.author_label
  if (!name) return null
  const letters = fold(name).replace(/[^a-z]/g, '').slice(0, 3).toUpperCase()
  if (!letters) return null
  const year = book?.acquired_on ? String(book.acquired_on).slice(0, 4) : null
  return year ? `${letters} ${year}` : letters
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
