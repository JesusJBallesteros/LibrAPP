import { useEffect } from 'react'
import { READ_LABEL, byline, readState } from '../lib.js'

// What each flag means, in the reader's terms rather than the builder's.
const FLAG_TEXT = {
  title_clipped: 'the title is cut off — no source had it whole',
  illegible_spine: 'the spine could not be read properly',
  no_personal_author: 'no named author: a reference work, anthology or anonymous text',
  no_genre: 'no genre recorded yet',
  placeholder: 'a stand-in, not a real title — re-photograph this one',
  series_not_expanded: 'stands for several volumes no source lists individually',
}

const CONFIDENCE_TEXT = {
  high: 'from a machine-readable source, checked against its own count',
  medium: 'transcribed by eye or by model',
  low: 'a guess',
}

export default function BookDetail({ book, authors, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const state = readState(book)
  const rows = [
    ['Series', book.series && `${book.series}${book.series_index ? ` · vol. ${book.series_index}` : ''}`],
    ['Formats', (book.formats || []).join(' + ')],
    ['Read', READ_LABEL[state]],
    ['Acquired', book.acquired_on],
    ['Publisher', book.publisher],
    ['Genre', book.genre],
    ['Where', book.location],
    ['Collections', book.collections],
    ['Devices', book.devices],
    ['Sources', (book.sources || []).join(', ')],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '')

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <aside className="detail" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 10 }}>
          <span className={`pill ${state}`}>{READ_LABEL[state]}</span>
          <button className="btn small" onClick={onClose}>
            Close
          </button>
        </div>

        <h3>{book.title}</h3>
        <p className="byline">{byline(book, authors)}</p>

        <dl>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt>{label}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>

        {state === 'unknown' && (
          <p className="tiny faint" style={{ marginTop: 14 }}>
            Nothing has ever recorded whether this was read. That is not the same as unread, so it
            is left blank rather than guessed.
          </p>
        )}

        {book.notes && (
          <p className="tiny muted" style={{ marginTop: 14 }}>
            <strong>Noted when read:</strong> {book.notes}
          </p>
        )}

        {(book.tags || []).length > 0 && (
          <>
            <h4 style={{ margin: '18px 0 7px', font: '600 13px var(--sans)' }}>Tags</h4>
            <div className="row" style={{ gap: 5 }}>
              {book.tags.map((t) => (
                <span className="pill" key={`${t.kind}-${t.key}`}>
                  {t.value}
                </span>
              ))}
            </div>
          </>
        )}

        {(book.flags || []).length > 0 && (
          <>
            <h4 style={{ margin: '18px 0 7px', font: '600 13px var(--sans)' }}>Worth knowing</h4>
            <ul className="tiny muted" style={{ margin: 0, paddingLeft: 18 }}>
              {book.flags.map((f) => (
                <li key={f}>{FLAG_TEXT[f] || f}</li>
              ))}
            </ul>
          </>
        )}

        <p className="tiny faint" style={{ marginTop: 18 }}>
          Confidence <strong>{book.confidence}</strong> — {CONFIDENCE_TEXT[book.confidence]}.
        </p>
      </aside>
    </div>
  )
}
