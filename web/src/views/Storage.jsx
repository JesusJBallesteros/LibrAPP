import { useEffect, useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { requestPersistence, storageEstimate } from '../store/fs.js'

const KINDS = {
  folder: 'a folder you chose — plain files you can open, back up or commit',
  browser: 'browser storage — private to LibrAPP, and only leaves by export',
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`

export default function Storage({ lib }) {
  const [estimate, setEstimate] = useState(null)
  const [note, setNote] = useState(null)
  const [persisted, setPersisted] = useState(null)

  useEffect(() => {
    storageEstimate().then(setEstimate).catch(() => {})
    navigator.storage?.persisted?.().then(setPersisted).catch(() => {})
  }, [lib.sources])

  const exportBundle = async () => {
    const bundle = await lib.library.exportBundle()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `librapp-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setNote(`Exported ${bundle.sources.length} source(s).`)
  }

  const importBundle = (file) =>
    lib.run(async (library) => {
      const written = await library.importBundle(JSON.parse(await file.text()))
      await library.rebuild()
      setNote(`Imported ${written} source(s) and rebuilt.`)
    })

  return (
    <div className="view">
      <header>
        <h2>Library</h2>
        <p>
          Where your catalog lives, what it was built from, and how to move it to another device.
        </p>
      </header>

      {note && (
        <div className="notice good">
          <p>{note}</p>
        </div>
      )}

      <div className="card">
        <h3>Storage</h3>
        <p className="muted tiny">{KINDS[lib.library?.kind] || 'unknown'}</p>
        {estimate?.quota ? (
          <p className="tiny faint" style={{ marginTop: 8 }}>
            Using {mb(estimate.usage)} of about {mb(estimate.quota)} the browser allows this app.
          </p>
        ) : null}
        {lib.library?.kind === 'browser' && persisted === false && (
          <div className="notice bad" style={{ marginTop: 12 }}>
            <p className="tiny">
              <strong>This storage is not marked persistent.</strong> The browser may clear it if
              the device runs short of space, and your library would go with it. Installing LibrAPP
              usually earns persistence; until then, keep an export.
            </p>
            <button
              className="btn small"
              style={{ marginTop: 8 }}
              onClick={async () => setPersisted(await requestPersistence())}
            >
              Ask for persistent storage
            </button>
          </div>
        )}
        {lib.library?.kind === 'browser' && persisted === true && (
          <p className="tiny" style={{ color: 'var(--good)', marginTop: 10 }}>
            Marked persistent — the browser will not clear it to reclaim space.
          </p>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={lib.forget}>
            Use a different location
          </button>
        </div>
        <p className="tiny faint" style={{ marginTop: 8 }}>
          This forgets where the library is; it does not delete anything.
        </p>
      </div>

      <div className="card">
        <h3>Sources</h3>
        {lib.sources.length === 0 ? (
          <p className="muted">Nothing ingested yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--ink-faint)' }}>
                <th style={{ padding: '4px 0' }}>name</th>
                <th>kind</th>
                <th>from</th>
                <th>trust</th>
                <th style={{ textAlign: 'right' }}>records</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lib.sources.map((s) => (
                <tr key={s.file} style={{ borderTop: '1px solid var(--rule)' }}>
                  <td style={{ padding: '6px 0' }}>{s.source?.name || s.file}</td>
                  <td className="muted">{s.source?.kind || '—'}</td>
                  <td className="faint">{s.error ? <span style={{ color: 'var(--bad)' }}>{s.error}</span> : s.source?.origin}</td>
                  <td className="muted">{s.source?.confidence || '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {s.records?.length ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn small"
                      disabled={lib.busy}
                      onClick={() =>
                        lib.run(async (library) => {
                          await library.deleteSource(s.file)
                          const left = await library.sourceNames()
                          if (left.length) await library.rebuild()
                          setNote(`Removed ${s.file}.`)
                        })
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="tiny faint" style={{ marginTop: 10 }}>
          Every source stays as its ingester wrote it. Rebuilding merges all of them, so removing
          one and rebuilding is how an import is undone.
        </p>
      </div>

      <div className="card">
        <h3>Move this library elsewhere</h3>
        <p className="muted tiny">
          An export holds the sources, not the catalog. The catalog is rebuilt from them on the
          other side, so the two copies cannot drift into disagreeing about which is current.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={exportBundle} disabled={!lib.sources.length}>
            Export
          </button>
        </div>
        <div style={{ marginTop: 14 }}>
          <DropZone
            glyph="📥"
            title="Import an export"
            hint="adds its sources to this library, then rebuilds"
            accept=".json,application/json"
            disabled={lib.busy}
            onFile={importBundle}
          />
        </div>
      </div>
    </div>
  )
}
