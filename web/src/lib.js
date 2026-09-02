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
 * The fields on a book that only the reader can fill, and has not.
 *
 * Read state, a loan and a note are the three things no import can supply:
 * a spreadsheet, a store export and a barcode lookup all describe the book,
 * and none of them knows whether it was read, who has it or what was thought
 * of it. A field the app never asks about is a field that stays empty, so the
 * book's own card asks.
 *
 * Only what is absent, and "absent" is read strictly. An unread book has a
 * recorded read state and is not listed; a borrowed book has a recorded loan,
 * in the other direction, and is not listed either.
 */
export const stillToRecord = (book) =>
  [
    readState(book) === 'unknown' && 'read',
    !lentOut(book) && !borrowed(book) && 'lent_to',
    !String(book?.notes || '').trim() && 'notes',
  ].filter(Boolean)

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

/**
 * The band a book falls into under the current sort, or null.
 *
 * A letter for the two alphabetical sorts, a year for the two by date. The
 * point is the same either way: a reader scanning a long list can see where one
 * run ends and the next begins, and jump to roughly the right place.
 *
 * Reads the folded sort keys the catalog already computed, so the band matches
 * the order exactly rather than being worked out again from the display text.
 * That matters most for authors, where the row shows a given name and the list
 * is ordered by surname.
 */
export function sortBand(book, sort) {
  if (sort === 'acquired' || sort === 'oldest') {
    return book?.acquired_on ? String(book.acquired_on).slice(0, 4) : null
  }
  const key = sort === 'author' ? book?._author : book?._title
  const first = String(key || '').trim().charAt(0)
  if (!first) return null
  const upper = first.toUpperCase()
  // Digits and punctuation share one band rather than each starting their own.
  return /[A-Z]/.test(upper) ? upper : '#'
}

/**
 * The same books, with a band marker before each run.
 *
 * Returns a flat list so the view can render it in one pass. A marker carries
 * no book and a book carries no marker, which keeps the two apart in the
 * markup as well.
 */
export function withBands(books, sort) {
  const out = []
  let last = null
  for (const book of books) {
    const band = sortBand(book, sort)
    if (band !== null && band !== last) {
      out.push({ band })
      last = band
    }
    out.push({ book })
  }
  return out
}

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

// The thinnest a spine may be drawn, in pixels, and it is the content that
// sets it rather than any book: one line of title at the size every spine uses,
// with the read stamp at its foot, and room to sit in. Nothing gets narrower
// than this however short it is, because below it the spine stops being
// readable and starts being a rule.
const FLOOR = 34

// And the widest, which is a decision about the shelf rather than about books.
// A thousand-page book really is ten times the thickness of a hundred-page one,
// and drawn that way one volume would take a row to itself. Two and a bit times
// reads as much thicker without the wall becoming about one book.
const CEILING = 76

// Between these two the width is proportional. Outside them it is flat: under a
// hundred pages the content floor has already been reached, and over a thousand
// the difference has stopped being legible anyway.
const FEW = 100
const MANY = 1000

// What a book with no page count gets. Not the middle of the scale, which would
// draw it as a five-hundred-page book, but the width of an unremarkable one.
const UNKNOWN = 42

/**
 * How thick to draw the spine, in pixels.
 *
 * From the page count, which is the only honest measure of thickness a catalog
 * holds, and in proportion to it rather than in bands. A shelf of real books
 * has as many thicknesses as it has books, and three widths made a wall of
 * them look sorted into sizes.
 *
 * A book with no page count is drawn at a fixed unremarkable width: not because
 * it is average, but because nothing is known, and drawing it thin or thick
 * would be inventing a fact about the book.
 */
export function spineWidth(book) {
  const pages = Number(book?.pages)
  if (!Number.isFinite(pages) || pages <= 0) return UNKNOWN
  const held = Math.min(Math.max(pages, FEW), MANY)
  return Math.round(FLOOR + ((held - FEW) / (MANY - FEW)) * (CEILING - FLOOR))
}

/** Whether a spine's width came from a recorded page count or from not knowing. */
export const spineMeasured = (book) => {
  const pages = Number(book?.pages)
  return Number.isFinite(pages) && pages > 0
}

/**
 * How tall to draw the spine, in pixels.
 *
 * From the length of the title, which is decoration and says so: a taller spine
 * means a longer name, not a bigger book. Thickness is where the real measure
 * went, since a page count is a fact about the book and a title is not.
 *
 * Clamped to a band, so a book with a subtitle and two colons does not tower
 * over the shelf. Past the top of the band the title wraps to a second line
 * across the spine instead of making it taller.
 */
export function spineHeight(book, { min = 150, max = 250 } = {}) {
  const length = String(book?.title || '').length
  const span = Math.min(Math.max(length, 4), 60)
  return Math.round(min + ((span - 4) / 56) * (max - min))
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
