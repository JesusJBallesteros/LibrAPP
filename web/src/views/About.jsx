import { useEffect } from 'react'
import { useT } from '../i18n/index.jsx'
import { buildLabel } from '../version.js'

/**
 * One page rather than four.
 *
 * The usual footer wants About, Privacy, Licence and Contact as separate
 * destinations. For an app with no account, no server and nothing sold, that
 * would be four thin pages saying "not applicable" in four different ways. They
 * are sections here instead, and the footer links land on the right one.
 *
 * The About section is not vanity. LibrAPP asks people to photograph their
 * possessions and to paste an API key into a web page; the honest answer to
 * "why should I trust this?" is a named person with a public trail, which does
 * more work than any policy document.
 */

const CV = 'https://jesusjballesteros.github.io/'
const GITHUB = 'https://github.com/JesusJBallesteros'
const REPO = 'https://github.com/JesusJBallesteros/LibrAPP'
const ISSUES = 'https://github.com/JesusJBallesteros/LibrAPP/issues'
const LICENCE = 'https://polyformproject.org/licenses/noncommercial/1.0.0'

// Everything that ships inside the built app, with the terms it ships under.
// Attribution is a condition of MIT, Apache-2.0 and the Open Font Licence, so
// this list is an obligation. Check it against package.json when a dependency
// changes, and against public/fonts when a face is added or dropped. The two
// font licences travel with the files, in public/fonts.
const BUNDLED = [
  { name: 'React', licence: 'MIT', url: 'https://github.com/facebook/react' },
  { name: 'pdf.js', licence: 'Apache-2.0', url: 'https://github.com/mozilla/pdf.js' },
  { name: 'Zod', licence: 'MIT', url: 'https://github.com/colinhacks/zod' },
  {
    name: 'Anthropic SDK',
    licence: 'MIT',
    url: 'https://github.com/anthropics/anthropic-sdk-typescript',
  },
  {
    name: 'EB Garamond',
    licence: 'SIL Open Font Licence 1.1',
    url: 'https://github.com/octaviopardo/EBGaramond12',
  },
  {
    name: 'IBM Plex Sans and Mono',
    licence: 'SIL Open Font Licence 1.1',
    url: 'https://github.com/IBM/plex',
  },
]

const Out = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
)

export default function About({ onBack, focus, inShell = false }) {
  const { t } = useT()

  // Arriving from a footer link should land on the section that link named.
  useEffect(() => {
    if (!focus) return
    document.getElementById(`about-${focus}`)?.scrollIntoView({ block: 'start' })
  }, [focus])

  return (
    <div className={inShell ? 'view' : 'landing'}>
      <div className={inShell ? undefined : 'landing-inner'}>
        <header className="landing-head">
          <div className="spread">
            {inShell ? (
              <p className="eyebrow">{t('about.eyebrow')}</p>
            ) : (
              <h1 className="landing-brand">
                Libr<em>APP</em>
              </h1>
            )}
            {onBack && (
              <button className="btn" onClick={onBack}>
                ← {t('about.back')}
              </button>
            )}
          </div>
          <p className="landing-tagline about-tagline">{t('about.title')}</p>
        </header>

        <section className="about-section" id="about-what">
          <h3 className="section-head">{t('about.what')}</h3>
          <p className="muted tiny">{t('about.whatBody')}</p>
          <p className="muted tiny">{t('about.whatBody2')}</p>
        </section>

        <section className="about-section" id="about-librarian">
          <h3 className="section-head">{t('about.librarian')}</h3>
          <p className="muted tiny">{t('about.librarianBody')}</p>
          <p className="muted tiny">{t('about.librarianOwl')}</p>
          <p className="muted tiny">{t('about.librarianYours')}</p>
          <p className="tiny faint">{t('about.librarianHonest')}</p>
        </section>

        <section className="about-section" id="about-who">
          <h3 className="section-head">{t('about.who')}</h3>
          <p className="muted tiny">{t('about.whoBody')}</p>
          <div className="row" style={{ marginTop: 10 }}>
            <Out href={CV}>{t('about.cv')}</Out>
            <Out href={GITHUB}>{t('about.github')}</Out>
            <Out href={REPO}>{t('about.repo')}</Out>
          </div>
          <p className="tiny faint" style={{ marginTop: 10 }}>
            {t('about.noWarranty')}
          </p>
        </section>

        <section className="about-section" id="about-ai">
          <h3 className="section-head">{t('about.ai')}</h3>
          <p className="muted tiny">{t('about.aiBody')}</p>
          <ul className="landing-needs" style={{ marginTop: 10 }}>
            {['author', 'assistant', 'testers'].map((id) => (
              <li key={id}>
                <span className="glyph" aria-hidden="true">
                  ·
                </span>
                <span className="tiny muted">
                  <strong>{t(`about.ai.${id}`)}</strong> {t(`about.ai.${id}.did`)}
                </span>
              </li>
            ))}
          </ul>
          <p className="muted tiny" style={{ marginTop: 10 }}>{t('about.aiReview')}</p>
          <p className="tiny faint" style={{ marginTop: 10 }}>{t('about.aiNotYourBooks')}</p>
        </section>

        <section className="about-section" id="about-privacy">
          <h3 className="section-head">{t('about.privacy')}</h3>
          <p className="muted tiny">{t('about.privacyBody')}</p>
          <ul className="landing-needs" style={{ marginTop: 10 }}>
            {['account', 'device', 'key', 'requests', 'cookies', 'offline'].map((id) => (
              <li key={id}>
                <span className="glyph" aria-hidden="true">
                  ·
                </span>
                <span className="tiny muted">{t(`about.privacy.${id}`)}</span>
              </li>
            ))}
          </ul>
          <p className="tiny faint" style={{ marginTop: 10 }}>
            {t('about.privacyCheck')} <Out href={REPO}>{t('about.readSource')}</Out>.
          </p>
        </section>

        <section className="about-section" id="about-licence">
          <h3 className="section-head">{t('about.licence')}</h3>
          <p className="muted tiny">{t('about.licenceBody')}</p>
          <p className="tiny" style={{ marginTop: 8 }}>
            <Out href={LICENCE}>{t('about.licenceName')}</Out>
          </p>

          <h4 style={{ margin: '18px 0 7px', font: '500 13px var(--sans)' }}>
            {t('about.attributions')}
          </h4>
          <p className="tiny faint" style={{ margin: 0 }}>
            {t('about.attributionsBody')}
          </p>
          <ul className="landing-needs" style={{ marginTop: 10 }}>
            {BUNDLED.map((dep) => (
              <li key={dep.name}>
                <span className="glyph" aria-hidden="true">
                  ·
                </span>
                <span className="tiny muted">
                  <Out href={dep.url}>{dep.name}</Out> — {dep.licence}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-section" id="about-contact">
          <h3 className="section-head">{t('about.contact')}</h3>
          <p className="muted tiny">{t('about.contactBody')}</p>
          <div className="row" style={{ marginTop: 10 }}>
            <Out href={ISSUES}>{t('about.reportProblem')}</Out>
            <Out href={CV}>{t('about.contactMe')}</Out>
          </div>
        </section>

        <footer className="landing-foot">
          <p className="tiny faint" style={{ margin: 0 }}>
            {t('about.version', { build: buildLabel() })} · {t('about.updateNote')}
          </p>
        </footer>
      </div>
    </div>
  )
}
