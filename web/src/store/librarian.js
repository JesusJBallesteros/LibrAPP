// Whether the LibrAPPrian is wanted at all.
//
// Dismissing it is meant to be final, so the choice outlives the session.
// localStorage rather than IndexedDB, matching the theme: it is one small
// preference, and a synchronous read keeps the owl from appearing for a moment
// on every load before being told to go away.

const KEY = 'librapp-librarian'

/** True when the owl has been sent away for good. */
export function isDismissed() {
  try {
    return localStorage.getItem(KEY) === 'dismissed'
  } catch {
    return false
  }
}

export function dismiss() {
  try {
    localStorage.setItem(KEY, 'dismissed')
  } catch {
    // A browser refusing storage still gets the owl gone for this session.
  }
}

export function restore() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
