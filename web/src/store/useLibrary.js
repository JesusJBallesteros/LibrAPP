import { useCallback, useEffect, useRef, useState } from 'react'
import { Library } from './library.js'
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

  const load = useCallback(async (lib) => {
    setCatalog(await lib.readCatalog())
    setSources(await lib.readSources())
  }, [])

  const adopt = useCallback(async (lib) => {
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
    setLibrary(null)
    setCatalog(null)
    setSources([])
    setStatus('choose')
  }, [])

  const run = useCallback(
    async (fn) => {
      setBusy(true)
      setError(null)
      try {
        const result = await fn(library)
        await load(library)
        return result
      } catch (err) {
        setError(err.message)
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
    canPickFolder: canPickFolder(),
    useFolder, useBrowserStorage, grantPermission, forget,
    rebuild, run, refresh: () => library && load(library),
    setError,
  }
}
