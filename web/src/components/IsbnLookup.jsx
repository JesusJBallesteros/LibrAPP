import { useRef, useState } from 'react'
import { lookup, parseCodes } from '../ingest/isbn.js'
import { useT } from '../i18n/index.jsx'

/**
 * Fill a book in from the number printed on its own barcode.
 *
 * Sits beside the desk's other requests and is deliberately not one of them:
 * the others assemble a question for a model and are priced per request, and
 * this asks a bibliographic service for a record it already holds. No key, no
 * cost, no judgement. What it does share with them is the ending, because it
 * has the same problem: what comes back is shown and accepted rather than
 * written straight into the catalog.
 *
 * That matters more here than it looks. A service asked for an ISBN it does not
 * have answers with some other book rather than with an error, so a digit typed
 * wrong does not fail, it succeeds wrongly. The checksum catches most of that
 * and a person catches the rest.
 */
export default function IsbnLookup({ lib, onDone }) {
  const { t } = useT()
  const [text, setText] = useState('')
  const [format, setFormat] = useState('physical')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [found, setFound] = useState(null)
  const [written, setWritten] = useState(null)
  const inFlight = useRef(null)

  const { codes, rejected } = parseCodes(text)

  const run = async () => {
    setError(null)
    setWritten(null)
    setBusy(true)
    const controller = new AbortController()
    inFlight.current = controller
    try {
      const result = await lookup(codes, {
        signal: controller.signal,
        onProgress: setProgress,
      })
      setFound(result)
    } catch (err) {
      if (err?.name !== 'AbortError') setError(err.message)
    } finally {
      inFlight.current = null
      setBusy(false)
      setProgress(null)
    }
  }

  const keep = () =>
    lib.run(async (library) => {
      await library.addLookupRecords(found.found, { format })
      const catalog = await library.rebuild()
      setWritten({ n: found.found.length, books: catalog.counts?.books })
      setFound(null)
      setText('')
      onDone?.()
    })

  const onFile = async (file) => {
    if (!file) return
    setText(await file.text())
    setFound(null)
  }

  return (
    <section className="desk-section">
      <h3 className="section-head">{t('isbn.title')}</h3>
      <p className="tiny faint" style={{ margin: '6px 0 12px' }}>{t('isbn.note')}</p>

      {/* Said once, plainly, where the feature is rather than in a policy page.
          This is the only part of the app that talks to a service, and what it
          sends is the whole of the argument for it being here. */}
      <p className="tiny muted">{t('isbn.privacy')}</p>

      {!found && !written && (
        <>
          <label className="field" style={{ marginTop: 12 }}>
            <span className="tiny">{t('isbn.paste')}</span>
            <textarea
              rows={4}
              value={text}
              spellCheck={false}
              placeholder={'978-0-441-01359-3\n9780547928227'}
              onChange={(e) => setText(e.target.value)}
              disabled={busy || lib?.busy}
            />
          </label>

          <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <label className="field">
              <span className="tiny">{t('isbn.format')}</span>
              <select value={format} onChange={(e) => setFormat(e.target.value)} disabled={busy}>
                <option value="physical">{t('isbn.format.physical')}</option>
                <option value="ebook">{t('isbn.format.ebook')}</option>
                <option value="audio">{t('isbn.format.audio')}</option>
              </select>
            </label>
            <label className="btn small file-button">
              {t('isbn.fromFile')}
              <input
                type="file"
                accept=".txt,.csv,.tsv"
                hidden
                onChange={(e) => {
                  onFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          <p className="tiny faint" style={{ marginTop: 10 }} aria-live="polite">
            {codes.length
              ? t('isbn.ready', { n: codes.length })
              : text.trim()
                ? t('isbn.noneFound')
                : ''}
            {rejected.length ? ` ${t('isbn.rejected', { n: rejected.length })}` : ''}
          </p>
          {rejected.length > 0 && (
            <p className="tiny faint tabular">{rejected.join(', ')}</p>
          )}

          <button
            className="btn primary"
            style={{ marginTop: 10 }}
            disabled={!codes.length || busy || lib?.busy}
            onClick={run}
          >
            {busy
              ? progress
                ? t('isbn.looking', { done: progress.done, total: progress.total })
                : t('isbn.lookingUp')
              : t('isbn.lookUp', { n: codes.length })}
          </button>
        </>
      )}

      {error && (
        <div className="notice bad" role="alert">
          <p className="tiny">{error}</p>
        </div>
      )}

      {found && (
        <div className="lookup-review">
          <p>
            <strong>{t('isbn.foundN', { n: found.found.length })}</strong>{' '}
            {found.missing.length ? t('isbn.missingN', { n: found.missing.length }) : ''}
          </p>
          <p className="tiny faint">{t('isbn.checkThese')}</p>

          <ul className="lookup-list">
            {found.found.map((record) => (
              <li key={record.isbn}>
                <span>
                  <span className="title">{record.title}</span>
                  <br />
                  <span className="tiny muted">
                    {[
                      record.authors.join(', ') || t('isbn.noAuthor'),
                      record.publisher,
                      record.published_year,
                      record.pages ? t('isbn.pages', { n: record.pages }) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className="tiny faint tabular">{record.isbn}</span>
              </li>
            ))}
          </ul>

          {found.missing.length > 0 && (
            <p className="tiny faint">
              {t('isbn.missingWhich')} <span className="tabular">{found.missing.join(', ')}</span>
            </p>
          )}

          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button
              className="btn primary"
              disabled={!found.found.length || lib?.busy}
              onClick={keep}
            >
              {t('isbn.keep', { n: found.found.length })}
            </button>
            <button className="btn" disabled={lib?.busy} onClick={() => setFound(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {written && (
        <div className="notice good">
          <p>
            <strong>{t('isbn.kept', { n: written.n })}</strong>{' '}
            {t('isbn.nowHolds', { n: written.books })}
          </p>
          <p className="tiny">{t('isbn.merged')}</p>
        </div>
      )}
    </section>
  )
}
