import { useId, useState } from 'react'

/**
 * The encircled i, and the paragraph it opens in place.
 *
 * Closed until pressed, at every width. It holds text somebody asks to see,
 * placed beside the thing it is about, and never a tooltip or a dialog.
 */
export function useDisclosure() {
  const [open, setOpen] = useState(false)
  const id = useId()
  return { open, id, toggle: () => setOpen((was) => !was) }
}

export function InfoMark({ disclosure, label, small = false }) {
  return (
    <button
      type="button"
      className={`info-mark${small ? ' small' : ''}`}
      aria-expanded={disclosure.open}
      aria-controls={disclosure.open ? disclosure.id : undefined}
      title={label}
      aria-label={label}
      onClick={disclosure.toggle}
    >
      <span aria-hidden="true">i</span>
    </button>
  )
}

export function InfoBlock({ disclosure, children }) {
  if (!disclosure.open) return null
  return (
    <div id={disclosure.id} className="info-block">
      {children}
    </div>
  )
}
