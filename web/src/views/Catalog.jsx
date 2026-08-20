import { useMemo, useState } from 'react'
import BookDetail from '../components/BookDetail.jsx'
import { READ_LABEL, authorNames, byline, fold, readState, sortName, uniqueSorted } from '../lib.js'

const GROUPINGS = [
  { id: 'title', label: 'Title' },
  { id: 'author', label: 'Author' },
  { id: 'series', label: 'Series' },
]

const SORTS = {
  title: (a, b) => a._title.localeCompare(b._title),
  author: (a, b) => a._author.localeCompare(b._author) || a._title.localeCompare(b._title),
  acquired: (a, b) => (b.acquired_on || '').localeCompare(a.acquired_on || ''),
  oldest: (a, b) => (a.acquired_on || '￿').localeCompare(b.acquired_on || '￿'),
}

export default function Catalog({ catalog, state, onGo }) {
  const [q, setQ] = useState('')
  const [read, setRead] = useState('all')
  const [format, setFormat] = useState('all')
  const [source, setSource] = useState('all')
  const [group, setGroup] = useState('title')
  const [sort, setSort] = useState('title')
  const [selected, setSelected] = useState(null)

  const authors = useMemo(() => authorNames(catalog), [catalog])

  const prepared = useMemo(() => {
    if (!catalog) return []
    return catalog.books.map((b) => ({
      ...b,
      _title: fold(b.title),
      _author: sortName(b, authors),
      _byline: byline(b, authors),
      _haystack: fold(
        [b.title, byline(b, authors), b.series, (b.tags || []).map((t) => t.value).join(' ')].join(' '),
      ),
    }))
  }, [catalog, authors])

  const formats = useMemo(() => uniqueSorted(prepared.flatMap((b) => b.formats || [])), [prepared])
  const sources = useMemo(() => uniqueSorted(prepared.flatMap((b) => b.sources || [])), [prepared])

  const shown = useMemo(() => {
    const needle = fold(q)
    const out = prepared.filter((b) => {
      if (needle && !b._haystack.includes(needle)) return false
      if (read !== 'all' && readState(b) !== read) return false
      if (format !== 'all' && !(b.formats || []).includes(format)) return false
      if (source !== 'all' && !(b.sources || []).includes(source)) return false
      return true
    })
    return out.sort(SORTS[sort])
  }, [prepared, q, read, format, source, sort])

  const groups = useMemo(() => {
    if (group === 'title') return [{ key: null, books: shown }]
    const buckets = new Map()
    for (const book of shown) {
      const key =
        group === 'author'
          ? book._byline
          : book.series || 'Standalone'
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(book)
    }
    const entries = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    if (group === 'series') {
      for (const [, books] of entries) {
        books.sort((x, y) => (x.series_index || 99) - (y.series_index || 99))
      }
      // Standalones are not a series; they belong after every real one.
      entries.sort((a, b) =>
        a[0] === 'Standalone' ? 1 : b[0] === 'Standalone' ? -1 : a[0].localeCompare(b[0]),
      )
    }
    return entries.map(([key, books]) => ({ key, books }))
  }, [shown, group])

  if (!catalog) {
    return (
      <div className="view">
        <header>
          <h2>No catalog yet</h2>
          <p>
            Nothing has been ingested. Start with a photograph of a shelf, or with a list you
            already keep — either one on its own is enough to build a catalog.
          </p>
        </header>
        <div className="row">
          <button className="btn primary" onClick={() => onGo('shelf')}>
            Read a shelf photograph
          </button>
          <button className="btn" onClick={() => onGo('list')}>
            Upload a list
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="view">
      <header className="spread">
        <div>
          <h2>Catalog</h2>
          <p className="tiny muted">
            {shown.length === prepared.length
              ? `${prepared.length} books`
              : `${shown.length} of ${prepared.length} books`}
            {state?.catalog?.generated_at &&
              ` · built ${new Date(state.catalog.generated_at).toLocaleString()}`}
          </p>
        </div>
      </header>

      <div className="toolbar">
        <div className="search">
          <span className="glyph" aria-hidden="true">
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, authors, series, tags…"
            aria-label="Search the catalog"
          />
          {q && (
            <button className="clear" onClick={() => setQ('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="segmented" role="group" aria-label="Group by">
          {GROUPINGS.map((g) => (
            <button key={g.id} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
              {g.label}
            </button>
          ))}
        </div>

        <label className="field">
          Read
          <select value={read} onChange={(e) => setRead(e.target.value)}>
            <option value="all">any</option>
            <option value="read">read</option>
            <option value="unread">unread</option>
            <option value="unknown">not recorded</option>
          </select>
        </label>

        {formats.length > 1 && (
          <label className="field">
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="all">any</option>
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        )}

        {sources.length > 1 && (
          <label className="field">
            Source
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">any</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="title">title</option>
            <option value="author">author</option>
            <option value="acquired">newest first</option>
            <option value="oldest">oldest first</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          Nothing matches. <button className="btn link" onClick={() => { setQ(''); setRead('all'); setFormat('all'); setSource('all') }}>Clear the filters</button>
        </div>
      ) : (
        <div className="results">
          {groups.map(({ key, books }) => (
            <div key={key || '_'}>
              {key && (
                <div className="group-head">
                  {key} <span className="faint">· {books.length}</span>
                </div>
              )}
              {books.map((book) => (
                <button
                  key={book.id}
                  className="book-row"
                  aria-selected={selected?.id === book.id}
                  onClick={() => setSelected(book)}
                >
                  <span>
                    <span className="title">
                      {book.series_index && group === 'series' ? `${book.series_index}. ` : ''}
                      {book.title}
                    </span>
                    <br />
                    <span className="byline">{book._byline}</span>
                  </span>
                  <span className="meta">
                    {(book.formats || []).map((f) => (
                      <span className="pill" key={f}>
                        {f}
                      </span>
                    ))}
                    <span className={`pill ${readState(book)}`}>{READ_LABEL[readState(book)]}</span>
                    {book.acquired_on && <span className="faint tiny">{book.acquired_on.slice(0, 4)}</span>}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <BookDetail book={selected} authors={authors} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
