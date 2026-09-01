import { useState } from 'react'
import script from '../../../tools/kindle-library-exporter/kindle-library-exporter.js?raw'
import { copyText } from '../lib.js'
import { useT } from '../i18n/index.jsx'

/**
 * Getting a Kindle library out of Amazon and into a file.
 *
 * Amazon ships no export button, and for a lot of people the Kindle is the
 * largest collection they own, so this is the way in that was missing. It is
 * not an importer: it ends with a CSV file, which Upload list already knows how
 * to read.
 *
 * Two routes, and the order matters. Asking Amazon for the data needs nothing
 * from anybody but patience, so it goes first. Reading the list off the page is
 * faster and asks the reader to paste code into a console, which is the shape
 * of a well-known attack, so it goes second and says so in as many words.
 *
 * The script is imported from the file it lives in rather than copied into this
 * page, so what is shown and what is in the repository cannot drift apart.
 */
export default function Kindle({ onGo, onBack }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (await copyText(script)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="view">
      {/* Only when there is no shell around this page, which is the case for
          somebody who has come straight here from the front page. */}
      {onBack && (
        <button className="btn" onClick={onBack}>
          {'← '}
          {t('about.back')}
        </button>
      )}

      <div className="view-head">
        <p className="eyebrow">{t('kindle.eyebrow')}</p>
        <h2>{t('kindle.title')}</h2>
        <hr className="rule" />
        <p>{t('kindle.intro')}</p>
      </div>

      <section className="shelf-step" style={{ marginTop: 28 }}>
        <h3 className="step-head">{t('kindle.ask.head')}</h3>
        <p style={{ marginTop: 8 }}>{t('kindle.ask.intro')}</p>
        <ol style={{ marginTop: 10 }}>
          <li>{t('kindle.ask.1')}</li>
          <li>{t('kindle.ask.2')}</li>
          <li>{t('kindle.ask.3')}</li>
          <li>{t('kindle.ask.4')}</li>
        </ol>
        <p style={{ marginTop: 10 }}>{t('kindle.ask.note')}</p>
      </section>

      <section className="shelf-step" style={{ marginTop: 34 }}>
        <h3 className="step-head">{t('kindle.run.head')}</h3>
        <p style={{ marginTop: 8 }}>{t('kindle.run.intro')}</p>

        {/* Straight, and not softened. Somebody who reads this page and then
            refuses to paste anything has understood it correctly. */}
        <div className="notice bad" style={{ marginTop: 14 }}>
          <p><strong>{t('kindle.warn.head')}</strong></p>
          <p className="tiny">{t('kindle.warn.1')}</p>
          <p className="tiny">{t('kindle.warn.2')}</p>
          <p className="tiny">{t('kindle.warn.3')}</p>
          <p className="tiny">{t('kindle.warn.4')}</p>
        </div>

        <ol style={{ marginTop: 14 }}>
          <li>{t('kindle.run.1')}</li>
          <li>{t('kindle.run.2')}</li>
          <li>{t('kindle.run.3')}</li>
          <li>{t('kindle.run.4')}</li>
          <li>{t('kindle.run.5')}</li>
        </ol>

        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" onClick={copy}>
            {copied ? t('common.copied') : t('kindle.copy')}
          </button>
        </div>
        <pre className="snippet" style={{ marginTop: 12 }}>{script}</pre>

        <p className="tiny faint" style={{ marginTop: 10 }}>{t('kindle.run.fails')}</p>
      </section>

      <section className="shelf-step" style={{ marginTop: 34 }}>
        <h3 className="step-head">{t('kindle.then.head')}</h3>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn primary" onClick={() => onGo('list')}>
            {t('kindle.then.go')}
          </button>
        </div>
      </section>
    </div>
  )
}
