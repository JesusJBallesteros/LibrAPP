import { useEffect, useRef, useState } from 'react'
import { EDITABLE } from '../core/overrides.js'
import { useT } from '../i18n/index.jsx'
import Overlay from './Overlay.jsx'

/**
 * One form for both jobs: typing a book in, and correcting one already there.
 *
 * They differ only in where the result goes. A new book becomes a record in the
 * manual source and is merged like anything else, so typing in a book an export
 * already has yields one entry rather than a duplicate. A correction to an
 * existing entry becomes an override, applied after the merge, outranking every
 * source and surviving every rebuild.
 */

const FORMATS = ['physical', 'ebook', 'audio']

const field = {
  border: '1px solid var(--rule-strong)',
  background: 'var(--paper)',
  borderRadius: 7,
  padding: '7px 9px',
  width: '100%',
}

function Row({ label, hint, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 11 }}>
      <span className="tiny" style={{ color: 'var(--ink-faint)', display: 'block', marginBottom: 3 }}>
        {label}
      </span>
      {children}
      {hint && <span className="tiny faint" style={{ display: 'block', marginTop: 3 }}>{hint}</span>}
    </label>
  )
}

export const toForm = (book, names) => ({
  title: book?.title || '',
  authors: book
    ? (book.authors || []).map((id) => names?.get(id)?.display_name || id).join(', ')
    : '',
  series: book?.series || '',
  series_index: book?.series_index ?? '',
  genre: book?.genre || '',
  read: book?.read === true ? 'read' : book?.read === false ? 'unread' : 'unknown',
  acquired_on: book?.acquired_on || '',
  lent_to: book?.lent_to || '',
  lent_on: book?.lent_on || '',
  borrowed_from: book?.borrowed_from || '',
  borrowed_on: book?.borrowed_on || '',
  publisher: book?.publisher || '',
  pages: book?.pages ?? '',
  location: book?.location || '',
  notes: book?.notes || '',
  favourite: Boolean(book?.favourite),
  formats: book?.formats?.length ? [...book.formats] : ['physical'],
})

export default function BookEditor({ book, authorNames, onSave, onCancel, busy, focusField, saveError }) {
  const { t } = useT()
  const editing = Boolean(book)
  // Opened at a field, when the panel was asked to record one thing rather
  // than to correct the book. The form is long enough that landing at the top
  // of it and hunting for the loan boxes is most of the effort of recording a
  // loan, which is the reason the loans go unrecorded.
  const opensAt = useRef(null)
  useEffect(() => {
    const control = opensAt.current
    if (!control) return
    control.focus({ preventScroll: true })
    control.scrollIntoView({ block: 'center' })
  }, [])
  const [form, setForm] = useState(() => toForm(book, authorNames))
  const [error, setError] = useState(null)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const toggleFormat = (f) =>
    setForm({
      ...form,
      formats: form.formats.includes(f)
        ? form.formats.filter((x) => x !== f)
        : [...form.formats, f].sort(),
    })

  const collect = () => {
    const title = form.title.trim()
    if (!title) throw new Error(t('editor.needTitle'))
    for (const key of ['acquired_on', 'lent_on', 'borrowed_on']) {
      if (form[key] && !/^\d{4}-\d{2}-\d{2}$/.test(form[key])) throw new Error(t('editor.badDate'))
    }
    // A book cannot be lent out and borrowed at the same time: one is owned and
    // away, the other is not owned at all.
    if (form.lent_to.trim() && form.borrowed_from.trim()) throw new Error(t('editor.bothLoans'))
    const index = String(form.series_index).trim()
    if (index && !/^\d+$/.test(index)) throw new Error(t('editor.badVolume'))
    const pages = String(form.pages).trim()
    if (pages && !/^\d+$/.test(pages)) throw new Error(t('editor.badPages'))

    return {
      title,
      authors: form.authors.split(',').map((a) => a.trim()).filter(Boolean),
      series: form.series.trim() || null,
      series_index: index ? Number(index) : null,
      genre: form.genre.trim() || null,
      read: form.read === 'read' ? true : form.read === 'unread' ? false : null,
      acquired_on: form.acquired_on.trim() || null,
      lent_to: form.lent_to.trim() || null,
      lent_on: form.lent_to.trim() ? form.lent_on.trim() || null : null,
      borrowed_from: form.borrowed_from.trim() || null,
      borrowed_on: form.borrowed_from.trim() ? form.borrowed_on.trim() || null : null,
      publisher: form.publisher.trim() || null,
      pages: pages ? Number(pages) : null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      favourite: form.favourite,
      formats: form.formats.length ? form.formats : ['physical'],
    }
  }

  /**
   * Only what actually changed.
   *
   * Recording every field would pin each one to its current value, so a better
   * source could never improve the entry again. A correction claiming eleven
   * changed fields when two changed is also unreadable. An unchanged form saves
   * nothing.
   */
  const changedOnly = (next) => {
    const current = toForm(book, authorNames)
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
    const changed = {}

    for (const key of Object.keys(next)) {
      if (key === 'authors') {
        const before = current.authors.split(',').map((a) => a.trim()).filter(Boolean)
        if (!same(before, next.authors)) changed.authors = next.authors
        continue
      }
      if (key === 'favourite') {
        if (current.favourite !== next.favourite) changed.favourite = next.favourite
        continue
      }
      if (key === 'formats') {
        if (!same([...current.formats].sort(), [...next.formats].sort())) changed.formats = next.formats
        continue
      }
      if (key === 'read') {
        const before = current.read === 'read' ? true : current.read === 'unread' ? false : null
        if (before !== next.read) changed.read = next.read
        continue
      }
      if (key === 'series_index' || key === 'pages') {
        const before = current[key] === '' ? null : Number(current[key])
        if (before !== next[key]) changed[key] = next[key]
        continue
      }
      const before = String(current[key] ?? '').trim() || null
      if (before !== next[key]) changed[key] = next[key]
    }
    return changed
  }

  const submit = () => {
    setError(null)
    try {
      const collected = collect()
      if (!editing) return onSave(collected)
      const changed = changedOnly(collected)
      if (!Object.keys(changed).length) {
        throw new Error(t('editor.nothingChanged'))
      }
      onSave(changed)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    // Busy means a save is in flight, and closing then would lose it, so the
    // backdrop stops dismissing until it lands.
    <Overlay onClose={onCancel} busy={busy} label={editing ? t('editor.correct') : t('editor.add')}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{editing ? t('editor.correct') : t('editor.add')}</h3>
          <button className="btn small" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </button>
        </div>

        <p className="tiny muted" style={{ marginTop: 0 }}>
          {editing ? t('editor.correctNote') : t('editor.addNote')}
        </p>

        <div style={{ marginTop: 14 }}>
          <Row label={t('editor.title')}>
            <input style={field} value={form.title} onChange={set('title')} autoFocus />
          </Row>
          <Row label={t('editor.authors')} hint={t('editor.authorsHint')}>
            <input style={field} value={form.authors} onChange={set('authors')} />
          </Row>
          {editing && !form.authors.trim() && (
            <p className="tiny faint" style={{ margin: '-6px 0 11px' }}>
              {book.author_label
                ? t('editor.noPersonalAuthor', { label: book.author_label })
                : t('editor.noAuthorRecorded')}
            </p>
          )}

          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: '2 1 160px' }}>
              <Row label={t('book.series')}>
                <input style={field} value={form.series} onChange={set('series')} />
              </Row>
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <Row label={t('editor.volume')}>
                <input style={field} value={form.series_index} onChange={set('series_index')} inputMode="numeric" />
              </Row>
            </div>
          </div>

          <Row label={t('book.genre')}>
            <input style={field} value={form.genre} onChange={set('genre')} />
          </Row>

          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 130px' }}>
              <Row label={t('book.read')} hint={t('editor.readHint')}>
                <select
                  ref={focusField === 'read' ? opensAt : null}
                  style={field}
                  value={form.read}
                  onChange={set('read')}
                >
                  <option value="unknown">{t('read.unknown')}</option>
                  <option value="read">{t('read.read')}</option>
                  <option value="unread">{t('read.unread')}</option>
                </select>
              </Row>
            </div>
            <div style={{ flex: '1 1 130px' }}>
              <Row label={t('book.acquired')} hint="YYYY-MM-DD">
                <input style={field} value={form.acquired_on} onChange={set('acquired_on')} placeholder="2024-01-19" />
              </Row>
            </div>
          </div>

          <Row label={t('book.pages')} hint={t('editor.pagesHint')}>
            <input style={field} value={form.pages} inputMode="numeric" onChange={set('pages')} />
          </Row>

          <Row label={t('book.publisher')}>
            <input style={field} value={form.publisher} onChange={set('publisher')} />
          </Row>
          <Row label={t('editor.where')} hint={t('editor.whereHint')}>
            <input style={field} value={form.location} onChange={set('location')} />
          </Row>
          <h4 style={{ margin: '18px 0 10px', font: '500 13px var(--sans)' }}>
            {t('editor.whereIsIt')}
          </h4>
          <p className="tiny faint" style={{ margin: '0 0 11px' }}>{t('editor.loanHint')}</p>

          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: '2 1 150px' }}>
              <Row label={t('editor.lentTo')}>
                <input
                  ref={focusField === 'lent_to' ? opensAt : null}
                  style={field}
                  value={form.lent_to}
                  onChange={set('lent_to')}
                />
              </Row>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <Row label={t('editor.lentOn')} hint="YYYY-MM-DD">
                <input
                  style={field}
                  value={form.lent_on}
                  onChange={set('lent_on')}
                  disabled={!form.lent_to.trim()}
                  placeholder="2026-03-14"
                />
              </Row>
            </div>
          </div>

          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: '2 1 150px' }}>
              <Row label={t('editor.borrowedFrom')}>
                <input style={field} value={form.borrowed_from} onChange={set('borrowed_from')} />
              </Row>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <Row label={t('editor.borrowedOn')} hint="YYYY-MM-DD">
                <input
                  style={field}
                  value={form.borrowed_on}
                  onChange={set('borrowed_on')}
                  disabled={!form.borrowed_from.trim()}
                  placeholder="2026-03-14"
                />
              </Row>
            </div>
          </div>

          {/* A toggle, not a checkbox in a list: it is one mark on one book,
              and it carries its own state for a screen reader. */}
          <Row label={t('editor.favourite')}>
            <button
              type="button"
              className={`star-toggle${form.favourite ? ' on' : ''}`}
              aria-pressed={form.favourite}
              onClick={() => setForm({ ...form, favourite: !form.favourite })}
            >
              <span aria-hidden="true">{form.favourite ? '\u2605' : '\u2606'}</span>
              {form.favourite ? t('editor.favouriteOn') : t('editor.favouriteOff')}
            </button>
          </Row>

          <Row label={t('editor.notes')} hint={t('editor.notesHint')}>
            <textarea
              ref={focusField === 'notes' ? opensAt : null}
              style={{ ...field, minHeight: 110, resize: 'vertical' }}
              value={form.notes}
              onChange={set('notes')}
            />
          </Row>

          <Row label={t('book.formats')}>
            <div className="row" style={{ gap: 8 }}>
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="btn small"
                  aria-pressed={form.formats.includes(f)}
                  onClick={() => toggleFormat(f)}
                  style={
                    form.formats.includes(f)
                      ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                      : undefined
                  }
                >
                  {t(`format.${f}`)}
                </button>
              ))}
            </div>
          </Row>
        </div>

        {/* Both kinds of failure land here rather than at the head of the
            form: a refused date and a write that could not finish are both
            answers to pressing Save, and this form is long enough that the top
            of it is off the screen by the time anybody does. */}
        {(error || saveError) && (
          <div className="notice bad" role="alert" style={{ marginTop: 10 }}>
            <p className="tiny">{error || saveError}</p>
          </div>
        )}

        <div className="row" style={{ marginTop: 6 }}>
          <button className="btn primary" onClick={submit} disabled={busy}>
            {busy ? t('common.saving') : editing ? t('editor.saveCorrection') : t('editor.addBook')}
          </button>
          <button className="btn" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </button>
        </div>

        {editing && (
          <p className="tiny faint" style={{ marginTop: 12 }}>
            {t('editor.correctable', { fields: EDITABLE.join(', ') })}
          </p>
        )}
    </Overlay>
  )
}
