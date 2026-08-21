import { useMemo, useState } from 'react'
import { authorNames, byline, copyText, forgotten, intentWhy } from '../lib.js'
import { readerProfile } from '../core/profile.js'
import GenrePie from '../components/GenrePie.jsx'
import ApiKeyBox from '../components/ApiKeyBox.jsx'

// Imported under another name: `ask` is already the state holding which
// prompt is selected, and the local binding silently shadows the import.
import { actualCost, ask as askModel, dollars, pricesForChoice } from '../ai/model.js'
import { providerById } from '../ai/providers.js'
import synopsisPrompt from '../../../prompts/synopsis.md?raw'
import recommendPrompt from '../../../prompts/recommend.md?raw'

const ASKS = [
  {
    id: 'synopsis',
    text: synopsisPrompt,
    label: 'Synopsis',
    placeholder: 'Which book? It does not have to be one you own.',
    blurb:
      'Describes a book to someone whose shelf is in front of you — what it argues, what it is reacting against, and how it stands against books you already have.',
  },
  {
    id: 'recommend',
    text: recommendPrompt,
    label: 'Recommendation',
    placeholder: 'Anything to steer it? "something for a long flight", or leave blank.',
    blurb:
      'Two or three books, never more, chosen against where your reading is going rather than where it has been — and it checks the unread pile before suggesting a purchase.',
  },
]

export default function Desk({ catalog }) {
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

  if (!catalog) {
    // Naming the service on the button matters: the answer is about to be paid
  // for by whoever's key is switched on, and they should see whose it is.
  const serviceName = keyStatus ? providerById(keyStatus.provider).label.split(' - ')[0] : ''
  const askLabel = serviceName && serviceName.length <= 20 ? `Ask ${serviceName}` : 'Ask for me'

  return (
      <div className="view">
        <header>
          <h2>LibrAPPrian's desk</h2>
          <p>Nothing to work with yet — build a catalog first.</p>
        </header>
      </div>
    )
  }

  return (
    <div className="view">
      <header>
        <h2>LibrAPPrian's desk</h2>
        <p>
          Where the catalog stops being a list and starts being an argument. Everything on the left
          is computed locally. The right-hand side prepares a question for a model — your shelf is
          what makes the answer yours rather than generic.
        </p>
      </header>

      <div className="desk-grid">
        <div>
          <div className="card">
            <div className="spread">
              <h3 style={{ margin: 0 }}>Bought, and never opened</h3>
              <label className="field">
                waiting at least
                <select
                  value={minYears}
                  onChange={(e) => {
                    setMinYears(Number(e.target.value))
                    setShowAllStale(false)
                  }}
                >
                  {[1, 2, 3, 5, 8].map((y) => (
                    <option key={y} value={y}>
                      {y} year{y > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="tiny faint" style={{ margin: '6px 0 12px' }}>
              Ordered by how long they have waited, weighted by how much you evidently wanted them
              at the time. Only books <em>known</em> to be unread appear — {catalog.counts.read_unknown}{' '}
              books have no reading record at all, and guessing would bury this list under books you
              already finished.
            </p>

            {stale.length === 0 ? (
              <p className="muted">Nothing has waited that long.</p>
            ) : (
              (showAllStale ? stale : stale.slice(0, 5)).map((row) => (
                <div className="forgotten-item spread" key={row.book.id}>
                  <span>
                    <span className="title">{row.book.title}</span>
                    <br />
                    <span className="tiny muted">{byline(row.book, authors)}</span>
                    {intentWhy(row) && <div className="why">{intentWhy(row)}</div>}
                  </span>
                  <span className="waited">{row.age.toFixed(1)} yr</span>
                </div>
              ))
            )}

            {stale.length > 5 && (
              <button
                className="btn small"
                style={{ marginTop: 12 }}
                onClick={() => setShowAllStale((shown) => !shown)}
              >
                {showAllStale ? 'Show only the first five' : `Show all ${stale.length}`}
              </button>
            )}
          </div>

          <div className="card">
            <h3>What the collection is made of</h3>
            <GenrePie books={catalog.books} />
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Ask</h3>
            <div className="segmented" style={{ marginBottom: 10 }}>
              {ASKS.map((a) => (
                <button key={a.id} aria-pressed={ask === a.id} onClick={() => setAsk(a.id)}>
                  {a.label}
                </button>
              ))}
            </div>
            <p className="tiny muted">{chosen.blurb}</p>

            <textarea
              className="compose"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={chosen.placeholder}
              style={{ marginTop: 10 }}
            />

            <div className="row" style={{ marginTop: 10 }}>
              {keyStatus?.state === 'active' && (
                <button
                  className="btn primary"
                  disabled={!assembled || asking}
                  onClick={askClaude}
                >
                  {asking ? 'thinking…' : askLabel}
                </button>
              )}
              <button
                className={keyStatus?.state === 'active' ? 'btn' : 'btn primary'}
                disabled={!assembled}
                onClick={() => flash('all', assembled)}
              >
                {copied === 'all' ? 'Copied' : 'Copy the whole request'}
              </button>
              <button className="btn" disabled={!context} onClick={() => flash('ctx', context)}>
                {copied === 'ctx' ? 'Copied' : 'Copy just the profile'}
              </button>
            </div>

            {askError && (
              <div className="notice bad" style={{ marginTop: 12 }}>
                <p className="tiny">{askError}</p>
              </div>
            )}

            {(answer || asking) && (
              <div style={{ marginTop: 14 }}>
                <div className="spread">
                  <strong className="tiny">Answer</strong>
                  <span className="tiny faint">
                    {asking ? 'streaming…' : spent !== null ? `cost ${dollars(spent)}` : ''}
                  </span>
                </div>
                <pre className="snippet" style={{ marginTop: 8, whiteSpace: 'pre-wrap', maxHeight: 420 }}>
                  {answer || ' '}
                </pre>
                {!asking && answer && (
                  <button className="btn small" style={{ marginTop: 8 }} onClick={() => flash('answer', answer)}>
                    {copied === 'answer' ? 'Copied' : 'Copy the answer'}
                  </button>
                )}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <ApiKeyBox what="the desk" onChange={setKeyStatus} />
            </div>

            <div className="notice" style={{ marginTop: 14 }}>
              <p className="tiny">
                {keyStatus?.state === 'active'
                  ? 'With a key, LibrAPP asks on your behalf. Without one it assembles the request for you to paste into any AI session — the same instructions, the same profile, the same question.'
                  : 'LibrAPP assembles the instructions, your reading profile and your question into one block — paste it into any AI session you already use. Add a key below and it can ask for you instead.'}{' '}
                The prompts live in <code>prompts/</code> as plain text, so you can edit how it asks.
              </p>
            </div>
          </div>

          {context && (
            <div className="card">
              <div className="spread">
                <h3 style={{ margin: 0 }}>Your reading profile</h3>
                <span className="tiny faint">{context.length.toLocaleString()} characters</span>
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>
                Deliberately not the whole catalog — a few hundred titles crowd out the question.
                This is the shape of the collection and how it has moved, with enough named books to
                argue from.
              </p>
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
