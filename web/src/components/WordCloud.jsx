import { useT } from '../i18n/index.jsx'

/**
 * The words a collection keeps returning to, and what it is made of.
 *
 * Two clouds, one component. Keywords are the messier half and genres the
 * shorter one, and both come from the sources rather than a controlled list, so
 * a real catalog has hundreds of the first and over a hundred of the second,
 * most used once. Only the ones used more than once are drawn.
 *
 * Genres were a donut until this. On a real shelf the labels fragment far
 * enough that the largest wedge is everything else, which says nothing; a cloud
 * of the same data shows the ones that carry the collection and simply gets
 * smaller as the tail grows.
 *
 * Every word is a button rather than positioned SVG text. A cloud of unlabelled
 * shapes is unreachable by keyboard and unreadable by a screen reader, and the
 * whole point of this one is that the words are clickable.
 *
 * Layout is a wrapped row ordered by weight, not a placement algorithm. A
 * scattered layout would have to run on every render and would move the words
 * whenever the catalog changed.
 */

const MAX_WORDS = 40

// Genres are fewer and longer, keywords more numerous and shorter, so they are
// not drawn at the same scale.
const SCALE = {
  keyword: { min: 13, max: 30 },
  genre: { min: 15, max: 34 },
}

/** Tags of one kind worth drawing, heaviest first. */
export function summariseWords(books, { kind = 'keyword', limit = MAX_WORDS, least = 2 } = {}) {
  const counts = new Map()
  for (const book of books || []) {
    for (const tag of book.tags || []) {
      if (tag.kind !== kind) continue
      const seen = counts.get(tag.key)
      if (seen) seen.count += 1
      else counts.set(tag.key, { key: tag.key, value: tag.value, count: 1 })
    }
  }
  // How many books have to share a word before it is worth drawing. Two for
  // genres, which are few and deliberate; three for keywords, which arrive
  // uncontrolled from every source and bury the shelf in words used twice.
  const repeated = [...counts.values()].filter((w) => w.count >= least)
  // Ties are broken alphabetically so the cloud does not reshuffle when two
  // words are used equally often.
  repeated.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
  return {
    words: repeated.slice(0, limit),
    distinct: counts.size,
    drawn: Math.min(repeated.length, limit),
  }
}

/** Font size for a count, on a square-root scale so one huge word cannot swamp the rest. */
export const sizeFor = (count, max, { min, max: top }) => {
  if (max <= 1) return min
  const share = Math.sqrt(count - 1) / Math.sqrt(max - 1)
  return Math.round(min + share * (top - min))
}

export default function WordCloud({ books, onPick, kind = 'keyword', least }) {
  const { t } = useT()
  const { words, distinct, drawn } = summariseWords(books, { kind, least })

  if (!words.length) {
    return (
      <>
        <p className="muted tiny">{t(`cloud.${kind}.none`)}</p>
        <p className="tiny faint" style={{ marginTop: 6 }}>{t(`cloud.${kind}.noneHow`)}</p>
      </>
    )
  }

  const max = words[0].count
  const scale = SCALE[kind] || SCALE.keyword

  return (
    <div>
      <div className={`word-cloud ${kind}`}>
        {words.map((word) => (
          <button
            key={word.key}
            /* One colour for every word in a cloud. Size carries the count and
               always did; the colour never carried anything. */
            className="word"
            style={{ fontSize: sizeFor(word.count, max, scale) }}
            title={t('cloud.count', { n: word.count })}
            aria-label={t('cloud.label', { word: word.value, n: word.count })}
            onClick={() => onPick?.(word)}
          >
            {word.value}
          </button>
        ))}
      </div>
      <p className="tiny faint" style={{ marginTop: 10 }}>
        {t(`cloud.${kind}.note`, { drawn, distinct })}
      </p>
    </div>
  )
}
