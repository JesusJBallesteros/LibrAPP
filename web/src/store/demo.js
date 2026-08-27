import bundle from '../../../data/sample/demo.bundle.json'
import { Library } from './library.js'
import { setOverride } from '../core/overrides.js'

/**
 * A library to look around before committing an evening to building one.
 *
 * Everything the app can show needs a catalog, and every way of getting one
 * asks for something the visitor has to go and fetch: a photograph, a
 * spreadsheet, a store export. So the parts worth seeing, the shelf, the unread
 * pile with its reasoning, the chart, the keyword cloud, were all behind the
 * work rather than in front of it.
 *
 * The shelf here is invented. It is a plausible one rather than a tidy one:
 * books nobody recorded a read state for, a couple with no genre, two lent out
 * and one borrowed, and a pile bought years ago and never opened, because a
 * demo whose every panel is full and neat demonstrates something the app does
 * not actually do.
 */

/**
 * Files in a Map, with the same surface the real backends have.
 *
 * This is what keeps the demo safe: it is not a mode the rest of the app has to
 * know about and remember to check before writing. There is nowhere for a write
 * to land. Anything done while looking around, an edit, an import, a
 * correction, works exactly as it does for real, and is gone on reload.
 */
export function memoryBackend() {
  const files = new Map()
  return {
    kind: 'demo',
    async list(dir) {
      const prefix = `${dir}/`
      return [...files.keys()]
        .filter((path) => path.startsWith(prefix))
        .map((path) => path.slice(prefix.length))
        .sort()
    },
    async readText(path) {
      return files.get(path) ?? null
    },
    async writeText(path, text) {
      files.set(path, text)
    },
    async readBlob() {
      return null
    },
    async writeBlob() {},
    async remove(path) {
      files.delete(path)
    },
  }
}

// Books the imagined reader marked, and what they wrote against them. Kept
// here rather than in the bundle because a favourite is marked by the reader
// and never by a source, so putting one in a source file would be showing off a
// route the app does not actually have. These go through the correction layer,
// which is where anybody's own would go.
const MARKED = {
  'The Dispossessed': 'The one I keep lending and never getting back.',
  Exhalation: "Read 'The Merchant and the Alchemist's Gate' first.",
  'The Order of Time': null,
  Piranesi: 'Marta has not stopped talking about it since I lent it to her.',
  'Norwegian Wood': 'Bought in Kyoto, read on the train back.',
  'Pedro Páramo': 'Shorter than it has any right to be.',
}

/** The demo, built and ready to browse. */
export async function openDemo() {
  const library = new Library(memoryBackend())
  await library.importBundle(bundle, { replace: true })
  const catalog = await library.rebuild()

  // Matched on title after the build rather than by a written-down id, because
  // ids are handed out by the builder and a list of them here would rot the
  // first time a demo book changed.
  let overrides = await library.readOverrides()
  for (const book of catalog.books) {
    if (!(book.title in MARKED)) continue
    const note = MARKED[book.title]
    overrides = setOverride(
      overrides,
      book,
      note ? { favourite: true, notes: note } : { favourite: true },
      'demo',
    )
  }
  await library.writeOverrides(overrides)
  await library.rebuild()
  return library
}

/** How many books are in it, for the button that offers it. */
export const demoSize = () =>
  (bundle.sources || []).reduce((n, s) => n + (s.payload?.records?.length || 0), 0)
