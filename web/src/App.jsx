import { useCallback, useEffect, useRef, useState } from 'react'
import { useLibrary } from './store/useLibrary.js'
import { checkCapabilities } from './store/capabilities.js'
import { useT } from './i18n/index.jsx'
import Librarian from './components/Librarian.jsx'
import { dismiss as dismissLibrarian, isDismissed, restore as restoreLibrarian } from './store/librarian.js'
import Landing from './views/Landing.jsx'
import About from './views/About.jsx'
import Catalog from './views/Catalog.jsx'
import Shelf from './views/Shelf.jsx'
import ListImport from './views/ListImport.jsx'
import Desk from './views/Desk.jsx'
import Setup from './views/Setup.jsx'
import Storage from './views/Storage.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import ContrastToggle from './components/ContrastToggle.jsx'

const VIEWS = ['catalog', 'shelf', 'list', 'desk', 'storage', 'about']

const NAV_KEY = {
  catalog: 'catalog', shelf: 'shelf', list: 'list',
  desk: 'desk', storage: 'stacks', about: 'about',
}

export default function App() {
  const { t } = useT()
  const lib = useLibrary()
  const [view, setView] = useState('home')
  const [focus, setFocus] = useState(null)
  // The owl is drawn in one place and put away from another, so the preference
  // is held here rather than inside either of them. The same goes for what it
  // is currently reporting: the views that start the work say so, and clear it
  // when the work finishes rather than on a timer.
  const [owlGone, setOwlGone] = useState(isDismissed)
  const [owlEvent, setOwlEvent] = useState(null)
  // Where About was opened from, so leaving it returns to that view rather
  // than to the front page.
  const [before, setBefore] = useState('home')
  // Where to return to once storage exists. Each route asks for storage at the
  // point it needs it, rather than the app demanding it at the door.
  const [pendingView, setPendingView] = useState(null)
  const counts = lib.catalog?.counts
  const capabilities = checkCapabilities()
  const demoAsked = useRef(false)

  // #demo in the address opens the demo library straight away, so a link from
  // the README or from anywhere else lands in a populated app rather than on a
  // page asking for a photograph. Once only, and never over a demo already
  // open. It cannot harm an existing library: the demo is held in memory and
  // has nowhere to write.
  useEffect(() => {
    if (demoAsked.current || lib.status === 'opening' || lib.isDemo) return
    if (!/(^|[?&#])demo(=|&|$)/.test(window.location.search + window.location.hash)) return
    demoAsked.current = true
    lib.useDemo().then(() => setView('catalog'))
  }, [lib])

  /** Go to a view, stopping for the storage question only if it is unanswered. */
  // A single page app changes what it shows without changing what it is
  // called, so a screen reader announces the same title on every view and a
  // row of open tabs says nothing that tells them apart. The view leads, since
  // that is the part that differs.
  useEffect(() => {
    const here = view === 'home' ? null : t(`nav.${NAV_KEY[view] || view}`)
    document.title = here ? `${here} · LibrAPP` : 'LibrAPP'
  }, [view, t])

  const go = useCallback(
    (next, wanted = null) => {
      setFocus(wanted)
      // About needs no storage, so it must not be routed through the storage
      // question the way the working views are.
      if (next === 'about') {
        setBefore((current) => (view === 'about' ? current : view))
        setView('about')
        return
      }
      if (next !== 'home' && lib.status !== 'ready') {
        setPendingView(next)
        return
      }
      setPendingView(null)
      setView(next)
    },
    [lib.status, view],
  )

  if (lib.status === 'opening') {
    return <div className="loading">{t('common.opening')}</div>
  }

  // About has to be readable before a library exists, and there is no shell to
  // put it in at that point, so it gets a page of its own with a way back.
  if (view === 'about' && lib.status !== 'ready') {
    return <About focus={focus} onBack={() => setView(before)} />
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
      <>
        <Landing
          onGo={go}
          hasCatalog={Boolean(counts?.books)}
          bookCount={counts?.books ? `${counts.books} ${t('sidebar.books')}` : null}
          browserUsable={capabilities.usable}
          onDemo={async () => {
            await lib.useDemo()
            go('catalog')
          }}
        />
        <Librarian
          view="home"
          counts={counts}
          books={lib.catalog?.books || []}
          hasCatalog={Boolean(counts?.books)}
          onGo={go}
          gone={owlGone}
          onDismiss={() => {
            dismissLibrarian()
            setOwlGone(true)
          }}
        />
      </>
    )
  }

  return (
    <div className="shell">
      {/* Thirteen tab stops stand between the top of the page and its content,
          on every view, every time. This is the way past them, and it shows
          only when focused, because it exists for the people who would
          otherwise walk through all thirteen. It has to come before the
          sidebar to be the first thing a Tab reaches. */}
      <a className="skip-link" href="#content">
        {t('a11y.skipToContent')}
      </a>
      <aside className="sidebar">
        <button className="brand brand-button" onClick={() => setView('home')}>
          <h1>
            Libr<em>APP</em>
          </h1>
          <span className="brand-rule" aria-hidden="true" />
          <p className="eyebrow">{t('app.strapline')}</p>
        </button>

        <nav className="nav">
          {VIEWS.map((id) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={view === id ? 'page' : undefined}
              title={t(`nav.${NAV_KEY[id]}.hint`)}
            >
              {t(`nav.${NAV_KEY[id]}`)}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <p className="eyebrow">{t('sidebar.holdings')}</p>
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
          <ThemeToggle />
        <ContrastToggle />

          <nav className="sidebar-links">
            {[
              ['foot.about', null],
              ['foot.privacy', 'privacy'],
              ['foot.licence', 'licence'],
            ].map(([key, section], i) => (
              <span key={key}>
                {i > 0 && <span aria-hidden="true"> · </span>}
                <button className="btn link" onClick={() => go('about', section)}>
                  {t(key)}
                </button>
              </span>
            ))}
          </nav>
        </div>
      </aside>

      <main className="main" id="content" tabIndex={-1}>
        {/* Above everything, on every page, for as long as the demo is open.
            Somebody who forgets which library they are in and starts correcting
            books would lose the work on the next reload, so this does not
            dismiss. */}
        {lib.isDemo && (
          <div className="view" style={{ paddingBottom: 0 }}>
            <div className="notice demo-notice">
              <p>
                <strong>{t('demo.banner')}</strong>
              </p>
              <p className="tiny">{t('demo.bannerWhy')}</p>
              <button
                className="btn small"
                style={{ marginTop: 8 }}
                onClick={() => window.location.reload()}
              >
                {t('demo.leave')}
              </button>
            </div>
          </div>
        )}

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
          <Catalog catalog={lib.catalog} onGo={go} lib={lib} focus={focus} />
        ) : view === 'shelf' ? (
          <Shelf lib={lib} onOwl={setOwlEvent} />
        ) : view === 'list' ? (
          <ListImport lib={lib} onOwl={setOwlEvent} />
        ) : view === 'desk' ? (
          <Desk catalog={lib.catalog} onGo={go} onOwl={setOwlEvent} lib={lib} />
        ) : view === 'about' ? (
          <About focus={focus} inShell />
        ) : (
          <Storage
            lib={lib}
            focus={focus}
            owlGone={owlGone}
            onRestoreOwl={() => {
              restoreLibrarian()
              setOwlGone(false)
            }}
          />
        )}

        {/* Not on About: that is the page where the app explains itself, and a
            character talking over the explanation reads badly. */}
        {view !== 'about' && (
          <Librarian
            view={view}
            counts={counts}
            books={lib.catalog?.books || []}
            hasCatalog={Boolean(counts?.books)}
            event={owlEvent}
            onGo={go}
            gone={owlGone}
            onDismiss={() => {
              dismissLibrarian()
              setOwlGone(true)
            }}
          />
        )}
      </main>
    </div>
  )
}
