import { useEffect, useId, useRef } from 'react'

/**
 * The panel that slides in over the catalog, as a dialog rather than a div.
 *
 * Both the book detail and the editor used to be a backdrop with a click
 * handler and an Escape listener, which is enough for a mouse and nothing else.
 * Opening one from the keyboard left focus on the row behind it: nothing was
 * announced, and tabbing walked through the whole catalog before arriving at
 * the panel that had opened. On a catalog of a few hundred books that is
 * several hundred stops.
 *
 * So this does the four things a dialog owes its reader. It says what it is,
 * with a name taken from whatever heading the panel already shows. It takes
 * focus when it opens. It keeps focus inside while it is open, since anything
 * behind it is inert and tabbing there is a journey with no way back. And it
 * gives focus to whatever had it before, so closing returns to the row that was
 * opened rather than to the top of the page.
 *
 * `aria-modal` tells a screen reader to ignore the rest of the page. It is a
 * claim rather than a mechanism, which is why the trap below is real code and
 * not a promise.
 */
/**
 * Which panels are open, innermost last.
 *
 * The editor opens over the detail panel, so both are mounted at once and both
 * listen for Escape. Without a stack the first one registered answers, which is
 * the one underneath: pressing Escape in the editor closed the panel behind it
 * and left the editor sitting on nothing. Only the innermost panel acts, and
 * the same rule keeps the two focus traps from fighting each other.
 */
const stack = []

export default function Overlay({ onClose, label, labelledBy, busy = false, children }) {
  const panel = useRef(null)
  const cameFrom = useRef(null)
  const fallbackId = useId()

  useEffect(() => {
    const mine = {}
    stack.push(mine)
    cameFrom.current = document.activeElement

    // The panel itself takes focus rather than its first control: a reader
    // arriving at the top hears the name and the heading before the buttons,
    // which is the order the panel is written in.
    panel.current?.focus()

    const onKey = (event) => {
      if (stack[stack.length - 1] !== mine) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const stops = [...(panel.current?.querySelectorAll(
        'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || [])].filter((el) => el.offsetParent !== null)
      if (!stops.length) {
        // Nothing to move between, so the panel keeps focus rather than
        // handing it to the page behind.
        event.preventDefault()
        panel.current?.focus()
        return
      }

      const first = stops[0]
      const last = stops[stops.length - 1]
      const on = document.activeElement
      // Wrapping at both ends, and from the panel itself, which is focusable
      // but is not one of the stops.
      if (event.shiftKey && (on === first || on === panel.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && on === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      const at = stack.indexOf(mine)
      if (at >= 0) stack.splice(at, 1)
      // Only when focus has nowhere to be. Something that closed the panel by
      // moving focus somewhere on purpose has the better claim.
      const loose = !document.activeElement || document.activeElement === document.body
      if (!loose) return

      const returning = cameFrom.current
      if (returning?.isConnected) {
        returning.focus()
        return
      }

      // What opened this is gone, which happens when a panel replaces another:
      // the editor opens from a button on the detail panel, and that button
      // goes with it. Falling back to the content region keeps a keyboard on
      // the page it was working in, rather than starting again from the top of
      // the document.
      const main = document.querySelector('main')
      if (main) {
        main.setAttribute('tabindex', '-1')
        main.focus()
        // Taken off again so it never becomes a tab stop of its own.
        main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true })
      }
    }
  }, [onClose])

  return (
    <div className="detail-backdrop" onClick={busy ? undefined : onClose}>
      <aside
        ref={panel}
        className="detail"
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy || undefined}
        tabIndex={-1}
        id={fallbackId}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  )
}
