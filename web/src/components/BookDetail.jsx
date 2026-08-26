import { useEffect } from 'react'
import { byline, callNumber, readState } from '../lib.js'
import { useT } from '../i18n/index.jsx'

export default function BookDetail({ book, authors, onClose, onEdit, onRemove, onRevert, busy }) {
  const { t } = useT()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const state = readState(book)
  const rows = [
    [
      t('book.series'),
      book.series &&
        `${book.series}${book.series_index ? ` · ${t('book.volume')} ${book.series_index}` : ''}`,
    ],
    [t('book.formats'), (book.formats || []).map((f) => t('format.' + f)).join(' + ')],
    [t('book.read'), t(`read.${state}`)],
    [t('book.acquired'), book.acquired_on],
    [
      t('book.lentTo'),
      book.lent_to && (book.lent_on ? `${book.lent_to} (${book.lent_on})` : book.lent_to),
    ],
    [
      t('book.borrowedFrom'),
      book.borrowed_from &&
        (book.borrowed_on ? `${book.borrowed_from} (${book.borrowed_on})` : book.borrowed_from),
    ],
    [t('book.publisher'), book.publisher],
    [t('book.published'), book.published_year],
    [t('book.rating'), book.rating],
    [t('book.originalLanguage'), book.original_language],
    [t('book.genre'), book.genre],
    [t('book.where'), book.location],
    [t('book.collections'), book.collections],
    [t('book.devices'), book.devices],
    [t('book.sources'), (book.sources || []).join(', ')],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '')

  const mark = callNumber(book, authors)
  const name = byline(book, authors)

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <aside className="detail" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>
          {t('common.close')} ✕
        </button>

        {/* The one decorated surface in the app: a catalog card, the way a
            library would have written one. Everything on it is a recorded
            field, including the shelf mark, which is omitted rather than
            invented when no author is known. */}
        <div className="catalog-card">
          <span className="card-hole" aria-hidden="true" />
          {mark && <p className="call-number">{mark}</p>}

          <h3>{book.title}</h3>
          <p className="byline">{name || t('book.authorUnknown')}</p>

          <dl className="ruled">
            {rows.map(([label, value]) => (
              <div key={label} style={{ display: 'contents' }}>
                <dt>{label}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>

          <p className="card-foot">
            <span className={`stamp ${state}`}>{t(`read.${state}`)}</span>
            <span className="conf">{t('book.confShort', { level: t(`confidence.${book.confidence}`) })}</span>
          </p>
        </div>

        <p className="tiny faint card-why">{t(`confidence.${book.confidence}.why`)}</p>

        <div className="row card-actions">
          {onEdit && (
            <button className="btn" onClick={() => onEdit(book)} disabled={busy}>
              {t('common.edit')}
            </button>
          )}
          {onRemove && (
            <button className="btn danger" onClick={() => onRemove(book)} disabled={busy}>
              {t('common.remove')}
            </button>
          )}
        </div>

        {state === 'unknown' && <p className="tiny faint" style={{ marginTop: 14 }}>{t('book.unknownNote')}</p>}

        {book.overridden && (
          <div className="notice" style={{ marginTop: 14 }}>
            <p className="tiny">
              <strong>
                {book.overridden.at
                  ? t('book.correctedOn', { date: book.overridden.at })
                  : t('book.corrected')}
              </strong>{' '}
              {t('book.correctedFields', { fields: book.overridden.fields.join(', ') })}
              {book.overridden.why ? ` ${book.overridden.why}` : ''}
            </p>
            <p className="tiny" style={{ marginTop: 6 }}>
              {t('book.before')}{' '}
              {book.overridden.fields
                .map((f) => `${f} = ${JSON.stringify(book.overridden.was[f])}`)
                .join(' · ')}
            </p>
            {onRevert && (
              <button className="btn small" style={{ marginTop: 8 }} onClick={() => onRevert(book)} disabled={busy}>
                {t('book.undoCorrection')}
              </button>
            )}
          </div>
        )}

        {book.abstract && (
          <p className="tiny muted" style={{ marginTop: 14 }}>
            <strong>{t('book.abstract')}</strong> {book.abstract}
          </p>
        )}

        {book.notes && (
          <p className="tiny muted" style={{ marginTop: 14 }}>
            <strong>{t('book.notedWhenRead')}</strong> {book.notes}
          </p>
        )}

        {(book.tags || []).length > 0 && (
          <>
            <h4 style={{ margin: '18px 0 7px', font: '500 13px var(--sans)' }}>{t('book.tags')}</h4>
            <div className="row" style={{ gap: 5 }}>
              {book.tags.map((tag) => (
                <span className="pill" key={`${tag.kind}-${tag.key}`}>
                  {tag.value}
                </span>
              ))}
            </div>
          </>
        )}

        {(book.flags || []).length > 0 && (
          <>
            <h4 style={{ margin: '18px 0 7px', font: '500 13px var(--sans)' }}>
              {t('book.worthKnowing')}
            </h4>
            <ul className="tiny muted" style={{ margin: 0, paddingLeft: 18 }}>
              {book.flags.map((flag) => (
                // A flag with no translation shows its own name: better a raw
                // word than a blank line where a warning should be.
                <li key={flag}>{t(`flag.${flag}`) === `flag.${flag}` ? flag : t(`flag.${flag}`)}</li>
              ))}
            </ul>
          </>
        )}

      </aside>
    </div>
  )
}
