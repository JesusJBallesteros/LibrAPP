import { useT } from '../i18n/index.jsx'
/**
 * What the collection is made of.
 *
 * Part-to-whole at a glance, which a pie does well only while the slices stay
 * few. Genres are named until they account for roughly four fifths of the
 * collection, and everything after that becomes a single "other", so the chart
 * does not grow a tail of indistinguishable slivers.
 *
 * The tag vocabulary is uncontrolled, so a real catalog has well over a hundred
 * genre labels, most used once. Charting the few that carry the collection
 * conveys more than charting all of them.
 *
 * Colours come from a categorical palette validated for colour-vision
 * deficiency against this app's own surfaces in both themes. Every slice is
 * also named and counted in the legend, so identity never rests on colour
 * alone.
 */

const NAMED_SHARE = 0.8
const MAX_NAMED = 5

/** Genre counts, largest first, with the tail folded into one slice. */
export function summarise(books, { share = NAMED_SHARE, maxNamed = MAX_NAMED } = {}) {
  const counts = new Map()
  for (const book of books || []) {
    for (const tag of book.tags || []) {
      if (tag.kind !== 'genre') continue
      counts.set(tag.value, (counts.get(tag.value) || 0) + 1)
    }
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  if (!total) return { slices: [], total: 0, distinct: 0 }

  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const named = []
  let running = 0
  for (const [value, n] of ordered) {
    if (named.length >= maxNamed || running / total >= share) break
    named.push({ label: value, count: n })
    running += n
  }

  const rest = total - running
  const restCount = ordered.length - named.length
  // One leftover genre is worth naming; calling a single category "other"
  // hides a fact for no gain.
  if (restCount === 1) {
    const [value, n] = ordered[named.length]
    named.push({ label: value, count: n })
    return { slices: withShare(named, total), total, distinct: ordered.length }
  }
  if (rest > 0) named.push({ label: OTHER, count: rest, isOther: true, covers: restCount })
  return { slices: withShare(named, total), total, distinct: ordered.length }
}

// The catch-all slice. A fixed marker rather than a translated word, so the
// chart does not gain or lose a category when the language changes.
const OTHER = '\u0000other'

const withShare = (slices, total) =>
  slices.map((s, i) => ({ ...s, share: s.count / total, slot: i + 1 }))

/** A slice's outline, as an SVG path. */
function arc(cx, cy, r, from, to) {
  // A slice covering the whole circle cannot be drawn as an arc, because its
  // start and end points coincide, so it becomes two half circles.
  if (to - from >= Math.PI * 2 - 1e-6) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
  }
  const x1 = cx + r * Math.cos(from)
  const y1 = cy + r * Math.sin(from)
  const x2 = cx + r * Math.cos(to)
  const y2 = cy + r * Math.sin(to)
  const large = to - from > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

const percent = (share) => (share < 0.005 ? '<1%' : `${Math.round(share * 100)}%`)

export default function GenrePie({ books, size = 168 }) {
  const { t } = useT()
  const { slices, total, distinct } = summarise(books)
  const other = slices.find((s) => s.isOther)
  const named = slices.filter((s) => !s.isOther)

  if (!slices.length) {
    // A heading with one quiet line under it reads as a section that failed to
    // load rather than one with nothing to show. Say why it is empty, and where
    // the genres can be got.
    return (
      <>
        <p className="muted tiny">{t('pie.noGenres')}</p>
        <p className="tiny faint" style={{ marginTop: 6 }}>{t('pie.noGenresHow')}</p>
      </>
    )
  }

  const r = size / 2 - 6
  const cx = size / 2
  const cy = size / 2
  let angle = -Math.PI / 2 // start at twelve o'clock

  const paths = slices.map((slice) => {
    const from = angle
    const to = angle + slice.share * Math.PI * 2
    angle = to
    return { ...slice, d: arc(cx, cy, r, from, to) }
  })

  return (
    <div className="pie-wrap">
      <svg
        className="pie"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={`Genre composition of ${total} tagged books across ${distinct} genres`}
      >
        {paths.map((slice) => (
          <path
            key={slice.label}
            d={slice.d}
            fill={`var(--series-${slice.slot})`}
            /* No stroke between slices. The palette is a single ramp from dark
               to light, so neighbouring slices differ in lightness rather than
               hue and separate themselves. Every slice is still named and
               counted in the legend, which is what identity actually rests on. */
          >
            <title>
              {slice.isOther ? t('pie.other') : slice.label}: {slice.count} (
              {percent(slice.share)})
            </title>
          </path>
        ))}
        {/* Punched out of the middle, so the chart reads as a ring rather
            than a pie. Painted in the page colour rather than cut, which keeps
            the slice paths and their tooltips whole. --paper, not
            --paper-raised: the desk section behind it is no longer a card, so
            a raised fill would show as a lighter disc. */}
        <circle cx={cx} cy={cy} r={30} fill="var(--paper)" />
      </svg>

      <ul className="pie-legend">
        {slices.map((slice) => (
          <li key={slice.label}>
            <span className="swatch" style={{ background: `var(--series-${slice.slot})` }} aria-hidden="true" />
            <span className="pie-label">
              {slice.isOther ? t('pie.other') : slice.label}
              {slice.isOther && (
                <span className="faint"> · {t('pie.more', { n: slice.covers })}</span>
              )}
            </span>
            <span className="pie-value">
              {slice.count} <span className="faint">{percent(slice.share)}</span>
            </span>
          </li>
        ))}
      </ul>

      {other && (
        <p className="tiny faint pie-note">
          {t('pie.note', {
            named: named.length,
            share: Math.round(named.reduce((sum, s) => sum + s.share, 0) * 100),
            rest: other.covers,
          })}
          {other.share > 0.5 && ` — ${t('pie.fragmented')}`}
        </p>
      )}
    </div>
  )
}
