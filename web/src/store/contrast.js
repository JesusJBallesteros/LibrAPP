// Whether the reader asked for more contrast, if they asked at all.
//
// A second axis, independent of light and dark. Somebody who needs stronger
// contrast may want it on either, so this is not a third theme: it raises the
// quiet colours of whichever theme is in force. Three states, like the theme:
// 'high', 'normal', or absent, and absent means the operating system decides
// through prefers-contrast.
//
// localStorage rather than IndexedDB, for the same two reasons the theme uses
// it: the language preference already lives there, and only a synchronous store
// can be read before the first paint. A page that painted at one contrast and
// switched to another a moment later would be worst for exactly the people this
// is for.

const KEY = 'librapp-contrast'
export const LEVELS = ['high', 'normal']

/** 'high', 'normal', or null when the system decides. */
export function readContrast() {
  try {
    const stored = localStorage.getItem(KEY)
    return LEVELS.includes(stored) ? stored : null
  } catch {
    return null
  }
}

export function saveContrast(level) {
  if (!LEVELS.includes(level)) return followSystemContrast()
  try {
    localStorage.setItem(KEY, level)
  } catch {
    // A browser refusing storage still gets the choice for this session.
  }
  applyContrast(level)
}

export function followSystemContrast() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
  applyContrast(null)
}

/** What the system asks for, used to show which button is live. */
export const systemContrast = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-contrast: more)').matches
    ? 'high'
    : 'normal'

/**
 * Put the choice on the document, or take it off.
 *
 * Removing the attribute hands control back to the media query. Writing the
 * system's own answer instead would look identical today and would stop
 * tracking a system that changes tomorrow.
 */
export function applyContrast(level) {
  const root = document.documentElement
  if (LEVELS.includes(level)) root.setAttribute('data-contrast', level)
  else root.removeAttribute('data-contrast')
}

/** The level in force right now, whether chosen or inherited. */
export const effectiveContrast = (stored) => stored ?? systemContrast()
