import { useEffect, useState } from 'react'

// Joins the wanted paths into one string, which is what the effect depends on.
// A path is written by the app as spines/<source>/<n>.jpg and cannot contain
// this, so splitting the string back apart cannot cut a path in half.
const SEPARATOR = '|'

/**
 * Object URLs for the spine crops of the books on screen.
 *
 * Read through the library rather than through `run`, which marks the app busy
 * and disables the controls: drawing a wall is not an edit, and a wall that
 * greyed out the sort while it loaded would be worse than one with no pictures.
 *
 * Keyed by path rather than by book, so two books sharing a crop, which happens
 * when a read places them on the same spine, hold one copy between them.
 *
 * Every URL made here is revoked when the set changes or the view goes away.
 * Without that, walking the catalog would hold on to a copy of every crop it
 * had ever drawn until the tab was closed.
 */
export function useSpines(books, library) {
  const [urls, setUrls] = useState(() => new Map())

  // A stable identity for the set of crops wanted, so scrolling or re-sorting
  // does not reload pictures that are already in hand.
  const wanted = [...new Set((books || []).map((book) => book.spine).filter(Boolean))]
    .sort()
    .join(SEPARATOR)

  useEffect(() => {
    const paths = wanted ? wanted.split(SEPARATOR) : []
    if (!library || !paths.length) {
      setUrls(new Map())
      return undefined
    }

    let live = true
    const made = new Map()
    ;(async () => {
      for (const path of paths) {
        const blob = await library.readSpine(path).catch(() => null)
        if (!live) return
        // A crop that is not there is not an error. A folder can be edited
        // from outside the app, and a missing picture means the book is drawn.
        if (blob) made.set(path, URL.createObjectURL(blob))
      }
      if (live) setUrls(made)
    })()

    return () => {
      live = false
      for (const url of made.values()) URL.revokeObjectURL(url)
    }
  }, [wanted, library])

  return urls
}
