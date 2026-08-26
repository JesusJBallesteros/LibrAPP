// Port of `query.py context`. A compact picture of a reader, for sending to a
// model alongside one of the prompts.
//
// Not the whole catalog, because a few hundred titles crowd out the question
// being asked. A recommender needs the shape of the collection, how it has
// moved, and enough named books to argue from.

import { representative } from './sample.js'

const YEAR_MS = 365.25 * 24 * 3600 * 1000

export const yearsSince = (iso, now = Date.now()) => {
  if (!iso) return null
  const then = Date.parse(iso)
  return Number.isNaN(then) ? null : (now - then) / YEAR_MS
}

/** Python's collections.Counter.most_common: by count, then insertion order. */
function mostCommon(values, limit) {
  const counts = new Map()
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1)
  const entries = [...counts.entries()].map((e, i) => [...e, i])
  entries.sort((a, b) => b[1] - a[1] || a[2] - b[2])
  return entries.slice(0, limit).map(([value, n]) => [value, n])
}

const describe = (book, names) => {
  const who = (book.authors || []).map((a) => names.get(a) || a).join(', ')
  // Naming the gap rather than printing a dash: this document is read by a
  // model, and a bare dash tells it nothing about why the author is missing.
  return `${book.title}  ·  ${who || book.author_label || 'author not recorded'}`
}

/**
 * One line about a book, carrying whatever is actually recorded.
 *
 * Absent fields are left out rather than written as unknown. A hundred lines
 * each saying "rating: none" costs real money on every request and tells a
 * model nothing it could not infer from the field being missing.
 */
const line = (book, names) => {
  const bits = []
  const genre = (book.tags || []).find((t) => t.kind === 'genre')?.value || book.genre
  if (genre) bits.push(genre)
  if (book.published_year) bits.push(String(book.published_year))
  if (book.pages) bits.push(`${book.pages}pp`)
  if (book.rating != null) bits.push(`rated ${book.rating}`)
  if (book.original_language) bits.push(`orig. ${book.original_language}`)
  if (book.read === true) bits.push('read')
  else if (book.read === false) bits.push('unread')
  if (book.favourite) bits.push('favourite')
  const tail = bits.length ? ` — ${bits.join(', ')}` : ''
  const note = book.notes ? `\n    note: ${book.notes}` : ''
  return `- ${describe(book, names)}${tail}${note}`
}

/** A count and a share, for the aggregate blocks. */
const share = (n, total) => (total ? `${n} (${Math.round((n / total) * 100)}%)` : `${n}`)

/** Buckets a set of numbers, so a spread can be stated without listing it. */
function spread(values, edges, labels) {
  const counts = labels.map(() => 0)
  for (const v of values) {
    let i = edges.findIndex((edge) => v < edge)
    if (i < 0) i = labels.length - 1
    counts[i] += 1
  }
  return labels.map((label, i) => [label, counts[i]]).filter(([, n]) => n > 0)
}

const tagValues = (books, kind) =>
  books.flatMap((b) => (b.tags || []).filter((t) => t.kind === kind).map((t) => t.value))

/**
 * The reader profile, as markdown.
 *
 * Follows the command-line output section for section, with one exception. The
 * loans section has no command-line counterpart, because lending is recorded in
 * the override layer and the Python tools do not read that layer.
 */
export function readerProfile(catalog, { recentYears = 2, now = Date.now(), sampleSize = 40 } = {}) {
  const books = catalog.books || []
  const names = new Map((catalog.authors || []).map((a) => [a.id, a.display_name]))

  const dated = books.filter((b) => b.acquired_on).sort((a, b) =>
    a.acquired_on < b.acquired_on ? -1 : a.acquired_on > b.acquired_on ? 1 : 0,
  )
  const quarter = Math.max(1, Math.floor(dated.length / 4))
  const early = dated.slice(0, quarter)
  const late = dated.slice(-quarter)
  const recent = dated.filter((b) => (yearsSince(b.acquired_on, now) ?? 99) <= recentYears)

  const topGenres = (subset) => {
    const top = mostCommon(tagValues(subset, 'genre'), 6)
    return top.length ? top.map(([v, n]) => `${v} (${n})`).join(', ') : '—'
  }

  const out = []
  out.push('# Reader profile', '')
  out.push(
    `Catalog of ${books.length} books by ${(catalog.authors || []).length} authors. ` +
      `${catalog.counts.read} read, ${catalog.counts.unread} explicitly unread, ` +
      `${catalog.counts.read_unknown} never recorded.`,
    '',
  )

  out.push('## What the collection is made of', '')
  for (const [value, n] of mostCommon(tagValues(books, 'genre'), 12)) out.push(`- ${value}: ${n}`)
  out.push('')

  out.push('## How it has moved', '')
  out.push(`- Earliest quarter of acquisitions: ${topGenres(early)}`)
  out.push(`- Most recent quarter: ${topGenres(late)}`)
  out.push('')

  out.push('## Most represented authors', '')
  for (const [aid, n] of mostCommon(books.flatMap((b) => b.authors || []), 12)) {
    const read = books.filter((b) => (b.authors || []).includes(aid) && b.read).length
    out.push(`- ${names.get(aid) || aid}: ${n} books, ${read} read`)
  }
  out.push('')

  out.push('## Recurring themes', '')
  const keywords = mostCommon(tagValues(books, 'keyword'), 30).filter(([, n]) => n > 1)
  out.push(keywords.map(([v]) => v).join(', '))
  out.push('')

  // What the shelf is like as objects, not as subjects. Cheap to state and
  // otherwise invisible: a model cannot tell a shelf of short novels from a
  // shelf of doorstops by their titles.
  const withPages = books.filter((b) => b.pages).map((b) => b.pages)
  const withYear = books.filter((b) => b.published_year).map((b) => b.published_year)
  const rated = books.filter((b) => b.rating != null).map((b) => b.rating)
  const languages = mostCommon(books.map((b) => b.original_language).filter(Boolean), 6)
  if (withPages.length || withYear.length || rated.length || languages.length) {
    out.push('## The shape of the shelf', '')
    if (withPages.length) {
      const lengths = spread(
        withPages,
        [200, 400, 700],
        ['under 200pp', '200 to 400pp', '400 to 700pp', 'over 700pp'],
      )
      out.push(`- Length, where recorded: ${lengths.map(([l, n]) => `${l} ${n}`).join(', ')}`)
    }
    if (withYear.length) {
      const eras = spread(
        withYear,
        [1900, 1970, 2000],
        ['before 1900', '1900 to 1970', '1970 to 2000', 'since 2000'],
      )
      out.push(`- First published: ${eras.map(([l, n]) => `${l} ${n}`).join(', ')}`)
    }
    if (rated.length) {
      const mean = rated.reduce((a, b) => a + b, 0) / rated.length
      out.push(`- Rated books: ${rated.length}, averaging ${mean.toFixed(1)} out of 5`)
    }
    if (languages.length) {
      out.push(`- Written originally in: ${languages.map(([l, n]) => `${l} (${n})`).join(', ')}`)
    }
    out.push('')
  }

  // What is recorded and what is not, so a model knows which silences mean
  // "no" and which mean "nobody has said". It also stops a recommendation
  // resting on a field that is blank across the whole shelf.
  out.push('## What the catalog records', '')
  for (const [label, field] of [
    ['acquisition date', 'acquired_on'],
    ['genre', 'genre'],
    ['page count', 'pages'],
    ['year first published', 'published_year'],
    ['rating', 'rating'],
    ['abstract', 'abstract'],
  ]) {
    const held = books.filter((b) => b[field] != null && b[field] !== '').length
    out.push(`- ${label}: ${share(held, books.length)}`)
  }
  out.push('')

  // A cross-section rather than the most recent purchases. Thirty newest
  // titles describe the last two years and imply the shelf began then.
  const sample = representative(books, sampleSize)
  out.push(`## A cross-section of the shelf (${sample.length} of ${books.length})`, '')
  out.push(
    'Chosen to match the shape of the collection, not the order it was bought in.',
    'Books the reader marked or wrote about are always included.',
    '',
  )
  for (const book of sample) out.push(line(book, names))
  out.push('')

  out.push(`## Bought in the last ${recentYears} years`, '')
  // Ties must compare equal, not just "not greater": Python keeps books bought
  // on the same day in the order they were already in, and a comparator that
  // never returns 0 quietly loses that.
  const newest = [...recent]
    .sort((a, b) => (a.acquired_on < b.acquired_on ? 1 : a.acquired_on > b.acquired_on ? -1 : 0))
    .slice(0, 15)
  for (const book of newest) {
    out.push(`- ${describe(book, names)} — ${book.acquired_on.slice(0, 4)}, ${book.read ? 'read' : 'unread'}`)
  }
  out.push('')

  out.push('## Owned but never read, longest waiting', '')
  const stale = books
    .filter((b) => b.read === false && b.acquired_on)
    .map((b) => [yearsSince(b.acquired_on, now), b])
    .sort((a, b) => (b[0] || 0) - (a[0] || 0))
    .slice(0, 15)
  for (const [age, book] of stale) {
    out.push(`- ${describe(book, names)} — bought ${Math.round(age)} years ago`)
  }

  // What the reader marked and what the reader wrote. Both outrank anything
  // inferred from the shape of the collection, so both are labelled plainly
  // enough that a model treats them as the reader's own opinion rather than as
  // catalog data. Only books that carry them appear: the profile is sent with
  // every request, and empty fields would be paid for on each one.
  const favourites = books.filter((b) => b.favourite)
  if (favourites.length) {
    out.push('')
    out.push('## Marked as favourites by the reader', '')
    out.push('The strongest statement of taste in this document.', '')
    for (const book of favourites) out.push(line(book, names))
  }

  const noted = books.filter((b) => b.notes)
  if (noted.length) {
    out.push('')
    out.push("## The reader's own notes on particular books", '')
    out.push('These are the reader\'s words, not a description of the book.', '')
    for (const book of noted) out.push(`- ${describe(book, names)}: ${book.notes}`)
  }

  // A recommendation should not suggest a book that is at a friend's house, and
  // a borrowed book is somebody else's regardless of what the shelf looks like.
  const lent = books.filter((b) => b.lent_to)
  const borrowedIn = books.filter((b) => b.borrowed_from)
  if (lent.length || borrowedIn.length) {
    out.push('')
    out.push('## Not on the shelf right now', '')
    for (const book of lent) {
      const when = book.lent_on ? ` on ${book.lent_on}` : ''
      out.push(`- ${describe(book, names)}: lent to ${book.lent_to}${when}`)
    }
    for (const book of borrowedIn) {
      const when = book.borrowed_on ? ` on ${book.borrowed_on}` : ''
      out.push(`- ${describe(book, names)}: borrowed from ${book.borrowed_from}${when}`)
    }
  }

  return out.join('\n') + '\n'
}
