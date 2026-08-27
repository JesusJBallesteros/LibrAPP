import { useEffect, useMemo, useState } from 'react'
import BookEditor from '../components/BookEditor.jsx'
import BookPanel from '../components/BookPanel.jsx'
import { setOverride } from '../core/overrides.js'
import {
  authorNames,
  borrowed,
  hiddenActiveFilters,
  byline,
  fold,
  lentOut,
  readState,
  sortName,
  sortBand,
  spineHeight,
  spineTint,
  spineWidth,
  uniqueSorted,
  withBands,
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
  const [favourite, setFavourite] = useState('all')
  // Set when the desk sends a word here. Matched against tag keys, which are
  // already folded, so it is exact rather than a substring search.
  const [tag, setTag] = useState(null)
  const [showMore, setShowMore] = useState(false)
  const [mode, setMode] = useState('list')
  const [group, setGroup] = useState('title')
  const [sort, setSort] = useState('title')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null) // an existing book, or 'new'

  const authors = useMemo(() => authorNames(catalog), [catalog])

  useEffect(() => {
    if (focus?.tag) setTag({ key: focus.tag, label: focus.label ?? focus.tag })
    // The desk sends a word; the librarian sends a filter. Both arrive the same
    // way, and a filter behind the disclosure opens it, so nothing narrows the
    // list with its control out of sight.
    if (focus?.read) setRead(focus.read)
    if (focus?.favourite) {
      setFavourite(focus.favourite)
      setShowMore(true)
    }
    if (focus?.sort) setSort(focus.sort)
    if (focus?.loan) {
      setLoan(focus.loan)
      setShowMore(true)
    }
  }, [focus])

  const prepared = useMemo(() => {
    if (!catalog) return []
    return catalog.books.map((b) => ({
      ...b,
      _title: fold(b.title),
      _author: sortName(b, authors),
      _byline: byline(b, authors),
      _haystack: fold(
        [
          b.title,
          byline(b, authors) || '',
          b.series,
          (b.tags || []).map((t) => t.value).join(' '),
        ].join(' '),
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
      if (favourite === 'yes' && !b.favourite) return false
      if (loan === 'lent' && !lentOut(b)) return false
      if (loan === 'borrowed' && !borrowed(b)) return false
      if (loan === 'home' && (lentOut(b) || borrowed(b))) return false
      if (tag && !(b.tags || []).some((each) => each.key === tag.key)) return false
      return true
    })
    return out.sort(SORTS[sort])
  }, [prepared, q, read, format, source, loan, favourite, tag, sort])

  // Format, Source and Where sit behind the disclosure, so the page has to say
  // when one of them is narrowing the list.
  const LABEL = {
    format: 'catalog.format',
    source: 'catalog.source',
    loan: 'catalog.whereIs',
    favourite: 'catalog.favourites',
  }
  /**
   * Turn the mark on or off, from wherever it was pressed.
   *
   * A correction like any other, so it survives a rebuild and can be undone
   * from the Library. Nothing else about the book is touched: setOverride
   * merges into whatever that book already carries.
   */
  const toggleFavourite = (book) =>
    lib?.run(async (library) => {
      const overrides = await library.readOverrides()
      await library.writeOverrides(setOverride(overrides, book, { favourite: !book.favourite }))
      await library.rebuild()
    })

  const hiddenNames = hiddenActiveFilters({ format, source, loan, favourite }).map((name) =>
    t(LABEL[name]),
  )
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
            {t('catalog.favourites')}
            <select value={favourite} onChange={(e) => setFavourite(e.target.value)}>
              <option value="all">{t('catalog.any')}</option>
              <option value="yes">{t('catalog.favouritesOnly')}</option>
            </select>
          </label>

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
              setFavourite('all')
              setTag(null)
            }}
          >
            {t('catalog.clearFilters')}
          </button>
        </div>
      ) : mode === 'spines' ? (
        <SpineWall
          books={shown}
          authors={authors}
          selected={selected}
          onPick={setSelected}
          onToggle={toggleFavourite}
          busy={lib?.busy}
          sort={sort}
          t={t}
        />
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
              {/* Bands only where the list is one run. Grouping already cuts it
                  into named sections, and two kinds of divider in one list
                  would say the same thing twice. */}
              {(key ? books.map((book) => ({ book })) : withBands(books, sort)).map((item) =>
                item.band ? (
                  <p className="band" key={`band-${item.band}`}>
                    <span>{item.band}</span>
                  </p>
                ) : (
                <div
                  key={item.book.id}
                  className="book-row"
                  aria-selected={selected?.id === item.book.id}
                >
                  <Star book={item.book} onToggle={toggleFavourite} t={t} busy={lib?.busy} />
                  <button className="row-open" onClick={() => setSelected(item.book)}>
                  <span>
                    <span className="title">
                      {item.book.series_index && group === 'series'
                        ? `${item.book.series_index}. `
                        : ''}
                      {item.book.title}
                    </span>
                    <br />
                    <span className="byline">{item.book._byline || t('book.authorUnknown')}</span>
                  </span>
                  <span className="meta">
                    <span className="formats">
                      {(item.book.formats || []).map((f) => t(`format.${f}`)).join(' · ')}
                    </span>
                    <span className={`state ${readState(item.book)}`}>
                      {t(`read.${readState(item.book)}`)}
                    </span>
                    <span className="away">
                      {lentOut(item.book)
                        ? t('catalog.lentOut')
                        : borrowed(item.book)
                          ? t('catalog.borrowed')
                          : ''}
                    </span>
                    <span className="year">
                      {item.book.acquired_on ? item.book.acquired_on.slice(0, 4) : ''}
                    </span>
                  </span>
                  </button>
                </div>
                ),
              )}
            </div>
          ))}
        </div>
      )}

      <BookPanel
        book={selected}
        authors={authors}
        lib={lib}
        onClose={() => setSelected(null)}
      />

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

/**
 * The mark, pressable wherever a book appears.
 *
 * A button rather than a glyph, with its own pressed state, because it is a
 * control and not decoration. It stops the click from reaching whatever sits
 * behind it, so pressing the star never also opens the book.
 */
function Star({ book, onToggle, t, busy }) {
  return (
    <button
      className={`star-cell${book.favourite ? ' on' : ''}`}
      aria-pressed={Boolean(book.favourite)}
      disabled={busy}
      title={book.favourite ? t('catalog.unmark') : t('catalog.mark')}
      aria-label={book.favourite ? t('catalog.unmark') : t('catalog.mark')}
      onClick={(e) => {
        e.stopPropagation()
        onToggle(book)
      }}
    >
      {book.favourite ? '\u2605' : '\u2606'}
    </button>
  )
}

/**
 * The catalog as a shelf.
 *
 * One button per book, so the wall is reachable by keyboard and each spine
 * keeps its title as the accessible name. Grouping is deliberately not applied
 * here: a wall with headings cut through it stops looking like a shelf. The
 * sort still decides the order.
 *
 * Colour and height are decoration, and the caption below says so, because a
 * height that looked like a page count and was not would be the app inventing
 * data about the books.
 */
function SpineWall({ books, authors, selected, onPick, onToggle, busy, sort, t }) {
  return (
    <div className="spine-view">
      {/* A group rather than a list: role="listitem" on a button replaces the
          button role, and a spine that is no longer announced as clickable is
          a worse trade than losing the list semantics. */}
      <div className="spine-wall" role="group" aria-label={t('catalog.spineWall')}>
        {withBands(books, sort).map((item) => {
          if (item.band) {
            return (
              <p className="band band-spine" key={`band-${item.band}`}>
                <span>{item.band}</span>
              </p>
            )
          }
          const book = item.book
          const name = byline(book, authors)
          return (
            <div
              key={book.id}
              className={`spine-slot${book.favourite ? ' marked' : ''}`}
              style={{ width: spineWidth(book) }}
            >
              {/* Above the spine rather than on it: a spine is 26 pixels wide
                  and its lettering already fills it. First in the column, so
                  it sits over the spine rather than down on the shelf board. */}
              <Star book={book} onToggle={onToggle} t={t} busy={busy} />
              <button
                className="spine"
                aria-selected={selected?.id === book.id}
                title={name ? `${book.title} · ${name}` : book.title}
                onClick={() => onPick(book)}
                style={{
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
      <p className="spine-caption">{t('catalog.spinesCaption')}</p>
    </div>
  )
}
