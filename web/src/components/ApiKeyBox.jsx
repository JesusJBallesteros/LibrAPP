import { useEffect, useState } from 'react'
import { deleteKey, keyState, looksLikeKey, saveKey, setActive } from '../ai/key.js'

/**
 * The one place a key is entered, and the one place its state is visible.
 *
 * Deliberately explicit, and deliberately the same component wherever an
 * AI-powered feature appears: if the app can spend your money, you should be
 * able to see that at the moment you are about to use it, not buried in a
 * settings page you visited once.
 *
 * Switching a key off is separate from deleting it, because they answer
 * different questions — "not now" and "not ever".
 */
export default function ApiKeyBox({ what = 'this', onChange }) {
  const [state, setState] = useState('loading')
  const [masked, setMasked] = useState(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    const next = await keyState()
    setState(next.state)
    setMasked(next.masked)
    onChange?.(next.state)
  }

  useEffect(() => {
    refresh()
    // The box appears in more than one view; each mount reads the current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const save = () =>
    run(async () => {
      const key = draft.trim()
      if (!key) throw new Error('Paste a key first.')
      if (!looksLikeKey(key)) {
        throw new Error('That does not look like an Anthropic key — they begin with sk-ant-.')
      }
      await saveKey(key)
      setDraft('')
    })

  if (state === 'loading') return null

  return (
    <div className="card" style={{ background: 'var(--paper-sunk)', boxShadow: 'none' }}>
      <div className="spread">
        <h3 style={{ margin: 0 }}>API key</h3>
        <span className={`pill ${state === 'active' ? 'read' : state === 'off' ? 'unread' : 'unknown'}`}>
          {state === 'active' ? 'stored · in use' : state === 'off' ? 'stored · switched off' : 'no key stored'}
        </span>
      </div>

      {error && (
        <div className="notice bad" style={{ marginTop: 10 }}>
          <p className="tiny">{error}</p>
        </div>
      )}

      {state === 'absent' ? (
        <>
          <p className="tiny muted" style={{ marginTop: 8 }}>
            Optional. Without one, {what} still works — LibrAPP prepares everything for you to paste
            into an AI session yourself. With one, it can do it here.
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck="false"
              aria-label="Anthropic API key"
              style={{
                flex: '1 1 260px',
                minWidth: 180,
                border: '1px solid var(--rule-strong)',
                background: 'var(--paper)',
                borderRadius: 8,
                padding: '8px 11px',
                fontFamily: 'var(--mono)',
                fontSize: 13,
              }}
            />
            <button className="btn primary" onClick={save} disabled={busy}>
              Save key
            </button>
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            Kept in this browser's storage on this device, sent only to api.anthropic.com, and never
            written into your catalog or an export. Anything running on this page could read it, so
            use a key scoped to its own workspace with a spend limit.
          </p>
        </>
      ) : (
        <>
          <p className="tiny muted" style={{ marginTop: 8 }}>
            <code>{masked}</code>{' '}
            {state === 'active'
              ? '— LibrAPP may use this to read spines and answer questions.'
              : '— stored, but LibrAPP will not use it. The copy-and-paste route still works.'}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" disabled={busy} onClick={() => run(() => setActive(state !== 'active'))}>
              {state === 'active' ? 'Switch off' : 'Switch on'}
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => run(deleteKey)}
              style={{ borderColor: 'color-mix(in srgb, var(--bad) 50%, transparent)', color: 'var(--bad)' }}
            >
              Delete
            </button>
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            Switching off keeps the key for later without letting the app spend anything. Deleting
            removes it from this device.
          </p>
        </>
      )}
    </div>
  )
}
