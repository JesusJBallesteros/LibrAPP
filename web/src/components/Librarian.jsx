import { useEffect, useState } from 'react'
import { useT } from '../i18n/index.jsx'
import { announce, observe } from '../librarian.js'

/**
 * The LibrAPPrian: a small fixed presence in the corner.
 *
 * A badge, and a bubble it opens. Deliberately not a chat surface: there is
 * nowhere to type, because anything worth typing belongs at the desk, where the
 * question gets the catalog as context and the cost is shown before it is
 * spent. What the owl offers instead is one observation and, where there is
 * something to act on, one link that acts on it.
 *
 * The bubble opens by itself only for a transient line, which reports something
 * the reader has just set in motion. Everything else waits to be asked.
 */
export default function Librarian({ view, counts, books, hasCatalog, event, onGo, gone, onDismiss }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  const transient = announce(event)
  const observation = observe({ view, counts, books, hasCatalog })
  const said = transient || observation

  // Something is happening, so the owl speaks without being asked. It closes
  // again on its own when whoever set the event clears it.
  useEffect(() => {
    if (transient) setOpen(true)
  }, [transient?.key])

  if (gone || !said) return null

  const line = t(`librarian.${said.key}`, said.values)
  const action = !transient && observation?.action

  return (
    <div className="librarian">
      {open && (
        <div className="owl-bubble" role="status">
          <div className="spread">
            <p className="eyebrow">{t('librarian.name')}</p>
            <button className="owl-dismiss" onClick={onDismiss} title={t('librarian.dismissWhy')}>
              {t('librarian.dismiss')}
            </button>
          </div>
          <p className="owl-line">{line}</p>
          {action && (
            <button
              className="btn link"
              onClick={() => {
                onGo?.(action.view, action.focus ?? null)
                setOpen(false)
              }}
            >
              {t(`librarian.action.${action.key}`)}
            </button>
          )}
        </div>
      )}

      <button
        className="owl-badge"
        aria-expanded={open}
        aria-label={open ? t('librarian.close') : t('librarian.open')}
        onClick={() => setOpen((was) => !was)}
      >
        <Owl />
      </button>
    </div>
  )
}

/**
 * Placeholder art, built from plain shapes so it carries no image weight and
 * takes its colours from the theme. Meant to be replaced by a drawn owl at the
 * same size and position.
 */
function Owl() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
      <circle cx="13" cy="12" r="5" fill="var(--accent)" />
      <circle cx="35" cy="12" r="5" fill="var(--accent)" />
      <circle cx="24" cy="26" r="17" fill="var(--accent)" />
      <circle cx="24" cy="38" r="9" fill="var(--tan)" opacity=".35" />
      <circle cx="17.5" cy="22" r="7" fill="var(--paper)" />
      <circle cx="30.5" cy="22" r="7" fill="var(--paper)" />
      <g className="owl-eyes">
        <circle cx="17.5" cy="22" r="3.1" fill="var(--ink)" />
        <circle cx="30.5" cy="22" r="3.1" fill="var(--ink)" />
      </g>
      <polygon points="24,24 21,29 27,29" fill="var(--tan)" />
    </svg>
  )
}
