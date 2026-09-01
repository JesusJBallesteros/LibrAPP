import { useEffect, useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import {
  FIELDS,
  detectShape,
  loadTable,
  missingFields,
  readXlsx,
  readXml,
  xmlSections,
} from '../ingest/table.js'
import { parseKindle } from '../ingest/kindle.js'
import { linesFromPdf } from '../ingest/pdftext.js'
import { stemOf } from '../store/library.js'
import DemoWarning from '../components/DemoWarning.jsx'
import { KeepSummary, KeepToggle, useKeepSet } from '../components/Keep.jsx'
import { useT } from '../i18n/index.jsx'

const FORMATS = ['physical', 'ebook', 'audio']

/**
 * What to call each field in the column table.
 *
 * Almost all of these already have a name somewhere in the app, and a book
 * whose date is called Acquired on its own card should not be called
 * acquired_on here.
 */
const FIELD_LABEL = {
  title: 'editor.title',
  authors: 'editor.authors',
  genre: 'book.genre',
  keywords: 'book.tags',
  series: 'book.series',
  series_index: 'editor.volume',
  publisher: 'book.publisher',
  acquired_on: 'book.acquired',
  read: 'book.read',
  format: 'book.formats',
  location: 'book.where',
  isbn: 'book.isbn',
  asin: 'book.asin',
  published_year: 'book.published',
}

/** What a file of this shape most likely holds, where that is worth assuming. */
const FORMAT_FOR_SHAPE = { kindle: 'ebook' }
const CONFIDENCES = ['high', 'medium', 'low']

// How many rows to draw before asking. A spreadsheet exported from a store
// can hold a few thousand, and every row here is a button and three pieces of
// text. Drawing all of them costs a phone a visible pause for a list nobody
// reads to the end.
const ROWS_AT_FIRST = 200

const suffixOf = (name) => (/\.[^.]+$/.exec(name || '') || [''])[0].toLowerCase()

/** Which named lists a file holds, so a wishlist is never imported as a library. */
async function probe(file) {
  const suffix = suffixOf(file.name)
  if (suffix === '.xml') {
    return { suffix, sections: xmlSections(readXml(await file.text())) }
  }
  if (suffix === '.xlsx' || suffix === '.xlsm') {
    // readXlsx names its sheets in the error when asked for one that is absent,
    // which is a cheap way to list them without a second code path.
    try {
      await readXlsx(new Uint8Array(await file.arrayBuffer()), ' none')
      return { suffix, sections: [] }
    } catch (err) {
      const m = /it has (\[.*\])/.exec(err.message)
      return { suffix, sections: m ? JSON.parse(m[1]).filter(Boolean) : [] }
    }
  }
  return { suffix, sections: [] }
}

/**
 * What the librarian says once an import lands.
 *
 * The parser reports how many records a file held, and the catalog reports how
 * many books it holds afterwards. The difference is how many were new, and the
 * remainder is how many merged into a book already here. Both figures are
 * counted rather than assumed: a source file carries no record of what the
 * catalog already knew.
 */
export function arrival(before, after, records) {
  if (typeof before !== 'number' || typeof after !== 'number') return null
  const added = Math.max(0, Math.min(records, after - before))
  return { kind: 'imported', added, known: Math.max(0, records - added) }
}

export default function ListImport({ lib, onOwl }) {
  const { t } = useT()
  const [pending, setPending] = useState(null)
  const [name, setName] = useState('list')
  const [section, setSection] = useState('')
  const [format, setFormat] = useState('physical')
  const [confidence, setConfidence] = useState('medium')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [working, setWorking] = useState(false)
  // The rows themselves, parsed as soon as the file and the chosen list are
  // settled. This page used to write a spreadsheet without ever showing what
  // was in it, which made it the one way in with nothing to check.
  const [rows, setRows] = useState(null)
  // What the reading made of each column, and any correction to it. The
  // correction is keyed by column rather than by field, because two columns
  // can name one field and only one of them is being talked about.
  const [columns, setColumns] = useState(null)
  const [mapping, setMapping] = useState({})
  const [shape, setShape] = useState(null)
  const [rowError, setRowError] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const { dropped, toggle, reset } = useKeepSet()

  const onFile = async (file) => {
    setError(null)
    setResult(null)
    setWorking(true)
    const before = lib.catalog?.counts?.books ?? 0
    try {
      if (suffixOf(file.name) === '.pdf') {
        const pdfjs = await import('pdfjs-dist/build/pdf.mjs')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url,
        ).href
        const pages = await linesFromPdf(pdfjs, new Uint8Array(await file.arrayBuffer()))
        const { records, stats } = parseKindle(pages)
        await lib.run(async (library) => {
          const { file: written } = await library.putSource({
            name: await library.nameFor(`export-${stemOf(file.name)}`, file.name),
            kind: 'store-export', origin: file.name,
            format: 'ebook', confidence: 'high', records, stats,
          })
          const catalog = await library.rebuild()
          setResult({ records: records.length, counts: catalog.counts, stats, written })
          onOwl?.(arrival(before, catalog.counts?.books, records.length))
        }, { onError: setError })
        return
      }
      const info = await probe(file)
      setPending({ file, ...info })
      setSection(info.sections[0] || '')
      setName(file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'list')
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  // Parsed here rather than inside the import, so the rows can be looked at
  // and set aside first. Re-runs when the chosen list changes, because a
  // different sheet of the same file is a different set of rows.
  useEffect(() => {
    if (!pending) {
      setRows(null)
      return undefined
    }
    let cancelled = false
    setRows(null)
    setRowError(null)
    setShowAll(false)
    reset()
    ;(async () => {
      try {
        const bytes = new Uint8Array(await pending.file.arrayBuffer())
        const read = await loadTable({
          name: pending.file.name,
          bytes,
          text: new TextDecoder('utf-8').decode(bytes),
          section: section || null,
          mapping,
        })
        if (cancelled) return
        setRows(read.records)
        setColumns(read.columns)
        // Only on the first reading. A re-reading after a correction must not
        // decide again what the file is, or a reader who has just said it is
        // not a Kindle export would be told that it is.
        setShape((was) => {
          if (was !== null) return was
          const found = detectShape(read.columns)
          if (found && FORMAT_FOR_SHAPE[found]) setFormat(FORMAT_FOR_SHAPE[found])
          return found
        })
      } catch (err) {
        if (!cancelled) setRowError(err.message)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, section, mapping])

  // Row numbers are the key. Nothing in a spreadsheet row is reliably unique,
  // and two copies of the same title are two books until somebody says
  // otherwise.
  const keptRows = rows ? rows.filter((_, i) => !dropped.has(i)) : []

  /**
   * Point a column at a different field, or at nothing.
   *
   * Kept per column rather than per field: two columns can name one field, and
   * a reader correcting one of them is not saying anything about the other.
   * The file is read again, because a column's meaning is the reading.
   */
  const point = (key, field) => setMapping((was) => ({ ...was, [key]: field }))

  /**
   * Say what wrote this file, which is a guess the reader can overrule.
   *
   * A Kindle library is ebooks and saying so saves a second answer. Nothing is
   * assumed for the others: a Calibre library holds whatever its owner put in
   * it, and guessing there would be guessing about the books rather than about
   * the file.
   */
  const chooseShape = (id) => {
    setShape(id)
    if (FORMAT_FOR_SHAPE[id]) setFormat(FORMAT_FOR_SHAPE[id])
  }

  // How many of these could be looked up without guessing, which is the whole
  // of the argument for doing it.
  const withIsbn = rows ? rows.filter((r) => r.isbn).length : 0
  const formatColumn = columns?.find((c) => c.field === 'format' && c.used) || null

  const doImport = () =>
    lib.run(async (library) => {
      const before = lib.catalog?.counts?.books ?? 0
      const { file } = pending
      // Already parsed for the preview. Reading the file a second time here
      // would be a second chance to disagree with what was on the screen.
      const records = keptRows
      const { file: written } = await library.putSource({
        name: await library.nameFor(name, file.name),
        kind: 'table', origin: file.name, format, confidence,
        records,
        // What the file held, and what of it was kept. A source that says 40
        // rows when the sheet had 60 should say so in its own stats.
        stats: {
          rows: records.length,
          of: rows.length,
          section: section || null,
        },
      })
      const catalog = await library.rebuild()
      setPending(null)
      setResult({
        records: records.length,
        counts: catalog.counts,
        written,
        // What this list did not carry. Said here rather than nowhere: a file
        // with no read column empties the desk's unread pile without ever
        // explaining itself, and the reader is left thinking the app is broken.
        missing: missingFields(records),
      })
      onOwl?.(arrival(before, catalog.counts?.books, records.length))
    }, { onError: setError })

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">{t('list.eyebrow')}</p>
        <h2>{t('nav.list')}</h2>
        <hr className="rule" />
        <p>{t('list.intro')}</p>
      </div>

      <DemoWarning lib={lib} />

      {/* Step one --------------------------------------------------------- */}
      <section className="shelf-step" style={{ marginTop: 28 }}>
        <h3 className="step-head">{t('list.stepOne')}</h3>
        <p style={{ marginTop: 8 }}>{t('list.stepOne.note')}</p>
        <ul className="tiny faint" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {['xlsx', 'csv', 'xml', 'pdf'].map((kind) => (
            <li key={kind}>{t(`list.format.${kind}`)}</li>
          ))}
        </ul>

        {/* A failure to read a file lands beside the box it was dropped in. A
            failure to import does not: that button is three steps down. */}
        {error && !pending && (
          <div className="notice bad" role="alert" style={{ marginTop: 12 }}>
            <p>{error}</p>
          </div>
        )}

        <div className="drop-wide" style={{ marginTop: 14 }}>
          <DropZone
            mark="page"
            title={t('list.drop')}
            hint=".xlsx · .csv · .tsv · .xml · .pdf"
            accept=".xlsx,.xlsm,.csv,.tsv,.txt,.xml,.pdf"
            disabled={working || lib.busy}
            onFile={onFile}
          />
          {working && <p className="tiny faint" style={{ marginTop: 10 }}>{t('list.reading')}</p>}
        </div>
      </section>

      {pending && (
        <>
          {/* Step two ----------------------------------------------------- */}
          <section className="shelf-step" style={{ marginTop: 34 }}>
            <div className="spread">
              <h3 className="step-head">{t('list.stepTwo')}</h3>
              <span className="tabular tiny faint">{pending.file.name}</span>
            </div>

            {/* Everything here is answered already. A reader who agrees with
                all of it goes straight on to the books below. */}
            <p style={{ marginTop: 8 }}>
              {shape ? t('list.readAs', { what: t(`list.shape.${shape}`) }) : t('list.readAsOther')}
            </p>

            {pending.sections.length > 1 && (
              <div className="notice" style={{ marginTop: 12 }}>
                <p className="tiny">{t('list.manyLists')}</p>
              </div>
            )}

            <div className="import-controls" style={{ marginTop: 14 }}>
              {pending.sections.length > 0 && (
                <label className="field">
                  {t('list.whichList')}
                  <select value={section} onChange={(e) => setSection(e.target.value)}>
                    {pending.sections.map((one) => (
                      <option key={one} value={one}>
                        {one}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="field">
                {t('list.whichShape')}
                <select value={shape || 'other'} onChange={(e) => chooseShape(e.target.value)}>
                  {['kindle', 'calibre', 'other'].map((id) => (
                    <option key={id} value={id}>
                      {t(`list.shape.${id}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                {t('list.theseAre')}
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {t(`format.${f}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="tiny faint" style={{ marginTop: 8 }}>
              {formatColumn
                ? t('list.formatFromFile', { column: formatColumn.header })
                : t('list.formatForAll')}
            </p>

            {rows && (
              <p className="tiny" style={{ marginTop: 12 }}>
                {withIsbn
                  ? t('list.withIsbn', { n: withIsbn, total: rows.length })
                  : t('list.noIsbn')}
              </p>
            )}

            {columns && (
              <>
                {/* A panel heading rather than a section one: this sits
                    inside a step that already has a heading, and the section
                    rule under a second one clipped its own count off the edge
                    of a phone. */}
                <div className="spread" style={{ marginTop: 22 }}>
                  <h3 className="panel-head" style={{ margin: 0 }}>{t('list.columns')}</h3>
                  <span className="tabular tiny faint">
                    {t('list.columnsRead', {
                      n: columns.filter((c) => c.field).length,
                      of: columns.length,
                    })}
                  </span>
                </div>
                <p className="tiny faint">{t('list.columnsNote')}</p>

                <ul className="column-map">
                  {columns.map((column) => (
                    <li key={column.key}>
                      <span className="column-name">
                        <span className="tabular">{column.header}</span>
                        {column.sample && (
                          <span className="tiny faint column-sample">{column.sample}</span>
                        )}
                      </span>
                      <select
                        value={column.field || ''}
                        aria-label={t('list.columnIs', { column: column.header })}
                        onChange={(e) => point(column.key, e.target.value || null)}
                      >
                        <option value="">{t('list.column.ignore')}</option>
                        {FIELDS.map((field) => (
                          <option key={field} value={field}>
                            {t(FIELD_LABEL[field])}
                          </option>
                        ))}
                      </select>
                      <span className="tiny faint column-count">
                        {column.field ? t('list.columnFilled', { n: column.rows }) : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Step three --------------------------------------------------- */}
          <section className="shelf-step" style={{ marginTop: 34 }}>
            <h3 className="step-head">
              {rows ? t('list.stepThree', { n: rows.length }) : t('list.stepThreeWaiting')}
            </h3>

            {rowError ? (
              <div className="notice bad" role="alert" style={{ marginTop: 12 }}>
                <p className="tiny">{rowError}</p>
              </div>
            ) : rows === null ? (
              <p className="tiny faint" style={{ marginTop: 10 }}>{t('list.reading')}</p>
            ) : (
              <>
                <p className="tiny faint" style={{ marginTop: 8 }}>{t('keep.note')}</p>

                <ul className="lookup-list">
                  {(showAll ? rows : rows.slice(0, ROWS_AT_FIRST)).map((record, i) => {
                    const isDropped = dropped.has(i)
                    return (
                      <li key={i} className={isDropped ? 'discarded' : undefined}>
                        <span>
                          <span className="title">{record.title}</span>
                          <br />
                          <span className="tiny muted">
                            {[
                              (record.authors || []).join(', ') || t('isbn.noAuthor'),
                              record.publisher,
                              record.published_year,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>
                        <span className="lookup-fate tiny">
                          {isDropped && <span className="faint">{t('keep.discardedTag')}</span>}
                          <KeepToggle
                            dropped={isDropped}
                            disabled={lib.busy}
                            onToggle={() => toggle(i)}
                          />
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {rows.length > ROWS_AT_FIRST && !showAll && (
                  <p className="tiny faint">
                    {t('list.showingSome', { shown: ROWS_AT_FIRST, n: rows.length })}{' '}
                    <button className="btn link" onClick={() => setShowAll(true)}>
                      {t('list.showAll', { n: rows.length })}
                    </button>
                  </p>
                )}

                <KeepSummary kept={keptRows.length} total={rows.length} />
              </>
            )}
          </section>

          {/* Step four ---------------------------------------------------- */}
          <section className="shelf-step" style={{ marginTop: 34 }}>
            <h3 className="step-head">{t('list.stepFour')}</h3>

            <div className="import-controls" style={{ marginTop: 14 }}>
              <label className="field">
                {t('list.callIt')}
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <label className="field">
                {t('list.trust')}
                <select value={confidence} onChange={(e) => setConfidence(e.target.value)}>
                  {CONFIDENCES.map((c) => (
                    <option key={c} value={c}>
                      {t(`confidence.${c}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="tiny faint" style={{ marginTop: 10 }}>
              <strong>{t('list.theseAre')}</strong> {t('list.theseAreNote')}{' '}
              <strong>{t('list.trust')}</strong> {t('list.trustNote')}
            </p>

            {/* Beside the button, not at the top of a page this long. */}
            {error && (
              <div className="notice bad" role="alert" style={{ marginTop: 12 }}>
                <p className="tiny">{error}</p>
              </div>
            )}

            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn primary"
                onClick={doImport}
                disabled={lib.busy || !keptRows.length}
              >
                {lib.busy ? t('common.importing') : t('list.importAction')}
              </button>
            </div>
          </section>
        </>
      )}

      {result && (
        <div className="notice good">
          <p>
            <strong>{t('list.imported', { n: result.records })}</strong>{' '}
            {t('list.nowHolds', { n: result.counts.books })}
            {result.written && ` ${t('list.savedAs', { name: result.written })}`}
          </p>
          {result.stats?.amazon_declared_total ? (
            <p className="tiny">
              {t('list.declared', {
                declared: result.stats.amazon_declared_total,
                read: result.stats.parsed_records,
                difference: result.stats.parsed_records - result.stats.amazon_declared_total,
              })}
            </p>
          ) : null}
          {result.missing?.length > 0 && (
            <div className="missing-columns">
              <p className="tiny">
                <strong>{t('list.missingTitle')}</strong>
              </p>
              <ul className="tiny">
                {result.missing.map((field) => (
                  <li key={field}>{t(`list.missing.${field}`)}</li>
                ))}
              </ul>
              <p className="tiny faint">{t('list.missingHow')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
