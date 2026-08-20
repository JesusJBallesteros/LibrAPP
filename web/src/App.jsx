import { useState } from 'react'
import { useLibrary } from './store/useLibrary.js'
import Catalog from './views/Catalog.jsx'
import Shelf from './views/Shelf.jsx'
import ListImport from './views/ListImport.jsx'
import Desk from './views/Desk.jsx'
import Setup from './views/Setup.jsx'
import Storage from './views/Storage.jsx'

const VIEWS = [
  { id: 'catalog', glyph: '📖', label: 'Catalog', hint: 'everything you own' },
  { id: 'shelf', glyph: '📷', label: 'Shelf picture', hint: 'read a photograph' },
  { id: 'list', glyph: '📋', label: 'Upload list', hint: 'a file you already keep' },
  { id: 'desk', glyph: '🕮', label: "LibrAPPrian's desk", hint: 'ask about it' },
  { id: 'storage', glyph: '🗄', label: 'Library', hint: 'where it lives' },
]

export default function App() {
  const [view, setView] = useState('catalog')
  const lib = useLibrary()
  const counts = lib.catalog?.counts

  if (lib.status === 'opening') {
    return <div className="loading">Opening your library…</div>
  }

  if (lib.status === 'permit') {
    return (
      <div className="view" style={{ maxWidth: 560 }}>
        <header>
          <h2>Reopen your library</h2>
          <p>
            The browser needs you to confirm access to the folder again. It asks once per session,
            and there is nothing LibrAPP can do to skip it.
          </p>
        </header>
        <div className="row">
          <button className="btn primary" onClick={lib.grantPermission}>
            Open the folder
          </button>
          <button className="btn" onClick={lib.forget}>
            Choose somewhere else
          </button>
        </div>
      </div>
    )
  }

  if (lib.status === 'choose') {
    return (
      <Setup
        canPickFolder={lib.canPickFolder}
        onFolder={lib.useFolder}
        onBrowser={lib.useBrowserStorage}
        error={lib.error}
      />
    )
  }

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
            <button key={v.id} onClick={() => setView(v.id)} aria-current={view === v.id} title={v.hint}>
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
            <button className="btn small" onClick={lib.rebuild} disabled={lib.busy || !lib.sources.length}>
              {lib.busy ? 'working…' : 'Rebuild catalog'}
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        {lib.error && (
          <div className="view" style={{ paddingBottom: 0 }}>
            <div className="notice bad">
              <p>
                <strong>{lib.error}</strong>
              </p>
              <button className="btn small" style={{ marginTop: 8 }} onClick={() => lib.setError(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {view === 'catalog' ? (
          <Catalog catalog={lib.catalog} onGo={setView} />
        ) : view === 'shelf' ? (
          <Shelf lib={lib} />
        ) : view === 'list' ? (
          <ListImport lib={lib} />
        ) : view === 'desk' ? (
          <Desk catalog={lib.catalog} />
        ) : (
          <Storage lib={lib} />
        )}
      </main>
    </div>
  )
}
