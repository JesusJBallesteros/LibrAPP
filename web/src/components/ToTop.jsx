import { useEffect, useState } from 'react'
import { useT } from '../i18n/index.jsx'

/**
 * The way back to the top of a long page.
 *
 * The catalog runs to a thousand spines, the shelf photograph to five steps and
 * the desk to two rings and a question panel. On a phone any of them is a great
 * deal of thumb, and the only way back was the same distance in reverse.
 *
 * Shown by how long the page is rather than by how far down it somebody has
 * got: a page worth three screens or more carries it, and it stays put. A
 * control that appears partway through a scroll is a control nobody knows is
 * there until they have already done without it.
 *
 * Opposite the owl, and quieter than it. The owl speaks and this only goes
 * somewhere, so it is smaller, half there until it is pointed at, and out of
 * the way of the sidebar on a screen wide enough to have one.
 */
export default function ToTop() {
  const { t } = useT()
  const [tall, setTall] = useState(false)

  useEffect(() => {
    // Measured on the document rather than watched on the scroll, because what
    // decides this is the length of the page and that changes when a filter
    // narrows a list or a step opens, not when somebody scrolls.
    const measure = () => {
      const page = document.documentElement.scrollHeight
      setTall(page >= window.innerHeight * 3)
    }
    measure()
    window.addEventListener('resize', measure)
    // Every layout change: a list filtered, a panel opened, an import landing.
    const watch = new ResizeObserver(measure)
    watch.observe(document.documentElement)
    return () => {
      window.removeEventListener('resize', measure)
      watch.disconnect()
    }
  }, [])

  if (!tall) return null

  return (
    <button
      className="to-top"
      title={t('common.toTop')}
      aria-label={t('common.toTop')}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'auto' })
        // And take the keyboard with it. Scrolling the page leaves focus where
        // it was, so the next Tab would jump back down to whatever was under
        // the finger a second ago.
        document.getElementById('content')?.focus?.()
      }}
    >
      {/* A wide chevron rather than an arrow: an arrow reads as a direction to
          travel and this is a place to return to. Drawn rather than typed, so
          it is the same shape on every platform. */}
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M4 15.5 L12 8.5 L20 15.5" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
