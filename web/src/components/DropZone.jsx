import { useRef, useState } from 'react'

/**
 * A click-or-drag target for one file.
 *
 * `mark` names a shape drawn in CSS rather than an emoji, so the target looks
 * the same on every platform and takes its colour from the theme.
 */
export default function DropZone({ accept, mark, title, hint, disabled, onFile }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)

  const take = (file) => {
    if (file && !disabled) onFile(file)
  }

  return (
    <div
      className={`drop${over ? ' over' : ''}`}
      onClick={() => !disabled && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        take(e.dataTransfer.files?.[0])
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      aria-disabled={disabled}
      style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
    >
      <span className={`mark ${mark}`} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{hint}</span>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          take(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
