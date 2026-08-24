// Port of tools/librapp/records.py. The contract between ingesting a source and
// building the catalog.
//
// Every ingester produces this shape and the builder reads nothing else, so a
// catalog can be built from a photograph alone, a list alone, or any
// combination. In the browser there are no file paths, so `read` takes an
// already-parsed object. Everything else is the same.

import { clean } from './textmatch.js'

export const SCHEMA_VERSION = 1

export const KINDS = new Set(['store-export', 'photo', 'table', 'manual'])
export const FORMATS = new Set(['ebook', 'physical', 'audio'])
export const CONFIDENCE = { high: 3, medium: 2, low: 1 }

/** How much a source's claim outweighs another's. Higher wins. */
export const rank = (confidence) => CONFIDENCE[confidence] ?? 0

/**
 * Every field a record may carry, with the value meaning "not known".
 * A source that cannot see a field leaves it out; null always means unknown,
 * never no.
 */
export const RECORD_FIELDS = {
  title: '',
  title_clipped: false,
  authors: [],
  author_label: null,
  publisher: null,
  acquired_on: null,
  read: null, // true | false | null = unknown
  series: null,
  series_index: null,
  genre: null,
  keywords: null,
  collections: null,
  devices: null,
  update_available: false,
  formats: [],
  confidence: null,
  location: null,
  collapsed: false,
  listed_volumes: null,
  flags: [],
  notes: null,
  // Where a book is, when it is not on its shelf. A book lent out is still
  // owned; a book borrowed is not owned at all, and the catalog says so rather
  // than quietly counting it as part of the collection.
  // Recalled by a model rather than read off a spine, when the extras
  // checklist asked for them. Every book carrying one is flagged.
  abstract: null,
  published_year: null,
  rating: null,
  original_language: null,
  lent_to: null,
  lent_on: null,
  borrowed_from: null,
  borrowed_on: null,
}

export class SourceError extends Error {}

const TEXT_FIELDS = ['publisher', 'genre', 'keywords', 'series', 'location', 'notes', 'author_label']

/** Compare like Python compares strings: by code point, not by locale. */
export const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/** One record with every field present and defaults filled in. */
export function normalise(record) {
  const out = {}
  for (const [k, v] of Object.entries(RECORD_FIELDS)) out[k] = Array.isArray(v) ? [...v] : v

  const unknown = Object.keys(record).filter((k) => !(k in RECORD_FIELDS))
  if (unknown.length) {
    throw new SourceError(
      `unknown field(s) ${JSON.stringify(unknown.sort())} in record ${JSON.stringify(record.title)}`,
    )
  }
  Object.assign(out, record)

  out.title = clean(String(out.title ?? ''))
  out.authors = (out.authors || []).map((a) => clean(a)).filter(Boolean)
  for (const key of TEXT_FIELDS) if (out[key]) out[key] = clean(String(out[key]))

  out.formats = [...new Set((out.formats || []).filter(Boolean))].sort(byCodePoint)
  const badFormats = out.formats.filter((f) => !FORMATS.has(f))
  if (badFormats.length) throw new SourceError(`unknown format(s) ${JSON.stringify(badFormats)}`)
  if (out.confidence && !(out.confidence in CONFIDENCE)) {
    throw new SourceError(`unknown confidence ${JSON.stringify(out.confidence)}`)
  }
  return out
}

/** Build a source envelope, refusing anything the builder could not trust. */
export function makeSource({ name, kind, origin, format, confidence, records, stats }) {
  if (!KINDS.has(kind)) throw new SourceError(`kind must be one of ${[...KINDS].sort()}, not ${kind}`)
  if (!FORMATS.has(format)) throw new SourceError(`format must be one of ${[...FORMATS].sort()}, not ${format}`)
  if (!(confidence in CONFIDENCE)) {
    throw new SourceError(`confidence must be one of ${Object.keys(CONFIDENCE).sort()}, not ${confidence}`)
  }

  const normalised = (records || []).map(normalise)
  const untitled = normalised.map((r, i) => (r.title ? -1 : i)).filter((i) => i >= 0)
  if (untitled.length) {
    throw new SourceError(
      `${untitled.length} record(s) have no title, at index ${JSON.stringify(untitled.slice(0, 5))}`,
    )
  }

  return {
    librapp_source: SCHEMA_VERSION,
    source: { name, kind, origin, format, confidence },
    stats: stats || {},
    records: normalised,
  }
}

/** Read a source envelope, with records normalised and defaults applied. */
export function readSource(payload, label = 'source') {
  if (payload?.librapp_source !== SCHEMA_VERSION) {
    throw new SourceError(
      `${label} is not a LibrAPP source file (expected librapp_source ${SCHEMA_VERSION}, ` +
        `found ${JSON.stringify(payload?.librapp_source)})`,
    )
  }
  const meta = payload.source || {}
  for (const key of ['name', 'kind', 'origin', 'format', 'confidence']) {
    if (!meta[key]) throw new SourceError(`${label} is missing source.${key}`)
  }

  const records = (payload.records || []).map((raw) => {
    const r = normalise(raw)
    if (!r.formats.length) r.formats = [meta.format]
    // A record may lower its own confidence, as one illegible spine among many
    // clear ones does, but never raise it above its source. However cleanly a
    // model read a photograph, it was still reading a photograph.
    const own = r.confidence || meta.confidence
    r.confidence = rank(own) <= rank(meta.confidence) ? own : meta.confidence
    r._source = meta.name
    return r
  })

  return { ...payload, records }
}
