import { useMemo, useState } from 'react'
import { authorNames, byline, copyText, forgotten, intentWhy, onLoan } from '../lib.js'
import { readerProfile } from '../core/profile.js'
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
import { useT } from '../i18n/index.jsx'

// The prompt text itself is not translated: it is the instruction sent to a
// model, and it lives in prompts/ where anyone can edit it. What is translated
// is how the two are offered here.
const ASKS = [
  { id: 'synopsis', text: synopsisPrompt },
  { id: 'recommend', text: recommendPrompt },
]

export default function Desk({ catalog, onGo }) {
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

  const authors = useMemo(() => authorNames(catalog), [catalog])
  const stale = useMemo(() => forgotten(catalog?.books || [], minYears), [catalog, minYears])
  const lent = useMemo(() => onLoan(catalog?.books || [], 'lent'), [catalog])
  const borrowedIn = useMemo(() => onLoan(catalog?.books || [], 'borrowed'), [catalog])

  // Built here rather than fetched: the profile is a view of the catalog
  // already in hand, and computing it locally is what lets the desk work with
  // no network at all.
  const context = useMemo(() => (catalog ? readerProfile(catalog) : null), [catalog])

  const chosen = ASKS.find((a) => a.id === ask)
  const assembled = useMemo(() => {
    if (!context) return ''
    return [
      chosen.text.trim(),
      '\n---\n',
      context.trim(),
      '\n---\n',
      question.trim() ? `## The question\n\n${question.trim()}` : '## The question\n\n(fill this in)',
    ].join('\n')
  }, [context, chosen, question])

  const askClaude = async () => {
    setAskError(null)
    setAnswer('')
    setSpent(null)
    setAsking(true)
    try {
      // The same block the copy button produces, so both routes ask the same
      // question of the same model.
      const { usage } = await askModel({
        request: assembled,
        onText: (chunk) => setAnswer((prior) => prior + chunk),
      })
      setSpent(actualCost(usage, pricesForChoice(keyStatus)))
    } catch (err) {
      setAskError(err.message)
    } finally {
      setAsking(false)
    }
  }

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
        <header>
          <h2>{t('nav.desk')}</h2>
          <p>{t('desk.nothingYet')}</p>
        </header>
      </div>
    )
  }

  return (
    <div className="view">
      <header>
        <h2>{t('nav.desk')}</h2>
        <p>{t('desk.intro')}</p>
      </header>

      <div className="desk-grid">
        <div>
          <div className="card">
            <div className="spread">
              <h3 style={{ margin: 0 }}>{t('desk.neverOpened')}</h3>
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
              (showAllStale ? stale : stale.slice(0, 5)).map((row) => (
                <div className="forgotten-item spread" key={row.book.id}>
                  <span>
                    <span className="title">{row.book.title}</span>
                    <br />
                    <span className="tiny muted">{byline(row.book, authors)}</span>
                    {intentWhy(row) && <div className="why">{intentWhy(row)}</div>}
                  </span>
                  <span className="waited">
                    {t('desk.yearsShort', {
                      n: row.age.toLocaleString(language, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      }),
                    })}
                  </span>
                </div>
              ))
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
          </div>

          <div className="card">
            <h3>{t('desk.away')}</h3>
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
                  <strong className="tiny">{t(heading, { n: rows.length })}</strong>
                  {rows.map((row) => (
                    <div className="forgotten-item spread" key={row.book.id}>
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
                    </div>
                  ))}
                </div>
              ) : null,
            )}
          </div>

          <div className="card">
            <h3>{t('desk.madeOf')}</h3>
            <GenrePie books={catalog.books} />
          </div>

          <div className="card">
            <h3>{t('desk.themes')}</h3>
            <p className="tiny faint" style={{ margin: '6px 0 12px' }}>{t('desk.themesNote')}</p>
            <WordCloud
              books={catalog.books}
              onPick={(word) => onGo?.('catalog', { tag: word.key, label: word.value })}
            />
          </div>
        </div>

        <div>
          <div className="card">
            <h3>{t('desk.ask')}</h3>
            <div className="segmented" style={{ marginBottom: 10 }}>
              {ASKS.map((a) => (
                <button key={a.id} aria-pressed={ask === a.id} onClick={() => setAsk(a.id)}>
                  {t(`desk.${a.id}`)}
                </button>
              ))}
            </div>
            <p className="tiny muted">{t(`desk.${chosen.id}.blurb`)}</p>

            <textarea
              className="compose"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t(`desk.${chosen.id}.placeholder`)}
              style={{ marginTop: 10 }}
            />

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

            {(answer || asking) && (
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

            <div style={{ marginTop: 16 }}>
              <ApiKeyBox what={t('desk.whatItIsFor')} onChange={setKeyStatus} />
            </div>

            <div className="notice" style={{ marginTop: 14 }}>
              <p className="tiny">
                {keyStatus?.usable ? t('desk.withKey') : t('desk.withoutKey')}{' '}
                {t('desk.promptsNote')}
              </p>
            </div>
          </div>

          {context && (
            <div className="card">
              <div className="spread">
                <h3 style={{ margin: 0 }}>{t('desk.profile')}</h3>
                <span className="tiny faint">
                  {t('desk.characters', { n: context.length.toLocaleString() })}
                </span>
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>{t('desk.profileNote')}</p>
              <pre className="snippet" style={{ marginTop: 10, maxHeight: 300 }}>
                {context}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
