// Port of tools/librapp/build_catalog.py. Merges any number of sources into one
// catalog.
//
// Records describing the same book are clustered across sources and become one
// entry owning every format it was found in. Where sources disagree, the more
// reliable source wins on matters of fact: a store export knows the acquisition
// date and a photograph cannot. Judgements such as genre are taken from
// whichever source recorded one.
//
// Ordering is fixed everywhere it appears. The Python original sorts by code
// point and relies on stable sorts and on `max` returning the first of equals.
// This does the same, so both implementations produce byte-identical catalogs
// and can be diffed against each other.

import { byCodePoint, rank } from './records.js'
import {
  TITLE_MATCH_THRESHOLD,
  UNCREDITED_MATCH_THRESHOLD,
  authorTokens,
  bestTitleScore,
  clean,
  detectSeries,
  fold,
  indexKeys,
  slugify,
  splitCredits,
  titleHead,
  titleKey,
  tokenKey,
} from './textmatch.js'

// A title standing in for a book nobody could identify, left behind by an
// earlier and worse photograph. Kept so the gap stays visible, never trusted.
//
// The bracketed elision is its own case. The first pattern only matches a title
// that is nothing but a bracketed note, so a title standing in for the half
// nobody could read and then carrying on, "[...] and Philosophy", read as a
// real title and was trusted at whatever its source claimed.
const PLACEHOLDER =
  /^\s*\[.*\]\s*$|\[\s*(?:\.{3}|…)\s*\]|not legible|partly legible|illegible/iu

// What a source writes in the author column when it has no author to give.
// A book can honestly have no personal author, which is what no_personal_author
// records; this is different, and means the column was filled with a word
// standing in for the answer.
const PLACEHOLDER_AUTHOR =
  /^\s*(?:reference|various|various authors|anon|anonymous|unknown|n\s*\/?\s*a|varios|varios autores|vv\.?\s*aa\.?|aa\.?\s*vv\.?|desconocido|autor desconocido)\s*$/iu

/** Whichever of two confidence values is the lower. */
const lower = (a, b) => (rank(a) <= rank(b) ? a : b)

const sortedUnique = (values) => [...new Set(values)].sort(byCodePoint)

/** Python's `max(iterable, key=…)`: the first of equals wins. */
function maxBy(items, key) {
  let best = null
  let bestScore = -Infinity
  for (const item of items) {
    const score = key(item)
    if (score > bestScore) {
      best = item
      bestScore = score
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

class AuthorIndex {
  constructor() {
    this.byTokens = new Map() // tokenKey -> entry
    this.remap = new Map()
  }

  add(name) {
    const cleaned = clean(name).replace(/^[\s,;]+|[\s,;]+$/g, '')
    const tokens = authorTokens(cleaned)
    if (!cleaned || tokens.size === 0) return null
    const key = tokenKey(tokens)
    const display = AuthorIndex.displayForm(cleaned)

    let entry = this.byTokens.get(key)
    if (!entry) {
      entry = {
        id: slugify(display),
        display_name: display,
        sort_name: AuthorIndex.sortForm(cleaned),
        aliases: [],
        _tokens: tokens,
      }
      this.byTokens.set(key, entry)
    }
    // 'Pratchett, Terry' and 'Terry Pratchett' are one spelling in two orders,
    // so only genuinely different wording is recorded as an alias.
    if (display !== entry.display_name && !entry.aliases.includes(display)) {
      entry.aliases.push(display)
    }
    return entry.id
  }

  /**
   * 'Pratchett, Terry' -> 'Terry Pratchett'; anything else left alone.
   * Only a single comma with words either side is treated as inverted; a name
   * with two commas is a compound the sources spell inconsistently.
   */
  static displayForm(name) {
    if ((name.match(/,/g) || []).length === 1) {
      const [surname, forename] = name.split(',')
      if (surname.trim() && forename.trim()) return `${forename.trim()} ${surname.trim()}`
    }
    return name
  }

  static sortForm(name) {
    if (name.includes(',')) return name
    const parts = name.split(' ').filter(Boolean)
    return parts.length > 1 ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}` : name
  }

  /**
   * Fold together spellings of one author that the sources disagree on.
   *
   * A name whose tokens are a less complete spelling of exactly one other
   * author is the same person: 'Plato' for 'Platon', or 'Lovecraft, H. P.'
   * against 'Howard Phillips Lovecraft'.
   *
   * A name matching two or more candidates is left alone. 'Shelley' can be
   * Mary or Percy, and merging would pick one at random.
   */
  mergeVariants() {
    const entries = [...this.byTokens.values()]
    const merges = []
    const order = entries
      .map((e, i) => [e, i])
      .sort((a, b) => (a[0]._tokens ? a[0]._tokens.size : 0) - (b[0]._tokens ? b[0]._tokens.size : 0) || a[1] - b[1])

    for (const [entry] of order) {
      const tokens = entry._tokens
      if (!tokens) continue
      const targets = entries.filter(
        (other) => other !== entry && other._tokens && AuthorIndex.isVariant(tokens, other._tokens),
      )
      if (targets.length !== 1) continue
      const target = targets[0]
      for (const spelling of [entry.display_name, ...entry.aliases]) {
        if (spelling !== target.display_name && !target.aliases.includes(spelling)) {
          target.aliases.push(spelling)
        }
      }
      merges.push({ merged: entry.display_name, into: target.display_name })
      this.remap.set(entry.id, target.id)
      entry._tokens = null
      this.byTokens.set(tokenKey(tokens), target)
    }
    return merges
  }

  /** True if `smaller` is a less complete spelling of `larger`. */
  static isVariant(smaller, larger) {
    if (smaller.size > larger.size) return false
    if (smaller.size === larger.size && [...smaller].every((t) => larger.has(t))) return false
    if ([...smaller].every((t) => larger.has(t))) return true // dropped initials
    // Every token is a prefix of some token in the fuller name, and long enough
    // that short words cannot carry a match on their own.
    return [...smaller].every((t) =>
      [...larger].some((o) => t === o || (t.length >= 4 && o.startsWith(t))),
    )
  }

  finalise() {
    const out = []
    const seen = new Set()
    for (const entry of this.byTokens.values()) {
      if (seen.has(entry.id)) continue // a merge target reached through several spellings
      seen.add(entry.id)
      const { _tokens, ...rest } = entry
      out.push(rest)
    }
    out.sort((a, b) => byCodePoint(fold(a.sort_name), fold(b.sort_name)))
    return out
  }
}

// ---------------------------------------------------------------------------
// Clustering
// ---------------------------------------------------------------------------

class Cluster {
  constructor(record) {
    this.records = [record]
    this.keys = new Set()
    this.index(record)
  }

  index(record) {
    for (const name of record.authors) for (const k of indexKeys(name)) this.keys.add(k)
  }

  add(record) {
    this.records.push(record)
    this.index(record)
  }

  sources() {
    return new Set(this.records.map((r) => r._source))
  }

  /**
   * How well a record fits this cluster, 0 if it cannot.
   *
   * Authors must agree before titles are compared. A title score on its own
   * merges two different books in the same series.
   */
  score(record) {
    if (this.sources().has(record._source)) return 0.0 // one source's rows are distinct books
    const candidateKeys = new Set()
    for (const name of record.authors) for (const k of indexKeys(name)) candidateKeys.add(k)

    // Neither side naming an author is not agreement. The title has to carry
    // the match alone, and is held to a higher standard.
    const uncredited = candidateKeys.size === 0 || this.keys.size === 0
    if (!uncredited) {
      let shares = false
      for (const k of candidateKeys) if (this.keys.has(k)) { shares = true; break }
      if (!shares) return 0.0
    }
    const floor = uncredited ? UNCREDITED_MATCH_THRESHOLD : TITLE_MATCH_THRESHOLD
    let best = 0
    for (const r of this.records) best = Math.max(best, bestTitleScore(record.title, r.title))
    return best >= floor ? best : 0.0
  }
}

/**
 * Group every record across every source into one cluster per book.
 * Sources are visited most-reliable first, so a cluster starts from the best
 * evidence available and weaker sources attach to it.
 */
function clusterRecords(sources) {
  const ordered = sources
    .map((s, i) => [s, i])
    .sort((a, b) => rank(b[0].source.confidence) - rank(a[0].source.confidence) || a[1] - b[1])
    .map(([s]) => s)

  const clusters = []
  const collapsed = []
  for (const source of ordered) {
    for (const record of source.records) {
      if (record.collapsed) {
        collapsed.push(record) // stands for a series, not a book
        continue
      }
      let best = null
      let bestScore = 0
      for (const cluster of clusters) {
        const score = cluster.score(record)
        if (score > bestScore) {
          best = cluster
          bestScore = score
        }
      }
      if (best) best.add(record)
      else clusters.push(new Cluster(record))
    }
  }
  return { clusters, collapsed }
}

/**
 * What collapsed rows can tell the volumes they stand for, keyed by author.
 *
 * An author may have more than one. Pratchett has Discworld and the Long
 * Earth, so each keeps its own entry and the volume chooses between them.
 */
function collapsedIndex(collapsed) {
  const out = new Map()
  for (const record of collapsed) {
    // The row's title lists the volumes as well as naming the series; only the
    // part before the first list separator is the name itself.
    let name = record.series || record.title.split(/[-–—;(]|vols?\./u)[0]
    name = name.replace(/^[\s,;]+|[\s,;]+$/g, '')
    const entry = {
      genre: record.genre,
      keywords: record.keywords,
      series: name.length >= 3 && name.length <= 60 ? name : null,
      listed: fold(`${record.title} ${record.listed_volumes || ''}`),
      record,
    }
    for (const author of record.authors) {
      for (const credit of splitCredits(author)) {
        const key = tokenKey(authorTokens(credit))
        if (!out.has(key)) out.set(key, [])
        out.get(key).push(entry)
      }
    }
  }
  return out
}

/**
 * Which of an author's collapsed rows, if any, stands for this book.
 *
 * A row that names the book wins. Where none does, a lone row still supplies a
 * genre, since one series carries one judgement. Several rows do not, because
 * picking between them would be a guess.
 */
function inheritedFrom(candidates, title) {
  if (!candidates || !candidates.length) return null
  const opening = titleHead(title).split(' ').filter(Boolean).slice(0, 5).join(' ')
  if (opening.split(' ').filter(Boolean).length >= 2) {
    for (const entry of candidates) if (entry.listed.includes(opening)) return entry
  }
  return candidates.length === 1 ? candidates[0] : null
}

// ---------------------------------------------------------------------------
// Building an entry
// ---------------------------------------------------------------------------

/**
 * The fullest title anyone recorded.
 *
 * A clipped title is a prefix of the true one, so a longer unclipped title from
 * any source repairs it. A spreadsheet can therefore fix what a store page cut
 * off mid-word.
 */
function pickTitle(cluster) {
  const whole = cluster.records.filter((r) => !r.title_clipped)
  if (whole.length) return [maxBy(whole, (r) => r.title.length).title, false]
  return [maxBy(cluster.records, (r) => r.title.length).title, true]
}

/**
 * Freeform genre and keyword strings as typed tags.
 *
 * The vocabulary is not controlled and sources mix levels of abstraction, so
 * the kind is recorded and normalisation is left to a later pass that can see
 * the whole distribution.
 */
export function splitTags(genre, keywords) {
  const tags = []
  const seen = new Set()
  for (const [kind, blob] of [
    ['genre', genre],
    ['keyword', keywords],
  ]) {
    for (const part of String(blob || '').split(/[,;/]| - /u)) {
      const value = part.trim()
      if (!value) continue
      const key = `${kind} ${fold(value)}`
      if (seen.has(key)) continue
      seen.add(key)
      tags.push({ kind, value, key: fold(value) })
    }
  }
  return tags
}

function buildEntry(cluster, collapsed, authors, ids) {
  const byRank = cluster.records
    .map((r, i) => [r, i])
    .sort((a, b) => rank(b[0].confidence) - rank(a[0].confidence) || a[1] - b[1])
    .map(([r]) => r)

  const firstFact = (field) => {
    for (const record of byRank) {
      const value = record[field]
      if (value !== null && value !== undefined && value !== '' && value !== false) return value
    }
    for (const record of byRank) if (record[field] !== null && record[field] !== undefined) return record[field]
    return null
  }
  const firstJudgement = (field) => {
    for (const record of byRank) if (record[field]) return record[field]
    return null
  }

  const [title, clipped] = pickTitle(cluster)

  // Every spelling seen goes into the index, so a shorter form on a spine
  // survives as an alias of the fuller one; the entry itself is credited from
  // the most reliable source that named anyone.
  for (const record of byRank) {
    for (const name of record.authors) for (const credit of splitCredits(name)) authors.add(credit)
  }
  const credits = byRank.find((r) => r.authors.length)?.authors || []
  const authorIds = credits
    .flatMap((n) => splitCredits(n))
    .map((c) => authors.add(c))
    .filter(Boolean)

  let genre = firstJudgement('genre')
  let keywords = firstJudgement('keywords')
  let series = firstFact('series')
  let seriesIndex = firstFact('series_index')
  if (!series) [series, seriesIndex] = detectSeries(title)

  const inherited = credits.length
    ? inheritedFrom(collapsed.get(tokenKey(authorTokens(credits[0]))), title)
    : null
  if (inherited) {
    genre = genre || inherited.genre
    keywords = keywords || inherited.keywords
    // The series name only covers volumes the row actually lists, otherwise a
    // standalone book by the same author is filed into it.
    const opening = titleHead(title).split(' ').filter(Boolean).slice(0, 5).join(' ')
    if (!series && opening.split(' ').filter(Boolean).length >= 2 && inherited.listed.includes(opening)) {
      series = inherited.series
    }
  }

  const formats = sortedUnique(cluster.records.flatMap((r) => r.formats))
  const flags = sortedUnique(cluster.records.flatMap((r) => r.flags))
  if (clipped) flags.push('title_clipped')
  if (!genre) flags.push('no_genre')
  if (!authorIds.length) flags.push('no_personal_author')
  const placeholder = PLACEHOLDER.test(title)
  if (placeholder) flags.push('placeholder')

  // A stand-in where the author should be. Judged on what the entry ends up
  // showing rather than on every record behind it, and by the same rule the
  // label itself follows below: a source that wrote "Varios" but lost the merge
  // to one that named the authors has been corrected, not tolerated, and the
  // finished entry is no less trustworthy for it.
  const shownAuthors = authorIds.length ? credits : [firstFact('author_label')]
  const standInAuthor =
    !placeholder && shownAuthors.some((name) => name && PLACEHOLDER_AUTHOR.test(String(name)))
  if (standInAuthor) flags.push('placeholder_author')

  const base = slugify(credits.length ? credits[0] : '', title)
  let entryId = base
  let n = 2
  while (ids.has(entryId)) entryId = `${base}-${n++}`
  ids.add(entryId)

  const readValue = byRank.find((r) => r.read !== null && r.read !== undefined)?.read ?? null

  return {
    id: entryId,
    title,
    title_key: titleKey(title),
    authors: authorIds,
    author_label: authorIds.length ? null : firstFact('author_label'),
    notes: firstFact('notes'),
    series,
    series_index: seriesIndex,
    formats,
    publisher: firstFact('publisher'),
    acquired_on: firstFact('acquired_on'),
    // Where the book is, when it is not on its shelf. These are usually written
    // by hand, and a correction reaches the entry after the build, which is why
    // the desk has always shown loans despite the builder dropping them. A
    // source is allowed to carry them too, and one that did was being ignored.
    lent_to: firstFact('lent_to'),
    lent_on: firstFact('lent_on'),
    borrowed_from: firstFact('borrowed_from'),
    borrowed_on: firstFact('borrowed_on'),
    read: readValue,
    collections: firstFact('collections'),
    devices: firstFact('devices'),
    update_available: Boolean(firstFact('update_available')),
    location: firstFact('location'),
    isbn: firstFact('isbn'),
    // Recalled by a model rather than read from a spine, and only present when
    // the extras checklist asked for them. They travel through the merge like
    // any other fact: the record with the highest confidence wins. Leaving them
    // out here was silently throwing away every answer the checklist paid for,
    // while the recalled_details flag on the record still arrived, so a book
    // could say it carried recalled details and show none.
    abstract: firstFact('abstract'),
    published_year: firstFact('published_year'),
    rating: firstFact('rating'),
    original_language: firstFact('original_language'),
    pages: firstFact('pages'),
    genre,
    tags: splitTags(genre, keywords),
    sources: [...cluster.sources()].sort(byCodePoint),
    // A source declares how far it is trusted, and until now that was the whole
    // of it: a tidy file said high and every row in it was high, however
    // implausible the row itself. The container is still what a source can
    // vouch for, so this only ever lowers, never raises.
    confidence: placeholder
      ? 'low'
      : lower(
          maxBy(cluster.records, (r) => rank(r.confidence)).confidence,
          standInAuthor ? 'medium' : 'high',
        ),
    flags: sortedUnique(flags),
  }
}

// ---------------------------------------------------------------------------

export function build(sources) {
  const { clusters, collapsed: collapsedRecords } = clusterRecords(sources)
  const collapsed = collapsedIndex(collapsedRecords)
  const authors = new AuthorIndex()
  const ids = new Set()

  const books = clusters.map((c) => buildEntry(c, collapsed, authors, ids))

  // A collapsed row whose volumes no source lists individually would otherwise
  // vanish, and a list-only build would lose a whole series without saying so.
  // A row counts as expanded only when the catalog holds a book the row names.
  // Sharing an author is not enough.
  const byAuthor = new Map()
  for (const book of books) {
    for (const aid of book.authors) {
      if (!byAuthor.has(aid)) byAuthor.set(aid, [])
      byAuthor.get(aid).push(book)
    }
  }

  const orphans = []
  for (const record of collapsedRecords) {
    const credits = record.authors
      .flatMap((name) => splitCredits(name))
      .map((n) => authors.add(n))
      .filter(Boolean)
    const siblings = credits.flatMap((c) => byAuthor.get(c) || [])
    const listed = fold(`${record.title} ${record.listed_volumes || ''}`)
    let expanded = siblings.some((b) => {
      const words = titleHead(b.title).split(' ').filter(Boolean)
      return words.length >= 2 && listed.includes(words.slice(0, 4).join(' '))
    })
    // A row naming no volumes at all is a placeholder for spines nobody could
    // read, and any book from that author appearing answers it.
    if (!expanded && siblings.length && PLACEHOLDER.test(record.title)) expanded = true
    if (expanded) continue

    const entry = buildEntry(new Cluster(record), new Map(), authors, ids)
    entry.flags = sortedUnique([...entry.flags, 'series_not_expanded'])
    books.push(entry)
    orphans.push({ title: record.title, source: record._source })
  }

  const authorMerges = authors.mergeVariants()
  for (const book of books) {
    book.authors = [...new Set(book.authors.map((a) => authors.remap.get(a) || a))]
  }

  books.sort((a, b) => {
    const ka = a.authors.length ? fold(a.authors[0]) : fold(a.title)
    const kb = b.authors.length ? fold(b.authors[0]) : fold(b.title)
    return (
      byCodePoint(ka, kb) ||
      byCodePoint(a.series || '', b.series || '') ||
      (a.series_index || 0) - (b.series_index || 0) ||
      byCodePoint(fold(a.title), fold(b.title))
    )
  })

  const authorList = authors.finalise()
  const multi = books.filter((b) => b.sources.length > 1)
  const formatCounts = {}
  for (const f of sortedUnique(books.flatMap((b) => b.formats))) {
    formatCounts[f] = books.filter((b) => b.formats.includes(f)).length
  }

  return {
    generated_at: new Date().toISOString().replace(/\.\d+Z$/, '+00:00'),
    sources: sources.map((s) => s.source),
    counts: {
      books: books.length,
      authors: authorList.length,
      by_format: formatCounts,
      in_multiple_sources: multi.length,
      read: books.filter((b) => b.read === true).length,
      unread: books.filter((b) => b.read === false).length,
      read_unknown: books.filter((b) => b.read === null || b.read === undefined).length,
    },
    books,
    authors: authorList,
    review: {
      author_variants_merged: authorMerges,
      matched_across_sources: multi.map((b) => ({ title: b.title, sources: b.sources })),
      series_not_expanded: orphans,
      clipped_titles: books.filter((b) => b.flags.includes('title_clipped')).map((b) => b.title),
      low_confidence: books
        .filter((b) => b.confidence === 'low')
        .map((b) => ({ title: b.title, sources: b.sources })),
      no_genre: books.filter((b) => b.flags.includes('no_genre')).map((b) => b.title),
    },
  }
}
