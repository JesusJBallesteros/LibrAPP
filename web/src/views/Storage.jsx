import { useEffect, useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { requestPersistence, storageEstimate } from '../store/fs.js'
import { clearOverride, setRemoved } from '../core/overrides.js'
import { checkCapabilities } from '../store/capabilities.js'
import { useT } from '../i18n/index.jsx'
import { BUILT, buildLabel, reloadFresh } from '../version.js'

const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`

export default function Storage({ lib, focus, owlGone, onRestoreOwl }) {
  const { t, language } = useT()
  const [estimate, setEstimate] = useState(null)
  const [note, setNote] = useState(null)
  const [persisted, setPersisted] = useState(null)

  useEffect(() => {
    storageEstimate().then(setEstimate).catch(() => {})
    navigator.storage?.persisted?.().then(setPersisted).catch(() => {})
  }, [lib.sources])

  // Arriving here from "I have a catalog from another device" should land on
  // the import box, not the top of a long page.
  useEffect(() => {
    if (focus !== 'import') return
    const box = document.getElementById('import-box')
    // Instant, for the reason given in Shelf.jsx.
    box?.scrollIntoView({ block: 'center' })
  }, [focus])

  const exportBundle = async () => {
    const bundle = await lib.library.exportBundle()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `librapp-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setNote(t('storage.exported', { n: bundle.sources.length }))
  }

  const capabilities = checkCapabilities()

  /**
    * A capability's own wording, translated where a translation exists.
    *
    * The checks carry English text of their own so the module stands alone.
    * A check added later without a translation should read in English rather
    * than showing the name of a missing key.
    */
  const cap = (id, part, fallback) => {
    const key = `cap.${id}.${part}`
    const value = t(key)
    return value === key ? fallback : value
  }

  const review = lib.catalog?.review || {}
  const removed = review.removed_by_hand || []
  const corrected = review.corrected || []
  const orphaned = review.orphaned_overrides || []

  /** Drop a correction entirely, returning the entry to what the sources say. */
  const undo = (id, title) =>
    lib.run(async (library) => {
      await library.writeOverrides(clearOverride(await library.readOverrides(), id))
      await library.rebuild()
      setNote(t('storage.undone', { what: title || id }))
    })

  /**
   * Bring a removed book back without discarding anything else about it.
   *
   * A book can be both edited and removed. Undoing the removal must not undo
   * the edit as well, which is a second decision nobody made.
   */
  const restore = (entry) =>
    lib.run(async (library) => {
      const overrides = await library.readOverrides()
      await library.writeOverrides(
        setRemoved(overrides, { id: entry.id, title: entry.title, authors: entry.authors }, false),
      )
      await library.rebuild()
      setNote(t('storage.restored', { what: entry.title || entry.id }))
    })

  /**
    * Import a catalog exported elsewhere.
    *
    * The file is judged by what is in it, never by what the picker calls it.
    * Android reports a downloaded .json as application/octet-stream often
    * enough that filtering on type hides the file the person came to choose.
    * Nothing is filtered, and a wrong file is explained instead.
    */
  const importBundle = (file) =>
    lib.run(async (library) => {
      const text = await file.text()
      let bundle
      try {
        bundle = JSON.parse(text)
      } catch {
        throw new Error(t('error.notJson', { name: file.name }))
      }
      if (bundle?.librapp_bundle !== 1) {
        throw new Error(t('error.notAnExport', { name: file.name }))
      }
      const written = await library.importBundle(bundle)
      await library.rebuild()
      setNote(t('storage.imported', { n: written }))
    })

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">{t('storage.eyebrow')}</p>
        <h2>{t('nav.stacks')}</h2>
        <hr className="rule" />
        <p>{t('storage.intro')}</p>
      </div>

      {note && (
        <div className="notice good">
          <p>{note}</p>
        </div>
      )}

      <div className="storage-pair">
        <section className="desk-section">
          <h3 className="section-head">{t('storage.where')}</h3>
          <p className="muted tiny">
            {lib.library?.kind ? t(`storage.kind.${lib.library.kind}`) : t('storage.kind.unknown')}
          </p>
          {estimate?.quota ? (
            <>
              <p className="quota">
                {t('storage.using', { used: mb(estimate.usage), quota: mb(estimate.quota) })}
              </p>
              {/* The figures are the statement; the bar is only there to make
                  the proportion readable at a glance. */}
              <div
                className="usage"
                role="img"
                aria-label={t('storage.using', { used: mb(estimate.usage), quota: mb(estimate.quota) })}
              >
                <span style={{ width: `${Math.min(100, (estimate.usage / estimate.quota) * 100)}%` }} />
              </div>
            </>
          ) : null}
        {lib.library?.kind === 'browser' && persisted === false && (
          <div className="notice bad" style={{ marginTop: 12 }}>
            <p className="tiny">
              <strong>{t('storage.notPersistent')}</strong> {t('storage.notPersistentBody')}
            </p>
            <button
              className="btn small"
              style={{ marginTop: 8 }}
              onClick={async () => setPersisted(await requestPersistence())}
            >
              {t('storage.askPersistent')}
            </button>
          </div>
        )}
        {lib.library?.kind === 'browser' && persisted === true && (
          <p className="tiny" style={{ color: 'var(--good)', marginTop: 10 }}>
            {t('storage.persistent')}
          </p>
        )}

          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={exportBundle} disabled={!lib.sources.length}>
              {t('common.export')}
            </button>
            <button className="btn" onClick={lib.forget}>
              {t('storage.elsewhere')}
            </button>
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            {t('storage.forgetNote')}
          </p>
        </section>
        <section className="desk-section">
          <div className="section-head spread">
            <h3>{t('storage.browser')}</h3>
            <span className={`tag ${capabilities.complete ? 'read' : capabilities.usable ? 'unread' : 'bad'}`}>
              {capabilities.complete
                ? t('storage.allSupported')
                : capabilities.usable
                  ? t('storage.someMissing', { n: capabilities.missingOptional.length })
                  : t('storage.notSupported')}
            </span>
          </div>
          <p className="muted tiny" style={{ marginTop: 8 }}>
            {t('storage.browserNote')}
          </p>

          <div style={{ marginTop: 12 }}>
            {capabilities.checks.map((c) => (
              <div className="forgotten-item spread" key={c.id}>
                <span>
                  <span className="title" style={{ font: '400 13.5px/1.3 var(--sans)' }}>
                    {cap(c.id, 'label', c.label)}
                  </span>
                  <div className="why">
                    {cap(c.id, 'needed', c.needed)}
                    {!c.ok && c.fix ? ` — ${cap(c.id, 'fix', c.fix)}` : ''}
                  </div>
                </span>
                <span className={`answer ${c.ok ? 'read' : c.required ? 'bad' : 'unread'}`}>
                  {c.ok ? t('storage.yes') : c.required ? t('storage.missing') : t('storage.no')}
                </span>
              </div>
            ))}
          </div>

          {!capabilities.usable && (
            <div className="notice bad" style={{ marginTop: 12 }}>
              <p className="tiny">{t('storage.cannotRun')}</p>
            </div>
          )}
        </section>
      </div>

      <section className="desk-section">
        <h3 className="section-head">{t('storage.sources')}</h3>
        {lib.sources.length === 0 ? (
          <p className="muted">{t('storage.noSources')}</p>
        ) : (
          <div className="table-scroll">
          <table className="sources">
            <thead>
              <tr>
                <th>{t('storage.col.name')}</th>
                <th>{t('storage.col.kind')}</th>
                <th>{t('storage.col.from')}</th>
                <th>{t('storage.col.trust')}</th>
                <th className="right">{t('storage.col.records')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lib.sources.map((s) => (
                <tr key={s.file}>
                  <td className="tabular">{s.source?.name || s.file}</td>
                  <td className="muted">{s.source?.kind || t('storage.kindUnknown')}</td>
                  <td className="faint">{s.error ? <span style={{ color: 'var(--bad)' }}>{s.error}</span> : s.source?.origin}</td>
                  <td className="muted">
                    {s.source?.confidence ? t(`confidence.${s.source.confidence}`) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {s.records?.length ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn small"
                      disabled={lib.busy}
                      onClick={() =>
                        lib.run(async (library) => {
                          await library.deleteSource(s.file)
                          const left = await library.sourceNames()
                          if (left.length) await library.rebuild()
                          setNote(t('storage.sourceRemoved', { name: s.file }))
                        })
                      }
                    >
                      {t('common.remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        <p className="tiny faint" style={{ marginTop: 10 }}>
          {t('storage.sourcesNote')}
        </p>
      </section>

      <section className="desk-section">
        <h3 className="section-head">{t('storage.corrections')}</h3>
        <p className="muted tiny">{t('storage.correctionsNote')}</p>

        {!removed.length && !corrected.length && !orphaned.length && (
          <p className="muted" style={{ marginTop: 10 }}>{t('storage.noCorrections')}</p>
        )}

        {removed.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p className="group-label">{t('storage.removedGroup', { n: removed.length })}</p>
            {removed.map((r) => (
              <div className="forgotten-item spread" key={r.id}>
                <span>
                  <span className="title">{r.title}</span>
                  {r.why && <div className="why">{r.why}</div>}
                </span>
                <button className="btn small" disabled={lib.busy} onClick={() => restore(r)}>
                  {t('common.restore')}
                </button>
              </div>
            ))}
          </div>
        )}

        {corrected.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p className="group-label">{t('storage.editedGroup', { n: corrected.length })}</p>
            {corrected.map((c) => (
              <div className="forgotten-item spread" key={c.id}>
                <span>
                  <span className="title">{c.title}</span>
                  <div className="why">{t('storage.changed', { fields: c.fields.join(', ') })}</div>
                </span>
                <button className="btn small" disabled={lib.busy} onClick={() => undo(c.id, c.title)}>
                  {t('common.undo')}
                </button>
              </div>
            ))}
          </div>
        )}

        {orphaned.length > 0 && (
          <div className="notice bad" style={{ marginTop: 14 }}>
            <p className="tiny">
              <strong>{t('storage.orphaned', { n: orphaned.length })}</strong>{' '}
              {t('storage.orphanedNote')}
            </p>
            {orphaned.map((o) => (
              <div className="forgotten-item spread" key={o.id}>
                <span>
                  <span className="title">{o.title || o.id}</span>
                  <div className="why">
                    {o.removed ? t('storage.wasRemoved') : t('storage.wasEdited')}
                    {o.at ? ` · ${o.at}` : ''}
                  </div>
                </span>
                <button className="btn small" disabled={lib.busy} onClick={() => undo(o.id, o.title)}>
                  {t('storage.forgetIt')}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="desk-section">
        <div className="section-head spread">
          <h3>{t('version.title')}</h3>
          <span className="tabular tiny faint">{buildLabel()}</span>
        </div>
        <p className="muted tiny" style={{ marginTop: 8 }}>
          {BUILT ? t('version.built', { when: new Date(BUILT).toLocaleString(language) }) : ''}{' '}
          {t('version.body')}
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={reloadFresh}>
            {t('version.refresh')}
          </button>
        </div>
        <p className="tiny faint" style={{ marginTop: 8 }}>
          {t('version.safe')}
        </p>
      </section>

      {owlGone && (
        <section className="desk-section">
          <h3 className="section-head">{t('librarian.name')}</h3>
          <p className="muted tiny">{t('storage.owlHidden')}</p>
          <div className="row" style={{ marginTop: 14 }}>
            <button
              className="btn"
              onClick={() => {
                onRestoreOwl?.()
                setNote(t('storage.owlBack'))
              }}
            >
              {t('storage.owlRestore')}
            </button>
          </div>
        </section>
      )}

      {/* Export moved up beside the location it would be leaving, so this is
          the way in rather than a pair of opposite doors in one box. */}
      <section className="desk-section" id="import-box">
        <h3 className="section-head">{t('storage.move')}</h3>
        <p className="muted tiny">{t('storage.moveNote')}</p>
        <div style={{ marginTop: 18 }}>
          <DropZone
            mark="bundle"
            title={t('storage.importTitle')}
            hint={t('storage.importHint')}
            disabled={lib.busy}
            onFile={importBundle}
          />
        </div>
      </section>
    </div>
  )
}
