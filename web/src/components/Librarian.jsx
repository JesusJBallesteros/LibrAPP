import { useEffect, useState } from 'react'
import { useT } from '../i18n/index.jsx'
import { announce, observations } from '../librarian.js'

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
  // Which of the things it has to say is showing. Reset when the page changes,
  // because the second thing about the catalog is not the second thing here.
  const [at, setAt] = useState(0)

  const transient = announce(event)
  const lines = observations({ view, counts, books, hasCatalog })

  useEffect(() => {
    setAt(0)
  }, [view, hasCatalog])

  // Something is happening, so the owl speaks without being asked. It closes
  // again on its own when whoever set the event clears it.
  useEffect(() => {
    if (transient) setOpen(true)
  }, [transient?.key])

  // A transient line replaces the lot: it is about right now, and paging
  // through the manual while a photograph is being read helps nobody.
  const showing = transient || lines[Math.min(at, lines.length - 1)]
  if (gone || !showing) return null

  const line = t(`librarian.${showing.key}`, showing.values)
  const action = !transient && showing.action
  const many = !transient && lines.length > 1

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

          {many && (
            <div className="owl-pager">
              <button
                onClick={() => setAt((i) => Math.max(0, i - 1))}
                disabled={at === 0}
                aria-label={t('librarian.previous')}
              >
                {'\u2039'}
              </button>
              <span className="tabular" aria-live="polite">
                {t('librarian.position', { at: at + 1, of: lines.length })}
              </span>
              <button
                onClick={() => setAt((i) => Math.min(lines.length - 1, i + 1))}
                disabled={at >= lines.length - 1}
                aria-label={t('librarian.next')}
              >
                {'\u203a'}
              </button>
            </div>
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
