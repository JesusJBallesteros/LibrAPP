// Translation.
//
// The browser's own translate feature is not used here, for three reasons:
//
//   1. An installed app has no browser chrome, so there is no menu to translate
//      from. The people most likely to want another language are exactly the
//      ones who installed it.
//   2. Page translators rewrite the DOM underneath React, which then tries to
//      remove nodes that are no longer where it left them. It crashes.
//   3. It would translate the books too. Titles, authors and genres are data
//      rather than interface, and "La Odisea" must not become "The Odyssey" in
//      someone's catalog.
//
// The interface therefore carries its own strings. Book data is never passed
// through here.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './en.js'
import es from './es.js'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

const DICTIONARIES = { en, es }
const STORAGE_KEY = 'librapp-language'

/** The language to start in: what was chosen before, else what the browser asks for. */
export function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && DICTIONARIES[saved]) return saved
  } catch {
    /* storage can be denied; fall through to the browser's preference */
  }
  for (const tag of navigator.languages || [navigator.language || 'en']) {
    const code = String(tag).slice(0, 2).toLowerCase()
    if (DICTIONARIES[code]) return code
  }
  return 'en'
}

/**
 * Look up one string.
 *
 * A missing translation falls back to English rather than showing a blank or a
 * key, so a half-translated language is merely mixed, never broken. `{name}`
 * placeholders are filled from `vars`.
 */
export function translate(language, key, vars) {
  const value = DICTIONARIES[language]?.[key] ?? DICTIONARIES.en[key] ?? key
  if (!vars) return value
  return String(value).replace(/\{(\w+)\}/g, (whole, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  )
}

const LanguageContext = createContext({ language: 'en', setLanguage: () => {}, t: (k) => k })

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectLanguage)

  const setLanguage = useCallback((code) => {
    if (!DICTIONARIES[code]) return
    setLanguageState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      /* a refused write only means the choice will not survive a reload */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({ language, setLanguage, t: (key, vars) => translate(language, key, vars) }),
    [language, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useT = () => useContext(LanguageContext)

/** Every key English defines, for checking a translation's coverage. */
export const keysOf = (code) => Object.keys(DICTIONARIES[code] || {})
export const dictionaries = DICTIONARIES
