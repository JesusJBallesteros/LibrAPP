// Filling in what the catalog does not know.
//
// Extras are offered once, while a shelf photograph is being read. Anything not
// ticked then is lost until the photograph is read again, which for a catalog
// built from a spreadsheet never happens at all. This is the general way to ask
// for the same fields later.
//
// Every value it produces is recalled by a model rather than read from a source,
// so nothing here writes directly. The reply is parsed, shown, and only written
// through the override layer if somebody accepts it, which is what makes each
// one visible under Corrections and undoable one at a time.

import { EXTRAS } from './extras.js'

/** The fields this can fill: the recalled half of the extras checklist. */
export const FILLABLE = EXTRAS.filter((e) => e.kind === 'recalled').map((e) => e.field)

/** How many books are missing each field. */
export function gapsByField(books, fields = FILLABLE) {
  const counts = {}
  for (const field of fields) {
    counts[field] = books.filter((b) => b[field] == null || b[field] === '').length
  }
  return counts
}

/**
 * The books to ask about: those missing at least one of the chosen fields.
 *
 * Capped, because the cost of this request scales with the number of books and
 * a catalog of eight hundred would produce a request nobody meant to send. The
 * cap is applied after sorting, so running it twice works through the shelf in
 * a stable order rather than asking about the same books again.
 */
export function booksNeeding(books, fields, { limit = 60 } = {}) {
  const missing = books.filter((b) => fields.some((f) => b[f] == null || b[f] === ''))
  const ranked = [...missing].sort((a, b) => {
    // Books the reader has spoken about first: a note or a star means this is
    // one they care to have complete.
    const spoke = (x) => (x.favourite ? 2 : 0) + (x.notes ? 1 : 0)
    return spoke(b) - spoke(a) || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
  })
  return ranked.slice(0, limit)
}

/**
 * The request text.
 *
 * Each book carries its id, so the reply can be matched back without guessing
 * from a title that a model may have tidied on the way through. Titles and
 * authors go out because the model needs them to recognise the book at all;
 * nothing else does.
 */
export function buildRequest(books, fields, names, promptText) {
  const wanted = fields.filter((f) => FILLABLE.includes(f))
  const lines = ['## Books to fill in', '']
  for (const book of books) {
    const who = (book.authors || []).map((a) => names.get(a) || a).join(', ')
    const gaps = wanted.filter((f) => book[f] == null || book[f] === '')
    lines.push(
      `- id: ${book.id}`,
      `  title: ${book.title}`,
      `  author: ${who || book.author_label || 'not recorded'}`,
      `  missing: ${gaps.join(', ')}`,
    )
  }
  return [
    promptText.trim(),
    '\n---\n',
    `## Fields asked for\n\n${wanted.join(', ')}`,
    '\n---\n',
    lines.join('\n'),
  ].join('\n')
}

export class GapsError extends Error {}

const FIELD_TYPE = {
  abstract: (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
  published_year: (v) => (Number.isInteger(v) && v > 0 && v <= 2200 ? v : null),
  rating: (v) => (typeof v === 'number' && v >= 0 && v <= 5 ? Math.round(v * 10) / 10 : null),
  original_language: (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
  pages: (v) => (Number.isInteger(v) && v > 0 && v < 20000 ? v : null),
}

/**
 * Turn a reply into changes, keeping only what is usable.
 *
 * A value of the wrong type, a field nobody asked for, an id that is not in the
 * catalog, or a value for a field that is already filled are all dropped rather
 * than argued with. The point is to never write something the reader did not
 * ask for and cannot see, so anything doubtful is discarded and counted.
 */
export function parseReply(text, { books, fields }) {
  let payload
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start < 0 || end < start) throw new Error('no object')
    payload = JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new GapsError('reply was not JSON')
  }

  const rows = Array.isArray(payload.books) ? payload.books : null
  if (!rows) throw new GapsError('reply had no books array')

  const byId = new Map(books.map((b) => [b.id, b]))
  const wanted = fields.filter((f) => FILLABLE.includes(f))
  const proposals = []
  let ignored = 0

  for (const row of rows) {
    const book = byId.get(row?.id)
    if (!book) {
      ignored += 1
      continue
    }
    const set = {}
    for (const field of wanted) {
      if (!(field in row)) continue
      // Never overwrite something already recorded. This fills gaps; a value
      // that is already there came from somewhere and is not this to replace.
      if (book[field] != null && book[field] !== '') continue
      const value = FIELD_TYPE[field](row[field])
      if (value != null) set[field] = value
    }
    if (Object.keys(set).length) proposals.push({ id: book.id, title: book.title, set })
    else ignored += 1
  }

  return { proposals, ignored }
}

/**
 * What a reply amounts to, in counts.
 *
 * The raw document is JSON and shows a reader nothing they can weigh: a wall of
 * braces beside a list of the same books. What is worth knowing before keeping
 * any of it is how many books are affected and which fields were actually
 * answered, since a request asking for five fields commonly comes back with
 * three of them and no explanation.
 */
export function summarise(proposals = []) {
  const byField = new Map()
  for (const row of proposals) {
    for (const field of Object.keys(row.set || {})) {
      byField.set(field, (byField.get(field) || 0) + 1)
    }
  }
  return {
    books: proposals.length,
    values: [...byField.values()].reduce((a, b) => a + b, 0),
    // Largest first, so the field the request mostly succeeded at leads. Ties
    // by name, so the same reply always reads the same way.
    fields: [...byField.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .map(([field, n]) => ({ field, n })),
  }
}

/**
 * Why a book was changed, recorded with the correction itself.
 *
 * The shelf path marks a recalled book with a flag on its source record, but a
 * flag is not an editable field and cannot travel through an override. The
 * override layer carries a reason instead, which is shown in the correction
 * notice on the book and in the Corrections list, and that is the better place
 * for it: it is attached to the specific change rather than to the whole book,
 * so undoing one correction takes its provenance with it.
 */
export const WHY = 'Recalled by a model at the desk, not read from any source.'
