// The service worker: what makes LibrAPP an app rather than a page.
//
// Two jobs. It lets the browser offer to install LibrAPP, which is how it gets
// a window and an icon on Windows, Linux and Android. And it keeps the app
// itself available with no network, which for a catalog that lives on the
// device is not a nicety — a book list you cannot open on the underground is
// not a book list.
//
// Your library is never cached here. It is not fetched over the network in the
// first place: it lives in a folder you chose or in the origin's private file
// system, and neither passes through this file.
//
// Assets are hashed at build time, so their names are not known when this is
// written and there is no precache manifest. Instead the shell is cached on
// install and everything else is cached the first time it is used. The cost is
// that the very first visit must be online; after that nothing needs to be.

const CACHE = 'librapp-v1'

// Enough to boot the interface. The hashed script and stylesheet arrive on the
// first load and are cached then.
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // One missing entry should not fail the whole install, so they are added
      // individually and failures ignored.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // A navigation is how a new version arrives, so try the network first and
  // fall back to the cached shell. Anything else is content-hashed and can be
  // served from the cache without checking.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
