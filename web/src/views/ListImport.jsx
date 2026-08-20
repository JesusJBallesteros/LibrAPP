import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { api } from '../api.js'

const FORMATS = ['physical', 'ebook', 'audio']
const CONFIDENCES = ['high', 'medium', 'low']

export default function ListImport({ state, onDone }) {
  const [probe, setProbe] = useState(null)
  const [name, setName] = useState('list')
  const [section, setSection] = useState('')
  const [format, setFormat] = useState('physical')
  const [confidence, setConfidence] = useState('medium')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setBusy(false)
    }
  }

  const onFile = (file) =>
    run(async () => {
      setResult(null)
      const isPdf = file.name.toLowerCase().endsWith('.pdf')
      if (isPdf) {
        const imported = await api.uploadExport(file, { name: 'export' })
        const built = await api.rebuild()
        setResult({ ...imported, counts: built.counts, kind: 'export' })
        setProbe(null)
        await onDone()
        return
      }
      const info = await api.probeList(file)
      setProbe(info)
      setSection(info.sections.length ? info.sections[0] : '')
      setName(file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'list')
    })

  const doImport = () =>
    run(async () => {
      const imported = await api.importList({
        staged: probe.staged,
        name,
        section,
        format,
        confidence,
      })
      const built = await api.rebuild()
      setResult({ ...imported, counts: built.counts, kind: 'list' })
      setProbe(null)
      await onDone()
    })

  return (
    <div className="view">
      <header>
        <h2>Upload list</h2>
        <p>
          A spreadsheet, a CSV, an XML catalog, or a store export as PDF. Columns are matched by
          name in several languages, so a sheet headed <em>Autor / Título / Género</em> works as
          well as <em>author / title / genre</em>.
        </p>
      </header>

      {error && (
        <div className="notice bad">
          <p>{error}</p>
        </div>
      )}

      <div className="card">
        <DropZone
          glyph="📋"
          title="Drop a list"
          hint=".xlsx · .csv · .tsv · .xml · .pdf"
          accept=".xlsx,.xlsm,.csv,.tsv,.txt,.xml,.pdf"
          disabled={busy}
          onFile={onFile}
        />
      </div>

      {probe && (
        <div className="card">
          <h3>What is in {probe.staged}?</h3>

          {probe.sections.length > 1 && (
            <div className="notice">
              <p className="tiny">
                This file holds more than one list. Pick the one you actually own — importing a
                wishlist as your library is the mistake worth one extra question.
              </p>
            </div>
          )}

          <div className="row" style={{ marginTop: 10, alignItems: 'flex-end' }}>
            {probe.sections.length > 0 && (
              <label className="field">
                Which list
                <select value={section} onChange={(e) => setSection(e.target.value)}>
                  {probe.sections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="field">
              Call it
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  border: '1px solid var(--rule-strong)',
                  background: 'var(--paper)',
                  borderRadius: 7,
                  padding: '6px 8px',
                  width: 130,
                }}
              />
            </label>

            <label className="field">
              These are
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Trust
              <select value={confidence} onChange={(e) => setConfidence(e.target.value)}>
                {CONFIDENCES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <button className="btn primary" onClick={doImport} disabled={busy}>
              {busy ? 'importing…' : 'Import and rebuild'}
            </button>
          </div>

          <p className="tiny faint" style={{ marginTop: 10 }}>
            <strong>These are</strong> is only a fallback: rows that name their own format keep it.
            <strong> Trust</strong> decides who wins when two sources disagree about the same book —
            a verified export outranks a hand-kept list.
          </p>
        </div>
      )}

      {result && (
        <div className="notice good">
          <p>
            <strong>{result.records} rows imported.</strong> The catalog now holds{' '}
            {result.counts.books} books.
          </p>
        </div>
      )}

      {state?.sources?.length > 0 && (
        <div className="card">
          <h3>Sources feeding the catalog</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--ink-faint)' }}>
                <th style={{ padding: '4px 0' }}>name</th>
                <th>kind</th>
                <th>from</th>
                <th>trust</th>
                <th style={{ textAlign: 'right' }}>records</th>
              </tr>
            </thead>
            <tbody>
              {state.sources.map((s) => (
                <tr key={s.file} style={{ borderTop: '1px solid var(--rule)' }}>
                  <td style={{ padding: '6px 0' }}>{s.name || s.file}</td>
                  <td className="muted">{s.kind}</td>
                  <td className="faint">{s.origin}</td>
                  <td className="muted">{s.confidence}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {s.records ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tiny faint" style={{ marginTop: 10 }}>
            Every source stays on disk. Rebuilding merges all of them, so removing one and
            rebuilding is how you undo an import.
          </p>
        </div>
      )}
    </div>
  )
}
