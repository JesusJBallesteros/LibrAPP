import { useEffect, useState } from 'react'
import { providersWithKeys } from '../ai/key.js'
import { useT } from '../i18n/index.jsx'

/**
 * What is set up and what is not.
 *
 * Three things decide whether LibrAPP can do everything it offers: somewhere to
 * keep the catalog, at least one book in it, and a key for the two steps that
 * can use one. Each is answered in a different place, and nothing gathered the
 * answers, so the only way to know where you had got to was to visit all three.
 *
 * State, not instruction. A line here says what is true and, where something is
 * missing, where to go; it does not explain what any of the three is for.
 *
 * Shown only once a library exists. Before that every line reads as not done,
 * which is a wall of empty boxes in front of somebody who has not started, and
 * the ways in below are the whole of what there is to do anyway.
 */
export default function SetUpSoFar({ lib, bookCount, onGo }) {
  const { t } = useT()
  const [keyed, setKeyed] = useState(null)

  useEffect(() => {
    let cancelled = false
    providersWithKeys()
      .then((found) => {
        if (!cancelled) setKeyed(found.length > 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (lib.status !== 'ready' || !lib.library) return null

  const where = lib.library.where
  const rows = [
    {
      id: 'storage',
      done: true,
      said: where || t(`storage.kind.${lib.library.kind}`),
      go: () => onGo('storage'),
    },
    {
      id: 'books',
      done: bookCount > 0,
      said: bookCount > 0 ? t('setUp.books.n', { n: bookCount }) : t('setUp.books.none'),
      go: () => onGo('shelf'),
    },
    {
      id: 'key',
      done: keyed === true,
      said: keyed === null ? '' : keyed ? t('setUp.key.stored') : t('setUp.key.none'),
      go: () => onGo('shelf', 'key'),
    },
  ]

  return (
    <section className="set-up-so-far">
      <h2 className="section-head">{t('setUp.title')}</h2>
      <ul>
        {rows.map((row) => (
          <li key={row.id} className={row.done ? 'done' : undefined}>
            <span className="mark" aria-hidden="true">
              {row.done ? '✓' : '·'}
            </span>
            <span className="what">{t(`setUp.${row.id}`)}</span>
            <span className="said">{row.said}</span>
            {!row.done && (
              <button className="btn link" onClick={row.go}>
                {t(`setUp.${row.id}.action`)}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
