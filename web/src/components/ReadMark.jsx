import { useT } from '../i18n/index.jsx'

/**
 * The mark a book carries at the foot of its spine, saying whether it was read.
 *
 * Drawn rather than coloured. Tinting the whole spine by read state was the
 * other option and it would have cost the wall its identity: the eight spine
 * colours are how a book is recognised across sorts and filters, and replacing
 * them with two would turn a shelf into a bar chart.
 *
 * A ring, a milled edge and a mark, in the ink the spine already uses for its
 * lettering. That ink is paired with each fill at 4.5:1, so the stamp is
 * legible on all eight without a palette of its own. Shape carries it as well
 * as colour, which is what a reader who cannot separate the two needs.
 *
 * Two of the three states are stamped: a check for read, a cross for unread.
 * Not recorded is left blank, and has to be, because a blank is what it means.
 * Stamping two of them and leaving the third bare is what makes the third
 * legible at all: a wall of unstamped spines used to say either "nobody has
 * said" or "read it, did not say so" and there was no telling which from the
 * shelf.
 */
export default function ReadMark({ state = 'read' }) {
  const { t } = useT()
  return (
    <span className={`spine-mark ${state}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.3" />
        {/* The milled edge, as one dashed circle rather than sixteen ticks.
            The pattern is 1.4 on, 2.37 off, which is the circumference at this
            radius divided into sixteen even parts. */}
        <circle
          cx="12" cy="12" r="9.6" fill="none" stroke="currentColor"
          strokeWidth="1.9" strokeDasharray="1.4 2.37"
        />
        <circle cx="12" cy="12" r="7.7" fill="none" stroke="currentColor" strokeWidth="0.9" />
        {state === 'read' ? (
          <path
            d="M8 12.4 l2.9 3 L16.3 8.9" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        ) : (
          // Inside the same inner ring the check sits in, so the two stamps
          // read as one thing said two ways rather than as two marks.
          <path
            d="M9.1 9.1 L14.9 14.9 M14.9 9.1 L9.1 14.9" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round"
          />
        )}
      </svg>
      {/* The spine's accessible name is its lettering, and the stamp is part of
          what it says. Without this the mark is visible and unannounced. */}
      <span className="offscreen">{t(`read.${state}`)}</span>
    </span>
  )
}
