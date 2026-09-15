import { useCallback, useEffect, useRef, useState } from 'react'
import { HardDrive, House, Info, Library, Plus, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react'
import { useLibrary } from './store/useLibrary.js'
import { checkCapabilities } from './store/capabilities.js'
import { useT } from './i18n/index.jsx'
import Librarian from './components/Librarian.jsx'
import ToTop from './components/ToTop.jsx'
import { dismiss as dismissLibrarian, isDismissed, restore as restoreLibrarian } from './store/librarian.js'
import Landing from './views/Landing.jsx'
import About from './views/About.jsx'
import Catalog from './views/Catalog.jsx'
import Shelf from './views/Shelf.jsx'
import ListImport from './views/ListImport.jsx'
import Kindle from './views/Kindle.jsx'
import Barcode from './views/Barcode.jsx'
import Desk from './views/Desk.jsx'
import Setup from './views/Setup.jsx'
import Storage from './views/Storage.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Add, { ADD_VIEWS } from './views/Add.jsx'
import { leaveForYourOwn, wantedStart } from './components/DemoWarning.jsx'

// Six places. The four ways in share one, Add, which opens on the photograph
// and carries the other three as tabs.
const NAV = [
  { id: 'home', key: 'home', Icon: House },
  { id: 'catalog', key: 'catalog', Icon: Library },
  { id: 'shelf', key: 'add', Icon: Plus },
  { id: 'desk', key: 'desk', Icon: Sparkles },
  { id: 'storage', key: 'stacks', Icon: HardDrive },
  { id: 'about', key: 'about', Icon: Info },
]

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
  // The folder just picked, waiting to be confirmed or changed.
  const [picked, setPicked] = useState(null)
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

  // #kindle opens the page about getting a library out of Amazon. That page is
  // the answer to a question people go looking for on its own — Amazon has no
  // export button — and it needs no library, so it can be linked to directly
  // and read by somebody who has never opened this app.
  useEffect(() => {
    if (!/(^|[?&#])kindle(=|&|$)/.test(window.location.hash)) return
    setBefore('home')
    setView('kindle')
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

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
      // question the way the working views are. Nor does the Kindle page: it is
      // instructions and a file to download, and asking where to keep a catalog
      // before somebody may read how to get their books out of Amazon is a door
      // in front of a door.
      if (next === 'about' || next === 'kindle') {
        setBefore((current) => (view === next ? current : view))
        setView(next)
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

  // And so does the Kindle page. It writes nothing: it is instructions and a
  // file to download, and asking somebody where to keep a catalog before they
  // are allowed to read how to get their books out of Amazon is a door in front
  // of a door.
  if (view === 'kindle' && lib.status !== 'ready') {
    return <Kindle onGo={go} onBack={() => setView(before)} />
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
  if (pendingView && (lib.status === 'choose' || picked)) {
    return (
      <Setup
        canPickFolder={lib.canPickFolder}
        // Shown rather than taken. The picker is easy to answer with the wrong
        // directory, and until now nothing said which one had been answered
        // with.
        chosen={picked}
        onNext={() => {
          setPicked(null)
          setView(pendingView)
          setPendingView(null)
        }}
        onFolder={async () => {
          // The library it adopted, handed back. Reading lib.library here
          // would read the render this closure was built in, which is the
          // trap that swallowed the demo button.
          const library = await lib.useFolder()
          setPicked(library?.where ?? null)
        }}
        onBrowser={async () => {
          await lib.useBrowserStorage()
          setView(pendingView)
          setPendingView(null)
        }}
        onBack={() => {
          setPicked(null)
          setPendingView(null)
        }}
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
          lib={lib}
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
        <ToTop />

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

  const inAdd = ADD_VIEWS.includes(view)

  const page =
    view === 'catalog' ? (
          <Catalog catalog={lib.catalog} onGo={go} lib={lib} focus={focus} />
        ) : view === 'shelf' ? (
          <Shelf lib={lib} onOwl={setOwlEvent} />
        ) : view === 'list' ? (
          <ListImport lib={lib} onGo={go} onOwl={setOwlEvent} />
        ) : view === 'barcode' ? (
          <Barcode lib={lib} />
        ) : view === 'desk' ? (
          <Desk catalog={lib.catalog} onGo={go} onOwl={setOwlEvent} lib={lib} />
        ) : view === 'kindle' ? (
          <Kindle onGo={go} />
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
        )

  return (
    <div className="shell" data-view={view}>
      {/* The way past the rail's eight tab stops. Shown only when focused, and
          first in the page so it is the first thing a Tab reaches. */}
      <a className="skip-link" href="#content">
        {t('a11y.skipToContent')}
      </a>

      {/* A bar along the foot of a phone, a rail down the left of anything
          wider. The short name is the visible label; the full name and its
          gloss are the title. */}
      <nav className="rail" aria-label={t('nav.menu')}>
        <div className="rail-places">
          {NAV.map(({ id, key, Icon }) => (
            <button
              key={id}
              className="rail-item"
              onClick={() => go(id)}
              aria-current={(id === 'shelf' ? inAdd : view === id) ? 'page' : undefined}
              title={`${t(`nav.${key}`)} · ${t(`nav.${key}.hint`)}`}
            >
              <Icon aria-hidden="true" focusable="false" />
              <span className="rail-label">{t(`nav.short.${key}`)}</span>
            </button>
          ))}
        </div>
        <div className="rail-foot">
          <ThemeToggle icons />
        </div>
      </nav>

      <main className="main" id="content" tabIndex={-1}>
        <header className="shell-head">
          <button className="wordmark" onClick={() => go('home')} title={t('nav.home')}>
            Libr<em>APP</em>
          </button>
        </header>

        {/* On every page for as long as the demo is open. It does not dismiss:
            corrections made in the demo are lost on the next reload. */}
        {lib.isDemo && (
          <div className="demo-bar" role="note">
            <TriangleAlert className="demo-bar-icon" aria-hidden="true" focusable="false" />
            <div className="demo-bar-text">
              <p>
                <strong>{t('demo.banner')}</strong>
              </p>
              <p>{t('demo.bannerWhy')}</p>
            </div>
            <div className="demo-bar-actions">
              <button className="btn small primary" onClick={leaveForYourOwn}>
                {t('demo.tryYours')}
              </button>
              <button className="btn small" onClick={() => window.location.reload()}>
                {t('demo.leave')}
              </button>
            </div>
          </div>
        )}

        {lib.error && (
          <div className="notice bad" role="alert" ref={banner}>
            <p>
              <strong>{lib.error}</strong>
            </p>
            <button className="btn small" style={{ marginTop: 8 }} onClick={() => lib.setError(null)}>
              {t('common.dismiss')}
            </button>
          </div>
        )}

        {inAdd ? (
          <Add view={view} onGo={go}>
            {page}
          </Add>
        ) : (
          page
        )}

        {/* On every page, About included: it is a long one and this only goes
            somewhere. */}
        <ToTop />

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

      {/* A third column from 1040px. Narrower, it is drawn only under the
          stacks page, so the counts and Rebuild are always somewhere. */}
      <aside className="margin" aria-label={t('sidebar.holdings')}>
        <section>
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
            <p>{t('sidebar.noCatalog')}</p>
          )}
          <button
            className="btn small margin-rebuild"
            onClick={lib.rebuild}
            disabled={lib.busy || !lib.sources.length}
          >
            <RefreshCw aria-hidden="true" focusable="false" />
            {lib.busy ? t('sidebar.working') : t('sidebar.rebuild')}
          </button>
        </section>

        <nav className="margin-links" aria-label={t('foot.about')}>
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
      </aside>
    </div>
  )
}
