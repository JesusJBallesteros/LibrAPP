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

/**
 * A heading with its i beside it, and the paragraphs the i opens below.
 *
 * The class goes on the row, so a section heading keeps its rule and a panel
 * heading keeps its size. `aside` is anything that sits at the far end of the
 * row, such as a count.
 */
export function InfoHeading({ as: Tag = 'h3', className = '', title, label, aside, children }) {
  const disclosure = useDisclosure()
  return (
    <>
      <div className={`${className} info-heading`}>
        <Tag>{title}</Tag>
        <InfoMark disclosure={disclosure} label={label} small />
        {aside && <span className="info-heading-aside">{aside}</span>}
      </div>
      <InfoBlock disclosure={disclosure}>{children}</InfoBlock>
    </>
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
