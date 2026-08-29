import { useEffect, useRef } from 'react'
import ThemeToggle from '../components/ThemeToggle.jsx'
import OnYourPhone from '../components/OnYourPhone.jsx'
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
 * the opening question. Each route sets it up at the point where it is needed,
 * and the door that only chose storage is gone: it was the one technical
 * decision on the page, it was first, and the line under the doors already
 * promised that any of the others would do it anyway.
 *
 * What is offered depends on whether there is anything here yet. Somebody
 * arriving for the first time has three ways in and sees three. The other two
 * are for a reader who has been here before, and one of them used to render as
 * a disabled button saying there was nothing in it, which is a poor third thing
 * to meet on a front page.
 */

const WAYS_IN = [
  { id: 'photo', view: 'shelf' },
  { id: 'list', view: 'list' },
  { id: 'barcode', view: 'barcode' },
]

const COMING_BACK = [
  { id: 'browse', view: 'catalog', primary: true },
  { id: 'import', view: 'storage', focus: 'import' },
]

export default function Landing({ onGo, hasCatalog, bookCount, browserUsable, onDemo, startHere }) {
  const { t, language, setLanguage } = useT()
  const start = useRef(null)

  // Coming back first, because a reader who has a catalog came to open it.
  const doors = hasCatalog ? [...COMING_BACK, ...WAYS_IN] : WAYS_IN

  // Arrived from the demo having decided to build one. Put the ways in on
  // screen and hand focus to them, rather than dropping the reader at the top
  // of a page they have already read.
  useEffect(() => {
    if (!startHere || !start.current) return
    start.current.scrollIntoView({ block: 'start' })
    start.current.querySelector('h2')?.focus()
  }, [startHere])

  return (
    <div className="landing">
      <div className="landing-inner landing-home">
        <header className="landing-head">
          <div className="spread" style={{ alignItems: 'flex-start', gap: 16 }}>
            <h1 className="landing-brand">
              Libr<em>APP</em>
            </h1>
            {/* Language and theme are the two choices that apply before
                anything has been set up, so both belong on the front door. */}
            <div className="landing-prefs">
              <label className="field landing-lang">
                <span className="tiny">{t('landing.language')}</span>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field landing-theme">
                <span className="tiny">{t('theme.label')}</span>
                <ThemeToggle />
              </label>
            </div>
          </div>

          <span className="brand-rule" aria-hidden="true" />
          <p className="eyebrow">{t('app.strapline')}</p>

          <p className="landing-tagline">{t('landing.tagline')}</p>
          {/* The two things that are true of this app and not of the category
              it belongs to. Both used to be a paragraph further down, where
              somebody deciding whether to read on never reached them. */}
          <p className="landing-subhead">{t('landing.subhead')}</p>

          {/* The first thing offered, and the only one that asks for nothing.
              Everything below wants a photograph or a spreadsheet the visitor
              has to go and find; somebody deciding whether to bother should not
              have to read to the bottom of the page to find the way in that
              costs them nothing. Gone once there is a real catalog. */}
          {!hasCatalog && onDemo && (
            <div className="landing-demo">
              <button className="btn primary" onClick={onDemo}>
                {t('landing.demo.action', { n: DEMO_BOOKS })}
              </button>
              <p className="tiny faint">{t('landing.demo.hint', { n: DEMO_BOOKS })}</p>
            </div>
          )}
          <p className="landing-intro">{t('landing.intro')}</p>
        </header>

        {!browserUsable && (
          <div className="notice bad">
            <p className="tiny">{t('landing.browserWarning')}</p>
          </div>
        )}

        <div className="landing-facts">
          <section>
            <h3 className="section-head">{t('landing.privacy.title')}</h3>
            <p className="tiny muted">{t('landing.privacy.body')}</p>
            {/* The sharpest criticism of a local-first app that talks to a
                model is that "nothing is uploaded" and "send this to Anthropic"
                cannot both be true. They are not, and the honest version is a
                better claim than the absolute was. */}
            <p className="tiny muted">{t('landing.privacy.body2')}</p>
          </section>

          <section>
            <h3 className="section-head">{t('landing.needs.title')}</h3>
            <ul className="landing-needs">
              <li>
                <span className="tick" aria-hidden="true" />
                <span className="tiny muted">{t('landing.needs.storage')}</span>
              </li>
              <li>
                <span className="tick" aria-hidden="true" />
                <span className="tiny muted">{t('landing.needs.source')}</span>
              </li>
              <li>
                <span className="tick" aria-hidden="true" />
                <span className="tiny muted">{t('landing.needs.ai')}</span>
              </li>
            </ul>
          </section>
        </div>

        <section className="landing-start" ref={start}>
          <h2 tabIndex={-1}>{t('landing.start')}</h2>

          <div className="landing-options">
            {doors.map((option) => (
              <button
                key={option.id}
                className={`landing-option${option.primary ? ' primary' : ''}`}
                onClick={() => onGo(option.view, option.focus)}
              >
                <span className="landing-option-text">
                  <strong>{t(`landing.option.${option.id}`)}</strong>
                  <span className="tiny faint">
                    {option.id === 'browse' && bookCount
                      ? t('landing.option.browse.count', { n: bookCount })
                      : t(`landing.option.${option.id}.hint`)}
                  </span>
                </span>
                <span className="landing-option-go" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>

          {/* Where storage went. It is a real choice and some people want to
              make it first, but it is the only technical one here and it does
              not belong in front of somebody deciding whether to bother. */}
          <p className="tiny faint" style={{ marginTop: 14 }}>
            {t('landing.storageFirst')}{' '}
            <button className="btn link" onClick={() => onGo('storage')}>
              {t('landing.option.storage')}
            </button>
          </p>

          {/* Said before anybody invests an evening in it rather than only on
              a page they would have to go looking for. Noncommercial alarms
              people who would have been fine, so this leads with what it
              allows. */}
          <p className="tiny faint" style={{ marginTop: 10 }}>
            {t('landing.licence')}{' '}
            <button className="btn link" onClick={() => onGo('about', 'licence')}>
              {t('landing.licenceName')}
            </button>
          </p>
        </section>

        <OnYourPhone onGo={onGo} />

        <section className="landing-next">
          <h2>{t('landing.next.title')}</h2>
          <p className="muted tiny">{t('landing.next.body')}</p>
          <button
            className="btn primary"
            style={{ marginTop: 12 }}
            onClick={() => onGo('desk')}
            disabled={!hasCatalog}
          >
            {t('landing.next.action')}
          </button>
          {!hasCatalog && (
            <p className="tiny faint" style={{ marginTop: 8 }}>
              {t('landing.next.empty')}
            </p>
          )}
        </section>

        <footer className="landing-foot">
          {/* One page behind four links: each lands on its own section. */}
          <nav className="foot-links tiny">
            <button className="btn link tiny" onClick={() => onGo('about', 'what')}>
              {t('foot.about')}
            </button>
            <button className="btn link tiny" onClick={() => onGo('about', 'ai')}>
              {t('foot.ai')}
            </button>
            <button className="btn link tiny" onClick={() => onGo('about', 'privacy')}>
              {t('foot.privacy')}
            </button>
            <button className="btn link tiny" onClick={() => onGo('about', 'licence')}>
              {t('foot.licence')}
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
      </div>
    </div>
  )
}
