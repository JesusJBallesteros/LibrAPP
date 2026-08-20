import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { loadTranscription, tileImage } from '../ingest/shelf.js'
import { copyText } from '../lib.js'
import promptText from '../../../prompts/ingest-shelf.md?raw'

/**
 * Reading a shelf is the one step a parser cannot do, so this view is honest
 * about the hand-off rather than pretending to be automatic: it cuts the tiles,
 * a model reads them, and the result comes back here to be checked and merged.
 *
 * Everything happens on the device. A fifty-megapixel photograph is cut up in
 * the browser and never crosses a network, which matters most on a phone.
 */
export default function Shelf({ lib }) {
  const [photo, setPhoto] = useState(null)
  const [tiles, setTiles] = useState(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  const cut = async (file, grid) => {
    setError(null)
    setWorking(true)
    try {
      // Object URLs from the previous cut are useless now and would otherwise
      // hold on to a copy of every tile for as long as the page lives.
      tiles?.tiles.forEach((t) => URL.revokeObjectURL(t.url))
      setTiles(await tileImage(file, grid))
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  const onPhoto = async (file) => {
    setResult(null)
    setPhoto(file)
    await cut(file, undefined)
  }

  const regrid = (dCols, dRows) => {
    const cols = Math.max(1, Math.min(8, tiles.grid.cols + dCols))
    const rows = Math.max(1, Math.min(8, tiles.grid.rows + dRows))
    cut(photo, { cols, rows })
  }

  const onTranscription = (file) =>
    lib.run(async (library) => {
      const { records, stats } = loadTranscription(JSON.parse(await file.text()))
      await library.putSource({
        name: 'shelf',
        kind: 'photo',
        origin: stats.photo || file.name,
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

  return (
    <div className="view">
      <header>
        <h2>Shelf picture</h2>
        <p>
          Photograph a shelf straight on, at your camera's full resolution. This matters more than
          anything else here: a whole bookcase at one megapixel is unreadable, and the same shelf at
          fifty is not.
        </p>
      </header>

      {error && (
        <div className="notice bad">
          <p>{error}</p>
        </div>
      )}

      <div className="card">
        <h3>1 · The photograph</h3>
        <DropZone
          glyph="📷"
          title="Take or choose a photograph"
          hint="JPEG or PNG · nothing is uploaded"
          accept="image/*"
          disabled={working}
          onFile={onPhoto}
        />
        {working && <p className="tiny faint" style={{ marginTop: 10 }}>Cutting it into tiles…</p>}
      </div>

      {tiles && (
        <>
          <div className="card">
            <div className="spread">
              <h3 style={{ margin: 0 }}>2 · Read the spines</h3>
              <span className="tiny faint">
                {tiles.photo} · {tiles.photoSize[0]}×{tiles.photoSize[1]} · {tiles.tiles.length} tiles
              </span>
            </div>
            <p className="muted tiny" style={{ marginTop: 8 }}>
              Tiles are cut at native resolution and overlap, so a book on a seam is whole in one of
              them. Give them to a model along with the instructions below, and have it write the
              transcription.
            </p>

            <div className="card" style={{ marginTop: 12, boxShadow: 'none', background: 'var(--paper-sunk)' }}>
              <div className="spread">
                <strong className="tiny">
                  Grid · {tiles.grid.cols} across × {tiles.grid.rows} down
                </strong>
                <span className="row" style={{ gap: 6 }}>
                  <button className="btn small" disabled={working} onClick={() => regrid(-1, 0)}>
                    − across
                  </button>
                  <button className="btn small" disabled={working} onClick={() => regrid(1, 0)}>
                    + across
                  </button>
                  <button className="btn small" disabled={working} onClick={() => regrid(0, -1)}>
                    − down
                  </button>
                  <button className="btn small" disabled={working} onClick={() => regrid(0, 1)}>
                    + down
                  </button>
                </span>
              </div>
              <p className="tiny faint" style={{ margin: '8px 0 0' }}>
                Aim for tiles holding a handful of <em>whole</em> spines, with the title readable
                top to bottom. No setting suits every shelf: a wide bookcase wants several tiles
                across, and a close-up of three books wants one and nothing more.{' '}
                <strong>Adding rows is what splits a title in half</strong>, so add those only when
                the photograph really shows shelves stacked above one another.
              </p>
              {(tiles.grid.cols !== tiles.suggested.cols || tiles.grid.rows !== tiles.suggested.rows) && (
                <button
                  className="btn link tiny"
                  style={{ marginTop: 6, padding: 0 }}
                  onClick={() => cut(photo, tiles.suggested)}
                >
                  back to the suggested {tiles.suggested.cols}×{tiles.suggested.rows}
                </button>
              )}
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn small" onClick={() => flash('prompt', promptText)}>
                {copied === 'prompt' ? 'Copied' : 'Copy the instructions'}
              </button>
              <button className="btn small" onClick={() => setShowPrompt((s) => !s)}>
                {showPrompt ? 'Hide them' : 'Read them'}
              </button>
              <button className="btn small" onClick={() => tiles.tiles.forEach(saveTile)}>
                Save all tiles
              </button>
            </div>

            {showPrompt && (
              <pre className="snippet" style={{ marginTop: 12, maxHeight: 320 }}>
                {promptText}
              </pre>
            )}

            <div className="tiles" style={{ marginTop: 14 }}>
              {tiles.tiles.map((t) => (
                <figure key={t.tile}>
                  <img src={t.url} alt={`Tile row ${t.row}, column ${t.column}`} loading="lazy" />
                  <figcaption className="spread">
                    <span>
                      r{t.row}c{t.column}
                    </span>
                    <button className="btn small" onClick={() => saveTile(t)}>
                      Save
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>3 · Bring the transcription back</h3>
            <p className="muted tiny">
              The import refuses a file with an untitled book or an unknown confidence value. That
              is deliberate: a bad read should stop here rather than turn up in your catalog later.
            </p>
            <DropZone
              glyph="📄"
              title="Drop the transcription"
              hint="the JSON file the model wrote"
              accept=".json,application/json"
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
              {result.count} books read from the photograph
              {result.stats.uncertain_spines ? `, ${result.stats.uncertain_spines} spine(s) uncertain` : ''}.
            </strong>
          </p>
          <p className="tiny">
            The catalog now holds {result.counts.books} books. A photograph cannot see a purchase
            date or whether you read something, so those stay unknown until another source says.
          </p>
        </div>
      )}
    </div>
  )
}
