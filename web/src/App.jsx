import { useCallback, useState } from 'react'
import { useLibrary } from './store/useLibrary.js'
import { checkCapabilities } from './store/capabilities.js'
import { useT } from './i18n/index.jsx'
import Landing from './views/Landing.jsx'
import Catalog from './views/Catalog.jsx'
import Shelf from './views/Shelf.jsx'
import ListImport from './views/ListImport.jsx'
import Desk from './views/Desk.jsx'
import Setup from './views/Setup.jsx'
import Storage from './views/Storage.jsx'

const VIEWS = [
  { id: 'home', glyph: '✦' },
  { id: 'catalog', glyph: '📖' },
  { id: 'shelf', glyph: '📷' },
  { id: 'list', glyph: '📋' },
  { id: 'desk', glyph: '🕮' },
  { id: 'storage', glyph: '🗄' },
]

const NAV_KEY = {
  home: 'home', catalog: 'catalog', shelf: 'shelf',
  list: 'list', desk: 'desk', storage: 'library',
}

export default function App() {
  const { t } = useT()
  const lib = useLibrary()
  const [view, setView] = useState('home')
  const [focus, setFocus] = useState(null)
  // Where to return to once storage exists. Each route asks for storage at the
  // point it needs it, rather than the app demanding it at the door.
  const [pendingView, setPendingView] = useState(null)
  const counts = lib.catalog?.counts
  const capabilities = checkCapabilities()

  /** Go to a view, stopping for the storage question only if it is unanswered. */
  const go = useCallback(
    (next, wanted = null) => {
      setFocus(wanted)
      if (next !== 'home' && lib.status !== 'ready') {
        setPendingView(next)
        return
      }
      setPendingView(null)
      setView(next)
    },
    [lib.status],
  )

  if (lib.status === 'opening') {
    return <div className="loading">{t('common.opening')}</div>
  }

  if (lib.status === 'permit') {
    return (
      <div className="view" style={{ maxWidth: 560 }}>
        <header>
          <h2>{t('permit.title')}</h2>
          <p>{t('permit.body')}</p>
        </header>
        <div className="row">
          <button className="btn primary" onClick={lib.grantPermission}>
            {t('permit.open')}
          </button>
          <button className="btn" onClick={lib.forget}>
            {t('permit.elsewhere')}
          </button>
        </div>
      </div>
    )
  }

  // Storage was needed by whatever the person just chose to do. Once it exists,
  // carry on to where they were going.
  if (lib.status === 'choose' && pendingView) {
    return (
      <Setup
        canPickFolder={lib.canPickFolder}
        onFolder={async () => {
          await lib.useFolder()
          setView(pendingView)
          setPendingView(null)
        }}
        onBrowser={async () => {
          await lib.useBrowserStorage()
          setView(pendingView)
          setPendingView(null)
        }}
        onBack={() => setPendingView(null)}
        error={lib.error}
      />
    )
  }

  if (view === 'home' || lib.status !== 'ready') {
    return (
      <Landing
        onGo={go}
        hasCatalog={Boolean(counts?.books)}
        bookCount={counts?.books ? `${counts.books} ${t('sidebar.books')}` : null}
        browserUsable={capabilities.usable}
      />
    )
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="brand brand-button" onClick={() => setView('home')}>
          <h1>
            Libr<em>APP</em>
          </h1>
          <p>{t('app.strapline')}</p>
        </button>

        <nav className="nav">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => go(v.id)}
              aria-current={view === v.id}
              title={t(`nav.${NAV_KEY[v.id]}.hint`)}
            >
              <span className="glyph" aria-hidden="true">
                {v.glyph}
              </span>
              {t(`nav.${NAV_KEY[v.id]}`)}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          {counts ? (
            <dl>
              <dt>{t('sidebar.books')}</dt>
              <dd>{counts.books}</dd>
              <dt>{t('sidebar.authors')}</dt>
              <dd>{counts.authors}</dd>
              <dt>{t('sidebar.read')}</dt>
              <dd>{counts.read}</dd>
              <dt>{t('sidebar.unread')}</dt>
              <dd>{counts.unread}</dd>
              <dt>{t('sidebar.notRecorded')}</dt>
              <dd>{counts.read_unknown}</dd>
            </dl>
          ) : (
            <p style={{ padding: '0 8px' }}>{t('sidebar.noCatalog')}</p>
          )}
          <div style={{ padding: '0 8px' }}>
            <button className="btn small" onClick={lib.rebuild} disabled={lib.busy || !lib.sources.length}>
              {lib.busy ? t('sidebar.working') : t('sidebar.rebuild')}
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
                {t('common.dismiss')}
              </button>
            </div>
          </div>
        )}

        {view === 'catalog' ? (
          <Catalog catalog={lib.catalog} onGo={go} lib={lib} />
        ) : view === 'shelf' ? (
          <Shelf lib={lib} />
        ) : view === 'list' ? (
          <ListImport lib={lib} />
        ) : view === 'desk' ? (
          <Desk catalog={lib.catalog} />
        ) : (
          <Storage lib={lib} focus={focus} />
        )}
      </main>
    </div>
  )
}
