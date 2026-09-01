// Filling a book in from its title and its author, when it has no number.
//
// The ISBN route asks a precise question: this exact edition, what do you know
// about it. This one asks a vague one, and gets a vague answer. Open Library's
// search returns whatever ranks highest for the words it was given, and it
// always returns something. Taking the first hit would fill a shelf with facts
// about books nobody owns.
//
// So the answer is judged before it is offered, with the same rules the catalog
// uses to decide whether two records are the same book. A hit whose title does
// not score against the one asked for is not a match. A hit whose author shares
// no name with the one asked for is not a match either. And where the reader's
// record names no author at all, only the same title will do: the clusterer's
// tolerance for a near-identical one is tuned for two records off a single
// shelf, where a near miss usually is the same book. Against every book ever
// published it is not. "Beowulf and Grendel" scores 0.97 against "Beowulf",
// and they are two different works.
//
// What comes back fills gaps and nothing else. The title and the authors
// written into the record are the reader's own, not the ones the service
// returned: they are what the book is called on this shelf, they are what makes
// the record join the book it belongs to, and a search is not evidence that a
// title was written down wrong.

import { TITLE_MATCH_THRESHOLD, authorTokens, bestTitleScore, titleHead } from '../core/textmatch.js'

/** The one source every search is written into, so undoing it is deleting it. */
export const SEARCH_SOURCE = 'search'

/**
 * How many books one press will ask about.
 *
 * Open Library is a free service run by a charity and this is one request per
 * book, where the ISBN route is one per fifty. A press does a hundred, says so,
 * and can be pressed again; a run over a library of twelve hundred is a
 * decision somebody should take twelve times rather than once by accident.
 */
export const SEARCH_CAP = 100

/** Between one request and the next. Courtesy, not a requirement. */
export const SEARCH_PACE = 250

// The fields worth having back. Asking for fewer is faster for them as well as
// for us, and the search endpoint returns a great deal by default.
const FIELDS = [
  'key',
  'title',
  'author_name',
  'first_publish_year',
  'number_of_pages_median',
  'publisher',
  'subject',
  'edition_count',
].join(',')

/**
 * A title as it should be asked about.
 *
 * An ebook title carries its edition in brackets: "(Spanish Edition)",
 * "(S.F. MASTERWORKS Book 115)". Those words are about the printing rather than
 * the book, and they are noise in a search for the work.
 */
export const searchable = (title) =>
  String(title ?? '')
    .replace(/\s*[([][^)\]]*[)\]]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function searchUrl(title, author) {
  const params = new URLSearchParams({ title: searchable(title), limit: '5', fields: FIELDS })
  if (author) params.set('author', author)
  return `https://openlibrary.org/search.json?${params}`
}

/** Subjects, minus the shelving labels that describe a catalogue rather than a book. */
const NOT_A_SUBJECT = /^(accessible book|protected daisy|in library|overdrive|large type|open library)/i

/**
 * The best of what came back, or nothing.
 *
 * Nothing is the important half. A search that finds no match is a book this
 * cannot help with, and saying so is worth more than a confident wrong answer
 * about a book the reader will never check.
 */
export function bestMatch(docs, book) {
  const wanted = searchable(book.title)
  const mine = new Set(
    (book.authors || []).flatMap((name) => [...authorTokens(name)].filter((t) => t.length >= 3)),
  )

  let best = null
  for (const doc of docs || []) {
    if (!doc?.title) continue
    const score = bestTitleScore(wanted, doc.title)
    if (score < TITLE_MATCH_THRESHOLD) continue
    // With no author to check against, the title carries the whole decision and
    // a score will not do. The same title, subtitle aside, or nothing.
    if (!mine.size && titleHead(wanted) !== titleHead(doc.title)) continue
    if (mine.size) {
      const theirs = new Set(
        (doc.author_name || []).flatMap((name) => [...authorTokens(name)].filter((t) => t.length >= 3)),
      )
      if (![...mine].some((token) => theirs.has(token))) continue
    }
    // Where two survive, the one the world has printed most often is the one
    // most likely to be the book in somebody's hands.
    const weight = score + Math.min(doc.edition_count || 0, 50) / 1000
    if (!best || weight > best.weight) best = { doc, score, weight }
  }
  return best ? { doc: best.doc, score: best.score } : null
}

/**
 * A match as a source record.
 *
 * Title and authors are the reader's own. Everything else is what was found,
 * and only where the reader had nothing: this fills gaps, and the builder is
 * what decides between two sources that both say something.
 *
 * No ISBN. The search answers about a work and hands back the numbers of every
 * edition of it, and choosing one of those would be inventing an answer to a
 * question nobody asked.
 */
export function toSearchRecord(book, doc, { subjects = 8 } = {}) {
  const keywords = (doc.subject || [])
    .filter((name) => name && !NOT_A_SUBJECT.test(name))
    .slice(0, subjects)

  return {
    title: book.title,
    authors: [...(book.authors || [])],
    published_year: Number.isInteger(doc.first_publish_year) ? doc.first_publish_year : null,
    pages: Number.isInteger(doc.number_of_pages_median) ? doc.number_of_pages_median : null,
    publisher: (doc.publisher || [])[0] || null,
    keywords: keywords.length ? keywords.join(', ') : null,
  }
}

export class SearchError extends Error {}

/**
 * Ask about each book in turn.
 *
 * One at a time and paced, because this is a request per book against somebody
 * else's free service. A book the search cannot place comes back in `missing`
 * rather than as a failure: a shelf where forty are unknown is still a shelf
 * where the rest are known.
 */
export async function searchOne(book, { fetcher = fetch, signal } = {}) {
  const author = (book.authors || [])[0] || ''
  const response = await fetcher(searchUrl(book.title, author), { signal })
  if (!response.ok) throw new SearchError(`the search answered ${response.status}`)
  const payload = await response.json()
  const match = bestMatch(payload?.docs, book)
  return match ? { ...match, record: toSearchRecord(book, match.doc) } : null
}

export async function searchMany(books, { fetcher = fetch, signal, onProgress, pace = SEARCH_PACE } = {}) {
  const found = []
  const missing = []
  let done = 0

  for (const book of books) {
    if (signal?.aborted) break
    try {
      const hit = await searchOne(book, { fetcher, signal })
      if (hit) found.push({ book, ...hit })
      else missing.push(book)
    } catch (err) {
      if (err?.name === 'AbortError') throw err
      // One book the service would not answer about is not a reason to lose
      // the ninety-nine it did.
      missing.push(book)
    }
    done += 1
    onProgress?.({ done, total: books.length })
    if (pace && done < books.length) await new Promise((wait) => setTimeout(wait, pace))
  }

  return { found, missing }
}
