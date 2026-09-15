import { ChevronRight, FolderOpen, Globe } from 'lucide-react'
import { useT } from '../i18n/index.jsx'

/**
 * Where the catalog lives.
 *
 * Reached when something needs storage and none has been chosen, rather than
 * at startup, so the reason for asking is already established by the time this
 * appears.
 *
 * The two choices are doors like the ones on Start: an icon, the name, a line
 * about it, and a chevron. The one this browser can do best is marked.
 */
export default function Setup({ canPickFolder, onFolder, onBrowser, onBack, error, chosen, onNext }) {
  const { t } = useT()

  // A folder was picked and is waiting to be confirmed. Picking one used to
  // carry straight on, which left nobody sure which folder had been taken, and
  // a picker is easy to answer with the wrong directory.
  if (chosen) {
    return (
      <div className="view setup" style={{ maxWidth: 640 }}>
        <header className="start-head">
          <h2 className="start-title">{t('setup.chosen.title')}</h2>
          <hr className="start-rule" />
        </header>
        <div className="saved-card">
          <p className="tabular">{chosen}</p>
          <p>{t('setup.chosen.body')}</p>
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

  const doors = [
    canPickFolder && {
      id: 'folder',
      Icon: FolderOpen,
      onClick: onFolder,
      primary: true,
    },
    { id: 'browser', Icon: Globe, onClick: onBrowser, primary: !canPickFolder },
  ].filter(Boolean)

  return (
    <div className="view setup" style={{ maxWidth: 640 }}>
      <header className="start-head">
        <h2 className="start-title">{t('setup.title')}</h2>
        <hr className="start-rule" />
        <p className="muted" style={{ marginTop: 14 }}>{t('setup.intro')}</p>
      </header>

      {error && (
        <div className="notice bad">
          <p>{error}</p>
        </div>
      )}

      {!canPickFolder && (
        <div className="notice">
          <p className="tiny">{t('setup.noPicker')}</p>
        </div>
      )}

      <div className="landing-options" style={{ marginTop: 22 }}>
        {doors.map(({ id, Icon, onClick, primary }) => (
          <button
            key={id}
            className={`landing-option${primary ? ' primary' : ''}`}
            onClick={onClick}
          >
            <Icon className="landing-option-icon" aria-hidden="true" focusable="false" />
            <span className="landing-option-text">
              <strong>{t(`setup.${id}.action`)}</strong>
              <span className="tiny faint">{t(`setup.${id}.body`)}</span>
            </span>
            <ChevronRight className="landing-option-go" aria-hidden="true" focusable="false" />
          </button>
        ))}
      </div>

      <p className="tiny faint" style={{ marginTop: 14 }}>{t('setup.either')}</p>

      {onBack && (
        <button className="btn" onClick={onBack} style={{ marginTop: 14 }}>
          ← {t('nav.home')}
        </button>
      )}
    </div>
  )
}
