// What this browser can actually do.
//
// LibrAPP is a static site, so it runs in whatever browser it is opened in —
// Chrome, Edge, Brave, Opera, Vivaldi, Arc, Comet, Samsung Internet, Firefox,
// Safari, and things that do not exist yet. Rather than publish a table of
// browser names that is out of date the day it is written, the app checks what
// is in front of it and says so.
//
// Every check is a real feature test, not a look at the user agent: a browser
// that reports itself as Chrome may still have an API switched off by a
// privacy setting, and a browser nobody has heard of may support everything.

const test = (fn) => {
  try {
    return Boolean(fn())
  } catch {
    return false
  }
}

/**
 * One row per capability, in the order they matter.
 *
 * `required` marks the ones without which LibrAPP cannot work at all. The rest
 * each disable one feature and are reported as such, because a browser that
 * cannot save to a folder is not a broken browser — it is a browser that will
 * use its own storage instead.
 */
export function checkCapabilities() {
  const checks = [
    {
      id: 'secure',
      label: 'Secure page (HTTPS or localhost)',
      needed: 'everything below',
      required: true,
      ok: test(() => window.isSecureContext),
      fix: 'Open LibrAPP over https://, not http://.',
    },
    {
      id: 'indexeddb',
      label: 'IndexedDB',
      needed: 'remembering your settings and where your library is',
      required: true,
      ok: test(() => window.indexedDB),
      fix: 'Private or incognito windows sometimes disable this.',
    },
    {
      id: 'opfs',
      label: 'Private file storage',
      needed: 'keeping your library inside the browser',
      required: true,
      ok: test(() => navigator.storage && navigator.storage.getDirectory),
      fix: 'Without it LibrAPP has nowhere to keep a catalog.',
    },
    {
      id: 'regex',
      label: 'Modern regular expressions',
      needed: 'matching titles and author names',
      required: true,
      ok: test(() => new RegExp('(?<!a)b') && new RegExp('\\p{L}', 'u')),
      fix: 'Needs Safari 16.4 or later, or any current browser.',
    },
    {
      id: 'folder',
      label: 'Folder access',
      needed: 'saving your library to a folder you choose',
      required: false,
      ok: test(() => typeof window.showDirectoryPicker === 'function'),
      fix: 'Only Chrome and Edge on a desktop offer this. Everywhere else LibrAPP uses its own storage, which works the same but is not visible to other programs.',
    },
    {
      id: 'unzip',
      label: 'Decompression',
      needed: 'reading .xlsx spreadsheets',
      required: false,
      ok: test(() => new DecompressionStream('deflate-raw')),
      fix: 'CSV, XML and PDF imports still work. Needs Firefox 113 or Safari 16.4 and later.',
    },
    {
      id: 'canvas',
      label: 'Offscreen canvas',
      needed: 'cutting a photograph into readable tiles',
      required: false,
      ok: test(() => typeof OffscreenCanvas === 'function' && new OffscreenCanvas(1, 1).convertToBlob),
      fix: 'Without it, import your books from a list instead of a photograph.',
    },
    {
      id: 'bitmap',
      label: 'Image decoding',
      needed: 'opening the photograph you choose',
      required: false,
      ok: test(() => typeof createImageBitmap === 'function'),
      fix: 'Without it, import your books from a list instead of a photograph.',
    },
    {
      id: 'sw',
      label: 'Service workers',
      needed: 'installing LibrAPP and using it offline',
      required: false,
      ok: test(() => 'serviceWorker' in navigator),
      fix: 'LibrAPP still runs, but only while you have a connection.',
    },
  ]

  const missingRequired = checks.filter((c) => c.required && !c.ok)
  const missingOptional = checks.filter((c) => !c.required && !c.ok)

  return {
    checks,
    usable: missingRequired.length === 0,
    complete: missingRequired.length === 0 && missingOptional.length === 0,
    missingRequired,
    missingOptional,
  }
}

/**
 * Whether the library can survive the browser reclaiming space.
 *
 * Separate from the checks above because it is not a capability but a state,
 * and one that some privacy settings change without warning: a browser told to
 * clear site data on exit will take a library kept in its own storage with it.
 */
export async function checkPersistence() {
  if (!navigator?.storage?.persisted) return { supported: false, persisted: false }
  try {
    return { supported: true, persisted: await navigator.storage.persisted() }
  } catch {
    return { supported: false, persisted: false }
  }
}
