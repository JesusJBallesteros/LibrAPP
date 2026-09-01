import { useEffect, useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { loadTable, missingFields, readXlsx, readXml, xmlSections } from '../ingest/table.js'
import { parseKindle } from '../ingest/kindle.js'
import { linesFromPdf } from '../ingest/pdftext.js'
import { stemOf } from '../store/library.js'
import DemoWarning from '../components/DemoWarning.jsx'
import { KeepSummary, KeepToggle, useKeepSet } from '../components/Keep.jsx'
import { useT } from '../i18n/index.jsx'

const FORMATS = ['physical', 'ebook', 'audio']
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
        const { records } = await loadTable({
          name: pending.file.name,
          bytes,
          text: new TextDecoder('utf-8').decode(bytes),
          section: section || null,
        })
        if (!cancelled) setRows(records)
      } catch (err) {
        if (!cancelled) setRowError(err.message)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, section])

  // Row numbers are the key. Nothing in a spreadsheet row is reliably unique,
  // and two copies of the same title are two books until somebody says
  // otherwise.
  const keptRows = rows ? rows.filter((_, i) => !dropped.has(i)) : []

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

      {/* The drop zone is right below this, so a failure to read a file
          lands beside it. A failure to import does not: that button is at the
          bottom of the panel below, and its message goes there. */}
      {error && !pending && (
        <div className="notice bad" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="drop-wide">
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

      {pending && (
        <section className="desk-section" style={{ marginTop: 34 }}>
          <div className="section-head spread">
            <h3>{t('list.whatIsIn', { name: pending.file.name })}</h3>
            {/* A plain CSV has no named sections. Reporting "0 lists found"
                for it would state something the file never said. */}
            {pending.sections.length > 0 && (
              <span className="tabular tiny faint">
                {t('list.listsFound', { n: pending.sections.length })}
              </span>
            )}
          </div>

          {pending.sections.length > 1 && (
            <div className="notice">
              <p className="tiny">{t('list.manyLists')}</p>
            </div>
          )}

          <div className="import-controls">
            {pending.sections.length > 0 && (
              <label className="field">
                {t('list.whichList')}
                <select value={section} onChange={(e) => setSection(e.target.value)}>
                  {pending.sections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="field">
              {t('list.callIt')}
              <input value={name} onChange={(e) => setName(e.target.value)} />
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

          {/* What is actually in the file. Everything above this decides how the
              rows are read; this is the rows. */}
          {rowError ? (
            <div className="notice bad" role="alert" style={{ marginTop: 14 }}>
              <p className="tiny">{rowError}</p>
            </div>
          ) : rows === null ? (
            <p className="tiny faint" style={{ marginTop: 14 }}>{t('list.reading')}</p>
          ) : (
            <>
              <div className="section-head spread" style={{ marginTop: 20 }}>
                <h3>{t('list.whatItHolds', { n: rows.length })}</h3>
              </div>
              <p className="tiny faint">{t('keep.note')}</p>

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
                        {isDropped && (
                          <span className="faint">{t('keep.discardedTag')}</span>
                        )}
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

              {/* Beside the button, not at the top of the page. This panel is
                  long enough on a phone that the two are never on screen
                  together. */}
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
            </>
          )}

          <p className="tiny faint" style={{ marginTop: 10 }}>
            <strong>{t('list.theseAre')}</strong> {t('list.theseAreNote')}{' '}
            <strong>{t('list.trust')}</strong> {t('list.trustNote')}
          </p>
        </section>
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
