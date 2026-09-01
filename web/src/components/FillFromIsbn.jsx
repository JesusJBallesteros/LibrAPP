import { useRef, useState } from 'react'
import { lookup, previewLookup } from '../ingest/isbn.js'
import { KeepSummary, KeepToggle, useKeepSet } from './Keep.jsx'
import { useT } from '../i18n/index.jsx'

/**
 * Fill in books already imported, from the numbers their own list carried.
 *
 * A list that names an ISBN has said which edition each book is, and a free
 * bibliographic service will hand back the page count, the year, the subjects
 * and the publisher for it. None of that can be got from a title.
 *
 * After the import rather than before it, for two reasons. The catalog is the
 * durable thing and must not wait on a network to exist; and a lookup that
 * fails or is slow then costs nothing already gained. Nothing here is
 * automatic: the codes go nowhere until this button is pressed, and what comes
 * back is shown before it is written.
 *
 * That last part is not politeness. A service asked for an ISBN it does not
 * hold answers with some other book rather than with an error, so a wrong
 * number does not fail, it succeeds wrongly. The checksum on the way in
 * catches most of that; a person catches the rest.
 *
 * The reply is written as its own source, the same one the barcode page uses,
 * and the clusterer joins each record to the book it belongs to. Nothing
 * already in the catalog is edited, so undoing this is deleting one source.
 */
export default function FillFromIsbn({ lib, codes, format = 'physical', onDone }) {
  const { t } = useT()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [found, setFound] = useState(null)
  const [written, setWritten] = useState(null)
  const { dropped, toggle, reset } = useKeepSet()
  const inFlight = useRef(null)

  const run = async () => {
    setError(null)
    setBusy(true)
    const controller = new AbortController()
    inFlight.current = controller
    try {
      const result = await lookup(codes, { signal: controller.signal, onProgress: setProgress })
      // Which of these joins a book already on the shelf, worked out with the
      // real builder rather than by matching titles here.
      let merges = []
      try {
        merges = previewLookup(result.found, lib?.sources || [])
      } catch {
        // A preview that fails is not a reason to lose the lookup.
        merges = []
      }
      reset()
      setFound({ ...result, merges })
    } catch (err) {
      if (err?.name !== 'AbortError') setError(err.message)
    } finally {
      inFlight.current = null
      setBusy(false)
      setProgress(null)
    }
  }

  const keeping = found ? found.found.filter((r) => !dropped.has(r.isbn)) : []
  const joinsFor = (isbn) => found?.merges.find((m) => m.isbn === isbn)?.joins || null

  const keep = () =>
    lib.run(
      async (library) => {
        // In the form the list said these are owned in. A lookup describes an
        // edition and says nothing about owning it, so with no format of their
        // own these records would take the lookup source's default and quietly
        // claim a paper copy of every Kindle book.
        await library.addLookupRecords(keeping, { format })
        const catalog = await library.rebuild()
        setWritten({ n: keeping.length, books: catalog.counts?.books })
        setFound(null)
        onDone?.()
      },
      { onError: setError },
    )

  if (written) {
    return (
      <div className="notice good" style={{ marginTop: 12 }}>
        <p className="tiny">{t('fillIsbn.written', { n: written.n, books: written.books })}</p>
      </div>
    )
  }

  return (
    <>
      {!found && (
        <>
          <p style={{ marginTop: 8 }}>{t('fillIsbn.offer', { n: codes.length })}</p>
          <p className="tiny faint">{t('fillIsbn.what')}</p>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={run} disabled={busy || lib.busy || !codes.length}>
              {busy ? t('fillIsbn.asking') : t('fillIsbn.ask', { n: codes.length })}
            </button>
            {busy && (
              <button className="btn small" onClick={() => inFlight.current?.abort()}>
                {t('common.cancel')}
              </button>
            )}
          </div>
          {progress && (
            <p className="tiny faint" style={{ marginTop: 8 }}>
              {t('fillIsbn.progress', { done: progress.done, total: progress.total })}
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
            {t('fillIsbn.back', { found: found.found.length, missing: found.missing.length })}
          </p>
          <p className="tiny faint">{t('fillIsbn.check')}</p>

          <ul className="lookup-list">
            {found.found.map((record) => {
              const isDropped = dropped.has(record.isbn)
              const joins = joinsFor(record.isbn)
              return (
                <li key={record.isbn} className={isDropped ? 'discarded' : undefined}>
                  <span>
                    <span className="title">{record.title}</span>
                    <br />
                    <span className="tiny muted">
                      {[
                        (record.authors || []).join(', ') || t('isbn.noAuthor'),
                        record.published_year,
                        record.pages ? t('fillIsbn.pages', { n: record.pages }) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    {/* Which book on the shelf this lands on. A record that
                        joins nothing is a book this list did not bring in, and
                        saying so is the difference between filling a book in
                        and quietly adding one. */}
                    <br />
                    <span className="tiny faint">
                      {joins ? t('fillIsbn.joins', { title: joins }) : t('fillIsbn.joinsNothing')}
                    </span>
                  </span>
                  <span className="lookup-fate tiny">
                    {isDropped && <span className="faint">{t('keep.discardedTag')}</span>}
                    <KeepToggle
                      dropped={isDropped}
                      disabled={lib.busy}
                      onToggle={() => toggle(record.isbn)}
                    />
                  </span>
                </li>
              )
            })}
          </ul>

          <KeepSummary kept={keeping.length} total={found.found.length} />

          <div className="row" style={{ marginTop: 14 }}>
            <button
              className="btn primary"
              onClick={keep}
              disabled={lib.busy || !keeping.length}
            >
              {t('fillIsbn.keep', { n: keeping.length })}
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
