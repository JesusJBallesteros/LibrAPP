import { useRef, useState } from 'react'
import { SEARCH_CAP, searchMany } from '../ingest/search.js'
import { KeepSummary, KeepToggle, useKeepSet } from './Keep.jsx'
import { useT } from '../i18n/index.jsx'

/**
 * Fill in books that carried no number, from their title and their author.
 *
 * The weaker of the two lookups and presented as such. An ISBN names one
 * edition and the answer is about that edition; a title and an author name a
 * guess, and the service will always return something for them. What survives
 * the judging in ingest/search.js is offered here, with the title it matched
 * shown beside the title on the shelf, because that pair is the only thing a
 * reader can actually check.
 *
 * A hundred at a press. This is one request per book against a free service run
 * by a charity, where the ISBN route is one per fifty, and a run over a library
 * of twelve hundred should be a decision taken twelve times rather than once by
 * accident. Pressing again continues where it stopped.
 */
export default function FillFromSearch({ lib, books, format = 'physical', onDone }) {
  const { t } = useT()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [found, setFound] = useState(null)
  const [written, setWritten] = useState(null)
  // How far through the list the reader has got, so a second press carries on
  // rather than asking the same hundred again.
  const [at, setAt] = useState(0)
  const { dropped, toggle, reset } = useKeepSet()
  const inFlight = useRef(null)

  const batch = books.slice(at, at + SEARCH_CAP)

  const run = async () => {
    setError(null)
    setBusy(true)
    const controller = new AbortController()
    inFlight.current = controller
    try {
      const result = await searchMany(batch, {
        signal: controller.signal,
        onProgress: setProgress,
      })
      reset()
      setFound(result)
      setAt((was) => was + batch.length)
    } catch (err) {
      if (err?.name !== 'AbortError') setError(err.message)
    } finally {
      inFlight.current = null
      setBusy(false)
      setProgress(null)
    }
  }

  const keeping = found ? found.found.filter((hit) => !dropped.has(hit.book.id ?? hit.book.title)) : []

  const keep = () =>
    lib.run(
      async (library) => {
        await library.addSearchRecords(keeping.map((hit) => hit.record), { format })
        const catalog = await library.rebuild()
        setWritten({ n: keeping.length, books: catalog.counts?.books })
        setFound(null)
        onDone?.()
      },
      { onError: setError },
    )

  return (
    <>
      {written && (
        <div className="notice good" style={{ marginTop: 12 }}>
          <p className="tiny">{t('fillSearch.written', { n: written.n, books: written.books })}</p>
        </div>
      )}

      {!found && (
        <>
          <p style={{ marginTop: 8 }}>{t('fillSearch.offer', { n: books.length })}</p>
          <p className="tiny faint">{t('fillSearch.what')}</p>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={run} disabled={busy || lib.busy || !batch.length}>
              {busy ? t('fillSearch.asking') : t('fillSearch.ask', { n: batch.length })}
            </button>
            {busy && (
              <button className="btn small" onClick={() => inFlight.current?.abort()}>
                {t('common.cancel')}
              </button>
            )}
          </div>
          {at > 0 && !busy && batch.length > 0 && (
            <p className="tiny faint" style={{ marginTop: 8 }}>
              {t('fillSearch.soFar', { done: at, total: books.length })}
            </p>
          )}
          {progress && (
            <p className="tiny faint" style={{ marginTop: 8 }}>
              {t('fillSearch.progress', { done: progress.done, total: progress.total })}
            </p>
          )}
        </>
      )}

      {error && (
        <div className="notice bad" role="alert" style={{ marginTop: 12 }}>
          <p className="tiny">{error}</p>
        </div>
      )}

      {found && (
        <>
          <p style={{ marginTop: 8 }}>
            {t('fillSearch.back', { found: found.found.length, missing: found.missing.length })}
          </p>
          <div className="notice warn">
            <p className="tiny">{t('fillSearch.check')}</p>
          </div>

          <ul className="lookup-list">
            {found.found.map((hit) => {
              const key = hit.book.id ?? hit.book.title
              const isDropped = dropped.has(key)
              return (
                <li key={key} className={isDropped ? 'discarded' : undefined}>
                  <span>
                    <span className="title">{hit.book.title}</span>
                    <br />
                    {/* The title it matched, beside the title on the shelf.
                        This pair is the whole of what a reader can check, so it
                        is the pair that is shown. */}
                    <span className="tiny muted">
                      {t('fillSearch.matched', { title: hit.doc.title })}
                    </span>
                    <br />
                    <span className="tiny faint">
                      {[
                        hit.record.published_year,
                        hit.record.pages ? t('fillIsbn.pages', { n: hit.record.pages }) : null,
                        hit.record.publisher,
                      ]
                        .filter(Boolean)
                        .join(' · ') || t('fillSearch.nothingNew')}
                    </span>
                  </span>
                  <span className="lookup-fate tiny">
                    {isDropped && <span className="faint">{t('keep.discardedTag')}</span>}
                    <KeepToggle dropped={isDropped} disabled={lib.busy} onToggle={() => toggle(key)} />
                  </span>
                </li>
              )
            })}
          </ul>

          <KeepSummary kept={keeping.length} total={found.found.length} />

          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn primary" onClick={keep} disabled={lib.busy || !keeping.length}>
              {t('fillSearch.keep', { n: keeping.length })}
            </button>
            <button className="btn" onClick={() => setFound(null)} disabled={lib.busy}>
              {t('fillIsbn.discard')}
            </button>
          </div>
        </>
      )}
    </>
  )
}
