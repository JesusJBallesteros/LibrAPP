import { useState } from 'react'
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
export default function Shelf({ lib }) {
  const { t } = useT()
  const [photo, setPhoto] = useState(null)
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

  const cut = async (file, grid) => {
    setError(null)
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
  const readWithKey = async () => {
    setError(null)
    setReading(true)
    try {
      const { transcription, usage } = await readShelf({
        tiles: tiles.tiles,
        photo: tiles.photo,
        instructions: promptText,
      })
      const counted = (transcription.shelves || []).reduce((n, s) => n + (s.books?.length || 0), 0)
      setProposed({ transcription, usage, counted })
    } catch (err) {
      setError(err.message)
    } finally {
      setReading(false)
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

  // Cost is shown where it is spent. Some services publish a rate this app has
  // checked and some do not, so what can be said varies: a figure where one is
  // known, the token count where it is not, and never a number that was guessed.
  const prices = pricesForChoice(keyStatus)
  const estimate = tiles ? estimateShelfCost(tiles.tiles, prices) : null
  const estimateLabel = !estimate
    ? ''
    : estimate.dollars !== null
      ? dollars(estimate.dollars)
      : t('shelf.tokensOnly', { k: Math.round(estimate.inputTokens / 1000) })
  const spent = proposed ? actualCost(proposed.usage, prices) : null

  return (
    <div className="view">
      <header>
        <h2>{t('nav.shelf')}</h2>
        <p>{t('shelf.intro')}</p>
      </header>

      {error && (
        <div className="notice bad">
          <p>{error}</p>
        </div>
      )}

      <div className="card">
        <h3>{t('shelf.step1')}</h3>
        <DropZone
          glyph="📷"
          title={t('shelf.dropPhoto')}
          hint={t('shelf.dropPhotoHint')}
          accept="image/*"
          disabled={working}
          onFile={onPhoto}
        />
        {working && <p className="tiny faint" style={{ marginTop: 10 }}>{t('shelf.cutting')}</p>}
      </div>

      <ApiKeyBox what={t('shelf.whatItIsFor')} onChange={setKeyStatus} />

      {tiles && (
        <>
          <div className="card">
            <div className="spread">
              <h3 style={{ margin: 0 }}>{t('shelf.step2')}</h3>
              <span className="tiny faint">
                {tiles.photo} · {tiles.photoSize[0]}×{tiles.photoSize[1]} ·{' '}
                {t('shelf.tileCount', { n: tiles.tiles.length })}
              </span>
            </div>
            <p className="muted tiny" style={{ marginTop: 8 }}>{t('shelf.tilesNote')}</p>

            <div className="card" style={{ marginTop: 12, boxShadow: 'none', background: 'var(--paper-sunk)' }}>
              <div className="spread">
                <strong className="tiny">
                  {t('shelf.grid', { cols: tiles.grid.cols, rows: tiles.grid.rows })}
                </strong>
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

            {keyStatus?.state === 'active' && (
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn primary" onClick={readWithKey} disabled={reading || lib.busy}>
                  {reading ? t('shelf.reading') : t('shelf.readForMe')}
                </button>
                <span className="tiny faint">
                  {t('shelf.tileCount', { n: tiles.tiles.length })} · {estimateLabel} ·{' '}
                  {t('shelf.youApprove')}
                </span>
              </div>
            )}

            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn small" onClick={() => flash('prompt', promptText)}>
                {copied === 'prompt' ? t('common.copied') : t('shelf.copyInstructions')}
              </button>
              <button className="btn small" onClick={() => setShowPrompt((s) => !s)}>
                {showPrompt ? t('shelf.hideThem') : t('shelf.readThem')}
              </button>
              <button className="btn small" onClick={() => tiles.tiles.forEach(saveTile)}>
                {t('shelf.saveAll')}
              </button>
            </div>

            {showPrompt && (
              <pre className="snippet" style={{ marginTop: 12, maxHeight: 320 }}>
                {promptText}
              </pre>
            )}

            <div className="tiles" style={{ marginTop: 14 }}>
              {tiles.tiles.map((tile) => (
                <figure key={tile.tile}>
                  <img
                    src={tile.url}
                    alt={t('shelf.tileAlt', { row: tile.row, column: tile.column })}
                    loading="lazy"
                  />
                  <figcaption className="spread">
                    <span>
                      r{tile.row}c{tile.column}
                    </span>
                    <button className="btn small" onClick={() => saveTile(tile)}>
                      {t('common.save')}
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {proposed && (
            <div className="card">
              <div className="spread">
                <h3 style={{ margin: 0 }}>{t('shelf.step3')}</h3>
                <span className="tiny faint">
                  {t('shelf.bookCount', { n: proposed.counted })}
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
            </div>
          )}

          <div className="card">
            <h3>{t('shelf.stepBring', { n: proposed ? 4 : 3 })}</h3>
            <p className="muted tiny">{t('shelf.bringNote')}</p>
            <DropZone
              glyph="📄"
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
