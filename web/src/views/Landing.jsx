import ThemeToggle from '../components/ThemeToggle.jsx'
import ContrastToggle from '../components/ContrastToggle.jsx'
import { demoSize } from '../store/demo.js'
import { LANGUAGES, useT } from '../i18n/index.jsx'

// Counted from the bundle rather than written down, so the offer cannot come to
// disagree with what opening it actually shows.
const DEMO_BOOKS = demoSize()

/**
 * The front door.
 *
 * The app used to open by asking for access to storage. This says what LibrAPP
 * is, what it needs, and then offers the five things someone may have arrived
 * wanting to do.
 *
 * Storage is still required before anything can be saved, but it is no longer
 * the opening question. Each route sets it up at the point where it is needed.
 */

const OPTIONS = [
  { id: 'storage', view: 'storage' },
  { id: 'photo', view: 'shelf' },
  { id: 'list', view: 'list' },
  { id: 'barcode', view: 'barcode' },
  { id: 'import', view: 'storage', focus: 'import' },
  { id: 'browse', view: 'catalog', needsCatalog: true },
]

export default function Landing({ onGo, hasCatalog, bookCount, browserUsable, onDemo }) {
  const { t, language, setLanguage } = useT()

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
              <label className="field landing-theme">
                <span className="tiny">{t('contrast.label')}</span>
                <ContrastToggle />
              </label>
            </div>
          </div>

          <span className="brand-rule" aria-hidden="true" />
          <p className="eyebrow">{t('app.strapline')}</p>

          <p className="landing-tagline">{t('landing.tagline')}</p>

          {/* The first thing offered, and the only one that asks for nothing.
              Everything below wants a photograph or a spreadsheet the visitor
              has to go and find; somebody deciding whether to bother should not
              have to read to the bottom of the page to find the way in that
              costs them nothing. Gone once there is a real catalog. */}
          {!hasCatalog && onDemo && (
            <div className="landing-demo">
              <button className="btn primary" onClick={onDemo}>
                {t('landing.demo.action')}
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

        <section className="landing-start">
          <h2>{t('landing.start')}</h2>
          <p className="tiny faint">{t('landing.start.hint')}</p>

          <div className="landing-options">
            {OPTIONS.map((option) => {
              const unavailable = option.needsCatalog && !hasCatalog
              return (
                <button
                  key={option.id}
                  className="landing-option"
                  onClick={() => onGo(option.view, option.focus)}
                  disabled={unavailable}
                >
                  <span className="landing-option-text">
                    <strong>{t(`landing.option.${option.id}`)}</strong>
                    <span className="tiny faint">
                      {unavailable
                        ? t('landing.option.browse.empty')
                        : option.id === 'browse' && bookCount
                          ? `${bookCount}`
                          : t(`landing.option.${option.id}.hint`)}
                    </span>
                  </span>
                  <span className="landing-option-go" aria-hidden="true">
                    →
                  </span>
                </button>
              )
            })}
          </div>

        </section>

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
