import { useState } from 'react'
import { EDITABLE } from '../core/overrides.js'
import { useT } from '../i18n/index.jsx'

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

const toForm = (book, names) => ({
  title: book?.title || '',
  authors: book ? (book.authors || []).map((id) => names?.get(id) || id).join(', ') : '',
  series: book?.series || '',
  series_index: book?.series_index ?? '',
  genre: book?.genre || '',
  read: book?.read === true ? 'read' : book?.read === false ? 'unread' : 'unknown',
  acquired_on: book?.acquired_on || '',
  publisher: book?.publisher || '',
  location: book?.location || '',
  notes: book?.notes || '',
  formats: book?.formats?.length ? [...book.formats] : ['physical'],
})

export default function BookEditor({ book, authorNames, onSave, onCancel, busy }) {
  const { t } = useT()
  const editing = Boolean(book)
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
    if (form.acquired_on && !/^\d{4}-\d{2}-\d{2}$/.test(form.acquired_on)) {
      throw new Error(t('editor.badDate'))
    }
    const index = String(form.series_index).trim()
    if (index && !/^\d+$/.test(index)) throw new Error(t('editor.badVolume'))

    return {
      title,
      authors: form.authors.split(',').map((a) => a.trim()).filter(Boolean),
      series: form.series.trim() || null,
      series_index: index ? Number(index) : null,
      genre: form.genre.trim() || null,
      read: form.read === 'read' ? true : form.read === 'unread' ? false : null,
      acquired_on: form.acquired_on.trim() || null,
      publisher: form.publisher.trim() || null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
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
      if (key === 'formats') {
        if (!same([...current.formats].sort(), [...next.formats].sort())) changed.formats = next.formats
        continue
      }
      if (key === 'read') {
        const before = current.read === 'read' ? true : current.read === 'unread' ? false : null
        if (before !== next.read) changed.read = next.read
        continue
      }
      if (key === 'series_index') {
        const before = current.series_index === '' ? null : Number(current.series_index)
        if (before !== next.series_index) changed.series_index = next.series_index
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
    <div className="detail-backdrop" onClick={onCancel}>
      <aside className="detail" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{editing ? t('editor.correct') : t('editor.add')}</h3>
          <button className="btn small" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </button>
        </div>

        <p className="tiny muted" style={{ marginTop: 0 }}>
          {editing ? t('editor.correctNote') : t('editor.addNote')}
        </p>

        {error && (
          <div className="notice bad" style={{ marginTop: 10 }}>
            <p className="tiny">{error}</p>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <Row label={t('editor.title')}>
            <input style={field} value={form.title} onChange={set('title')} autoFocus />
          </Row>
          <Row label={t('editor.authors')} hint={t('editor.authorsHint')}>
            <input style={field} value={form.authors} onChange={set('authors')} />
          </Row>

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
                <select style={field} value={form.read} onChange={set('read')}>
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

          <Row label={t('book.publisher')}>
            <input style={field} value={form.publisher} onChange={set('publisher')} />
          </Row>
          <Row label={t('editor.where')} hint={t('editor.whereHint')}>
            <input style={field} value={form.location} onChange={set('location')} />
          </Row>
          <Row label={t('editor.notes')}>
            <textarea style={{ ...field, minHeight: 62, resize: 'vertical' }} value={form.notes} onChange={set('notes')} />
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
      </aside>
    </div>
  )
}
