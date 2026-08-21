import { useEffect, useState } from 'react'
import {
  chooseProvider,
  deleteKey,
  hostOf,
  keyState,
  looksLikeKey,
  providersWithKeys,
  rememberForProvider,
  saveKey,
  setActive,
} from '../ai/key.js'
import { PROVIDERS, providerById } from '../ai/providers.js'

/**
 * The one place a service is chosen and a key is entered, and the one place
 * their state is visible.
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
  const [choice, setChoice] = useState(null)
  const [stocked, setStocked] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    const next = await keyState()
    setChoice(next)
    setStocked(await providersWithKeys())
    onChange?.(next)
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

  if (!choice) return null

  const provider = providerById(choice.provider)
  const state = choice.state
  const where = provider.host || hostOf(choice.baseUrl)

  const save = () =>
    run(async () => {
      const key = draft.trim()
      if (!key) throw new Error('Paste a key first.')
      if (!looksLikeKey(provider.id, key)) {
        throw new Error(
          `That does not look like a key for ${provider.label} — they look like ${provider.keyHint}.`,
        )
      }
      await saveKey(provider.id, key)
      setDraft('')
    })

  const field = {
    border: '1px solid var(--rule-strong)',
    background: 'var(--paper)',
    borderRadius: 8,
    padding: '8px 11px',
    fontFamily: 'var(--mono)',
    fontSize: 13,
    minWidth: 0,
  }

  return (
    <div className="card" style={{ background: 'var(--paper-sunk)', boxShadow: 'none' }}>
      <div className="spread">
        <h3 style={{ margin: 0 }}>AI service</h3>
        <span className={`pill ${state === 'active' ? 'read' : state === 'off' ? 'unread' : 'unknown'}`}>
          {state === 'active'
            ? 'key stored · in use'
            : state === 'off'
              ? 'key stored · switched off'
              : 'no key stored'}
        </span>
      </div>

      {error && (
        <div className="notice bad" style={{ marginTop: 10 }}>
          <p className="tiny">{error}</p>
        </div>
      )}

      <div className="row" style={{ marginTop: 10, alignItems: 'flex-end' }}>
        <label className="tiny muted" style={{ display: 'grid', gap: 4, flex: '1 1 240px', minWidth: 0 }}>
          Service
          <select
            value={provider.id}
            disabled={busy}
            onChange={(e) => run(() => chooseProvider(e.target.value))}
            style={{ ...field, fontFamily: 'inherit' }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {stocked.includes(p.id) ? ' · key stored' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="tiny muted" style={{ display: 'grid', gap: 4, flex: '1 1 200px', minWidth: 0 }}>
          Model
          <input
            list={`models-${provider.id}`}
            value={choice.model}
            disabled={busy}
            placeholder={provider.defaultModel || 'the model name your service uses'}
            onChange={(e) => setChoice({ ...choice, model: e.target.value })}
            onBlur={(e) => run(() => rememberForProvider(provider.id, { model: e.target.value.trim() }))}
            spellCheck="false"
            style={field}
          />
          <datalist id={`models-${provider.id}`}>
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label || ''}
              </option>
            ))}
          </datalist>
        </label>
      </div>

      {provider.editableBaseUrl && (
        <label
          className="tiny muted"
          style={{ display: 'grid', gap: 4, marginTop: 10, minWidth: 0 }}
        >
          Address
          <input
            value={choice.baseUrl}
            disabled={busy}
            placeholder="https://…/v1"
            onChange={(e) => setChoice({ ...choice, baseUrl: e.target.value })}
            onBlur={(e) => run(() => rememberForProvider(provider.id, { baseUrl: e.target.value.trim() }))}
            spellCheck="false"
            style={field}
          />
          <span className="faint">
            Anything that speaks the OpenAI chat interface — Groq, Mistral, DeepSeek, Together, or a
            server on your own machine. Give the address ending in <code>/v1</code>. A local server
            has to be configured to accept requests from this page before a browser may reach it.
          </span>
        </label>
      )}

      {state === 'absent' ? (
        <>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            Optional. Without a key, {what} still works — LibrAPP prepares everything for you to
            paste into an AI session yourself. With one, it can do it here.
            {provider.keysAt && (
              <>
                {' '}
                <a href={provider.keysAt} target="_blank" rel="noreferrer">
                  Where to get a key
                </a>
                .
              </>
            )}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder={provider.keyHint}
              autoComplete="off"
              spellCheck="false"
              aria-label={`API key for ${provider.label}`}
              style={{ ...field, flex: '1 1 260px' }}
            />
            <button className="btn primary" onClick={save} disabled={busy}>
              Save key
            </button>
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            Kept in this browser's storage on this device, sent only to {where}, and never written
            into your catalog or an export. Anything running on this page could read it, so use a key
            scoped to its own project or workspace, with a spend limit.
          </p>
        </>
      ) : (
        <>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            <code>{choice.masked}</code>{' '}
            {state === 'active'
              ? `— LibrAPP may send requests to ${where} to read spines and answer questions.`
              : '— stored, but LibrAPP will not use it. The copy-and-paste route still works.'}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button
              className="btn"
              disabled={busy}
              onClick={() => run(() => setActive(provider.id, state !== 'active'))}
            >
              {state === 'active' ? 'Switch off' : 'Switch on'}
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => run(() => deleteKey(provider.id))}
              style={{ borderColor: 'color-mix(in srgb, var(--bad) 50%, transparent)', color: 'var(--bad)' }}
            >
              Delete
            </button>
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            Switching off keeps the key for later without letting the app spend anything. Deleting
            removes it from this device. Each service keeps its own key, so switching between them
            costs nothing.
          </p>
        </>
      )}
    </div>
  )
}
