import { useT } from '../i18n/index.jsx'

/**
 * The words a collection keeps returning to.
 *
 * Genres are already the pie, so this draws keywords, which are the messier and
 * more interesting half. They come from the sources rather than a controlled
 * list, so a real catalog has hundreds of them and most appear once. Only the
 * ones used more than once are drawn, and only the top of those.
 *
 * Every word is a button rather than positioned SVG text. A cloud of unlabelled
 * shapes is unreachable by keyboard and unreadable by a screen reader, and the
 * whole point of this one is that the words are clickable.
 *
 * Layout is a plain wrapped row, ordered by weight. A scattered layout would
 * have to run a placement algorithm on every render, and would move the words
 * each time the catalog changed.
 */

const MAX_WORDS = 40
const MIN_SIZE = 13
const MAX_SIZE = 30

/** Keywords worth drawing, heaviest first. */
export function summariseWords(books, limit = MAX_WORDS) {
  const counts = new Map()
  for (const book of books || []) {
    for (const tag of book.tags || []) {
      if (tag.kind !== 'keyword') continue
      const seen = counts.get(tag.key)
      if (seen) seen.count += 1
      else counts.set(tag.key, { key: tag.key, value: tag.value, count: 1 })
    }
  }
  const repeated = [...counts.values()].filter((w) => w.count > 1)
  // Ties are broken alphabetically so the cloud does not reshuffle when two
  // words are used equally often.
  repeated.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
  return { words: repeated.slice(0, limit), distinct: counts.size, drawn: Math.min(repeated.length, limit) }
}

/** Font size for a count, on a square-root scale so one huge word cannot swamp the rest. */
const sizeFor = (count, max) => {
  if (max <= 1) return MIN_SIZE
  const share = Math.sqrt(count - 1) / Math.sqrt(max - 1)
  return Math.round(MIN_SIZE + share * (MAX_SIZE - MIN_SIZE))
}

export default function WordCloud({ books, onPick }) {
  const { t } = useT()
  const { words, distinct, drawn } = summariseWords(books)

  if (!words.length) {
    return <p className="muted tiny">{t('cloud.none')}</p>
  }

  const max = words[0].count

  return (
    <div>
      <div className="word-cloud">
        {words.map((word) => (
          <button
            key={word.key}
            className="word"
            /* One colour for every word. The old cycle through --series-N
               now runs a lightness ramp, whose pale end all but disappears on
               paper, and the colour never carried meaning here anyway: size
               does, and it still does. */
            style={{ fontSize: sizeFor(word.count, max) }}
            title={t('cloud.count', { n: word.count })}
            aria-label={t('cloud.label', { word: word.value, n: word.count })}
            onClick={() => onPick?.(word)}
          >
            {word.value}
          </button>
        ))}
      </div>
      <p className="tiny faint" style={{ marginTop: 10 }}>
        {t('cloud.note', { drawn, distinct })}
      </p>
    </div>
  )
}
