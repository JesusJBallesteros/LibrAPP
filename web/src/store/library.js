// A library on disk: the sources it was built from, and the catalog built from
// them.
//
//     sources/<name>.json    one per ingested source, exactly as it was read
//     catalog.json           rebuilt from all of them, never edited by hand
//     backups/<stamp>.json   a whole library, copied before it was replaced
//     answers.json           replies from the desk the reader chose to keep
//
// The same layout the command-line tools use, so a folder written here can be
// read by them and the other way round. Plain JSON, one file per source, which
// diffs cleanly if the folder happens to be a git repository.

import { build } from '../core/build.js'
import { applyOverrides, emptyOverrides, readOverrides } from '../core/overrides.js'
import { makeSource, normalise, readSource, SourceError } from '../core/records.js'
import { fold } from '../core/textmatch.js'

const SOURCES = 'sources'
const CATALOG = 'catalog.json'
const OVERRIDES = 'overrides.json'
const BACKUPS = 'backups'
const ANSWERS = 'answers.json'
const MANUAL = 'manual'
// Shared with the preview in ingest/isbn.js, so what is shown before keeping
// and what is written on keeping cannot drift apart.
const LOOKUP = 'isbn'
// The other lookup: found by title and author rather than by number, and kept
// apart from it because the two are not equally trustworthy and the reader
// should be able to delete one without losing the other.
const SEARCH = 'search'

export class Library {
  constructor(backend) {
    this.backend = backend
  }

  get kind() {
    return this.backend.kind
  }

  /** The name of the chosen folder, where there is one. */
  get where() {
    return this.backend.root?.name || null
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

  /**
   * Add books looked up by their own ISBN.
   *
   * One source that grows, rather than a new file per lookup, so a shelf done
   * in several sittings reads as one thing afterwards. Keyed by the ISBN, so
   * looking the same book up again corrects its entry instead of adding a
   * second one.
   *
   * High confidence, and honestly so: this is a published record of a specific
   * edition, not a reading of a spine. What it cannot vouch for is that the
   * number was the right number, which is why nothing reaches here until
   * somebody has seen what came back.
   */
  async addLookupRecords(records, { format = 'physical' } = {}) {
    const text = await this.backend.readText(`${SOURCES}/${LOOKUP}.json`)
    const existing = text ? readSource(JSON.parse(text), `${LOOKUP}.json`).records : []
    const byIsbn = new Map()
    for (const record of existing) {
      const { _source, ...rest } = record
      byIsbn.set(rest.isbn, rest)
    }
    for (const record of records) byIsbn.set(record.isbn, normalise(record))
    const kept = [...byIsbn.values()]
    return this.putSource({
      name: LOOKUP,
      kind: 'lookup',
      origin: 'openlibrary.org',
      format,
      confidence: 'high',
      records: kept,
      stats: { entries: kept.length },
    })
  }

  /**
   * Records found by searching for a title and an author.
   *
   * Its own source, and low confidence, which is the honest label: a search
   * returns what ranks highest for some words, and the judging that happens
   * before anything gets here narrows that without making it certain. Kept
   * apart from the ISBN lookup so a reader who decides they do not trust this
   * can delete it and keep the other.
   *
   * Keyed by title and author, since these have no number: searching for the
   * same book again corrects its entry rather than adding a second one.
   */
  async addSearchRecords(records, { format = 'physical' } = {}) {
    const text = await this.backend.readText(`${SOURCES}/${SEARCH}.json`)
    const existing = text ? readSource(JSON.parse(text), `${SEARCH}.json`).records : []
    const byBook = new Map()
    const keyOf = (r) => `${fold(r.title)}\u0000${fold((r.authors || [])[0] || '')}`
    for (const record of existing) {
      const { _source, ...rest } = record
      byBook.set(keyOf(rest), rest)
    }
    for (const record of records) byBook.set(keyOf(record), normalise(record))
    const kept = [...byBook.values()]
    return this.putSource({
      name: SEARCH,
      kind: 'lookup',
      origin: 'openlibrary.org',
      format,
      confidence: 'low',
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
      // Corrections go with the sources they correct. A restore that kept the
      // old ones would leave edits pointing at books that are no longer there,
      // and the ids they are keyed by are handed out by the builder, so the
      // survivors would attach themselves to whichever books happened to take
      // those ids next.
      await this.writeOverrides(emptyOverrides())
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

  // -- answers kept --------------------------------------------------------
  //
  // A reply from the desk lives in a box on the page and goes when the page
  // does. Most of them should: a synopsis of a book is worth reading once. A
  // description of the collection is not, and there was nothing to keep it
  // with except a clipboard.
  //
  // Their own file rather than the catalog. Nothing derives from them, a
  // rebuild must not touch them, and a reader deleting one is deleting a
  // document rather than editing a book.

  async readAnswers() {
    const text = await this.backend.readText(ANSWERS)
    if (!text) return []
    try {
      const payload = JSON.parse(text)
      return Array.isArray(payload?.answers) ? payload.answers : []
    } catch {
      // A file that will not parse is not a reason to lose the page. It is
      // replaced by the next save.
      return []
    }
  }

  async #writeAnswers(answers) {
    await this.backend.writeText(ANSWERS, JSON.stringify({ librapp_answers: 1, answers }, null, 2))
  }

  /** Keep one, newest first. */
  async saveAnswer({ ask, question, text }) {
    const answers = await this.readAnswers()
    const entry = {
      id: `a_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      ask,
      question: question || null,
      text,
      at: new Date().toISOString(),
    }
    await this.#writeAnswers([entry, ...answers])
    return entry
  }

  async deleteAnswer(id) {
    await this.#writeAnswers((await this.readAnswers()).filter((a) => a.id !== id))
  }

  // -- backups ------------------------------------------------------------
  //
  // A backup is an export bundle, written into the library instead of being
  // downloaded. Nothing about the format is private to backups, which is the
  // point: the file a reset leaves behind is the same file the export button
  // produces, so it can be carried to another device and brought in there
  // through the import that already exists.

  /** Every backup held here, newest first. */
  async backupNames() {
    const names = (await this.backend.list(BACKUPS)).filter((n) => n.endsWith('.json'))
    // Names begin with a timestamp, so the order the backend sorts them into is
    // already the order they were made in.
    return names.reverse()
  }

  /**
   * What each backup holds.
   *
   * Read from the file rather than from its name, because a name can be
   * anything once a folder is open to whoever owns it. A backup that will not
   * parse is still listed: it cannot be restored, but it can be deleted, and a
   * file that is invisible in the app and present on disk is worse.
   */
  async readBackups() {
    const out = []
    for (const file of await this.backupNames()) {
      const text = (await this.backend.readText(`${BACKUPS}/${file}`)) || ''
      try {
        const bundle = JSON.parse(text)
        if (bundle?.librapp_bundle !== 1) throw new Error('not a bundle')
        out.push({
          file,
          bytes: text.length,
          made_at: bundle.exported_at || null,
          why: bundle.made_because || null,
          sources: (bundle.sources || []).length,
          books: bundle.held?.books ?? null,
          readable: true,
        })
      } catch {
        out.push({ file, bytes: text.length, made_at: null, why: null, sources: null, books: null, readable: false })
      }
    }
    return out
  }

  /**
   * Copy the whole library, and say what the copy was made for.
   *
   * Returns null when there is nothing to copy. A library with no sources has
   * nothing that could be lost, and a shelf of empty backups is a list nobody
   * can read.
   */
  async makeBackup(why = 'manual') {
    const bundle = await this.exportBundle()
    if (!bundle.sources.length) return null
    const catalog = await this.readCatalog()
    // Colons are not allowed in a file name on every system this can be opened
    // on. Stripped rather than replaced with nothing, so the stamp still sorts
    // in the order the backups were made.
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')
    const file = `${stamp}-${safeName(why)}.json`
    await this.backend.writeText(
      `${BACKUPS}/${file}`,
      JSON.stringify(
        {
          ...bundle,
          made_because: why,
          // So the list can say what is in each one without parsing every
          // record of every source to count them again.
          held: { books: catalog?.counts?.books ?? null, sources: bundle.sources.length },
        },
        null,
        2,
      ),
    )
    return file
  }

  async readBackup(file) {
    const text = await this.backend.readText(`${BACKUPS}/${file}`)
    if (!text) throw new SourceError(`there is no backup called ${JSON.stringify(file)}`)
    let bundle
    try {
      bundle = JSON.parse(text)
    } catch {
      throw new SourceError(`the backup ${JSON.stringify(file)} is not readable`)
    }
    if (bundle?.librapp_bundle !== 1) {
      throw new SourceError(`the backup ${JSON.stringify(file)} is not a LibrAPP export`)
    }
    return bundle
  }

  async deleteBackup(file) {
    await this.backend.remove(`${BACKUPS}/${file}`)
  }

  /**
   * Forget every book, after copying them.
   *
   * The backups are not touched. Resetting is the act this feature exists to
   * make survivable, and a reset that swept away the way back would be the one
   * thing nobody could undo.
   */
  async resetCatalog() {
    const backup = await this.makeBackup('reset')
    for (const file of await this.sourceNames()) await this.backend.remove(`${SOURCES}/${file}`)
    await this.writeOverrides(emptyOverrides())
    // Removed rather than rebuilt. Rebuilding with no sources is refused, and
    // rightly so: an empty catalog arriving by accident is worth shouting
    // about. This one is on purpose, so what is left behind is a library that
    // looks exactly like one nothing has been added to yet.
    await this.backend.remove(CATALOG)
    return backup
  }

  /**
   * Put a backup back in place of what is here.
   *
   * What it replaces is copied first, so recovering the wrong one costs
   * nothing. Read before anything is removed: a backup that turns out to be
   * unreadable must not leave the library emptied on its way to finding out.
   */
  async restoreBackup(file) {
    const bundle = await this.readBackup(file)
    const replaced = await this.makeBackup('replaced')
    const written = await this.importBundle(bundle, { replace: true })
    await this.rebuild()
    return { replaced, written }
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
