// Which build this is, and how to get a newer one.
//
// A service worker is what lets LibrAPP open with no network. The cost is that
// the running copy can be older than the published one. It usually replaces
// itself on the next visit, and when it does not, there has to be a way to
// force it that does not involve explaining browser caches.

/** Stamped in at build time by vite.config.js. */
export const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'
export const COMMIT = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : 'unknown'
export const BUILT = typeof __APP_BUILT__ === 'string' ? __APP_BUILT__ : null

/** `1.0.0 · a8aa66d`, or just the version where the commit is not known. */
export const buildLabel = () => (COMMIT === 'unknown' ? VERSION : `${VERSION} · ${COMMIT}`)

/**
 * Throw away the cached copy of the app and load a fresh one.
 *
 * Only the app is discarded. The library is not cached here and never was. It
 * lives in a chosen folder or in the origin's private file system, neither of
 * which this touches.
 */
export async function reloadFresh() {
  try {
    const registrations = (await navigator.serviceWorker?.getRegistrations?.()) || []
    await Promise.all(registrations.map((r) => r.unregister()))
  } catch {
    // Nothing registered, or the browser will not say. Either way, carry on.
  }
  try {
    const keys = (await caches?.keys?.()) || []
    await Promise.all(keys.map((key) => caches.delete(key)))
  } catch {
    // No cache storage here; the reload below is then the whole of the fix.
  }
  // A query string the browser has not seen defeats any cache still holding on.
  const url = new URL(window.location.href)
  url.searchParams.set('fresh', Date.now().toString(36))
  window.location.replace(url.toString())
}
