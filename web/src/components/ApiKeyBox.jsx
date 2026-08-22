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
import { useT } from '../i18n/index.jsx'

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
export default function ApiKeyBox({ what, onChange }) {
  const { t } = useT()
  const [choice, setChoice] = useState(null)
  const [stocked, setStocked] = useState([])
  const [draft, setDraft] = useState('')
  // Set once a key of an unfamiliar shape has been offered and warned about.
  // The second press saves it: the shape check must not be the last word.
  const [unfamiliar, setUnfamiliar] = useState(false)
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
      if (!key) throw new Error(t('key.pasteFirst'))
      if (!looksLikeKey(provider.id, key) && !unfamiliar) {
        setUnfamiliar(true)
        throw new Error(t('key.wrongShape', { service: provider.label, hint: provider.keyHint }))
      }
      await saveKey(provider.id, key)
      setDraft('')
      setUnfamiliar(false)
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
        <h3 style={{ margin: 0 }}>{t('key.title')}</h3>
        <span className={`pill ${state === 'active' ? 'read' : state === 'off' ? 'unread' : 'unknown'}`}>
          {state === 'active'
            ? t('key.inUse')
            : state === 'off'
              ? t('key.switchedOff')
              : t('key.absent')}
        </span>
      </div>

      {error && (
        <div className="notice bad" style={{ marginTop: 10 }}>
          <p className="tiny">{error}</p>
        </div>
      )}

      <div className="row" style={{ marginTop: 10, alignItems: 'flex-end' }}>
        <label className="tiny muted" style={{ display: 'grid', gap: 4, flex: '1 1 240px', minWidth: 0 }}>
          {t('key.service')}
          <select
            value={provider.id}
            disabled={busy}
            onChange={(e) => {
              setUnfamiliar(false)
              run(() => chooseProvider(e.target.value))
            }}
            style={{ ...field, fontFamily: 'inherit' }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {stocked.includes(p.id) ? ` · ${t('key.stored')}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="tiny muted" style={{ display: 'grid', gap: 4, flex: '1 1 200px', minWidth: 0 }}>
          {t('key.model')}
          <input
            list={`models-${provider.id}`}
            value={choice.model}
            disabled={busy}
            placeholder={provider.defaultModel || t('key.modelPlaceholder')}
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
          {t('key.address')}
          <input
            value={choice.baseUrl}
            disabled={busy}
            placeholder="https://…/v1"
            onChange={(e) => setChoice({ ...choice, baseUrl: e.target.value })}
            onBlur={(e) => run(() => rememberForProvider(provider.id, { baseUrl: e.target.value.trim() }))}
            spellCheck="false"
            style={field}
          />
          <span className="faint">{t('key.addressNote')}</span>
        </label>
      )}

      {state === 'absent' ? (
        <>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            {t('key.optional', { what: what || t('key.thisFeature') })}
            {provider.keysAt && (
              <>
                {' '}
                <a href={provider.keysAt} target="_blank" rel="noreferrer">
                  {t('key.whereToGet')}
                </a>
                .
              </>
            )}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <input
              type="password"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setUnfamiliar(false)
              }}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder={provider.keyHint}
              autoComplete="off"
              spellCheck="false"
              aria-label={t('key.fieldLabel', { service: provider.label })}
              style={{ ...field, flex: '1 1 260px' }}
            />
            <button className="btn primary" onClick={save} disabled={busy}>
              {unfamiliar ? t('key.saveAnyway') : t('key.save')}
            </button>
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            {t('key.privacy', { where })}
          </p>
        </>
      ) : (
        <>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            <code>{choice.masked}</code>{' '}
            {state === 'active' ? t('key.activeNote', { where }) : t('key.offNote')}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button
              className="btn"
              disabled={busy}
              onClick={() => run(() => setActive(provider.id, state !== 'active'))}
            >
              {state === 'active' ? t('key.switchOff') : t('key.switchOn')}
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => run(() => deleteKey(provider.id))}
              style={{ borderColor: 'color-mix(in srgb, var(--bad) 50%, transparent)', color: 'var(--bad)' }}
            >
              {t('key.delete')}
            </button>
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            {t('key.storedNote')}
          </p>
        </>
      )}
    </div>
  )
}
