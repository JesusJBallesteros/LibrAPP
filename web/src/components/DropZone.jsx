import { useRef, useState } from 'react'

/**
 * A click-or-drag target for one file.
 *
 * `mark` names a shape drawn in CSS rather than an emoji, so the target looks
 * the same on every platform and takes its colour from the theme.
 *
 * `preview` is a picture of the file already chosen, shown in place of the mark
 * rather than beside it or further down the page. The target keeps working, so
 * the picture is also the way to choose a different one, and the title says so.
 */
export default function DropZone({ accept, mark, title, hint, disabled, preview, onFile }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)

  const take = (file) => {
    if (file && !disabled) onFile(file)
  }

  return (
    <div
      className={`drop${over ? ' over' : ''}${preview ? ' showing' : ''}`}
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
      {preview ? (
        // Decoration: the title below already says which photograph this is and
        // what happens on a click, and an alt repeating it would say it twice.
        <img className="drop-preview" src={preview.url} alt="" />
      ) : (
        <span className={`mark ${mark}`} aria-hidden="true" />
      )}
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
