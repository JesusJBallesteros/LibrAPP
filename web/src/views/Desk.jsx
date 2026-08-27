import { useMemo, useState } from 'react'
import {
  authorNames,
  byline,
  copyText,
  forgotten,
  intentWhy,
  onLoan,
  spineHeight,
  spineTint,
  spineWidth,
} from '../lib.js'
import { readerProfile } from '../core/profile.js'
import BookPanel from '../components/BookPanel.jsx'
import GenrePie from '../components/GenrePie.jsx'
import WordCloud from '../components/WordCloud.jsx'
import ApiKeyBox from '../components/ApiKeyBox.jsx'

// Imported under another name: `ask` is already the state holding which
// prompt is selected, and the local binding silently shadows the import.
import {
  actualCost,
  ask as askModel,
  dollars,
  estimateAskCost,
  pricesForChoice,
} from '../ai/model.js'
import { providerById } from '../ai/providers.js'
import synopsisPrompt from '../../../prompts/synopsis.md?raw'
import recommendPrompt from '../../../prompts/recommend.md?raw'
import fillPrompt from '../../../prompts/fill-gaps.md?raw'
import { setOverride } from '../core/overrides.js'
import {
  FILLABLE,
  WHY as FILL_WHY,
  booksNeeding,
  buildRequest,
  gapsByField,
  parseReply,
  summarise,
} from '../ai/gaps.js'
import { useT } from '../i18n/index.jsx'

// The prompt text itself is not translated: it is the instruction sent to a
// model, and it lives in prompts/ where anyone can edit it. What is translated
// is how the two are offered here.
const ASKS = [
  { id: 'synopsis', text: synopsisPrompt },
  { id: 'recommend', text: recommendPrompt },
  // Not a question in prose but a list of books with holes in them, so it
  // assembles its own request and reads the answer back rather than printing
  // it. The reply is written only after somebody has seen it.
  { id: 'fill', text: fillPrompt, structured: true },
]

/**
 * Which fields a reply actually answered, and for how many books.
 *
 * A request asking for five fields commonly comes back with three of them.
 * Naming what arrived is the difference between a reader knowing what they are
 * about to keep and guessing at it.
 */
function FieldCounts({ summary, t, written = false }) {
  if (!summary.fields.length) return null
  return (
    <ul className="field-counts">
      {summary.fields.map(({ field, n }) => (
        <li key={field}>
          <span>{t(`fill.field.${field}`)}</span>
          <span className="tabular">
            {written ? t('desk.fill.onBooks', { n }) : t('desk.fill.forBooks', { n })}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The waiting books as a shelf, drawn the way the catalog draws one.
 *
 * The same spines, so a pile the desk has singled out looks like the shelf it
 * came off rather than like a report about it. What the list had and a spine
 * has no room for goes above it: the years are the reason these books are here
 * at all, and the order they stand in.
 */
function StaleWall({ rows, authors, language, onPick, t }) {
  const waited = (row) =>
    t('desk.yearsShort', {
      n: row.age.toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    })

  return (
    <div className="spine-view">
      {/* A group rather than a list, for the same reason the catalog wall is
          one: role="listitem" on a button replaces the button role. */}
      <div className="spine-wall short" role="group" aria-label={t('desk.neverOpened')}>
        {rows.map((row) => {
          const book = row.book
          const name = byline(book, authors)
          const why = intentWhy(row)
          // Everything the row used to show, gathered into the one place a
          // spine can carry it.
          const label = [book.title, name, waited(row), why].filter(Boolean).join(' · ')
          // The slot takes its width from the label rather than from the spine.
          // A spine is 26px and the years above it are wider than that, so
          // fixing the slot to the spine would set neighbouring labels
          // overlapping each other.
          return (
            <div className="spine-slot labelled" key={book.id}>
              <span className="waited-cell tabular">{waited(row)}</span>
              <button
                className="spine"
                title={label}
                aria-label={label}
                onClick={() => onPick(book)}
                style={{
                  width: spineWidth(book),
                  height: spineHeight(book),
                  background: `var(--spine-${spineTint(book)})`,
                  color: `var(--spine-${spineTint(book)}-ink)`,
                }}
              >
                <span className="spine-title">{book.title}</span>
              </button>
            </div>
          )
        })}
      </div>
      <div className="shelf-board" />
    </div>
  )
}

export default function Desk({ catalog, onGo, onOwl, lib }) {
  const { t, language } = useT()
  const [ask, setAsk] = useState('synopsis')
  const [question, setQuestion] = useState('')
  const [copied, setCopied] = useState(null)
  const [minYears, setMinYears] = useState(2)
  const [showAllStale, setShowAllStale] = useState(false)
  // What the key box last reported: which service, which model, and whether
  // the app is allowed to use it. Null until the box has read its own state.
  const [keyStatus, setKeyStatus] = useState(null)
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [spent, setSpent] = useState(null)
  const [askError, setAskError] = useState(null)
  // The gap-filling request carries its own state: which fields to ask about,
  // and what came back, held until it is accepted or discarded.
  const [fields, setFields] = useState(['published_year', 'pages'])
  const [proposed, setProposed] = useState(null)
  // What the last accepted request changed, kept after the review closes so
  // pressing Keep leaves something behind rather than an empty panel.
  const [written, setWritten] = useState(null)
  // A book opened from one of the lists below. The same panel the catalog
  // opens, because a book listed here is the same book.
  const [selected, setSelected] = useState(null)

  const authors = useMemo(() => authorNames(catalog), [catalog])
  const stale = useMemo(() => forgotten(catalog?.books || [], minYears), [catalog, minYears])
  const lent = useMemo(() => onLoan(catalog?.books || [], 'lent'), [catalog])
  const borrowedIn = useMemo(() => onLoan(catalog?.books || [], 'borrowed'), [catalog])

  // Built here rather than fetched: the profile is a view of the catalog
  // already in hand, and computing it locally is what lets the desk work with
  // no network at all.
  const context = useMemo(() => (catalog ? readerProfile(catalog) : null), [catalog])
  const favourites = useMemo(
    () => (catalog?.books || []).filter((b) => b.favourite),
    [catalog],
  )

  const chosen = ASKS.find((a) => a.id === ask)

  const gaps = useMemo(() => gapsByField(catalog?.books || []), [catalog])
  const toFill = useMemo(
    () => booksNeeding(catalog?.books || [], fields),
    [catalog, fields],
  )
  const fillRequest = useMemo(
    () => (toFill.length ? buildRequest(toFill, fields, authors, fillPrompt) : ''),
    [toFill, fields, authors],
  )
  const assembled = useMemo(() => {
    if (chosen.structured) return fillRequest
    if (!context) return ''
    return [
      chosen.text.trim(),
      '\n---\n',
      context.trim(),
      '\n---\n',
      question.trim() ? `## The question\n\n${question.trim()}` : '## The question\n\n(fill this in)',
    ].join('\n')
  }, [context, chosen, question, fillRequest])

  const askClaude = async () => {
    setAskError(null)
    setAnswer('')
    setSpent(null)
    setAsking(true)
    onOwl?.({ kind: 'asking' })
    try {
      // The same block the copy button produces, so both routes ask the same
      // question of the same model.
      let whole = ''
      const { usage } = await askModel({
        request: assembled,
        onText: (chunk) => {
          whole += chunk
          // The structured ask returns JSON, and a reader can do nothing with a
          // wall of braces sitting beside a review of the same books. It is
          // collected for the parser and shown as counts instead.
          if (!chosen.structured) setAnswer((prior) => prior + chunk)
        },
      })
      setSpent(actualCost(usage, pricesForChoice(keyStatus)))
      if (chosen.structured) setProposed(parseReply(whole, { books: toFill, fields }))
    } catch (err) {
      setAskError(err.message)
    } finally {
      setAsking(false)
      onOwl?.(null)
    }
  }

  /**
   * Write what was accepted, one correction per book.
   *
   * Through the override layer rather than into a source: these values were
   * recalled, not read, and the layer is what makes each one show under
   * Corrections and come back out again singly. The reason travels with the
   * correction, so undoing it takes the provenance with it.
   */
  const acceptProposed = () =>
    lib.run(async (library) => {
      let overrides = await library.readOverrides()
      const byId = new Map((catalog.books || []).map((b) => [b.id, b]))
      for (const row of proposed.proposals) {
        const book = byId.get(row.id)
        if (book) overrides = setOverride(overrides, book, row.set, FILL_WHY)
      }
      await library.writeOverrides(overrides)
      await library.rebuild()
      setWritten(summarise(proposed.proposals))
      setProposed(null)
      setAnswer('')
    })

  const flash = async (key, text) => {
    if (await copyText(text)) {
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    }
  }

  // The shelf shows what a read will cost before spending anything. A question
  // should say the same before it is sent.
  const askEstimate = estimateAskCost(assembled, pricesForChoice(keyStatus))
  const askEstimateLabel =
    askEstimate.dollars !== null
      ? dollars(askEstimate.dollars)
      : t('shelf.tokensOnly', { k: Math.max(1, Math.round(askEstimate.inputTokens / 1000)) })

  // The button names the service because the answer is paid for by whichever
  // key is switched on.
  const serviceName = keyStatus ? providerById(keyStatus.provider).label.split(' - ')[0] : ''
  const askLabel =
    serviceName && serviceName.length <= 20 ? t('desk.askService', { service: serviceName }) : t('desk.askForMe')

  if (!catalog) {
    return (
      <div className="view">
        <div className="view-head">
          <p className="eyebrow">{t('desk.eyebrow')}</p>
          <h2>{t('nav.desk')}</h2>
          <hr className="rule" />
          <p>{t('desk.nothingYet')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">{t('desk.eyebrow')}</p>
        <h2>{t('nav.desk')}</h2>
        <hr className="rule" />
        <p>{t('desk.intro')}</p>
      </div>

      <div className="desk-grid">
        <div>
          <section className="desk-section">
            <div className="section-head spread">
              <h3>{t('desk.neverOpened')}</h3>
              <label className="field">
                {t('desk.waitingAtLeast')}
                <select
                  value={minYears}
                  onChange={(e) => {
                    setMinYears(Number(e.target.value))
                    setShowAllStale(false)
                  }}
                >
                  {[1, 2, 3, 5, 8].map((y) => (
                    <option key={y} value={y}>
                      {t(y > 1 ? 'desk.years' : 'desk.year', { n: y })}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="tiny faint" style={{ margin: '6px 0 12px' }}>
              {t('desk.neverOpenedNote', { unknown: catalog.counts.read_unknown })}
            </p>

            {stale.length === 0 ? (
              <p className="muted">{t('desk.nothingWaited')}</p>
            ) : (
              <StaleWall
                rows={showAllStale ? stale : stale.slice(0, 5)}
                authors={authors}
                language={language}
                onPick={setSelected}
                t={t}
              />
            )}

            {stale.length > 5 && (
              <button
                className="btn small"
                style={{ marginTop: 12 }}
                onClick={() => setShowAllStale((shown) => !shown)}
              >
                {showAllStale ? t('desk.showFive') : t('desk.showAll', { n: stale.length })}
              </button>
            )}
          </section>

          <section className="desk-section">
            <h3 className="section-head">{t('desk.away')}</h3>
            <p className="tiny faint" style={{ margin: '6px 0 12px' }}>{t('desk.awayNote')}</p>

            {!lent.length && !borrowedIn.length && (
              <p className="muted">{t('desk.nothingAway')}</p>
            )}

            {[
              ['desk.lentGroup', lent, 'desk.withWhom'],
              ['desk.borrowedGroup', borrowedIn, 'desk.fromWhom'],
            ].map(([heading, rows, whoKey]) =>
              rows.length ? (
                <div key={heading} style={{ marginTop: 10 }}>
                  <p className="group-label">{t(heading, { n: rows.length })}</p>
                  {rows.map((row) => (
                    <button
                      className="forgotten-item spread"
                      key={row.book.id}
                      onClick={() => setSelected(row.book)}
                    >
                      <span>
                        <span className="title">{row.book.title}</span>
                        <br />
                        <span className="tiny muted">{byline(row.book, authors)}</span>
                        <div className="why">{t(whoKey, { who: row.who })}</div>
                      </span>
                      <span className="waited">
                        {row.age === null
                          ? t('desk.sinceUnknown')
                          : t('desk.yearsShort', {
                              n: row.age.toLocaleString(language, {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              }),
                            })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null,
            )}
          </section>

          {favourites.length > 0 && (
            <section className="desk-section">
              <div className="section-head spread">
                <h3>{t('desk.favourites')}</h3>
                <span className="tabular tiny faint">{favourites.length}</span>
              </div>
              <p className="tiny faint" style={{ margin: '6px 0 12px' }}>{t('desk.favouritesNote')}</p>
              {favourites.map((book) => (
                <button
                  className="forgotten-item spread"
                  key={book.id}
                  onClick={() => setSelected(book)}
                >
                  <span>
                    <span className="title">
                      <span className="star" aria-hidden="true">{'\u2605'}</span>
                      {book.title}
                    </span>
                    <br />
                    <span className="tiny muted">
                      {byline(book, authors) || t('book.authorUnknown')}
                    </span>
                    {book.notes && <div className="why">{book.notes}</div>}
                  </span>
                </button>
              ))}
              <button
                className="btn link"
                style={{ marginTop: 12, paddingLeft: 0 }}
                onClick={() => onGo?.('catalog', { favourite: 'yes' })}
              >
                {t('desk.showFavourites')}
              </button>
            </section>
          )}

          <section className="desk-section">
            <h3 className="section-head">{t('desk.madeOf')}</h3>
            <GenrePie books={catalog.books} />
          </section>

          <section className="desk-section">
            <h3 className="section-head">{t('desk.themes')}</h3>
            <p className="tiny faint" style={{ margin: '6px 0 12px' }}>{t('desk.themesNote')}</p>
            <WordCloud
              books={catalog.books}
              onPick={(word) => onGo?.('catalog', { tag: word.key, label: word.value })}
            />
          </section>
        </div>

        <div>
          <section className="ask-panel">
            <p className="eyebrow">{t('desk.askEyebrow')}</p>
            {/* Tabs rather than a segmented control: the two are alternative
                questions to put, not a setting being switched. */}
            <div className="ask-tabs" role="group" aria-label={t('desk.ask')}>
              {ASKS.map((a) => (
                <button
                  key={a.id}
                  aria-pressed={ask === a.id}
                  onClick={() => {
                    setAsk(a.id)
                    // Each tab answers a different question. Leaving the last
                    // one on screen makes it look like the answer to this one.
                    setAnswer('')
                    setProposed(null)
                    setWritten(null)
                    setAskError(null)
                    setSpent(null)
                  }}
                >
                  {t(`desk.${a.id}`)}
                </button>
              ))}
            </div>
            <p className="tiny muted">{t(`desk.${chosen.id}.blurb`)}</p>

            {chosen.structured ? (
              <div className="fill-picker">
                <p className="eyebrow" style={{ marginTop: 14 }}>{t('desk.fill.which')}</p>
                {/* One tick for the lot. Indeterminate while some are on, so it
                    reports the state rather than guessing at it. */}
                <label className="check check-all">
                  <input
                    type="checkbox"
                    checked={fields.length === FILLABLE.length}
                    ref={(box) => {
                      if (box) box.indeterminate = fields.length > 0 && fields.length < FILLABLE.length
                    }}
                    onChange={() =>
                      setFields(fields.length === FILLABLE.length ? [] : [...FILLABLE])
                    }
                  />
                  <span className="tiny">{t('desk.fill.all')}</span>
                </label>

                {FILLABLE.map((field) => (
                  <label key={field} className="check">
                    <input
                      type="checkbox"
                      checked={fields.includes(field)}
                      onChange={() =>
                        setFields((on) =>
                          on.includes(field) ? on.filter((f) => f !== field) : [...on, field],
                        )
                      }
                    />
                    <span className="tiny">{t(`fill.field.${field}`)}</span>
                    <span className="tiny faint tabular">
                      {t('desk.fill.missing', { n: gaps[field] ?? 0 })}
                    </span>
                  </label>
                ))}

                {/* The cost scales with the number of books, so the number is
                    stated before anything is sent rather than after. */}
                <p className="tiny faint" style={{ marginTop: 12 }}>
                  {fields.length === 0
                    ? t('desk.fill.pickOne')
                    : t('desk.fill.covers', { n: toFill.length })}
                </p>
                {/* Every field on every book is the largest request the app can
                    make, and the cost follows the number of both. */}
                {fields.length === FILLABLE.length && toFill.length > 20 && (
                  <p className="tiny faint">{t('desk.fill.thatIsALot')}</p>
                )}
              </div>
            ) : (
              <textarea
                className="compose"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t(`desk.${chosen.id}.placeholder`)}
                style={{ marginTop: 10 }}
              />
            )}

            <div className="row" style={{ marginTop: 10 }}>
              {keyStatus?.usable && (
                <button
                  className="btn primary"
                  disabled={!assembled || asking}
                  onClick={askClaude}
                >
                  {asking ? t('desk.thinking') : askLabel}
                </button>
              )}
              <button
                className={keyStatus?.usable ? 'btn' : 'btn primary'}
                disabled={!assembled}
                onClick={() => flash('all', assembled)}
              >
                {copied === 'all' ? t('common.copied') : t('desk.copyRequest')}
              </button>
              {chosen.structured && (
                <button
                  className="btn"
                  disabled={!toFill.length}
                  onClick={() => {
                    const text = window.prompt(t('desk.fill.pastePrompt'))
                    if (!text) return
                    try {
                      setAskError(null)
                      setProposed(parseReply(text, { books: toFill, fields }))
                    } catch (err) {
                      setAskError(err.message)
                    }
                  }}
                >
                  {t('desk.fill.paste')}
                </button>
              )}
              <button className="btn" disabled={!context} onClick={() => flash('ctx', context)}>
                {copied === 'ctx' ? t('common.copied') : t('desk.copyProfile')}
              </button>
            </div>

            {keyStatus?.usable && assembled && (
              <p className="tiny faint" style={{ marginTop: 8 }}>
                {askEstimateLabel} · {t('desk.estimateNote')}
              </p>
            )}

            {askError && (
              <div className="notice bad" style={{ marginTop: 12 }}>
                <p className="tiny">{askError}</p>
              </div>
            )}

            {/* The structured ask has no prose to show. While it is out it says so,
                and when it lands the review takes over. */}
            {chosen.structured && asking && (
              <p className="tiny faint" style={{ marginTop: 14 }}>
                {t('desk.fill.working', { n: toFill.length })}
              </p>
            )}

            {!chosen.structured && (answer || asking) && (
              <div style={{ marginTop: 14 }}>
                <div className="spread">
                  <strong className="tiny">{t('desk.answer')}</strong>
                  <span className="tiny faint">
                    {asking
                      ? t('desk.streaming')
                      : spent !== null
                        ? t('shelf.cost', { amount: dollars(spent) })
                        : ''}
                  </span>
                </div>
                <pre className="snippet" style={{ marginTop: 8, whiteSpace: 'pre-wrap', maxHeight: 420 }}>
                  {answer || ' '}
                </pre>
                {!asking && answer && (
                  <button className="btn small" style={{ marginTop: 8 }} onClick={() => flash('answer', answer)}>
                    {copied === 'answer' ? t('common.copied') : t('desk.copyAnswer')}
                  </button>
                )}
              </div>
            )}

            {written && !proposed && (
              <div className="notice good" style={{ marginTop: 16 }}>
                <p className="tiny">
                  <strong>{t('desk.fill.written', { n: written.books })}</strong>
                </p>
                <FieldCounts summary={written} t={t} written />
              </div>
            )}

            {proposed && (
              <div className="fill-review">
                <p className="eyebrow" style={{ marginTop: 18 }}>{t('desk.fill.review')}</p>
                <p className="tiny faint" style={{ margin: '4px 0 6px' }}>
                  {t('desk.fill.reviewNote', {
                    n: proposed.proposals.length,
                    ignored: proposed.ignored,
                  })}
                </p>
                <FieldCounts summary={summarise(proposed.proposals)} t={t} />
                {proposed.proposals.map((row) => (
                  <div className="forgotten-item" key={row.id}>
                    <span className="title">{row.title}</span>
                    <div className="why">
                      {Object.entries(row.set)
                        .map(([field, value]) => `${field}: ${String(value).slice(0, 90)}`)
                        .join(' · ')}
                    </div>
                  </div>
                ))}
                <div className="row" style={{ marginTop: 14 }}>
                  <button
                    className="btn primary"
                    disabled={!proposed.proposals.length || lib?.busy}
                    onClick={acceptProposed}
                  >
                    {t('desk.fill.accept', { n: proposed.proposals.length })}
                  </button>
                  <button className="btn" disabled={lib?.busy} onClick={() => setProposed(null)}>
                    {t('desk.fill.discard')}
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <ApiKeyBox what={t('desk.whatItIsFor')} onChange={setKeyStatus} />
            </div>

            <div className="notice" style={{ marginTop: 14 }}>
              <p className="tiny">
                {keyStatus?.usable ? t('desk.withKey') : t('desk.withoutKey')}{' '}
                {t('desk.promptsNote')}
              </p>
            </div>
          </section>

          {context && (
            <section className="desk-section">
              <div className="section-head spread">
                <h3>{t('desk.profile')}</h3>
                <span className="tabular tiny faint">
                  {t('desk.characters', { n: context.length.toLocaleString() })}
                </span>
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>{t('desk.profileNote')}</p>
              <pre className="snippet" style={{ marginTop: 10, maxHeight: 300 }}>
                {context}
              </pre>
            </section>
          )}
        </div>
      </div>

      <BookPanel
        book={selected}
        authors={authors}
        lib={lib}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
