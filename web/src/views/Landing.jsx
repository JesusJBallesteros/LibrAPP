import { LANGUAGES, useT } from '../i18n/index.jsx'

/**
 * The front door.
 *
 * The app used to open by demanding access to storage, which is a strange first
 * thing to ask a stranger. This says what LibrAPP is, what it needs, and then
 * offers the five things someone might actually have arrived wanting to do.
 *
 * Storage is still required before anything can be saved, but it is no longer
 * the opening question — each route sets it up when it is needed, at a point
 * where the reason for asking is obvious.
 */

const OPTIONS = [
  { id: 'storage', glyph: '🗄', view: 'storage' },
  { id: 'photo', glyph: '📷', view: 'shelf' },
  { id: 'list', glyph: '📋', view: 'list' },
  { id: 'import', glyph: '📥', view: 'storage', focus: 'import' },
  { id: 'browse', glyph: '📖', view: 'catalog', needsCatalog: true },
]

export default function Landing({ onGo, hasCatalog, bookCount, browserUsable }) {
  const { t, language, setLanguage } = useT()

  return (
    <div className="landing">
      <div className="landing-inner landing-home">
        <header className="landing-head">
          <div className="spread" style={{ alignItems: 'flex-start', gap: 16 }}>
            <h1 className="landing-brand">
              Libr<em>APP</em>
            </h1>
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
          </div>

          <p className="landing-tagline">{t('landing.tagline')}</p>
          <p className="landing-intro">{t('landing.intro')}</p>
        </header>

        {!browserUsable && (
          <div className="notice bad">
            <p className="tiny">{t('landing.browserWarning')}</p>
          </div>
        )}

        <div className="landing-facts">
          <section className="card">
            <h3>{t('landing.privacy.title')}</h3>
            <p className="tiny muted">{t('landing.privacy.body')}</p>
          </section>

          <section className="card">
            <h3>{t('landing.needs.title')}</h3>
            <ul className="landing-needs">
              <li>
                <span className="glyph" aria-hidden="true">🗄</span>
                <span className="tiny muted">{t('landing.needs.storage')}</span>
              </li>
              <li>
                <span className="glyph" aria-hidden="true">📚</span>
                <span className="tiny muted">{t('landing.needs.source')}</span>
              </li>
              <li>
                <span className="glyph" aria-hidden="true">✨</span>
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
                  <span className="glyph" aria-hidden="true">
                    {option.glyph}
                  </span>
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
