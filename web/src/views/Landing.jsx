import { useEffect, useRef } from 'react'
import { Camera, ChevronRight, Languages, Library, ScanLine, Table, Tablet, Upload } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle.jsx'
import OnYourPhone from '../components/OnYourPhone.jsx'
import SetUpSoFar from '../components/SetUpSoFar.jsx'
import { demoSize } from '../store/demo.js'
import { LANGUAGES, useT } from '../i18n/index.jsx'

// Counted from the bundle rather than written down, so the offer cannot come to
// disagree with what opening it actually shows.
const DEMO_BOOKS = demoSize()

/**
 * The front door.
 *
 * The app used to open by asking for access to storage. This says what LibrAPP
 * is, what it needs, and then offers the ways in.
 *
 * Storage is still required before anything can be saved, but it is no longer
 * the opening question. Each route sets it up at the point where it is needed.
 *
 * Two places draw it. Before a library is open it is a page of its own, with
 * the name, the language and the theme at the top, since there is no shell to
 * carry them. Once a library is open it is Start, inside the shell, which
 * already carries the name and the theme; the language moves to the foot.
 *
 * What is offered depends on whether there is anything here yet. Somebody
 * arriving for the first time has four ways in and sees four. The other two
 * are for a reader who has been here before.
 */

const WAYS_IN = [
  { id: 'photo', view: 'shelf', Icon: Camera },
  { id: 'list', view: 'list', Icon: Table },
  { id: 'barcode', view: 'barcode', Icon: ScanLine },
  // Not a way of reading books into the app but a way of getting a list out of
  // somewhere that has no export button.
  { id: 'kindle', view: 'kindle', Icon: Tablet },
]

// First, because a reader who has a catalog came to open it.
const BROWSE = { id: 'browse', view: 'catalog', primary: true, Icon: Library }
const IMPORT = { id: 'import', view: 'storage', focus: 'import', Icon: Upload }

export default function Landing({
  onGo,
  hasCatalog,
  bookCount,
  browserUsable,
  onDemo,
  startHere,
  lib,
  inShell = false,
}) {
  const { t, language, setLanguage } = useT()
  const start = useRef(null)

  const doors = hasCatalog ? [BROWSE, ...WAYS_IN, IMPORT] : WAYS_IN

  // Arrived from the demo having decided to build one. Put the ways in on
  // screen and hand focus to them, rather than dropping the reader at the top
  // of a page they have already read.
  useEffect(() => {
    if (!startHere || !start.current) return
    start.current.scrollIntoView({ block: 'start' })
    start.current.querySelector('h2')?.focus()
  }, [startHere])

  const languagePicker = (className) => (
    <label className={className}>
      <span className="tiny">{t('landing.language')}</span>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )

  const page = (
    <>
      {!inShell && (
        <div className="landing-head-row">
          <h1 className="landing-brand">
            Libr<em>APP</em>
          </h1>
          {/* Language and theme are the two choices that apply before anything
              has been set up, so both belong on the front door. */}
          <div className="landing-prefs">
            {languagePicker('field landing-lang')}
            <label className="field landing-theme">
              <span className="tiny">{t('theme.label')}</span>
              <ThemeToggle />
            </label>
          </div>
        </div>
      )}

      <header className="start-head">
        <p className="eyebrow">{t('app.strapline')}</p>
        <h2 className="start-title">{t('landing.tagline')}</h2>
        <hr className="start-rule" />
        {/* The one way in that asks for nothing. Gone once there is a real
            catalog. */}
        {!hasCatalog && onDemo && (
          <div className="landing-demo">
            <button className="btn primary" onClick={onDemo}>
              {t('landing.demo.action', { n: DEMO_BOOKS })}
            </button>
          </div>
        )}
      </header>

      {!browserUsable && (
        <div className="notice bad">
          <p className="tiny">{t('landing.browserWarning')}</p>
        </div>
      )}

      <section className="landing-start" ref={start}>
        <h2 className="section-label" tabIndex={-1}>
          {t('landing.start')}
        </h2>

        <div className="landing-options">
          {doors.map(({ id, view, focus, primary, Icon }) => (
            <button
              key={id}
              className={`landing-option${primary ? ' primary' : ''}`}
              onClick={() => onGo(view, focus)}
            >
              <Icon className="landing-option-icon" aria-hidden="true" focusable="false" />
              <span className="landing-option-text">
                <strong>{t(`landing.option.${id}`)}</strong>
                <span className="tiny faint">
                  {id === 'browse' && bookCount
                    ? t('landing.option.browse.count', { n: bookCount })
                    : t(`landing.option.${id}.hint`)}
                </span>
              </span>
              <ChevronRight className="landing-option-go" aria-hidden="true" focusable="false" />
            </button>
          ))}
        </div>
      </section>

      <SetUpSoFar lib={lib} bookCount={bookCount} onGo={onGo} />

      <OnYourPhone onGo={onGo} />

      <section className="landing-terms">
        {inShell ? (
          <div className="start-lang">
            <Languages aria-hidden="true" focusable="false" />
            {languagePicker('landing-lang')}
          </div>
        ) : (
          <p className="tiny faint">
            {t('landing.storageFirst')}{' '}
            <button className="btn link" onClick={() => onGo('storage')}>
              {t('landing.option.storage')}
            </button>
          </p>
        )}
        <p className="tiny faint" style={{ marginTop: 10 }}>
          <button className="btn link" onClick={() => onGo('about', 'privacy')}>
            {t('landing.privacyLink')}
          </button>
          <button className="btn link" onClick={() => onGo('about', 'licence')}>
            {t('landing.licenceName')}
          </button>
        </p>
      </section>

      <footer className="landing-foot">
        <nav className="foot-links tiny">
          <button className="btn link tiny" onClick={() => onGo('about', 'what')}>
            {t('foot.about')}
          </button>
          <button className="btn link tiny" onClick={() => onGo('about', 'ai')}>
            {t('foot.ai')}
          </button>
          <a href="https://github.com/JesusJBallesteros/LibrAPP" target="_blank" rel="noreferrer">
            {t('foot.source')}
          </a>
          <a
            href="https://github.com/JesusJBallesteros/LibrAPP/issues"
            target="_blank"
            rel="noreferrer"
          >
            {t('foot.report')}
          </a>
        </nav>
      </footer>
    </>
  )

  if (inShell) return <div className="view start">{page}</div>

  return (
    <div className="landing">
      <div className="landing-inner landing-home">{page}</div>
    </div>
  )
}
