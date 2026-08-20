import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import { api } from '../api.js'
import { copyText } from '../lib.js'

/**
 * Reading a shelf is the one step a parser cannot do, so this view is honest
 * about the hand-off rather than pretending to be automatic: it prepares the
 * tiles and the instructions, a model reads them, and the result comes back
 * here to be checked and imported.
 */
export default function Shelf({ onDone }) {
  const [tiles, setTiles] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setBusy(false)
    }
  }

  const onPhoto = (file) =>
    run(async () => {
      setResult(null)
      const manifest = await api.uploadPhoto(file)
      setTiles(manifest)
    })

  const onTranscription = (file) =>
    run(async () => {
      const imported = await api.uploadTranscription(file, { name: 'shelf', confidence: 'medium' })
      const built = await api.rebuild()
      setResult({ ...imported, counts: built.counts })
      await onDone()
    })

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
          title="Drop a shelf photograph"
          hint="or click to choose · JPEG or PNG"
          accept="image/*"
          disabled={busy}
          onFile={onPhoto}
        />
        {busy && !tiles && <p className="tiny faint" style={{ marginTop: 10 }}>Cutting it into tiles…</p>}
      </div>

      {tiles && (
        <>
          <div className="card">
            <div className="spread">
              <h3 style={{ margin: 0 }}>2 · Read the spines</h3>
              <span className="tiny faint">
                {tiles.photo} · {tiles.photo_size[0]}×{tiles.photo_size[1]} · {tiles.tiles.length} tiles
              </span>
            </div>
            <p className="muted tiny" style={{ marginTop: 8 }}>
              Tiles are cropped at native resolution and overlap slightly, so a book on a seam is
              whole in one of them. Point Claude Code at the folder below with{' '}
              <code>prompts/ingest-shelf.md</code>, and have it write the transcription.
            </p>

            <pre className="snippet" style={{ marginTop: 10 }}>{tiles.tiles_dir}</pre>
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn small"
                onClick={async () => {
                  setCopied(await copyText(tiles.tiles_dir))
                  setTimeout(() => setCopied(false), 1800)
                }}
              >
                {copied ? 'Copied' : 'Copy folder path'}
              </button>
            </div>

            <div className="tiles" style={{ marginTop: 14 }}>
              {tiles.tiles.map((t) => (
                <figure key={t.tile}>
                  <img src={`/api/tile/${tiles.stem}/${t.tile}`} alt={`Tile row ${t.row}, column ${t.column}`} loading="lazy" />
                  <figcaption>
                    r{t.row}c{t.column}
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
              disabled={busy}
              onFile={onTranscription}
            />
          </div>
        </>
      )}

      {result && (
        <div className="notice good">
          <p>
            <strong>
              {result.records} books read from the photograph
              {result.stats?.uncertain_spines
                ? `, ${result.stats.uncertain_spines} spine(s) uncertain`
                : ''}
              .
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
