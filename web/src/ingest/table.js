// Port of tools/librapp/parse_table.py. Reads a list of books from a
// spreadsheet, CSV or XML file.
//
// This is the path for a catalog kept by hand, in whatever shape it was kept.
// Columns are matched by name in several languages rather than by position, so
// a sheet headed `Autor / Título / Género` works as well as
// `author / title / genre`.
//
// A row standing for several volumes at once, such as a whole series in one
// cell, is marked `collapsed` rather than treated as a single book.

import { clean, creditsAndLabel, stripAccents } from '../core/textmatch.js'
import { cleanIsbn, toIsbn13, validIsbn } from './isbn.js'
import { findAll, parseXml, textOf } from './xml.js'
import { readZip, readZipText } from './zip.js'

// Column names understood, in the order they are searched.
export const COLUMNS = {
  title: ['title', 'titulo', 'titel', 'titre', 'book', 'libro', 'obra', 'name', 'nombre'],
  authors: ['author', 'authors', 'autor', 'autores', 'writer', 'by', 'verfasser',
    // Goodreads writes the same name twice, once each way round. Either will
    // do, and the one it does not use shows in the column table as unused.
    'author l f'],
  genre: ['genre', 'genero', 'genre subject', 'subject', 'categoria', 'category', 'materia'],
  keywords: ['keywords', 'keyword', 'tags', 'palabras clave', 'temas', 'notes', 'notas',
    // A Goodreads shelf is a tag by another name: fiction, sci-fi, to-read-someday.
    'bookshelves'],
  series: ['series', 'serie', 'saga', 'collection', 'coleccion'],
  series_index: ['series index', 'series_index', 'volume', 'volumen', 'vol', 'numero', 'n'],
  publisher: ['publisher', 'editorial', 'editor', 'verlag', 'imprint'],
  acquired_on: ['acquired', 'acquired on', 'acquired_on', 'adquirido', 'fecha', 'date',
    'purchased', 'comprado'],
  // Goodreads keeps this in a column it calls exclusive, because a book is on
  // exactly one of read, currently-reading and to-read.
  read: ['read', 'leido', 'gelesen', 'status', 'estado', 'exclusive shelf'],
  format: ['format', 'formato', 'media', 'soporte', 'source', 'fuente', 'edition',
    // Goodreads: Hardcover, Paperback, Kindle Edition, Audiobook.
    'binding'],
  location: ['location', 'shelf', 'estanteria', 'ubicacion', 'where'],
  // The number printed on the edition. Worth carrying even though nothing here
  // uses it, because it is the one field that lets a book be looked up later
  // without guessing, and a list that has one is throwing it away otherwise.
  isbn: ['isbn', 'isbn13', 'isbn 13', 'isbn10', 'isbn 10', 'ean', 'barcode'],
  // Amazon's own number. Not an ISBN and not interchangeable with one: it
  // identifies a Kindle edition, which frequently has no ISBN at all.
  asin: ['asin', 'amazon id', 'kindle id'],
  // The year the work first appeared, not the year this edition was printed.
  // Goodreads carries both and they are different facts; only the first has a
  // home here, so a file naming its edition year leaves that column unused
  // rather than filing it under a heading that means something else.
  published_year: ['published', 'first published', 'published year', 'pubdate',
    'publication date', 'year', 'ano', 'publicado', 'erscheinungsjahr',
    'original publication year'],
  // Everybody's rating, not the reader's own. Goodreads writes both and this
  // is the community one: a reader's own opinion of a book is a note or a
  // star, and the prompts are told in as many words that a rating is not it.
  rating: ['average rating', 'rating medio'],
  pages: ['pages', 'number of pages', 'page count', 'paginas', 'seiten'],
}

// Header spellings that name a date a book entered a collection rather than a
// date it was published. Calibre writes `timestamp` for the former and
// `pubdate` for the latter, and getting them the wrong way round would date a
// whole library to the day it was catalogued.
COLUMNS.acquired_on.push('timestamp', 'date added', 'added', 'anadido', 'created')

const TRUE_WORDS = new Set(['y', 'yes', 'true', '1', 'x', 'si', 'sí', 'leido', 'leído', 'read', 'ja', 'gelesen'])
// A book being read is a book not read. Three values, and neither of these is
// the third: nobody who has a book on their currently-reading shelf is
// uncertain whether they have finished it.
const FALSE_WORDS = new Set(['n', 'no', 'false', '0', '', 'unread', 'pendiente', 'nein',
  'ungelesen', 'to read', 'currently reading'])

// What a format or provenance cell may say. A row can name more than one, so a
// hand-kept list can record a book owned both on paper and on a device.
const FORMAT_WORDS = {
  ebook: 'ebook', 'e book': 'ebook', ebooks: 'ebook', kindle: 'ebook',
  digital: 'ebook', epub: 'ebook', mobi: 'ebook',
  physical: 'physical', paper: 'physical', papel: 'physical', print: 'physical',
  impreso: 'physical', shelf: 'physical', estanteria: 'physical',
  hardback: 'physical', paperback: 'physical', 'tapa dura': 'physical', bolsillo: 'physical',
  audio: 'audio', audiobook: 'audio', audiolibro: 'audio',
}

/**
 * Cells that are a way of writing an empty cell.
 *
 * An exporter that has nothing to put in a column often writes something
 * rather than leaving it blank. Taken at face value it wins the column: a row
 * whose ISBN-13 says N/A and whose ISBN-10 holds a real number would keep the
 * N/A and drop the number, because the first column to hold anything claims
 * the field.
 */
const MEANS_NOTHING = new Set(['n a', 'na', 'none', 'null', 'nil', 'unknown', 'desconocido', '-', '--'])

const MULTI_VOLUME = /(?<![\p{L}\p{N}_])vol(?:s|umes|umen|\.)?(?![\p{L}\p{N}_])|(?<![\p{L}\p{N}_])tomos?(?![\p{L}\p{N}_])/iu

const SECTION_ELEMENTS = new Set(['book', 'item', 'entry', 'record'])

/**
 * Which program wrote this file, judged by the columns only it writes.
 *
 * Worth knowing because the answer changes what the defaults should be: a
 * Kindle library is ebooks, and a Calibre one may be anything. It is a guess
 * and it is stated as one, with a way to say otherwise, because the columns
 * are the only evidence and another program could write the same ones.
 */
export const SHAPES = [
  { id: 'kindle', needs: ['asin'] },
  { id: 'calibre', needs: ['timestamp', 'pubdate'] },
  { id: 'goodreads', needs: ['book id', 'exclusive shelf'] },
]

export function detectShape(columns) {
  const keys = new Set((columns || []).map((c) => c.key))
  return SHAPES.find((shape) => shape.needs.every((k) => keys.has(k)))?.id || null
}

/** The fields a column may be pointed at, for a reader correcting one. */
export const FIELDS = Object.keys(COLUMNS)

/** Header names compared without accents, case or punctuation. */
export const headerKey = (text) =>
  stripAccents(String(text ?? ''))
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

/** A read column is three-valued; an empty cell means nobody said. */
export function parseRead(value) {
  const word = headerKey(value)
  if (TRUE_WORDS.has(word)) return true
  if (FALSE_WORDS.has(word)) return word === '' ? null : false
  return null
}

/**
 * A four-digit year from a date cell, where the cell names a plausible one.
 *
 * Calibre writes 0101-01-01 for a book whose publication date nobody filled
 * in, and 43 rows of one real library carry it. Written through, that becomes
 * a shelf the profile describes as reaching back to the second century.
 */
export function parseYear(value) {
  const m = /(\d{4})/.exec(String(value ?? '').trim())
  if (!m) return null
  const year = Number(m[1])
  // The printing press at one end and next year at the other, since a
  // pre-order is a book somebody owns.
  return year >= 1450 && year <= new Date().getFullYear() + 1 ? year : null
}

export function parseDate(value) {
  const text = String(value ?? '').trim()
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  // Year first is unambiguous, whatever the separator. Goodreads writes
  // 2018/11/30 and a spreadsheet often writes 2018.11.30.
  m = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(text)
  if (m) return `${m[1]}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[3])).padStart(2, '0')}`
  m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(text)
  if (m) return `${m[3]}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`
  return null
}

/**
 * Which formats a cell names, if any. Handles a provenance column as well as a
 * format one, since a list recording where a book came from ('shelf', 'kindle',
 * 'shelf,kindle') is also recording the form it is owned in.
 */
export function parseFormats(value) {
  const found = []
  const take = (word) => {
    const kind = FORMAT_WORDS[word]
    if (kind && !found.includes(kind)) found.push(kind)
  }
  for (const part of String(value ?? '').split(/[,;/+&]| and /u)) {
    const whole = headerKey(part)
    take(whole)
    // And word by word, because a cell often names the form inside a longer
    // phrase: Goodreads writes Kindle Edition, Mass Market Paperback, Audio CD.
    // The whole phrase is tried first, so a two-word name can still be listed
    // above and beat its own parts.
    for (const word of whole.split(' ')) take(word)
  }
  return found
}

/** A whole number above zero, or nothing. Zero pages is a cell nobody filled. */
export function parseCount(value) {
  const number = Number(String(value ?? '').trim())
  return Number.isInteger(number) && number > 0 ? number : null
}

/**
 * A rating out of five, or nothing.
 *
 * Zero is what a site writes for a book nobody has rated, and averaging it in
 * with real scores would drag every reading of the shelf downwards.
 */
export function parseRating(value) {
  const number = Number(String(value ?? '').trim())
  return Number.isFinite(number) && number > 0 && number <= 5 ? number : null
}

/** A volume number, whole or fractional, or null where the cell says nothing. */
export function parseIndex(value) {
  const text = String(value ?? '').trim()
  if (!/^\d+(\.\d+)?$/.test(text)) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

/**
 * A row standing for several volumes rather than one book.
 *
 * Two slashes means a list of titles ('La Tierra Larga / La Guerra Larga /
 * El Marte Largo'); one means an alternative name for a single book
 * ('Historia de los visigodos / Los visigodos'), which is not collapsed.
 */
export function isCollapsed(title, seriesIndex) {
  if (seriesIndex) return false // a numbered volume is one book, however worded
  const semicolons = (title.match(/;/g) || []).length
  const slashes = (title.match(/\//g) || []).length
  return MULTI_VOLUME.test(title) || semicolons >= 1 || slashes >= 2 || title.length > 150
}

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

/** Split CSV text into rows, honouring quotes and the usual delimiters. */
export function readCsv(text) {
  const body = text.replace(/^﻿/, '')
  const sample = body.slice(0, 4096)
  const counts = [',', ';', '\t', '|'].map((d) => [d, (sample.split(d).length - 1)])
  counts.sort((a, b) => b[1] - a[1])
  const delimiter = counts[0][1] ? counts[0][0] : ','

  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (quoted) {
      if (ch === '"') {
        if (body[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"') { quoted = true; continue }
    if (ch === delimiter) { row.push(field); field = ''; continue }
    if (ch === '\r') continue
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    field += ch
  }
  row.push(field)
  rows.push(row)
  return rows.filter((r) => r.some((c) => c.trim()))
}

const colToIndex = (ref) => {
  let n = 0
  for (const ch of (/^[A-Z]*/.exec(ref) || [''])[0]) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** Read one worksheet of an .xlsx as a grid of strings. */
export async function readXlsx(bytes, sheet) {
  const entries = readZip(bytes)
  const names = [...entries.keys()].filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()
  if (!names.length) throw new Error('the workbook contains no worksheet')

  const shared = []
  if (entries.has('xl/sharedStrings.xml')) {
    const doc = parseXml(await readZipText(entries, 'xl/sharedStrings.xml'))
    for (const si of findAll(doc, 'si')) {
      let text = ''
      for (const t of findAll(si, 't')) text += textOf(t)
      shared.push(text)
    }
  }

  const workbook = parseXml(await readZipText(entries, 'xl/workbook.xml'))
  const titles = [...findAll(workbook, 'sheet')].map((s) => s.attrs.name || '')

  let chosen = names[0]
  if (sheet && sheet.toLowerCase() !== 'all') {
    const at = titles.findIndex((t) => headerKey(t) === headerKey(sheet))
    if (at < 0) throw new Error(`there is no sheet named ${sheet}; it has ${JSON.stringify(titles)}`)
    chosen = names[at] ?? names[0]
  }

  const doc = parseXml(await readZipText(entries, chosen))
  const rows = []
  for (const row of findAll(doc, 'row')) {
    const cells = new Map()
    for (const cell of row.children) {
      if (!/(^|:)c$/i.test(cell.tag)) continue
      const index = colToIndex(cell.attrs.r || '')
      let text = ''
      if (cell.attrs.t === 'inlineStr') {
        for (const t of findAll(cell, 't')) text += textOf(t)
      } else {
        const v = [...findAll(cell, 'v')][0]
        text = v ? textOf(v) : ''
        if (cell.attrs.t === 's' && text !== '') text = shared[Number(text)] ?? ''
      }
      if (index >= 0) cells.set(index, text)
    }
    if (cells.size) {
      const width = Math.max(...cells.keys()) + 1
      rows.push(Array.from({ length: width }, (_, i) => cells.get(i) ?? ''))
    }
  }
  return rows.filter((r) => r.some((c) => c.trim()))
}

/**
 * Read a nested XML catalog, using child element names as columns.
 *
 * A file may hold more than one list, such as books owned beside books wanted,
 * so each row remembers the named group it came from and the caller decides
 * which groups to keep.
 */
export function readXml(text) {
  const doc = parseXml(text)
  const out = []

  const visit = (node, section) => {
    const here = node.attrs?.name || node.attrs?.id || section
    for (const child of node.children) {
      if (SECTION_ELEMENTS.has(child.tag.toLowerCase()) && child.children.length) {
        const row = {}
        for (const gc of child.children) row[headerKey(gc.tag)] = clean(textOf(gc))
        for (const [k, v] of Object.entries(child.attrs || {})) {
          const key = headerKey(k)
          if (!(key in row)) row[key] = clean(v)
        }
        row._section = here
        out.push(row)
      } else {
        visit(child, here)
      }
    }
  }
  visit(doc, null)
  return out
}

/** The named groups an XML catalog holds, for choosing between them. */
export const xmlSections = (rows) =>
  [...new Set(rows.map((r) => r._section).filter(Boolean))].sort()

// ---------------------------------------------------------------------------

/**
 * An ISBN as thirteen digits, or nothing.
 *
 * A cell may hold either length, and the two are the same book. Storing both
 * spellings would make one book look like two to anything comparing them.
 */
export function keptIsbn(value) {
  const code = cleanIsbn(value)
  return code && validIsbn(code) ? toIsbn13(code) : null
}

/** Amazon's ten characters, which are not digits and carry no check. */
export function cleanAsin(value) {
  const code = String(value ?? '').trim().toUpperCase()
  return /^[A-Z0-9]{10}$/.test(code) ? code : null
}

const FIELD_FOR = new Map(
  Object.entries(COLUMNS).flatMap(([field, names]) => names.map((n) => [n, field])),
)

/**
 * Which column fed which field, for one row.
 *
 * The first column holding something usable claims a field, so an export
 * writing both ISBN-13 and ISBN-10 fills the ISBN from whichever of the two
 * that row actually has. `from` is the same decision seen the other way round,
 * and is what lets the reading report itself without a second rule that could
 * disagree with this one.
 */
export function pickFields(row, mapping = null) {
  const picked = {}
  const from = {}
  for (const [key, value] of Object.entries(row)) {
    // A reader who can see what a column was taken to mean can say otherwise,
    // and null is a decision too: it means leave this column out.
    const field = mapping && key in mapping ? mapping[key] : FIELD_FOR.get(key)
    if (!field || !value || field in picked) continue
    if (MEANS_NOTHING.has(headerKey(value))) continue
    picked[field] = value
    from[field] = key
  }
  return { picked, from }
}

/**
 * Whether a column's value survived into the record.
 *
 * Feeding a field is not the same as filling one. Calibre writes a series index
 * on every row it holds, and the ones with no series are dropped; a publication
 * date of 0101 is dropped as well. A report counting cells rather than values
 * would credit those columns with rows they did not fill.
 */
const landed = (record, field) => {
  const value = field === 'format' ? record.formats : record[field]
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined && value !== ''
}

/**
 * Turn already-keyed rows into source records, optionally one group only.
 *
 * `tally`, when given, is filled with the number of records each column
 * actually put something into, so an account of the reading can be given
 * without a second pass that might read the file differently.
 */
export function rowsToRecords(rows, section = null, { tally = null, mapping = null } = {}) {
  const out = []
  for (const row of rows) {
    if (section && headerKey(row._section || '') !== headerKey(section)) continue

    const { picked, from } = pickFields(row, mapping)
    const title = clean(picked.title || '')
    if (!title) continue

    const [authors, label] = creditsAndLabel(picked.authors || '')
    // A volume number belongs to a series. Calibre writes 1.0 in this column
    // for every book it holds, series or not, so read on its own it would put
    // 'volume 1' on 685 standalone books of one real library and, worse, tell
    // the check below that every one of them is a numbered volume.
    const series = picked.series || null
    const index = series ? parseIndex(picked.series_index) : null
    const collapsed = isCollapsed(title, index)
    const record = {
      title,
      authors,
      author_label: label,
      genre: picked.genre || null,
      keywords: picked.keywords || null,
      series,
      // Calibre writes 1.0 rather than 1, and 479 volumes of one real library
      // came through numberless because of it. A fractional index is a real
      // thing in that world (2.5 for a novella between two novels), so the
      // number is kept as written rather than rounded to the nearest whole.
      series_index: index,
      publisher: picked.publisher || null,
      acquired_on: parseDate(picked.acquired_on || ''),
      read: parseRead(picked.read || ''),
      location: picked.location || null,
      collapsed,
      formats: parseFormats(picked.format || ''),
      // Only a number that checks out. An ISBN is kept so a book need not be
      // looked up twice and so a later lookup can be matched back to its
      // entry, and a mistyped one would do the opposite of both.
      isbn: keptIsbn(picked.isbn),
      asin: cleanAsin(picked.asin),
      published_year: parseYear(picked.published_year || ''),
      rating: parseRating(picked.rating),
      pages: parseCount(picked.pages),
    }
    if (collapsed) record.listed_volumes = title
    if (tally) {
      for (const [field, key] of Object.entries(from)) {
        if (landed(record, field)) tally.set(key, (tally.get(key) || 0) + 1)
      }
    }
    out.push(record)
  }
  return out
}

// Fields whose absence costs something a reader would notice, in the order the
// cost is worth mentioning. A list can be missing a publisher and nobody minds;
// a list missing its read column quietly empties half the desk, which is how
// this came to be written.
export const TELLING_FIELDS = ['read', 'acquired_on', 'genre', 'authors', 'series', 'publisher']

/**
 * Which of those a list turned out not to carry.
 *
 * Judged on the records rather than on the header row, because a column that is
 * present and empty in every row costs exactly what an absent one costs, and a
 * reader looking at their own spreadsheet would call both "it's not in there".
 * Works the same for a spreadsheet, a CSV and an XML catalog, none of which
 * present their columns alike.
 */
export function missingFields(records) {
  const rows = records || []
  if (!rows.length) return []
  return TELLING_FIELDS.filter((field) =>
    rows.every((r) => {
      const value = r?.[field]
      if (Array.isArray(value)) return value.length === 0
      return value === null || value === undefined || value === ''
    }),
  )
}

/** Map a header row onto keyed rows. */
function keyRows(table) {
  const headers = table[0].map(headerKey)
  if (!headers.some((h) => COLUMNS.title.includes(h))) {
    throw new Error(
      `no title column found. Headers were ${JSON.stringify(table[0])}; ` +
        `name one of them ${JSON.stringify(COLUMNS.title)}`,
    )
  }
  return table.slice(1).map((row) => {
    const keyed = {}
    for (let i = 0; i < Math.min(row.length, headers.length); i++) keyed[headers[i]] = row[i]
    return keyed
  })
}

/**
 * What each column in the file was taken to mean.
 *
 * A file has always been read silently: a column whose heading this app does
 * not recognise is dropped without a word, and afterwards a report of what the
 * list "did not carry" is worked out from the records. The two are
 * indistinguishable from the outside, and the difference matters. One real
 * export was told it had no date column while carrying a date in all 1164 of
 * its rows, under a heading nobody here had thought of.
 *
 * So the reading says what it did. One entry per column, in the order the file
 * writes them, carrying the heading as written, the field it fed, and a value
 * out of the file so a heading like `timestamp` can be judged by what is
 * underneath it rather than by its name.
 *
 * `rows` counts how many rows a column actually fed, which is not the same as
 * whether it names a field. An export writing both ISBN-13 and ISBN-10 has two
 * columns for one field; the second is not idle, it fills in for the rows where
 * the first says nothing. Counted rather than reasoned about, from the same
 * function that fills the records.
 */
export function describeColumns(headers, rows, { fed = new Map(), mapping = null } = {}) {
  return headers.map((header) => {
    const key = headerKey(header)
    const guessed = FIELD_FOR.get(key) ?? null
    const field = mapping && key in mapping ? mapping[key] : guessed
    let sample = null
    for (const row of rows) {
      const value = String(row?.[key] ?? '').trim()
      if (value && !MEANS_NOTHING.has(headerKey(value))) {
        sample = value
        break
      }
    }
    return {
      header: String(header),
      key,
      field,
      // What this app made of the heading on its own, kept so a reader can be
      // shown what they changed and put it back.
      guessed,
      used: (fed.get(key) || 0) > 0,
      rows: fed.get(key) || 0,
      sample,
    }
  })
}

/** The columns an XML catalog turned out to have, which are its element names. */
const xmlHeaders = (rows) => {
  const seen = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (key !== '_section' && !seen.includes(key)) seen.push(key)
    }
  }
  return seen
}

/**
 * Read any supported list file.
 *
 * `bytes` for a spreadsheet, `text` for anything else; the caller knows which
 * because it knows the file's name.
 *
 * Returns the records and an account of how the file's columns were read. Both
 * come from one pass, so what the page shows about a column and what ends up
 * in a record cannot disagree.
 */
export async function loadTable({ name, bytes, text, section = null, mapping = null }) {
  const suffix = (/\.[^.]+$/.exec(name || '') || [''])[0].toLowerCase()

  if (suffix === '.xml') {
    const rows = readXml(text ?? new TextDecoder('utf-8').decode(bytes))
    const groups = xmlSections(rows)
    if (section && !groups.map(headerKey).includes(headerKey(section))) {
      throw new Error(`${name} has no section ${section}; it has ${JSON.stringify(groups)}`)
    }
    if (!section && groups.length > 1) {
      throw new Error(
        `${name} holds several lists: ${JSON.stringify(groups)}. ` +
          'Choose one, or ask for every row.',
      )
    }
    const wanted = (section || '').toLowerCase() === 'all' ? null : section
    const fed = new Map()
    return {
      records: rowsToRecords(rows, wanted, { tally: fed, mapping }),
      columns: describeColumns(xmlHeaders(rows), rows, { fed, mapping }),
    }
  }

  let table
  if (suffix === '.xlsx' || suffix === '.xlsm') {
    table = await readXlsx(bytes, section)
  } else if (['.csv', '.tsv', '.txt'].includes(suffix)) {
    table = readCsv(text ?? new TextDecoder('utf-8').decode(bytes))
  } else {
    throw new Error(`cannot read ${suffix || 'a file with no extension'}`)
  }
  if (!table.length) throw new Error(`${name} is empty`)
  const rows = keyRows(table)
  const fed = new Map()
  return {
    records: rowsToRecords(rows, null, { tally: fed, mapping }),
    columns: describeColumns(table[0], rows, { fed, mapping }),
  }
}
