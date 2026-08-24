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
import { findAll, parseXml, textOf } from './xml.js'
import { readZip, readZipText } from './zip.js'

// Column names understood, in the order they are searched.
export const COLUMNS = {
  title: ['title', 'titulo', 'titel', 'titre', 'book', 'libro', 'obra', 'name', 'nombre'],
  authors: ['author', 'authors', 'autor', 'autores', 'writer', 'by', 'verfasser'],
  genre: ['genre', 'genero', 'genre subject', 'subject', 'categoria', 'category', 'materia'],
  keywords: ['keywords', 'keyword', 'tags', 'palabras clave', 'temas', 'notes', 'notas'],
  series: ['series', 'serie', 'saga', 'collection', 'coleccion'],
  series_index: ['series index', 'series_index', 'volume', 'volumen', 'vol', 'numero', 'n'],
  publisher: ['publisher', 'editorial', 'editor', 'verlag', 'imprint'],
  acquired_on: ['acquired', 'acquired on', 'acquired_on', 'adquirido', 'fecha', 'date',
    'purchased', 'comprado'],
  read: ['read', 'leido', 'gelesen', 'status', 'estado'],
  format: ['format', 'formato', 'media', 'soporte', 'source', 'fuente', 'edition'],
  location: ['location', 'shelf', 'estanteria', 'ubicacion', 'where'],
}

const TRUE_WORDS = new Set(['y', 'yes', 'true', '1', 'x', 'si', 'sí', 'leido', 'leído', 'read', 'ja', 'gelesen'])
const FALSE_WORDS = new Set(['n', 'no', 'false', '0', '', 'unread', 'pendiente', 'nein', 'ungelesen'])

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

const MULTI_VOLUME = /(?<![\p{L}\p{N}_])vol(?:s|umes|umen|\.)?(?![\p{L}\p{N}_])|(?<![\p{L}\p{N}_])tomos?(?![\p{L}\p{N}_])/iu

const SECTION_ELEMENTS = new Set(['book', 'item', 'entry', 'record'])

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

export function parseDate(value) {
  const text = String(value ?? '').trim()
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
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
  for (const part of String(value ?? '').split(/[,;/+&]| and /u)) {
    const word = FORMAT_WORDS[headerKey(part)]
    if (word && !found.includes(word)) found.push(word)
  }
  return found
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

const FIELD_FOR = new Map(
  Object.entries(COLUMNS).flatMap(([field, names]) => names.map((n) => [n, field])),
)

/** Turn already-keyed rows into source records, optionally one group only. */
export function rowsToRecords(rows, section = null) {
  const out = []
  for (const row of rows) {
    if (section && headerKey(row._section || '') !== headerKey(section)) continue

    const picked = {}
    for (const [key, value] of Object.entries(row)) {
      const field = FIELD_FOR.get(key)
      if (field && value && !(field in picked)) picked[field] = value
    }
    const title = clean(picked.title || '')
    if (!title) continue

    const [authors, label] = creditsAndLabel(picked.authors || '')
    const indexRaw = picked.series_index || ''
    const collapsed = isCollapsed(title, indexRaw)
    const record = {
      title,
      authors,
      author_label: label,
      genre: picked.genre || null,
      keywords: picked.keywords || null,
      series: picked.series || null,
      series_index: /^\d+$/.test(String(indexRaw).trim()) ? Number(indexRaw) : null,
      publisher: picked.publisher || null,
      acquired_on: parseDate(picked.acquired_on || ''),
      read: parseRead(picked.read || ''),
      location: picked.location || null,
      collapsed,
      formats: parseFormats(picked.format || ''),
    }
    if (collapsed) record.listed_volumes = title
    out.push(record)
  }
  return out
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
 * Read any supported list file into source records.
 *
 * `bytes` for a spreadsheet, `text` for anything else; the caller knows which
 * because it knows the file's name.
 */
export async function loadTable({ name, bytes, text, section = null }) {
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
    return rowsToRecords(rows, (section || '').toLowerCase() === 'all' ? null : section)
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
  return rowsToRecords(keyRows(table))
}
