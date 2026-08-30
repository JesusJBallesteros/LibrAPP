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
 * The neighbours are targets too: a pair of arrows alone is a small surface on
 * a phone, and the name beside one is the part a thumb goes for. They are
 * pointer targets only, hidden from the accessible tree and out of the tab
 * order, because the list below already offers every item once and a reader
 * hearing the same three names twice is worse served, not better.
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
          thing, and large enough to be pressed. */}
      <button className="ring-near before" tabIndex={-1} aria-hidden="true" onClick={() => step(-1)}>
        {wrap(at - 1).label}
      </button>
      <span className="ring-here" aria-live="polite">{wrap(at).label}</span>
      <button className="ring-near after" tabIndex={-1} aria-hidden="true" onClick={() => step(1)}>
        {wrap(at + 1).label}
      </button>

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
