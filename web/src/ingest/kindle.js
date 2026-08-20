// Port of tools/librapp/parse_kindle.py — read an Amazon 'Manage Your Content
// and Devices' print-to-PDF.
//
// The page renders one block per item:
//
//     <title, possibly wrapped over several lines, possibly UI-truncated>
//     <author[, author][, publisher]>
//     Acquired on <D Month YYYY>
//     [In N Collection(s)]
//     [In N Device(s)  |  N Device(s)]
//     [READ]
//     [Update available]
//     Deliver or remove from device
//     Delete
//     More actions
//
// Two properties of the source make naive parsing lose records:
//
//   * The print splits blocks across page breaks. A record's title and author
//     can sit at the foot of one page while its 'Acquired on' line opens the
//     next, and the break leaves half-rendered fragments behind ('a ques Go',
//     'Ale'). The document is therefore flattened into one continuous line
//     stream first.
//   * Titles are clipped by the web UI to a fixed pixel width, mid-word and
//     with no ellipsis. Nothing here can recover them; they are flagged for the
//     merge, which repairs them from any source that has them whole.
//
// Blocks are delimited by the 'More actions' line closing every record. Within
// a block, 'Acquired on' is the anchor: the only line guaranteed present and
// unambiguous.

import { clean } from '../core/textmatch.js'

const ACQUIRED_RE = /^Acquired on\s+(\d{1,2}\s+\S+\s+\d{4})\s*$/u
const COLLECTIONS_RE = /^(?:In\s+)?(\d+)\s+Collections?$/u
const DEVICES_RE = /^(?:In\s+)?(\d+)\s+Devices?$/u
const SHOWING_RE = /^Showing\s+\d+\s+to\s+\d+\s+of\s+(\d+)\s+items$/u

const RECORD_END = 'More actions'
const FOOTER_START = 'Back to top'

// Page chrome: never part of a record, but kept in the stream as boundaries so
// a record split across a page break is not glued to its neighbour.
const CHROME = new Set([
  'Deliver or remove from device', 'Delete', 'Select All', 'Deselect All',
  'Digital Content', 'View: Books', 'All', 'Sort by: Author: A-Z',
  'Search your content', 'Go', 'Deliver to device', 'Mark as Read',
  'Mark as Unread', 'Add to Collections',
])

// Icon glyphs from the page webfont land in the text layer as private-use
// codepoints. They carry no information and would otherwise prefix titles.
const PUA_RE = /[-]/gu

// A real title or author always contains a word of three or more letters.
const WORD_RE = /\p{L}{3,}/u

// Where the page stops drawing a title. Text reaching this edge was cut off by
// the browser rather than ending there — see the note on `lineStream`.
const CLIP_EDGE = 411

// …except that a title can also happen to fill the box exactly. A cut lands
// wherever the pixels run out, which is almost never on a closing bracket or a
// full stop, so a title ending in one is taken as complete.
const ENDS_CLEANLY = /[)\]}.!?"»…]\s*$/u

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
}

// Publisher-ish trailing segments on the author line. A naming word is strong
// evidence on its own; a bare company suffix is not, because 'James S.A. Corey'
// is a pen name and not a limited company.
const PUBLISHER_NAMING =
  /(?<![\p{L}\p{N}_])(ediciones|editorial|editores|publishing|publications|press|books|libros|verlag|edizioni|editions|maeva|planeta|anagrama|alianza|gredos|debolsillo|penguin|random\s+house)(?![\p{L}\p{N}_])/iu
const CORPORATE_SUFFIX = /(?<![\p{L}\p{N}_])(s\.?a\.?u?|s\.?l\.?|ltd|inc|gmbh|group)\.?\s*$/iu

/** Collapse whitespace and normalise unicode for comparison keys. */
const norm = (s) => clean(s)

/**
 * True for a line carrying no recoverable content.
 *
 * Print-break debris and the pagination strip ('1', '2', '»', '10') are short
 * and wordless; a bare year-like number is kept in case a title is one.
 */
export function isDebris(s) {
  const text = (s || '').trim()
  if (!text) return true
  if (WORD_RE.test(text)) return false
  return !(/^\d+$/.test(text) && text.length >= 4)
}

/** '3 September 2019' -> '2019-09-03'. null if unparseable. */
export function parseDate(raw) {
  const m = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/u.exec((raw || '').trim())
  if (!m) return null
  const [, day, monthName, year] = m
  const month = MONTHS[monthName.toLowerCase()]
  if (!month) return null
  const d = Number(day)
  const date = new Date(Date.UTC(Number(year), month - 1, d))
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== d) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Split the author line into authors and a probable publisher.
 *
 * Some items credit the imprint and nobody else ('Editorial Planeta S.A.U.' for
 * Gomez-Jurado's El Paciente). Those yield no author at all, which is the
 * honest answer: the export does not name one.
 */
export function splitAuthors(line) {
  const parts = (line || '').split(',').map((p) => p.trim()).filter(Boolean)
  if (!parts.length) return [[], null]
  const last = parts[parts.length - 1]
  const naming = PUBLISHER_NAMING.test(last)
  if (naming || (parts.length > 1 && CORPORATE_SUFFIX.test(last))) {
    return [parts.slice(0, -1), last]
  }
  return [parts, null]
}

/**
 * Flatten the pages to one stream of {text, clipped, page}.
 *
 * The Python original detects a clipped title by the trailing space PyMuPDF
 * preserves. pdf.js discards it, so the evidence used here is where the ink
 * stopped: a title drawn all the way to the column's edge was cut off by the
 * browser, not written that short.
 */
export function lineStream(pages) {
  const stream = []
  for (let page = 0; page < pages.length; page++) {
    for (const line of pages[page]) {
      if (line.text.trim() === FOOTER_START) break
      const cleaned = line.text.replace(PUA_RE, '')
      if (!cleaned.trim()) continue
      stream.push({
        text: cleaned.trim(),
        clipped: line.right !== null && line.right >= CLIP_EDGE,
        page,
      })
    }
  }
  return stream
}

/**
 * Discard the re-rendered remains of a row split by a page break.
 *
 * When the break falls *through* a line rather than between two, the printer
 * leaves the top slice on one page and the bottom slice on the next. The bottom
 * slices survive the debris filter because they still contain letters, and
 * being last they would be mistaken for the author.
 *
 * The tell is that the earlier page already carries a complete title-and-author
 * pair. Where it carries only one line, the break fell cleanly between the two
 * and the later page's line is genuine, so nothing is dropped.
 */
export function dropReprinted(content) {
  if (content.length < 2) return content
  const firstPage = content[0].page
  const head = content.filter((c) => c.page === firstPage)
  if (head.length === content.length) return content
  return head.length >= 2 ? head : content
}

/** Turn one record block into a record, or null if it holds no item. */
export function parseBlock(block) {
  const anchor = block.findIndex((l) => ACQUIRED_RE.test(l.text))
  if (anchor < 0) return null
  const acquiredRaw = ACQUIRED_RE.exec(block[anchor].text)[1]

  // Content lines before the anchor, with chrome, counts and print debris
  // removed. What remains is [title..., author]. The 'Showing N items' header
  // is skipped rather than treated as a boundary: it prints at the *foot* of a
  // page, so a block straddling the break has its title above it, not below.
  let content = []
  for (const line of block.slice(0, anchor)) {
    const { text } = line
    if (SHOWING_RE.test(text)) continue
    if (CHROME.has(text) || text === 'READ' || text === 'Update available') continue
    if (COLLECTIONS_RE.test(text) || DEVICES_RE.test(text)) continue
    if (isDebris(text)) continue
    content.push(line)
  }
  content = dropReprinted(content)

  const authorLine = content.length ? content[content.length - 1].text : ''
  const titleParts = content.slice(0, -1)
  const title = norm(titleParts.map((p) => p.text).join(' '))
  const titleClipped =
    titleParts.length > 0 &&
    titleParts[titleParts.length - 1].clipped &&
    !ENDS_CLEANLY.test(title)

  let read = false
  let updateAvailable = false
  let collections = null
  let devices = null
  for (const { text } of block.slice(anchor + 1)) {
    if (text === 'READ') read = true
    else if (text === 'Update available') updateAvailable = true
    else if (COLLECTIONS_RE.test(text)) collections = Number(COLLECTIONS_RE.exec(text)[1])
    else if (DEVICES_RE.test(text)) devices = Number(DEVICES_RE.exec(text)[1])
  }

  const [authors, publisher] = splitAuthors(authorLine)
  return {
    title_raw: title,
    title_clipped: titleClipped,
    authors,
    publisher,
    acquired_on: parseDate(acquiredRaw),
    acquired_on_raw: acquiredRaw,
    read,
    collections,
    devices,
    update_available: updateAvailable,
    source_page: block[anchor].page,
  }
}

/** Every record in the document, plus the total Amazon claims it holds. */
export function parseLines(pages) {
  const stream = lineStream(pages)
  let declaredTotal = null
  for (const { text } of stream) {
    const m = SHOWING_RE.exec(text)
    if (m) {
      declaredTotal = Number(m[1])
      break
    }
  }

  const records = []
  let block = []
  for (const entry of stream) {
    if (entry.text === RECORD_END) {
      const record = parseBlock(block)
      if (record) records.push(record)
      block = []
    } else {
      block.push(entry)
    }
  }
  const last = parseBlock(block) // a final record with no closing terminator
  if (last) records.push(last)
  return { records, declaredTotal }
}

/**
 * Collapse records repeated across re-captured screens.
 *
 * Duplicates keep the most complete copy: an unclipped title and a READ flag
 * both beat their absence, since a clipped screen can lose either but never
 * invent one.
 */
export function dedupe(records) {
  const byKey = new Map()
  let dupes = 0
  for (const r of records) {
    const key = [
      norm(r.title_raw).toLowerCase(),
      r.authors.map((a) => a.toLowerCase()).join(''),
      r.acquired_on,
    ].join('')
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, r)
      continue
    }
    dupes++
    prev.read = prev.read || r.read
    prev.update_available = prev.update_available || r.update_available
    if (prev.collections === null) prev.collections = r.collections
    if (prev.devices === null) prev.devices = r.devices
    if (prev.title_clipped && !r.title_clipped) {
      prev.title_raw = r.title_raw
      prev.title_clipped = false
    }
  }
  return { records: [...byKey.values()], dupes }
}

const sortKey = (r) => {
  const parts = (r.authors[0] || '￿').split(' ').filter(Boolean)
  return [(parts[parts.length - 1] || '￿').toLowerCase(), r.title_raw.toLowerCase()]
}

/** Parse a document into source records, ready for `makeSource`. */
export function parseKindle(pages) {
  const { records: raw, declaredTotal } = parseLines(pages)
  const { records, dupes } = dedupe(raw)
  records.sort((a, b) => {
    const [aa, at] = sortKey(a)
    const [ba, bt] = sortKey(b)
    return aa < ba ? -1 : aa > ba ? 1 : at < bt ? -1 : at > bt ? 1 : 0
  })

  return {
    records: records.map((r) => ({
      title: r.title_raw,
      title_clipped: r.title_clipped,
      authors: r.authors,
      publisher: r.publisher,
      acquired_on: r.acquired_on,
      read: r.read,
      collections: r.collections,
      devices: r.devices,
      update_available: r.update_available,
    })),
    stats: {
      raw_blocks: raw.length,
      duplicate_blocks_merged: dupes,
      amazon_declared_total: declaredTotal,
      parsed_records: records.length,
    },
  }
}
