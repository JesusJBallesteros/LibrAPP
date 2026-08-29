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
import Barcode from './views/Barcode.jsx'
import Desk from './views/Desk.jsx'
import Setup from './views/Setup.jsx'
import Storage from './views/Storage.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import ContrastToggle from './components/ContrastToggle.jsx'
import { leaveForYourOwn, wantedStart } from './components/DemoWarning.jsx'

const VIEWS = ['catalog', 'shelf', 'list', 'barcode', 'desk', 'storage', 'about']

const NAV_KEY = {
  catalog: 'catalog', shelf: 'shelf', list: 'list', barcode: 'barcode',
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
  // Where a failure lands when the thing that caused it has nowhere of its own
  // to put one. A star pressed at the foot of a long shelf is the case: there
  // is no room beside it for a message, so the message stays here and the page
  // comes to it. Callers with somewhere better pass onError to lib.run and this
  // banner never fires for them.
  //
  // Not smooth, for the same reason the shelf page does not scroll smoothly to
  // its own failures: smooth scrolling can be skipped outright when the page is
  // not being composited, and this is not a message to leave to chance.
  const banner = useRef(null)
  // Whether this load is the one that followed "try yours now", so the front
  // page can open at the ways in rather than at the top.
  const [startHere] = useState(wantedStart)

  // #demo in the address opens the demo library straight away, so a link from
  // the README or from anywhere else lands in a populated app rather than on a
  // page asking for a photograph. Once only, and never over a demo already
  // open. It cannot harm an existing library: the demo is held in memory and
  // has nowhere to write.
  useEffect(() => {
    if (lib.error) banner.current?.scrollIntoView({ block: 'center' })
  }, [lib.error])

  useEffect(() => {
    if (demoAsked.current || lib.status === 'opening' || lib.isDemo) return
    if (!/(^|[?&#])demo(=|&|$)/.test(window.location.search + window.location.hash)) return
    demoAsked.current = true
    lib.useDemo().then(() => {
      setView('catalog')
      // Take the marker back out of the address. Leaving the demo is a reload,
      // and a reload with #demo still on it walks straight back in, so the way
      // out would be shut for as long as the tab lived.
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    })
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
          // The number, not a sentence. The wording and its plural belong to
          // the string that shows it, which is the only way the Spanish one can
          // agree with itself.
          bookCount={counts?.books ?? 0}
          browserUsable={capabilities.usable}
          startHere={startHere}
          onDemo={async () => {
            await lib.useDemo()
            // Straight there rather than through go(). That reads lib.status
            // from the render this closure was built in, which still says no
            // library is open, so it files the destination as pending and
            // returns. Nothing collects it: the pending view is only read while
            // the storage question is on screen, and the demo never asks it. The
            // books loaded and the page did not move.
            setPendingView(null)
            setView('catalog')
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
            >
              {t(`nav.${NAV_KEY[id]}`)}
              {/* The names in here are the house vocabulary and half of them
                  say nothing to somebody who has just arrived: a desk, some
                  stacks. These lines already existed and were in a title
                  attribute, which is a tooltip on a mouse and nothing at all
                  on a phone, so the one place the wording needed explaining
                  was the one place it was hidden. */}
              <span className="nav-hint">{t(`nav.${NAV_KEY[id]}.hint`)}</span>
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
              <span className="row" style={{ gap: 8, marginTop: 8 }}>
                {/* Being persuaded and being set up were two different pages
                    with nothing between them: leaving returned to the same five
                    doors the visitor had already declined. */}
                <button className="btn small primary" onClick={leaveForYourOwn}>
                  {t('demo.tryYours')}
                </button>
                <button className="btn small" onClick={() => window.location.reload()}>
                  {t('demo.leave')}
                </button>
              </span>
            </div>
          </div>
        )}

        {lib.error && (
          <div className="view" style={{ paddingBottom: 0 }}>
            <div className="notice bad" role="alert" ref={banner}>
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
        ) : view === 'barcode' ? (
          <Barcode lib={lib} />
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
