import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import Catalog from './views/Catalog.jsx'
import Shelf from './views/Shelf.jsx'
import ListImport from './views/ListImport.jsx'
import Desk from './views/Desk.jsx'

const VIEWS = [
  { id: 'catalog', glyph: '📖', label: 'Catalog', hint: 'everything you own' },
  { id: 'shelf', glyph: '📷', label: 'Shelf picture', hint: 'read a photograph' },
  { id: 'list', glyph: '📋', label: 'Upload list', hint: 'a file you already keep' },
  { id: 'desk', glyph: '🕮', label: "The LibrAPPrian's desk", hint: 'ask about it' },
]

export default function App() {
  const [view, setView] = useState('catalog')
  const [catalog, setCatalog] = useState(null)
  const [state, setState] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(true)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const next = await api.state()
      setState(next)
      // A catalog is only absent until the first source is ingested, so its
      // absence is a normal state of the app rather than a failure.
      if (next.catalog) setCatalog(await api.catalog())
      else setCatalog(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const rebuild = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await api.rebuild()
      await refresh()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }, [refresh])

  const counts = state?.catalog?.counts

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>
            Libr<em>APP</em>
          </h1>
          <p>your shelf, offline</p>
        </div>

        <nav className="nav">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-current={view === v.id}
              title={v.hint}
            >
              <span className="glyph" aria-hidden="true">
                {v.glyph}
              </span>
              {v.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          {counts ? (
            <dl>
              <dt>books</dt>
              <dd>{counts.books}</dd>
              <dt>authors</dt>
              <dd>{counts.authors}</dd>
              <dt>read</dt>
              <dd>{counts.read}</dd>
              <dt>unread</dt>
              <dd>{counts.unread}</dd>
              <dt>not recorded</dt>
              <dd>{counts.read_unknown}</dd>
            </dl>
          ) : (
            <p style={{ padding: '0 8px' }}>No catalog yet.</p>
          )}
          <div style={{ padding: '0 8px' }}>
            <button className="btn small" onClick={rebuild} disabled={busy}>
              {busy ? 'working…' : 'Rebuild catalog'}
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        {error && (
          <div className="view" style={{ paddingBottom: 0 }}>
            <div className="notice bad">
              <p>
                <strong>{error}</strong>
              </p>
              <p className="tiny">
                If the server is not running, start it with{' '}
                <code>python tools/librapp/serve.py</code>.
              </p>
            </div>
          </div>
        )}

        {busy && !catalog && !error ? (
          <div className="loading">Reading the catalog…</div>
        ) : view === 'catalog' ? (
          <Catalog catalog={catalog} state={state} onGo={setView} />
        ) : view === 'shelf' ? (
          <Shelf onDone={refresh} />
        ) : view === 'list' ? (
          <ListImport state={state} onDone={refresh} />
        ) : (
          <Desk catalog={catalog} />
        )}
      </main>
    </div>
  )
}
