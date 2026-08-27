// A library on disk: the sources it was built from, and the catalog built from
// them.
//
//     sources/<name>.json    one per ingested source, exactly as it was read
//     catalog.json           rebuilt from all of them, never edited by hand
//
// The same layout the command-line tools use, so a folder written here can be
// read by them and the other way round. Plain JSON, one file per source, which
// diffs cleanly if the folder happens to be a git repository.

import { build } from '../core/build.js'
import { applyOverrides, emptyOverrides, readOverrides } from '../core/overrides.js'
import { makeSource, normalise, readSource, SourceError } from '../core/records.js'

const SOURCES = 'sources'
const CATALOG = 'catalog.json'
const OVERRIDES = 'overrides.json'
const MANUAL = 'manual'

export class Library {
  constructor(backend) {
    this.backend = backend
  }

  get kind() {
    return this.backend.kind
  }

  // -- sources ------------------------------------------------------------

  async sourceNames() {
    return (await this.backend.list(SOURCES)).filter((n) => n.endsWith('.json'))
  }

  async readSources() {
    const out = []
    for (const file of await this.sourceNames()) {
      const text = await this.backend.readText(`${SOURCES}/${file}`)
      if (!text) continue
      try {
        out.push({ file, ...readSource(JSON.parse(text), file) })
      } catch (err) {
        out.push({ file, error: err.message })
      }
    }
    return out
  }

  /**
   * A source name that will not quietly destroy an earlier import.
   *
   * The name is the filename, so two imports that share one are the same file
   * and the second replaces the first. That is right when a photograph is read
   * again after adjusting the grid, and wrong when a second shelf is
   * photographed. The two cases are told apart by `origin`: same origin means
   * the same material and replacing it is a correction, a different origin
   * means different material and gets a name of its own.
   */
  async nameFor(base, origin) {
    const wanted = safeName(base)
    const taken = new Map(
      (await this.readSources()).map((s) => [
        s.file.replace(/\.json$/, ''),
        s.source?.origin ?? null,
      ]),
    )
    const free = (candidate) => !taken.has(candidate) || taken.get(candidate) === origin
    if (free(wanted)) return wanted
    for (let n = 2; n <= 99; n++) {
      const candidate = safeName(`${wanted}-${n}`)
      if (free(candidate)) return candidate
    }
    return safeName(`${wanted}-${Date.now().toString(36)}`)
  }

  /**
   * Store one source, at exactly the name given.
   *
   * This writes where it is told and will overwrite a source of the same name,
   * which is what `addManualRecord` relies on. Anything ingesting a file the
   * person chose should ask `nameFor` first.
   *
   * Ingested files are kept exactly as their ingester produced them. A source
   * is evidence, and edited evidence is no longer evidence, so any change to a
   * book belongs in the override layer.
   */
  async putSource({ name, kind, origin, format, confidence, records, stats }) {
    const payload = makeSource({ name, kind, origin, format, confidence, records, stats })
    const file = `${safeName(name)}.json`
    await this.backend.writeText(`${SOURCES}/${file}`, JSON.stringify(payload, null, 2))
    return { file, records: payload.records.length }
  }

  async deleteSource(file) {
    await this.backend.remove(`${SOURCES}/${safeName(file.replace(/\.json$/, ''))}.json`)
  }

  // -- catalog ------------------------------------------------------------

  async readCatalog() {
    const text = await this.backend.readText(CATALOG)
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  // -- corrections ---------------------------------------------------------

  async readOverrides() {
    const text = await this.backend.readText(OVERRIDES)
    if (!text) return emptyOverrides()
    return readOverrides(JSON.parse(text))
  }

  async writeOverrides(overrides) {
    await this.backend.writeText(OVERRIDES, JSON.stringify(overrides, null, 2))
  }

  // -- typing a book in ----------------------------------------------------

  /**
   * Append one hand-typed book to the manual source.
   *
   * Read, append, write: the manual source is the only one a person edits by
   * hand and the only one that cannot be regenerated from something upstream,
   * so a write must never lose the records already in it.
   *
   * It is a source like any other, so a book typed in here clusters and merges
   * with the same book from an export rather than becoming a duplicate. High
   * confidence is right: someone holding the book outranks a model reading a
   * spine, though a store export still owns the purchase date.
   */
  async addManualRecord(record) {
    const text = await this.backend.readText(`${SOURCES}/${MANUAL}.json`)
    const existing = text ? readSource(JSON.parse(text), `${MANUAL}.json`).records : []
    const kept = existing.map((r) => {
      const { _source, ...rest } = r
      return rest
    })
    kept.push(normalise(record))
    return this.putSource({
      name: MANUAL,
      kind: 'manual',
      origin: 'typed in',
      format: 'physical',
      confidence: 'high',
      records: kept,
      stats: { entries: kept.length },
    })
  }

  /** Rebuild from every source present, and store the result. */
  async rebuild() {
    const sources = await this.readSources()
    const broken = sources.filter((s) => s.error)
    if (broken.length) {
      throw new SourceError(`${broken[0].file}: ${broken[0].error}`)
    }
    if (!sources.length) {
      throw new SourceError('no sources yet — add a photograph, a list or an export first')
    }
    // Ordered by name, so a rebuild is reproducible: source order decides which
    // record supplies a book's credit when two are equally reliable.
    sources.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
    // Built first, corrected second. The merge never sees the corrections, so a
    // correction cannot change how two sources are reconciled. It changes only
    // what the finished entry says.
    const catalog = applyOverrides(build(sources), await this.readOverrides())
    await this.backend.writeText(CATALOG, JSON.stringify(catalog, null, 2))
    return catalog
  }

  // -- moving a library between devices ------------------------------------

  /**
   * Everything needed to rebuild this library elsewhere, as one file.
   *
   * The sources, not the catalog: the catalog is derived, and shipping it too
   * would let the copy and the original disagree about which is current.
   */
  async exportBundle() {
    const sources = []
    for (const file of await this.sourceNames()) {
      const text = await this.backend.readText(`${SOURCES}/${file}`)
      if (text) sources.push({ file, payload: JSON.parse(text) })
    }
    return {
      librapp_bundle: 1,
      exported_at: new Date().toISOString(),
      sources,
      // Corrections travel with the sources. They are the one thing in a
      // library that exists nowhere else and cannot be derived again.
      overrides: await this.readOverrides(),
    }
  }

  async importBundle(bundle, { replace = false } = {}) {
    if (bundle?.librapp_bundle !== 1) {
      throw new SourceError('not a LibrAPP export (expected librapp_bundle 1)')
    }
    if (replace) {
      for (const file of await this.sourceNames()) await this.backend.remove(`${SOURCES}/${file}`)
    }
    let written = 0
    for (const { file, payload } of bundle.sources || []) {
      readSource(payload, file) // refuse anything the builder could not read
      await this.backend.writeText(`${SOURCES}/${file}`, JSON.stringify(payload, null, 2))
      written++
    }
    if (bundle.overrides) await this.writeOverrides(readOverrides(bundle.overrides))
    return written
  }
}

/** Keep a source name to something that is safe as a file name. */
/** A filename without its extension, for naming a source after its material. */
export const stemOf = (filename) =>
  String(filename || '')
    .replace(/\.[^.]+$/, '')
    .slice(0, 32)

export function safeName(name) {
  const cleaned = String(name || '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 48)
  return cleaned || 'source'
}
