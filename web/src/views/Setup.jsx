import { useT } from '../i18n/index.jsx'

/**
 * Where the catalog lives.
 *
 * Reached when something needs storage and none has been chosen, rather than
 * as the app's opening demand — so by the time this appears, the reason for
 * asking is already obvious.
 */
export default function Setup({ canPickFolder, onFolder, onBrowser, onBack, error }) {
  const { t } = useT()

  return (
    <div className="view" style={{ maxWidth: 640 }}>
      <header>
        <h2>{t('setup.title')}</h2>
        <p>{t('setup.intro')}</p>
      </header>

      {error && (
        <div className="notice bad">
          <p>{error}</p>
        </div>
      )}

      {canPickFolder ? (
        <div className="card">
          <h3>{t('setup.folder.title')}</h3>
          <p className="muted tiny">{t('setup.folder.body')}</p>
          <button className="btn primary" onClick={onFolder} style={{ marginTop: 12 }}>
            {t('setup.folder.action')}
          </button>
        </div>
      ) : (
        <div className="notice">
          <p className="tiny">{t('setup.noPicker')}</p>
        </div>
      )}

      <div className="card">
        <h3>{t('setup.browser.title')}</h3>
        <p className="muted tiny">{t('setup.browser.body')}</p>
        <button
          className={canPickFolder ? 'btn' : 'btn primary'}
          onClick={onBrowser}
          style={{ marginTop: 12 }}
        >
          {t('setup.browser.action')}
        </button>
      </div>

      <p className="tiny faint">{t('setup.either')}</p>

      {onBack && (
        <button className="btn" onClick={onBack} style={{ marginTop: 14 }}>
          ← {t('nav.home')}
        </button>
      )}
    </div>
  )
}
