import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { authorNames, byline, copyText, forgotten, intentWhy } from '../lib.js'

const ASKS = [
  {
    id: 'synopsis',
    file: 'synopsis.md',
    label: 'Synopsis',
    placeholder: 'Which book? It does not have to be one you own.',
    blurb:
      'Describes a book to someone whose shelf is in front of you — what it argues, what it is reacting against, and how it stands against books you already have.',
  },
  {
    id: 'recommend',
    file: 'recommend.md',
    label: 'Recommendation',
    placeholder: 'Anything to steer it? "something for a long flight", or leave blank.',
    blurb:
      'Two or three books, never more, chosen against where your reading is going rather than where it has been — and it checks the unread pile before suggesting a purchase.',
  },
]

export default function Desk({ catalog }) {
  const [context, setContext] = useState(null)
  const [prompts, setPrompts] = useState({})
  const [ask, setAsk] = useState('synopsis')
  const [question, setQuestion] = useState('')
  const [copied, setCopied] = useState(null)
  const [minYears, setMinYears] = useState(2)
  const [error, setError] = useState(null)

  const authors = useMemo(() => authorNames(catalog), [catalog])
  const stale = useMemo(() => forgotten(catalog?.books || [], minYears), [catalog, minYears])

  useEffect(() => {
    if (!catalog) return
    api.context().then((r) => setContext(r.markdown)).catch((e) => setError(e.message))
  }, [catalog])

  useEffect(() => {
    const chosen = ASKS.find((a) => a.id === ask)
    if (prompts[chosen.file]) return
    api
      .prompt(chosen.file)
      .then((r) => setPrompts((p) => ({ ...p, [r.name]: r.markdown })))
      .catch((e) => setError(e.message))
  }, [ask, prompts])

  const chosen = ASKS.find((a) => a.id === ask)
  const assembled = useMemo(() => {
    if (!context || !prompts[chosen.file]) return ''
    return [
      prompts[chosen.file].trim(),
      '\n---\n',
      context.trim(),
      '\n---\n',
      question.trim() ? `## The question\n\n${question.trim()}` : '## The question\n\n(fill this in)',
    ].join('\n')
  }, [context, prompts, chosen, question])

  const flash = async (key, text) => {
    if (await copyText(text)) {
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    }
  }

  if (!catalog) {
    return (
      <div className="view">
        <header>
          <h2>The LibrAPPrian's desk</h2>
          <p>Nothing to work with yet — build a catalog first.</p>
        </header>
      </div>
    )
  }

  const genres = (catalog.books || [])
    .flatMap((b) => (b.tags || []).filter((t) => t.kind === 'genre').map((t) => t.value))
    .reduce((acc, v) => acc.set(v, (acc.get(v) || 0) + 1), new Map())
  const topGenres = [...genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const widest = topGenres[0]?.[1] || 1

  return (
    <div className="view">
      <header>
        <h2>The LibrAPPrian's desk</h2>
        <p>
          Where the catalog stops being a list and starts being an argument. Everything on the left
          is computed locally. The right-hand side prepares a question for a model — your shelf is
          what makes the answer yours rather than generic.
        </p>
      </header>

      {error && (
        <div className="notice bad">
          <p>{error}</p>
        </div>
      )}

      <div className="desk-grid">
        <div>
          <div className="card">
            <div className="spread">
              <h3 style={{ margin: 0 }}>Bought, and never opened</h3>
              <label className="field">
                waiting at least
                <select value={minYears} onChange={(e) => setMinYears(Number(e.target.value))}>
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
              stale.slice(0, 14).map((row) => (
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
          </div>

          <div className="card">
            <h3>What the collection is made of</h3>
            <div className="bars">
              {topGenres.map(([value, n]) => (
                <div className="bar-row" key={value}>
                  <span className="n">{n}</span>
                  <span className="bar" style={{ width: `${(n / widest) * 100}%` }} />
                  <span className="muted" style={{ gridColumn: 3 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
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
              <button
                className="btn primary"
                disabled={!assembled}
                onClick={() => flash('all', assembled)}
              >
                {copied === 'all' ? 'Copied' : 'Copy the whole request'}
              </button>
              <button
                className="btn"
                disabled={!context}
                onClick={() => flash('ctx', context)}
              >
                {copied === 'ctx' ? 'Copied' : 'Copy just the profile'}
              </button>
            </div>

            <div className="notice" style={{ marginTop: 14 }}>
              <p className="tiny">
                LibrAPP does not call a model itself, and holds no API key. It assembles the
                instructions, your reading profile and your question into one block — paste it into
                any AI session you already use. The prompts live in <code>prompts/</code> as plain
                text, so you can edit how it asks.
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
