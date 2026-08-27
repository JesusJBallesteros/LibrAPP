import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { loadTable, missingFields, readXlsx, readXml, xmlSections } from '../ingest/table.js'
import { parseKindle } from '../ingest/kindle.js'
import { linesFromPdf } from '../ingest/pdftext.js'
import { stemOf } from '../store/library.js'
import { useT } from '../i18n/index.jsx'

const FORMATS = ['physical', 'ebook', 'audio']
const CONFIDENCES = ['high', 'medium', 'low']

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
        })
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

  const doImport = () =>
    lib.run(async (library) => {
      const before = lib.catalog?.counts?.books ?? 0
      const { file } = pending
      const bytes = new Uint8Array(await file.arrayBuffer())
      const records = await loadTable({
        name: file.name,
        bytes,
        text: new TextDecoder('utf-8').decode(bytes),
        section: section || null,
      })
      const { file: written } = await library.putSource({
        name: await library.nameFor(name, file.name),
        kind: 'table', origin: file.name, format, confidence,
        records, stats: { rows: records.length, section: section || null },
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
    })

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">{t('list.eyebrow')}</p>
        <h2>{t('nav.list')}</h2>
        <hr className="rule" />
        <p>{t('list.intro')}</p>
      </div>

      {error && (
        <div className="notice bad">
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

            <button className="btn primary" onClick={doImport} disabled={lib.busy}>
              {lib.busy ? t('common.importing') : t('list.importAction')}
            </button>
          </div>

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
