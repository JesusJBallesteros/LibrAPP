import { useEffect, useRef, useState } from 'react'
import { barcodeReader, cleanIsbn, toIsbn13, validIsbn } from '../ingest/isbn.js'
import { useT } from '../i18n/index.jsx'

/**
 * A viewfinder that reads barcodes as they pass in front of it.
 *
 * Photographing a barcode, opening the file, waiting for it to decode and doing
 * that again for the next book is slower per book than typing the number. This
 * is the same reader pointed at a live picture instead, which is what makes a
 * shelf of paper books a few minutes of work rather than an evening.
 *
 * The stream never leaves the device and is never recorded. Frames are read
 * where they are drawn and thrown away; what comes out is thirteen digits. The
 * camera is asked for at the moment it is used and released the moment it is
 * not, including when the tab is hidden, because a camera light left on is the
 * one bug that would cost this app the trust the rest of it is built on.
 */

// How often to look. A frame every quarter second is faster than anybody can
// move a book into place, and leaves the decoder idle in between: the carried
// reader on a desktop takes tens of milliseconds a frame, and running it flat
// out would heat a phone for no gain.
const LOOK_EVERY_MS = 250

export function cameraAvailable() {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
}

/** What went wrong, in terms of what the reader can do about it. */
export function describeCameraError(err, t) {
  const name = err?.name || ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return t('scan.denied')
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return t('scan.noCamera')
  if (name === 'NotReadableError') return t('scan.inUse')
  // Only the message. Stringifying the error itself turns an object with no
  // message into "[object Object]", which is worse than saying nothing useful.
  return String(err?.message || '').trim() || t('scan.failed')
}

export default function LiveScan({ onCode, onClose }) {
  const { t } = useT()
  const video = useRef(null)
  const stream = useRef(null)
  const running = useRef(false)
  const seen = useRef(new Set())
  const [error, setError] = useState(null)
  const [found, setFound] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const stop = () => {
      running.current = false
      for (const track of stream.current?.getTracks() || []) track.stop()
      stream.current = null
    }

    const loop = async (detector) => {
      while (running.current && !cancelled) {
        try {
          const results = await detector.detect(video.current)
          for (const { rawValue } of results) {
            const code = cleanIsbn(rawValue)
            if (!validIsbn(code)) continue
            const isbn = toIsbn13(code)
            if (seen.current.has(isbn)) continue
            seen.current.add(isbn)
            setFound((current) => [isbn, ...current])
            onCode?.(isbn)
          }
        } catch {
          // A frame that cannot be read is not an error worth showing: the next
          // one is 250ms away. Only losing the camera is worth saying, and that
          // arrives as the stream ending rather than as a failed read.
        }
        await new Promise((r) => setTimeout(r, LOOK_EVERY_MS))
      }
    }

    ;(async () => {
      try {
        const Reader = await barcodeReader()
        if (cancelled) return
        stream.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) return stop()
        video.current.srcObject = stream.current
        await video.current.play()
        if (cancelled) return stop()
        setReady(true)
        running.current = true
        loop(new Reader({ formats: ['ean_13', 'upc_a'] }))
      } catch (err) {
        if (!cancelled) setError(describeCameraError(err, t))
      }
    })()

    // A tab in the background keeps its camera open, and its light on, which
    // looks exactly like an app watching somebody. Hand it back.
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        stop()
        setReady(false)
      }
    }
    document.addEventListener('visibilitychange', onHide)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onHide)
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="live-scan">
      <div className="live-frame">
        {/* muted and playsInline or iOS refuses to play it inline at all. */}
        <video ref={video} muted playsInline aria-label={t('scan.viewfinder')} />
        {!ready && !error && <p className="live-status tiny">{t('scan.starting')}</p>}
      </div>

      {error ? (
        <div className="notice bad" role="alert">
          <p className="tiny">{error}</p>
        </div>
      ) : (
        <p className="tiny faint">{t('scan.hint')}</p>
      )}

      <p className="tiny" aria-live="polite">
        {found.length ? t('scan.found', { n: found.length }) : t('scan.none')}
      </p>
      {found.length > 0 && (
        <p className="tiny faint tabular">{found.slice(0, 6).join(', ')}</p>
      )}

      <button className="btn small" style={{ marginTop: 8 }} onClick={onClose}>
        {t('scan.stop')}
      </button>
    </div>
  )
}
