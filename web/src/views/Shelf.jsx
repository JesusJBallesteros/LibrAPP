import { useEffect, useRef, useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { loadTranscription, tileImage } from '../ingest/shelf.js'
import { stemOf } from '../store/library.js'
import { copyText } from '../lib.js'
import ApiKeyBox from '../components/ApiKeyBox.jsx'
import {
  actualCost,
  dollars,
  estimateShelfCost,
  pricesForChoice,
  readShelf,
} from '../ai/model.js'
import { providerById } from '../ai/providers.js'
import { EXTRAS, extrasPrompt } from '../ai/extras.js'
import { idbGet, idbSet } from '../store/idb.js'
import promptText from '../../../prompts/ingest-shelf.md?raw'
import { useT } from '../i18n/index.jsx'

/**
 * Reading a shelf is the one step a parser cannot do, so this view is honest
 * about the hand-off rather than pretending to be automatic: it cuts the tiles,
 * a model reads them, and the result comes back here to be checked and merged.
 *
 * Everything happens on the device. A fifty-megapixel photograph is cut up in
 * the browser and never crosses a network, which matters most on a phone.
 */

// How long to wait for a reply before giving up. Nothing else bounds this: a
// request that never answers would otherwise leave the button saying "reading"
// for as long as the page stays open, which is indistinguishable from a button
// that does nothing at all.
const READ_TIMEOUT_MS = 4 * 60 * 1000
export default function Shelf({ lib, onOwl }) {
  const { t } = useT()
  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [tiles, setTiles] = useState(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  // What the key box last reported: which service, which model, and whether
  // the app is allowed to use it. Null until the box has read its own state.
  const [keyStatus, setKeyStatus] = useState(null)
  const [reading, setReading] = useState(false)
  const [proposed, setProposed] = useState(null)
  // Tiles the person has set aside. A photograph often yields one holding a
  // window, a lamp or the edge of a rug, and paying a vision model to read it
  // is waste. Keyed by tile name, which is unique within a cut.
  const [dropped, setDropped] = useState(() => new Set())
  // What to ask for beyond the titles. A preference rather than a per-photo
  // choice, so it is remembered between photographs and between sessions.
  const [extras, setExtras] = useState([])
  // Kept apart from `error` above, which belongs to the photograph. A failure
  // to read has to appear beside the button that caused it: shown at the top of
  // the page it is below the fold on a phone, and looks like nothing happened.
  const [readError, setReadError] = useState(null)
  // Which batch is in flight. A long shelf is read in several requests, and a
  // button that says nothing for two minutes looks like a button that failed.
  const [progress, setProgress] = useState(null)
  const failure = useRef(null)
  const inFlight = useRef(null)

  // The photograph itself, shown in the box it was chosen from. Held as an
  // object URL and revoked when it changes, so choosing several photographs in
  // one sitting does not keep a copy of each for as long as the page lives.
  useEffect(() => {
    if (!photo) {
      setPhotoUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(photo)
    setPhotoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  useEffect(() => {
    idbGet('shelf-extras')
      .then((saved) => Array.isArray(saved) && setExtras(saved))
      .catch(() => {})
  }, [])

  const toggleExtra = (id) =>
    setExtras((current) => {
      const next = current.includes(id) ? current.filter((each) => each !== id) : [...current, id]
      idbSet('shelf-extras', next).catch(() => {})
      return next
    })

  // One request text, used by the keyed route and by the copy button. If these
  // ever diverge, the keyless route silently stops asking for what was ticked.
  const instructions = promptText + extrasPrompt(extras)

  // What will actually be sent, and paid for.
  const kept = tiles ? tiles.tiles.filter((tile) => !dropped.has(tile.tile)) : []

  const cut = async (file, grid) => {
    setError(null)
    setReadError(null)
    // Tile names are positions in a grid, so they mean something different
    // after a recut. Carrying the old set over would discard the wrong tiles.
    setDropped(new Set())
    setWorking(true)
    try {
      // Object URLs from the previous cut are useless now and would otherwise
      // hold on to a copy of every tile for as long as the page lives.
      tiles?.tiles.forEach((tile) => URL.revokeObjectURL(tile.url))
      setTiles(await tileImage(file, grid))
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  const onPhoto = async (file) => {
    setResult(null)
    setProposed(null)
    setPhoto(file)
    await cut(file, undefined)
  }

  /**
   * Read the tiles with the API key, and stop.
   *
   * What comes back is shown for approval rather than imported: automating the
   * call should not automate the trust. A model reading a spine can be wrong in
   * a way nothing downstream can detect, so a person still sees the list.
   */
  /** Something a person can read, whatever was thrown. */
  const describeFailure = (err) => {
    if (err?.name === 'TimeoutError') {
      return t('shelf.timedOut', { minutes: Math.round(READ_TIMEOUT_MS / 60000) })
    }
    if (err?.name === 'AbortError') return t('shelf.stopped')
    // An empty notice is worse than none: it looks like the same silence the
    // person was already complaining about.
    return String(err?.message || err || '').trim() || t('shelf.failedUnknown')
  }

  const readWithKey = async () => {
    setReadError(null)
    setReading(true)
    onOwl?.({ kind: 'reading', tiles: kept.length })
    const controller = new AbortController()
    inFlight.current = controller
    const timer = setTimeout(
      () => controller.abort(new DOMException('read timed out', 'TimeoutError')),
      READ_TIMEOUT_MS,
    )
    try {
      const { transcription, usage, failures } = await readShelf({
        tiles: kept,
        photo: tiles.photo,
        instructions,
        signal: controller.signal,
        onProgress: setProgress,
      })
      const books = (transcription.shelves || []).flatMap((s) => s.books || [])
      const recalled = books.filter(
        (b) =>
          b.abstract != null ||
          b.published_year != null ||
          b.rating != null ||
          b.original_language != null ||
          b.pages != null,
      ).length
      setProposed({ transcription, usage, counted: books.length, recalled })
      // Some tiles came back and some did not. What arrived is worth keeping,
      // and the reader has to know the rest is missing before importing it as
      // though it were the whole shelf.
      if (failures?.length) {
        setReadError(
          t('shelf.someTilesFailed', {
            tiles: failures.flatMap((f) => f.tiles).join(', '),
            why: describeFailure(failures[0].error),
          }),
        )
      }
    } catch (err) {
      setReadError(describeFailure(err))
    } finally {
      clearTimeout(timer)
      inFlight.current = null
      setReading(false)
      setProgress(null)
      onOwl?.(null)
    }
  }

  const acceptProposed = () =>
    lib.run(async (library) => {
      const { records, stats } = loadTranscription(proposed.transcription)
      // Named after the photograph, so a second shelf does not overwrite the
      // first and re-reading the same one still replaces it.
      const origin = stats.photo || tiles.photo
      await library.putSource({
        name: await library.nameFor(`shelf-${stemOf(origin)}`, origin),
        kind: 'photo',
        origin,
        format: 'physical',
        confidence: 'medium',
        records,
        stats,
      })
      const catalog = await library.rebuild()
      setProposed(null)
      setResult({ count: records.length, stats, counts: catalog.counts })
    })

  const regrid = (dCols, dRows) => {
    const cols = Math.max(1, Math.min(8, tiles.grid.cols + dCols))
    const rows = Math.max(1, Math.min(8, tiles.grid.rows + dRows))
    cut(photo, { cols, rows })
  }

  const onTranscription = (file) =>
    lib.run(async (library) => {
      const { records, stats } = loadTranscription(JSON.parse(await file.text()))
      const origin = stats.photo || file.name
      await library.putSource({
        name: await library.nameFor(`shelf-${stemOf(origin)}`, origin),
        kind: 'photo',
        origin,
        format: 'physical',
        confidence: 'medium',
        records,
        stats,
      })
      const catalog = await library.rebuild()
      setResult({ count: records.length, stats, counts: catalog.counts })
    })

  // A failure that renders off-screen is the bug being fixed here, so put it
  // in view rather than trusting that it is near enough.
  //
  // Not smooth: smooth scrolling is driven by the compositor and is skipped
  // outright when the page is not being composited, which is measurable in a
  // backgrounded tab. A message the person has to see cannot depend on that.
  useEffect(() => {
    if (readError) failure.current?.scrollIntoView({ block: 'center' })
  }, [readError])

  const flash = async (key, text) => {
    if (await copyText(text)) {
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    }
  }

  const saveTile = (tile) => {
    const a = document.createElement('a')
    a.href = tile.url
    a.download = tile.tile
    a.click()
  }

  const toggleTile = (tile) =>
    setDropped((current) => {
      const next = new Set(current)
      if (next.has(tile.tile)) next.delete(tile.tile)
      else next.add(tile.tile)
      return next
    })

  // Which service the request will go to, shown with a failure so a report
  // says what was being used rather than only what went wrong.
  const serviceLine = keyStatus
    ? t('shelf.usingService', {
        service: providerById(keyStatus.provider).label,
        model: keyStatus.model,
      })
    : ''

  // Cost is shown where it is spent. Some services publish a rate this app has
  // checked and some do not, so what can be said varies: a figure where one is
  // known, the token count where it is not, and never a number that was guessed.
  const prices = pricesForChoice(keyStatus)
  const estimate = tiles ? estimateShelfCost(kept, prices) : null
  const estimateLabel = !estimate
    ? ''
    : estimate.dollars !== null
      ? dollars(estimate.dollars)
      : t('shelf.tokensOnly', { k: Math.round(estimate.inputTokens / 1000) })
  const spent = proposed ? actualCost(proposed.usage, prices) : null

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">{t('shelf.eyebrow')}</p>
        <h2>{t('nav.shelf')}</h2>
        <hr className="rule" />
        <p>{t('shelf.intro')}</p>
      </div>

      {error && (
        <div className="notice bad">
          <p>{error}</p>
        </div>
      )}

      {/* The two steps sit side by side. Step two appears only once a
          photograph has been cut into tiles, so before that step one has the
          row to itself. */}
      <ApiKeyBox what={t('shelf.whatItIsFor')} onChange={setKeyStatus} />

      {/* Three areas rather than two rows. Step two is long, the photograph is
          not, and the tiles were sitting in a third row below both, which left
          the space under the photograph empty on a wide screen. The tiles go
          there instead. */}
      <div className={`shelf-steps${tiles ? ' cut' : ''}`}>
        <section className="shelf-step shelf-one">
          <p className="eyebrow">{t('shelf.stepOne')}</p>
          <DropZone
            mark="camera"
            title={photoUrl ? photo.name : t('shelf.dropPhoto')}
            hint={photoUrl ? t('shelf.photoReplace') : t('shelf.dropPhotoHint')}
            preview={photoUrl ? { url: photoUrl } : null}
            accept="image/*"
            disabled={working}
            onFile={onPhoto}
          />
          {working && <p className="tiny faint" style={{ marginTop: 10 }}>{t('shelf.cutting')}</p>}
        </section>

        {tiles && (
          <section className="shelf-step shelf-two">
            <div className="spread">
              <p className="eyebrow">{t('shelf.stepTwo')}</p>
              <span className="tabular tiny faint">
                {tiles.photo} · {tiles.photoSize[0]}×{tiles.photoSize[1]} ·{' '}
                {t('shelf.tileCount', { n: tiles.tiles.length })}
              </span>
            </div>
            <p className="muted tiny" style={{ marginTop: 8 }}>{t('shelf.tilesNote')}</p>

            <div className="sunk-panel" style={{ marginTop: 12 }}>
              <div className="spread">
                <h3 className="panel-head">
                  {t('shelf.grid', { cols: tiles.grid.cols, rows: tiles.grid.rows })}
                </h3>
                <span className="row" style={{ gap: 6 }}>
                  <button className="btn small" disabled={working} onClick={() => regrid(-1, 0)}>
                    {t('shelf.lessAcross')}
                  </button>
                  <button className="btn small" disabled={working} onClick={() => regrid(1, 0)}>
                    {t('shelf.moreAcross')}
                  </button>
                  <button className="btn small" disabled={working} onClick={() => regrid(0, -1)}>
                    {t('shelf.lessDown')}
                  </button>
                  <button className="btn small" disabled={working} onClick={() => regrid(0, 1)}>
                    {t('shelf.moreDown')}
                  </button>
                </span>
              </div>
              <p className="tiny faint" style={{ margin: '8px 0 0' }}>
                {t('shelf.gridNote')}{' '}
                <strong>{t('shelf.gridWarning')}</strong> {t('shelf.gridWarningTail')}
              </p>
              {(tiles.grid.cols !== tiles.suggested.cols || tiles.grid.rows !== tiles.suggested.rows) && (
                <button
                  className="btn link tiny"
                  style={{ marginTop: 6, padding: 0 }}
                  onClick={() => cut(photo, tiles.suggested)}
                >
                  {t('shelf.backToSuggested', {
                    cols: tiles.suggested.cols,
                    rows: tiles.suggested.rows,
                  })}
                </button>
              )}
            </div>

            <div className="sunk-panel" style={{ marginTop: 12 }}>
              <h3 className="panel-head">{t('shelf.extras')}</h3>
              <p className="tiny faint" style={{ margin: '6px 0 10px' }}>{t('shelf.extrasNote')}</p>

              {['read', 'recalled'].map((kind) => (
                <div key={kind} style={{ marginTop: kind === 'recalled' ? 14 : 0 }}>
                  <span className="tiny muted">{t(`shelf.extras.${kind}`)}</span>
                  {kind === 'recalled' && (
                    <p className="tiny faint" style={{ margin: '4px 0 0' }}>
                      {t('shelf.extras.recalledWarning')}
                    </p>
                  )}
                  <div style={{ marginTop: 6 }}>
                    {EXTRAS.filter((extra) => extra.kind === kind).map((extra) => (
                      <label key={extra.id} className="check">
                        <input
                          type="checkbox"
                          checked={extras.includes(extra.id)}
                          onChange={() => toggleExtra(extra.id)}
                        />
                        <span className="tiny">{t(`shelf.extra.${extra.id}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <p className="tiny faint" style={{ margin: '12px 0 0' }}>{t('shelf.noCover')}</p>
            </div>

            {keyStatus?.usable && (
              <>
                <div className="row" style={{ marginTop: 12 }}>
                  <button
                    className="btn primary"
                    onClick={readWithKey}
                    disabled={reading || lib.busy || !kept.length}
                  >
                    {reading ? t('shelf.reading') : t('shelf.readForMe')}
                  </button>
                  {reading && progress && progress.total > 1 && (
                    <span className="tiny faint tabular">
                      {t('shelf.batchProgress', { at: progress.done + 1, of: progress.total })}
                    </span>
                  )}
                  {reading && (
                    <button className="btn" onClick={() => inFlight.current?.abort()}>
                      {t('shelf.stop')}
                    </button>
                  )}
                  <span className="tiny faint">
                    {kept.length === tiles.tiles.length
                      ? t('shelf.tileCount', { n: kept.length })
                      : t('shelf.tileCountKept', {
                          kept: kept.length,
                          total: tiles.tiles.length,
                        })}{' '}
                    · {estimateLabel} · {t('shelf.youApprove')}
                  </span>
                </div>

                {!kept.length && (
                  <p className="tiny faint" style={{ marginTop: 8 }}>
                    {t('shelf.noneKept')}
                  </p>
                )}

                {readError && (
                  <div className="notice bad" role="alert" style={{ marginTop: 12 }} ref={failure}>
                    <p className="tiny">
                      <strong>{t('shelf.failed')}</strong> {readError}
                    </p>
                    {serviceLine && (
                      <p className="tiny faint" style={{ marginTop: 6 }}>
                        {serviceLine}
                      </p>
                    )}
                    <button
                      className="btn small"
                      style={{ marginTop: 8 }}
                      onClick={() => flash('failure', `${readError}\n${serviceLine}`)}
                    >
                      {copied === 'failure' ? t('common.copied') : t('shelf.copyFailure')}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn small" onClick={() => flash('prompt', instructions)}>
                {copied === 'prompt' ? t('common.copied') : t('shelf.copyInstructions')}
              </button>
              <button className="btn small" onClick={() => setShowPrompt((s) => !s)}>
                {showPrompt ? t('shelf.hideThem') : t('shelf.readThem')}
              </button>
              <button
                className="btn small"
                onClick={() => kept.forEach(saveTile)}
                disabled={!kept.length}
              >
                {t('shelf.saveAll')}
              </button>
            </div>

            {showPrompt && (
              <pre className="snippet" style={{ marginTop: 12, maxHeight: 320 }}>
                {instructions}
              </pre>
            )}

          </section>
        )}
        {tiles && (
          <div className="shelf-tiles">
          <p className="tiny faint" style={{ margin: '26px 0 0' }}>
            {t('shelf.discardHint')}
          </p>

          <div className="tiles" style={{ marginTop: 10 }}>
              {tiles.tiles.map((tile) => {
                const isDropped = dropped.has(tile.tile)
                return (
                  <figure key={tile.tile} className={isDropped ? 'dropped' : undefined}>
                    <img
                      src={tile.url}
                      alt={t('shelf.tileAlt', { row: tile.row, column: tile.column })}
                      loading="lazy"
                    />
                    <figcaption className="spread">
                      <span>
                        r{tile.row}c{tile.column}
                        {isDropped && <span className="faint"> · {t('shelf.droppedTag')}</span>}
                      </span>
                      <span className="row" style={{ gap: 5 }}>
                        <button
                          className="btn small"
                          aria-pressed={isDropped}
                          onClick={() => toggleTile(tile)}
                        >
                          {isDropped ? t('shelf.keepTile') : t('shelf.dropTile')}
                        </button>
                        <button className="btn small" onClick={() => saveTile(tile)}>
                          {t('common.save')}
                        </button>
                      </span>
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {tiles && (
        <>
          {proposed && (
            <section className="shelf-step" style={{ marginTop: 34 }}>
              <div className="spread">
                <p className="eyebrow">{t('shelf.stepThree')}</p>
                <span className="tabular tiny faint">
                  {t('shelf.bookCount', { n: proposed.counted })}
                  {proposed.recalled > 0 &&
                    ` · ${t('shelf.recalledCount', { n: proposed.recalled })}`}
                  {spent !== null && ` · ${t('shelf.cost', { amount: dollars(spent) })}`}
                </span>
              </div>
              <p className="muted tiny" style={{ marginTop: 8 }}>{t('shelf.checkNote')}</p>

              {(proposed.transcription.shelves || []).map((shelf, i) => (
                <div key={i} style={{ marginTop: 12 }}>
                  <div className="group-head" style={{ position: 'static' }}>
                    {shelf.location || t('shelf.unplaced')}{' '}
                    <span className="faint">· {shelf.books?.length || 0}</span>
                  </div>
                  {(shelf.books || []).map((book, j) => (
                    <div className="forgotten-item spread" key={j}>
                      <span>
                        <span className="title">{book.title}</span>
                        <br />
                        <span className="tiny muted">
                          {(book.authors || []).join(', ') || '—'}
                          {book.publisher ? ` · ${book.publisher}` : ''}
                        </span>
                        {book.notes && <div className="why">{book.notes}</div>}
                      </span>
                      <span className={`pill ${book.confidence === 'high' ? 'read' : book.confidence === 'low' ? 'flag' : 'unread'}`}>
                        {t(`confidence.${book.confidence}`)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn primary" onClick={acceptProposed} disabled={lib.busy}>
                  {t('shelf.importThese', { n: proposed.counted })}
                </button>
                <button className="btn" onClick={() => setProposed(null)} disabled={lib.busy}>
                  {t('shelf.discard')}
                </button>
              </div>
            </section>
          )}

          <div className="card">
            <h3>{t('shelf.stepBring', { n: proposed ? 4 : 3 })}</h3>
            <p className="muted tiny">{t('shelf.bringNote')}</p>
            <DropZone
              mark="page"
              title={t('shelf.dropTranscription')}
              hint={t('shelf.dropTranscriptionHint')}
              disabled={lib.busy}
              onFile={onTranscription}
            />
          </div>
        </>
      )}

      {result && (
        <div className="notice good">
          <p>
            <strong>
              {t('shelf.result', { n: result.count })}
              {result.stats.uncertain_spines
                ? ` · ${t('shelf.uncertain', { n: result.stats.uncertain_spines })}`
                : ''}
            </strong>
          </p>
          <p className="tiny">
            {t('list.nowHolds', { n: result.counts.books })} {t('shelf.resultNote')}
          </p>
        </div>
      )}
    </div>
  )
}
