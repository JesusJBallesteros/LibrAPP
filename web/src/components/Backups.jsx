import { useCallback, useEffect, useState } from 'react'
import { useT } from '../i18n/index.jsx'

/**
 * Copies of the whole library, and the two ways to use one.
 *
 * Resetting is the only thing in the app that destroys work on purpose, and it
 * exists only because there is a way back from it. So it copies first, always,
 * and the copy is listed here beside every other one. Recovering copies first
 * too: choosing the wrong backup is a mistake somebody will make, and it should
 * cost nothing but a second choice.
 *
 * A backup is an export bundle, written into the library instead of being
 * downloaded. Nothing about the format is private to backups, which is the
 * point: the file a reset leaves behind is the same file the export button
 * produces, so it can be taken to another device and brought in through the
 * import that is already there. The download button on each row is what makes
 * that a real route rather than a claim.
 *
 * Every destructive button asks first, and the asking names what will go.
 */

const bytes = (n) => (n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} kB` : `${(n / 1e6).toFixed(1)} MB`)

export default function Backups({ lib }) {
  const { t, language } = useT()
  const [backups, setBackups] = useState(null)
  // Which destructive act is waiting to be confirmed, as { what, file }. One at
  // a time: two open questions on one page is two chances to answer the wrong
  // one.
  const [asking, setAsking] = useState(null)
  const [error, setError] = useState(null)
  const [note, setNote] = useState(null)

  const load = useCallback(async () => {
    if (!lib.library) return
    try {
      setBackups(await lib.library.readBackups())
    } catch (err) {
      setError(err.message)
    }
  }, [lib.library])

  useEffect(() => {
    load()
  }, [load])

  // Every act here ends the same way: say what happened, close the question,
  // and read the list again, because all of them change it.
  const act = (fn, said) =>
    lib.run(
      async (library) => {
        await fn(library)
        setAsking(null)
        setNote(said)
        await load()
      },
      { onError: setError },
    )

  const books = lib.catalog?.counts?.books ?? 0

  const makeNow = () =>
    act(async (library) => {
      const file = await library.makeBackup('manual')
      if (!file) throw new Error(t('backups.nothingToCopy'))
    }, t('backups.copied'))

  const reset = () =>
    act(async (library) => {
      await library.resetCatalog()
    }, t('backups.wasReset'))

  const recover = (file) =>
    act(async (library) => {
      await library.restoreBackup(file)
    }, t('backups.recovered'))

  const remove = (file) =>
    act(async (library) => {
      await library.deleteBackup(file)
    }, t('backups.deleted'))

  /** Hand one over as a file, which is how it reaches another device. */
  const download = async (file) => {
    setError(null)
    try {
      const bundle = await lib.library.readBackup(file)
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `librapp-${file}`
      a.click()
      URL.revokeObjectURL(url)
      setNote(t('backups.downloaded', { name: file }))
    } catch (err) {
      setError(err.message)
    }
  }

  /** When it was made, in the reader's own locale, or the file name if it never said. */
  const when = (backup) => {
    if (!backup.made_at) return backup.file
    const at = new Date(backup.made_at)
    return Number.isNaN(at.getTime()) ? backup.file : at.toLocaleString(language)
  }

  const question = (what, file) => asking?.what === what && asking?.file === file

  return (
    <section className="desk-section" style={{ marginTop: 34 }} id="backups-box">
      <div className="section-head spread">
        <h3>{t('backups.head')}</h3>
        {backups?.length > 0 && (
          <span className="tabular tiny faint">{t('backups.countN', { n: backups.length })}</span>
        )}
      </div>

      <p className="tiny">{t('backups.intro')}</p>
      <p className="tiny faint">{t('backups.carry')}</p>

      <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button className="btn" disabled={lib.busy || !books} onClick={makeNow}>
          {t('backups.makeNow')}
        </button>
        <button
          className="btn danger"
          disabled={lib.busy || !books}
          onClick={() => setAsking({ what: 'reset', file: null })}
        >
          {t('backups.reset')}
        </button>
      </div>

      {question('reset', null) && (
        <div className="notice bulk-confirm" style={{ marginTop: 12 }}>
          <p>
            <strong>{t('backups.resetConfirm', { n: books })}</strong>
          </p>
          <p className="tiny">{t('backups.resetWhy')}</p>
          <span className="row" style={{ gap: 8, marginTop: 8 }}>
            <button className="btn small danger" disabled={lib.busy} onClick={reset}>
              {t('backups.resetDo', { n: books })}
            </button>
            <button className="btn small" disabled={lib.busy} onClick={() => setAsking(null)}>
              {t('common.cancel')}
            </button>
          </span>
        </div>
      )}

      {error && (
        <div className="notice bad" role="alert" style={{ marginTop: 12 }}>
          <p className="tiny">{error}</p>
        </div>
      )}
      {note && !error && (
        <div className="notice good" style={{ marginTop: 12 }}>
          <p className="tiny">{note}</p>
        </div>
      )}

      {backups === null ? (
        <p className="tiny faint" style={{ marginTop: 14 }}>{t('backups.reading')}</p>
      ) : backups.length === 0 ? (
        <p className="tiny faint" style={{ marginTop: 14 }}>{t('backups.none')}</p>
      ) : (
        <ul className="lookup-list" style={{ marginTop: 14 }}>
          {backups.map((backup) => (
            <li key={backup.file}>
              <span>
                <span className="title">{when(backup)}</span>
                <br />
                <span className="tiny muted">
                  {backup.readable
                    ? [
                        t(`backups.why.${backup.why}`) === `backups.why.${backup.why}`
                          ? t('backups.why.manual')
                          : t(`backups.why.${backup.why}`),
                        t('backups.holds', { books: backup.books ?? 0, sources: backup.sources }),
                        bytes(backup.bytes),
                      ].join(' · ')
                    : t('backups.unreadable')}
                </span>

                {question('recover', backup.file) && (
                  <div className="notice bulk-confirm" style={{ marginTop: 8 }}>
                    <p className="tiny">
                      <strong>{t('backups.recoverConfirm', { books: backup.books ?? 0 })}</strong>
                    </p>
                    <p className="tiny">{t('backups.recoverWhy', { n: books })}</p>
                    <span className="row" style={{ gap: 8, marginTop: 8 }}>
                      <button
                        className="btn small primary"
                        disabled={lib.busy}
                        onClick={() => recover(backup.file)}
                      >
                        {t('backups.recoverDo')}
                      </button>
                      <button className="btn small" disabled={lib.busy} onClick={() => setAsking(null)}>
                        {t('common.cancel')}
                      </button>
                    </span>
                  </div>
                )}

                {question('delete', backup.file) && (
                  <div className="notice bulk-confirm" style={{ marginTop: 8 }}>
                    <p className="tiny">
                      <strong>{t('backups.deleteConfirm')}</strong>
                    </p>
                    <p className="tiny">{t('backups.deleteWhy')}</p>
                    <span className="row" style={{ gap: 8, marginTop: 8 }}>
                      <button
                        className="btn small danger"
                        disabled={lib.busy}
                        onClick={() => remove(backup.file)}
                      >
                        {t('backups.deleteDo')}
                      </button>
                      <button className="btn small" disabled={lib.busy} onClick={() => setAsking(null)}>
                        {t('common.cancel')}
                      </button>
                    </span>
                  </div>
                )}
              </span>

              <span className="row" style={{ gap: 6, alignItems: 'center' }}>
                {backup.readable && (
                  <button
                    className="btn small"
                    disabled={lib.busy}
                    onClick={() => setAsking({ what: 'recover', file: backup.file })}
                  >
                    {t('backups.recover')}
                  </button>
                )}
                {backup.readable && (
                  <button className="btn small" disabled={lib.busy} onClick={() => download(backup.file)}>
                    {t('backups.download')}
                  </button>
                )}
                <button
                  className="btn small"
                  disabled={lib.busy}
                  onClick={() => setAsking({ what: 'delete', file: backup.file })}
                >
                  {t('backups.delete')}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
