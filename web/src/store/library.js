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
import { makeSource, readSource, SourceError } from '../core/records.js'

const SOURCES = 'sources'
const CATALOG = 'catalog.json'

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
   * Store one source.
   *
   * Ingested files are kept exactly as their ingester produced them: a source
   * is evidence, and evidence that gets edited stops being evidence. Anything
   * you want to change about a book belongs in the override layer instead.
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
    const catalog = build(sources)
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
    return written
  }
}

/** Keep a source name to something that is safe as a file name. */
export function safeName(name) {
  const cleaned = String(name || '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 48)
  return cleaned || 'source'
}
