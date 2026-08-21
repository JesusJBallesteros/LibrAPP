import { useEffect, useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { requestPersistence, storageEstimate } from '../store/fs.js'
import { clearOverride, setRemoved } from '../core/overrides.js'
import { checkCapabilities } from '../store/capabilities.js'

const KINDS = {
  folder: 'a folder you chose — plain files you can open, back up or commit',
  browser: 'browser storage — private to LibrAPP, and only leaves by export',
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`

export default function Storage({ lib, focus }) {
  const [estimate, setEstimate] = useState(null)
  const [note, setNote] = useState(null)
  const [persisted, setPersisted] = useState(null)

  useEffect(() => {
    storageEstimate().then(setEstimate).catch(() => {})
    navigator.storage?.persisted?.().then(setPersisted).catch(() => {})
  }, [lib.sources])

  // Arriving here from "I have a catalog from another device" should land on
  // the import box, not the top of a long page.
  useEffect(() => {
    if (focus !== 'import') return
    const box = document.getElementById('import-box')
    box?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focus])

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

  const capabilities = checkCapabilities()

  const review = lib.catalog?.review || {}
  const removed = review.removed_by_hand || []
  const corrected = review.corrected || []
  const orphaned = review.orphaned_overrides || []

  /** Drop a correction entirely, returning the entry to what the sources say. */
  const undo = (id, title) =>
    lib.run(async (library) => {
      await library.writeOverrides(clearOverride(await library.readOverrides(), id))
      await library.rebuild()
      setNote(`Correction to ${title || id} undone.`)
    })

  /**
   * Bring a removed book back without discarding anything else about it.
   *
   * A book can be both edited and removed, and undoing the removal should not
   * quietly undo the edit as well — that is a second decision the person did
   * not make.
   */
  const restore = (entry) =>
    lib.run(async (library) => {
      const overrides = await library.readOverrides()
      await library.writeOverrides(
        setRemoved(overrides, { id: entry.id, title: entry.title, authors: entry.authors }, false),
      )
      await library.rebuild()
      setNote(`${entry.title || entry.id} restored.`)
    })

  /**
    * Import a catalog exported elsewhere.
    *
    * The file is judged by what is in it, never by what the picker calls it.
    * Android reports a downloaded .json as application/octet-stream often
    * enough that filtering on type hides the very file the person came to
    * choose — so nothing is filtered, and a wrong file is explained instead.
    */
  const importBundle = (file) =>
    lib.run(async (library) => {
      const text = await file.text()
      let bundle
      try {
        bundle = JSON.parse(text)
      } catch {
        throw new Error(
          `${file.name} is not readable as JSON. It may have been renamed, or downloaded only in part.`,
        )
      }
      if (bundle?.librapp_bundle !== 1) {
        throw new Error(
          `${file.name} is not a LibrAPP export. Choose the file you exported from ` +
            'Library → Export on the other device.',
        )
      }
      const written = await library.importBundle(bundle)
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
          <div className="table-scroll">
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
          </div>
        )}
        <p className="tiny faint" style={{ marginTop: 10 }}>
          Every source stays as its ingester wrote it. Rebuilding merges all of them, so removing
          one and rebuilding is how an import is undone.
        </p>
      </div>

      <div className="card">
        <div className="spread">
          <h3 style={{ margin: 0 }}>Your browser</h3>
          <span className={`pill ${capabilities.complete ? 'read' : capabilities.usable ? 'unread' : 'flag'}`}>
            {capabilities.complete
              ? 'everything supported'
              : capabilities.usable
                ? `${capabilities.missingOptional.length} feature(s) unavailable`
                : 'not supported'}
          </span>
        </div>
        <p className="muted tiny" style={{ marginTop: 8 }}>
          Checked by trying each feature, not by reading the browser's name — so this is what your
          browser can actually do, whichever one it is.
        </p>

        <div style={{ marginTop: 12 }}>
          {capabilities.checks.map((c) => (
            <div className="forgotten-item spread" key={c.id}>
              <span>
                <span className="title" style={{ font: '500 14px/1.3 var(--sans)' }}>{c.label}</span>
                <div className="why">
                  {c.needed}
                  {!c.ok && c.fix ? ` — ${c.fix}` : ''}
                </div>
              </span>
              <span className={`pill ${c.ok ? 'read' : c.required ? 'flag' : 'unread'}`}>
                {c.ok ? 'yes' : c.required ? 'missing' : 'no'}
              </span>
            </div>
          ))}
        </div>

        {!capabilities.usable && (
          <div className="notice bad" style={{ marginTop: 12 }}>
            <p className="tiny">
              LibrAPP cannot run properly in this browser. Try a current version of Chrome, Edge,
              Brave, Firefox or Safari.
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Corrections you have made</h3>
        <p className="muted tiny">
          Kept in <code>overrides.json</code>, apart from your sources and applied after every
          rebuild. Removing a book cannot delete it — the next rebuild reads the same sources and
          would put it back — so a removal is recorded here instead, and can be undone.
        </p>

        {!removed.length && !corrected.length && !orphaned.length && (
          <p className="muted" style={{ marginTop: 10 }}>Nothing corrected yet.</p>
        )}

        {removed.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong className="tiny">Removed ({removed.length})</strong>
            {removed.map((r) => (
              <div className="forgotten-item spread" key={r.id}>
                <span>
                  <span className="title">{r.title}</span>
                  {r.why && <div className="why">{r.why}</div>}
                </span>
                <button className="btn small" disabled={lib.busy} onClick={() => restore(r)}>
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        {corrected.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <strong className="tiny">Edited ({corrected.length})</strong>
            {corrected.map((c) => (
              <div className="forgotten-item spread" key={c.id}>
                <span>
                  <span className="title">{c.title}</span>
                  <div className="why">changed {c.fields.join(', ')}</div>
                </span>
                <button className="btn small" disabled={lib.busy} onClick={() => undo(c.id, c.title)}>
                  Undo
                </button>
              </div>
            ))}
          </div>
        )}

        {orphaned.length > 0 && (
          <div className="notice bad" style={{ marginTop: 14 }}>
            <p className="tiny">
              <strong>{orphaned.length} correction(s) no longer match any book.</strong> An entry is
              identified by its author and title, so this happens when a better source supplies a
              fuller title and the identity changes. They are listed rather than dropped, because
              silence would look like the correction had stopped mattering.
            </p>
            {orphaned.map((o) => (
              <div className="forgotten-item spread" key={o.id}>
                <span>
                  <span className="title">{o.title || o.id}</span>
                  <div className="why">{o.removed ? 'was removed' : 'was edited'}{o.at ? ` on ${o.at}` : ''}</div>
                </span>
                <button className="btn small" disabled={lib.busy} onClick={() => undo(o.id, o.title)}>
                  Forget it
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" id="import-box">
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
            hint="choose the .json file you exported — it is added, then rebuilt"
            disabled={lib.busy}
            onFile={importBundle}
          />
        </div>
      </div>
    </div>
  )
}
