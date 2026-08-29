import { useT } from '../i18n/index.jsx'

/**
 * Where the catalog lives.
 *
 * Reached when something needs storage and none has been chosen, rather than
 * at startup, so the reason for asking is already established by the time this
 * appears.
 */
export default function Setup({ canPickFolder, onFolder, onBrowser, onBack, error, chosen, onNext }) {
  const { t } = useT()

  // A folder was picked and is waiting to be confirmed. Picking one used to
  // carry straight on, which left nobody sure which folder had been taken, and
  // a picker is easy to answer with the wrong directory.
  if (chosen) {
    return (
      <div className="view" style={{ maxWidth: 640 }}>
        <header>
          <h2>{t('setup.chosen.title')}</h2>
        </header>
        <div className="card">
          <p className="tabular">{chosen}</p>
          <p className="muted tiny" style={{ marginTop: 8 }}>{t('setup.chosen.body')}</p>
          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <button className="btn primary" onClick={onNext}>
              {t('setup.chosen.next')}
            </button>
            <button className="btn" onClick={onFolder}>
              {t('setup.chosen.change')}
            </button>
          </div>
        </div>
      </div>
    )
  }

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
