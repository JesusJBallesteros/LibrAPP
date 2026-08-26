import { useEffect, useMemo, useState } from 'react'
import BookDetail from '../components/BookDetail.jsx'
import BookEditor from '../components/BookEditor.jsx'
import { clearOverride, setOverride, setRemoved } from '../core/overrides.js'
import {
  authorNames,
  borrowed,
  hiddenActiveFilters,
  byline,
  fold,
  lentOut,
  readState,
  sortName,
  uniqueSorted,
} from '../lib.js'
import { useT } from '../i18n/index.jsx'

const GROUPINGS = ['title', 'author', 'series']

// The bucket books with no series fall into. Kept as a fixed key rather than a
// translated one, so grouping does not reshuffle itself when the language does.
const STANDALONE = 'Standalone'

const SORTS = {
  title: (a, b) => a._title.localeCompare(b._title),
  author: (a, b) => a._author.localeCompare(b._author) || a._title.localeCompare(b._title),
  acquired: (a, b) => (b.acquired_on || '').localeCompare(a.acquired_on || ''),
  oldest: (a, b) => (a.acquired_on || '￿').localeCompare(b.acquired_on || '￿'),
}

export default function Catalog({ catalog, onGo, lib, focus }) {
  const { t, language } = useT()
  const [q, setQ] = useState('')
  const [read, setRead] = useState('all')
  const [format, setFormat] = useState('all')
  const [source, setSource] = useState('all')
  const [loan, setLoan] = useState('all')
  // Set when the desk sends a word here. Matched against tag keys, which are
  // already folded, so it is exact rather than a substring search.
  const [tag, setTag] = useState(null)
  const [showMore, setShowMore] = useState(false)
  // Spines arrive in the next task. The toggle carries its state now so the
  // control is not wired up twice.
  const [mode, setMode] = useState('list')
  const [group, setGroup] = useState('title')
  const [sort, setSort] = useState('title')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null) // an existing book, or 'new'

  const authors = useMemo(() => authorNames(catalog), [catalog])

  useEffect(() => {
    if (focus?.tag) setTag({ key: focus.tag, label: focus.label ?? focus.tag })
  }, [focus])

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
      if (loan === 'lent' && !lentOut(b)) return false
      if (loan === 'borrowed' && !borrowed(b)) return false
      if (loan === 'home' && (lentOut(b) || borrowed(b))) return false
      if (tag && !(b.tags || []).some((each) => each.key === tag.key)) return false
      return true
    })
    return out.sort(SORTS[sort])
  }, [prepared, q, read, format, source, loan, tag, sort])

  // Format, Source and Where sit behind the disclosure, so the page has to say
  // when one of them is narrowing the list.
  const LABEL = { format: 'catalog.format', source: 'catalog.source', loan: 'catalog.whereIs' }
  const hiddenNames = hiddenActiveFilters({ format, source, loan }).map((name) => t(LABEL[name]))
  const hiddenActive = hiddenNames.length

  const groups = useMemo(() => {
    if (group === 'title') return [{ key: null, books: shown }]
    const buckets = new Map()
    for (const book of shown) {
      const key =
        group === 'author'
          ? book._byline
          : book.series || STANDALONE
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
        a[0] === STANDALONE ? 1 : b[0] === STANDALONE ? -1 : a[0].localeCompare(b[0]),
      )
    }
    return entries.map(([key, books]) => ({ key, books }))
  }, [shown, group])

  if (!catalog) {
    return (
      <div className="view">
        <header>
          <h2>{t('catalog.empty.title')}</h2>
          <p>{t('catalog.empty.body')}</p>
        </header>
        <div className="row">
          <button className="btn primary" onClick={() => onGo('shelf')}>
            {t('catalog.empty.shelf')}
          </button>
          <button className="btn" onClick={() => onGo('list')}>
            {t('catalog.empty.list')}
          </button>
          <button className="btn" onClick={() => setEditing('new')}>
            {t('catalog.typeIn')}
          </button>
        </div>
        {editing === 'new' && (
          <BookEditor
            authorNames={authors}
            busy={lib?.busy}
            onCancel={() => setEditing(null)}
            onSave={(record) =>
              lib.run(async (library) => {
                await library.addManualRecord(record)
                await library.rebuild()
                setEditing(null)
              })
            }
          />
        )}
      </div>
    )
  }

  return (
    <div className="view">
      <header className="view-head">
        <div className="spread">
          <div>
            <p className="eyebrow">{t('catalog.eyebrow')}</p>
            <h2>{t('nav.catalog')}</h2>
          </div>
          <button className="btn" onClick={() => setEditing('new')} disabled={lib?.busy}>
            {t('catalog.typeIn')}
          </button>
        </div>
        <hr className="rule" />
        <p className="catalog-meta">
            {shown.length === prepared.length
              ? t(prepared.length === 1 ? 'catalog.countOne' : 'catalog.countAll', {
                  total: prepared.length,
                })
              : t('catalog.countSome', { shown: shown.length, total: prepared.length })}
            {catalog.generated_at &&
              ` · ${t('catalog.builtAt', {
                when: new Date(catalog.generated_at).toLocaleString(language),
              })}`}
            {catalog.counts?.corrected
              ? ` · ${t('catalog.correctedCount', { n: catalog.counts.corrected })}`
              : ''}
            {catalog.counts?.removed
              ? ` · ${t('catalog.removedCount', { n: catalog.counts.removed })}`
              : ''}
        </p>
      </header>

      <div className="toolbar">
        <div className="search">
          <span className="glyph" aria-hidden="true">
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            aria-label={t('catalog.searchLabel')}
          />
          {q && (
            <button className="clear" onClick={() => setQ('')} aria-label={t('catalog.clearSearch')}>
              ✕
            </button>
          )}
        </div>

        <div className="segmented" role="group" aria-label={t('catalog.groupBy')}>
          {GROUPINGS.map((g) => (
            <button key={g} aria-pressed={group === g} onClick={() => setGroup(g)}>
              {t(`catalog.group.${g}`)}
            </button>
          ))}
        </div>

        <label className="field">
          {t('book.read')}
          <select value={read} onChange={(e) => setRead(e.target.value)}>
            <option value="all">{t('catalog.any')}</option>
            <option value="read">{t('read.read')}</option>
            <option value="unread">{t('read.unread')}</option>
            <option value="unknown">{t('read.unknown')}</option>
          </select>
        </label>

        <label className="field">
          {t('catalog.sort')}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="title">{t('catalog.sort.title')}</option>
            <option value="author">{t('catalog.sort.author')}</option>
            <option value="acquired">{t('catalog.sort.newest')}</option>
            <option value="oldest">{t('catalog.sort.oldest')}</option>
          </select>
        </label>

        <button className="btn link more-filters" onClick={() => setShowMore((open) => !open)}>
          {showMore ? t('catalog.fewerFilters') : t('catalog.moreFilters')}
          {!showMore && hiddenActive > 0 && (
            <span className="filter-count">{hiddenActive}</span>
          )}
        </button>

        <div className="segmented view-mode" role="group" aria-label={t('catalog.viewMode')}>
          {['list', 'spines'].map((each) => (
            <button key={each} aria-pressed={mode === each} onClick={() => setMode(each)}>
              {t(`catalog.mode.${each}`)}
            </button>
          ))}
        </div>
      </div>

      {showMore && (
        <div className="toolbar toolbar-more">
          {formats.length > 1 && (
            <label className="field">
              {t('catalog.format')}
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="all">{t('catalog.any')}</option>
                {formats.map((f) => (
                  <option key={f} value={f}>
                    {t(`format.${f}`)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {sources.length > 1 && (
            <label className="field">
              {t('catalog.source')}
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="all">{t('catalog.any')}</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            {t('catalog.whereIs')}
            <select value={loan} onChange={(e) => setLoan(e.target.value)}>
              <option value="all">{t('catalog.any')}</option>
              <option value="home">{t('catalog.atHome')}</option>
              <option value="lent">{t('catalog.lentOut')}</option>
              <option value="borrowed">{t('catalog.borrowed')}</option>
            </select>
          </label>
        </div>
      )}

      {/* A filter that is on while its control is hidden would narrow the
          catalog with nothing on screen to explain it. Naming each one is the
          only version of this that cannot mislead. */}
      {!showMore && hiddenActive > 0 && (
        <p className="hidden-filters">
          {t('catalog.hiddenFiltersOn', { filters: hiddenNames.join(', ') })}{' '}
          <button className="btn link" onClick={() => setShowMore(true)}>
            {t('catalog.showThem')}
          </button>
        </p>
      )}

      {tag && (
        <p className="hidden-filters">
          {t('catalog.taggedWith', { tag: tag.label })}{' '}
          <button className="btn link" onClick={() => setTag(null)}>
            {t('catalog.clearTag')}
          </button>
        </p>
      )}

      {shown.length === 0 ? (
        <div className="empty">
          {t('catalog.noMatch')}{' '}
          <button
            className="btn link"
            onClick={() => {
              setQ('')
              setRead('all')
              setFormat('all')
              setSource('all')
              setLoan('all')
              setTag(null)
            }}
          >
            {t('catalog.clearFilters')}
          </button>
        </div>
      ) : (
        <div className="results">
          {groups.map(({ key, books }) => (
            <div key={key || '_'}>
              {key && (
                <div className="group-head">
                  {key === STANDALONE ? t('catalog.standalone') : key}{' '}
                  <span className="faint">· {books.length}</span>
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
                    <span className="formats">
                      {(book.formats || []).map((f) => t(`format.${f}`)).join(' · ')}
                    </span>
                    <span className={`state ${readState(book)}`}>
                      {t(`read.${readState(book)}`)}
                    </span>
                    <span className="away">
                      {lentOut(book)
                        ? t('catalog.lentOut')
                        : borrowed(book)
                          ? t('catalog.borrowed')
                          : ''}
                    </span>
                    <span className="year">{book.acquired_on ? book.acquired_on.slice(0, 4) : ''}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <BookDetail
          book={selected}
          authors={authors}
          busy={lib?.busy}
          onClose={() => setSelected(null)}
          onEdit={(book) => {
            setSelected(null)
            setEditing(book)
          }}
          onRemove={(book) =>
            lib.run(async (library) => {
              await library.writeOverrides(setRemoved(await library.readOverrides(), book, true))
              await library.rebuild()
              setSelected(null)
            })
          }
          onRevert={(book) =>
            lib.run(async (library) => {
              await library.writeOverrides(clearOverride(await library.readOverrides(), book.id))
              await library.rebuild()
              setSelected(null)
            })
          }
        />
      )}

      {editing && editing !== 'new' && (
        <BookEditor
          book={editing}
          authorNames={authors}
          busy={lib?.busy}
          onCancel={() => setEditing(null)}
          onSave={(changes) =>
            lib.run(async (library) => {
              await library.writeOverrides(setOverride(await library.readOverrides(), editing, changes))
              await library.rebuild()
              setEditing(null)
            })
          }
        />
      )}

      {editing === 'new' && (
        <BookEditor
          authorNames={authors}
          busy={lib?.busy}
          onCancel={() => setEditing(null)}
          onSave={(record) =>
            lib.run(async (library) => {
              await library.addManualRecord(record)
              await library.rebuild()
              setEditing(null)
            })
          }
        />
      )}
    </div>
  )
}
