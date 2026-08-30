import { useT } from '../i18n/index.jsx'

/**
 * One of a short list at a time, with the two either side in view.
 *
 * Labels that do not fit across a panel, and stacking them costs rows on a page
 * that is mostly panel already. One is chosen, its neighbours sit out by the
 * arrows where they cannot be mistaken for it, and the arrows move along.
 *
 * It wraps at both ends. A row that stops at the last one makes the reader check
 * which end they are at before pressing; a ring has no dead press, and over a
 * handful of items the way back is never more than half of them.
 *
 * The neighbours are labels rather than controls. Three targets a thumb apart
 * would make a wrong press expensive, and here it is expensive: changing the
 * question at the desk clears the answer that was just given. The whole list is
 * still there off screen, where a keyboard and a screen reader can reach it and
 * where three spans built for the eye cannot serve either.
 */
export default function Ring({ items, current, onPick, label }) {
  const { t } = useT()
  const at = Math.max(0, items.findIndex((item) => item.id === current))
  const wrap = (index) => items[(index + items.length) % items.length]
  const step = (by) => onPick(wrap(at + by).id)

  return (
    <div className="ring" role="group" aria-label={label}>
      <button
        className="ring-arrow"
        onClick={() => step(-1)}
        aria-label={t('ring.previous', { name: wrap(at - 1).label })}
      >
        {'‹'}
      </button>

      {/* Out by the arrows rather than beside the chosen one: a glimpse of what
          a press brings, far enough from the centre to read as a different
          thing. */}
      <span className="ring-near before" aria-hidden="true">{wrap(at - 1).label}</span>
      <span className="ring-here" aria-live="polite">{wrap(at).label}</span>
      <span className="ring-near after" aria-hidden="true">{wrap(at + 1).label}</span>

      <button
        className="ring-arrow"
        onClick={() => step(1)}
        aria-label={t('ring.next', { name: wrap(at + 1).label })}
      >
        {'›'}
      </button>

      <div className="offscreen">
        {items.map((item) => (
          <button key={item.id} aria-pressed={item.id === current} onClick={() => onPick(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
