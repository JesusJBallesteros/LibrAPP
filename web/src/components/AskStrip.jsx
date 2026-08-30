import { useT } from '../i18n/index.jsx'

/**
 * The questions the desk can put, one line of them.
 *
 * Six labels do not fit across a panel 421px wide, and wrapping them cost two
 * lines of a page that is mostly panel already. So one is chosen, its
 * neighbours are shown either side of it faintly, and the arrows move along the
 * row.
 *
 * It wraps at both ends. A row that stops at the last one makes the reader
 * check which end they are at before pressing; a ring never has a dead press,
 * and with six of them the way back is never more than three.
 *
 * The neighbours are labels, not controls. Making them pressable would put
 * three targets a thumb's width apart and turn a wrong press into a lost
 * answer, since changing the question clears the last one.
 */
export default function AskStrip({ asks, current, onPick }) {
  const { t } = useT()
  const at = Math.max(0, asks.findIndex((a) => a.id === current))
  const step = (by) => onPick(asks[(at + by + asks.length) % asks.length].id)

  const name = (index) => t(`desk.${asks[(index + asks.length) % asks.length].id}`)

  return (
    <div className="ask-strip">
      <button
        className="ask-arrow"
        onClick={() => step(-1)}
        aria-label={t('desk.ask.previous', { name: name(at - 1) })}
      >
        {'‹'}
      </button>

      {/* Named so the row reads as a ring rather than as one word in a box:
          the reader can see what a press either way will bring. */}
      <span className="ask-near" aria-hidden="true">{name(at - 1)}</span>

      <span className="ask-here" aria-live="polite">{name(at)}</span>

      <span className="ask-near" aria-hidden="true">{name(at + 1)}</span>

      <button
        className="ask-arrow"
        onClick={() => step(1)}
        aria-label={t('desk.ask.next', { name: name(at + 1) })}
      >
        {'›'}
      </button>

      {/* The whole row for a screen reader and a keyboard, which the three
          spans above cannot serve: they are decoration for the eye. */}
      <div className="offscreen">
        {asks.map((a) => (
          <button key={a.id} aria-pressed={a.id === current} onClick={() => onPick(a.id)}>
            {t(`desk.${a.id}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
