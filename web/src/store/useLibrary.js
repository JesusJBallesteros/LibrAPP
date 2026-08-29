import { useCallback, useEffect, useRef, useState } from 'react'
import { Library } from './library.js'
import { openDemo } from './demo.js'
import { browserStorage, canPickFolder, chooseFolder, forgetFolder, recallKind, reopenFolder, requestPersistence } from './fs.js'

/**
 * Opens the library and keeps the catalog in step with it.
 *
 * `status` is what the interface actually needs to decide what to show:
 *
 *   opening   still looking for a library
 *   choose    none opened yet, and the person has to say where it lives
 *   permit    a folder was chosen before, but the browser wants a click again
 *   ready     open
 */
export function useLibrary() {
  const [status, setStatus] = useState('opening')
  const [library, setLibrary] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [sources, setSources] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const regrant = useRef(null)

  // Which library the interface is currently showing. Held as a ref as well as
  // as state, because a read that started before the library changed has to be
  // able to tell that it is now answering about the wrong one.
  const showing = useRef(null)

  const load = useCallback(async (lib) => {
    const catalog = await lib.readCatalog()
    const sources = await lib.readSources()
    // Another library was adopted while this one was being read, so this answer
    // is stale and dropping it is the whole point. Reading a folder is slow and
    // reading memory is not, which is how the demo came to be opened over a
    // real catalog and then have that catalog land back on top of it: the
    // banner said demo while the books on screen were the reader's own.
    if (showing.current !== lib) return
    setCatalog(catalog)
    setSources(sources)
  }, [])

  const adopt = useCallback(async (lib) => {
    showing.current = lib
    setLibrary(lib)
    setStatus('ready')
    await load(lib)
  }, [load])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const kind = await recallKind()
        if (kind === 'browser') {
          const backend = await browserStorage()
          if (!cancelled) await adopt(new Library(backend))
          return
        }
        const reopened = await reopenFolder()
        if (cancelled) return
        if (reopened?.needsPermission) {
          regrant.current = reopened.grant
          setStatus('permit')
          return
        }
        if (reopened) return adopt(new Library(reopened))
        setStatus('choose')
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setStatus('choose')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [adopt])

  const useFolder = useCallback(async () => {
    setError(null)
    try {
      await adopt(new Library(await chooseFolder()))
    } catch (err) {
      // Dismissing the picker is a decision, not a failure.
      if (err?.name !== 'AbortError') setError(err.message)
    }
  }, [adopt])

  /**
   * Look around an invented library instead of building one.
   *
   * Held in memory, so nothing here can reach a folder or the browser's
   * storage, and nothing that was already there is touched. Leaving is a
   * reload: there is no state to unwind.
   */
  const useDemo = useCallback(async () => {
    setError(null)
    try {
      await adopt(await openDemo())
    } catch (err) {
      setError(err.message)
    }
  }, [adopt])

  const useBrowserStorage = useCallback(async () => {
    setError(null)
    try {
      await requestPersistence()
      await adopt(new Library(await browserStorage()))
    } catch (err) {
      setError(err.message)
    }
  }, [adopt])

  const grantPermission = useCallback(async () => {
    const backend = await regrant.current?.()
    if (backend) await adopt(new Library(backend))
    else setStatus('choose')
  }, [adopt])

  const forget = useCallback(async () => {
    await forgetFolder()
    showing.current = null
    setLibrary(null)
    setCatalog(null)
    setSources([])
    setStatus('choose')
  }, [])

  /**
   * Do something to the library, and reload what the app is showing.
   *
   * Failures go to the banner at the top of the page unless the caller passes
   * onError, in which case they go there instead. The banner is a long way from
   * whatever was pressed: on a phone, keeping a page of scanned books puts the
   * button near the bottom and the failure off the top of the screen, so the
   * press looked like it did nothing. A caller with somewhere to put the
   * message should say so and put it next to the control.
   */
  const run = useCallback(
    async (fn, { onError } = {}) => {
      setBusy(true)
      setError(null)
      onError?.(null)
      try {
        const result = await fn(library)
        await load(library)
        return result
      } catch (err) {
        // One place or the other, never both: two copies of the same failure on
        // one page reads as two failures.
        if (onError) onError(err.message)
        else setError(err.message)
        return null
      } finally {
        setBusy(false)
      }
    },
    [library, load],
  )

  const rebuild = useCallback(() => run((lib) => lib.rebuild()), [run])

  return {
    status, library, catalog, sources, error, busy,
    isDemo: library?.kind === 'demo',
    canPickFolder: canPickFolder(),
    useFolder, useBrowserStorage, useDemo, grantPermission, forget,
    rebuild, run, refresh: () => library && load(library),
    setError,
  }
}
