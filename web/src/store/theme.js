// Which theme the person chose, if they chose one.
//
// Three states, not two. "Follow the system" is a real answer and the default
// one, so the stored value is either 'light', 'dark', or absent. Absent leaves
// the data-theme attribute off the document and the media query in styles.css
// decides.
//
// localStorage rather than IndexedDB, for two reasons. It is where the language
// preference already lives, and it is the only store that can be read before
// the first paint. index.html stamps the attribute from here in a small inline
// script, which is what stops the page painting in one theme and switching to
// the other a moment later. IndexedDB keeps the things that are not needed
// before paint: the pointer to the library, and the API keys.

const KEY = 'librapp-theme'
export const THEMES = ['light', 'dark']

/** 'light', 'dark', or null when the system decides. */
export function readTheme() {
  try {
    const stored = localStorage.getItem(KEY)
    return THEMES.includes(stored) ? stored : null
  } catch {
    return null
  }
}

export function saveTheme(theme) {
  if (!THEMES.includes(theme)) return followSystem()
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // A browser refusing storage still gets the theme for this session.
  }
  applyTheme(theme)
}

export function followSystem() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
  applyTheme(null)
}

/** What the system asks for, used to show which button is live. */
export const systemTheme = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

/**
 * Put the choice on the document, or take it off.
 *
 * Removing the attribute hands control back to the media query. Writing the
 * system's own value instead would look identical today and would stop tracking
 * a system that changes tomorrow.
 */
export function applyTheme(theme) {
  const root = document.documentElement
  if (THEMES.includes(theme)) root.setAttribute('data-theme', theme)
  else root.removeAttribute('data-theme')
}

/** The theme in force right now, whether chosen or inherited. */
export const effectiveTheme = (stored) => stored ?? systemTheme()
