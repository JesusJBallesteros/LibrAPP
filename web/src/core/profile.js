// Port of `query.py context` — a compact picture of a reader, for handing to a
// model alongside one of the prompts.
//
// Deliberately not the whole catalog: a few hundred titles crowd out the
// question being asked. What a recommender needs is the shape of the collection
// and how it has moved, plus enough named books to argue from.

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
  return `${book.title}  ·  ${who || book.author_label || '—'}`
}

const tagValues = (books, kind) =>
  books.flatMap((b) => (b.tags || []).filter((t) => t.kind === kind).map((t) => t.value))

/**
 * The reader profile, as markdown.
 *
 * Reproduces the command-line output line for line, so a profile assembled in
 * the app and one assembled in a terminal are the same document.
 */
export function readerProfile(catalog, { recentYears = 2, now = Date.now() } = {}) {
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

  out.push(`## Bought in the last ${recentYears} years`, '')
  // Ties must compare equal, not just "not greater": Python keeps books bought
  // on the same day in the order they were already in, and a comparator that
  // never returns 0 quietly loses that.
  const newest = [...recent]
    .sort((a, b) => (a.acquired_on < b.acquired_on ? 1 : a.acquired_on > b.acquired_on ? -1 : 0))
    .slice(0, 30)
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

  return out.join('\n') + '\n'
}
