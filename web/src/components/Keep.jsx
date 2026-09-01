import { useCallback, useState } from 'react'
import { useT } from '../i18n/index.jsx'

/**
 * Which rows of an import are being kept, and the control that says so.
 *
 * Every way in produces a list to check before anything is written, and until
 * now that list was all or nothing: a photograph that read a DVD case as a
 * book, a spreadsheet with a header row that parsed as a title, one wrong
 * barcode among twenty right ones, and the only answer was to throw the whole
 * batch away and start again. Discarding the one row is the answer.
 *
 * Kept is the default and discarding is the deliberate act, because the list is
 * the result of work the person already did and most of it is right. Nothing is
 * hidden when it is discarded: the row stays where it was, struck through, so
 * the list does not reflow under the finger that pressed it and a discard can
 * be taken back.
 *
 * Keys are supplied by the caller because the three lists have nothing in
 * common. A barcode has its ISBN, a shelf book has its position in the
 * transcription, a spreadsheet row has its row number.
 */
export function useKeepSet() {
  const [dropped, setDropped] = useState(() => new Set())

  const toggle = useCallback((key) => {
    setDropped((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Several at once, for a whole group a page has offered to set aside. Adds
  // rather than replaces: a row already discarded by hand stays discarded.
  const dropAll = useCallback((keys) => {
    setDropped((current) => new Set([...current, ...keys]))
  }, [])

  // Called whenever the list underneath changes. Keys mean something different
  // in a new list, so carrying the old set over would discard the wrong rows.
  const reset = useCallback(() => setDropped(new Set()), [])

  return { dropped, toggle, dropAll, reset }
}

/** The control on one row. Says what pressing it will do, not what the row is. */
export function KeepToggle({ dropped, onToggle, disabled }) {
  const { t } = useT()
  return (
    <button
      className="btn small"
      disabled={disabled}
      onClick={(e) => {
        // The rows of these lists are not buttons today, but the shelf review
        // sits inside a panel that grows controls over time.
        e.stopPropagation()
        onToggle()
      }}
    >
      {dropped ? t('keep.restore') : t('keep.discard')}
    </button>
  )
}

/**
 * What the discards add up to, above the button that acts on them.
 *
 * Silent when nothing is discarded: a line reporting zero on every import would
 * be noise on the common case, and the per-row control is already visible.
 */
export function KeepSummary({ kept, total }) {
  const { t } = useT()
  if (kept === total) return null
  return (
    <p className="tiny" style={{ marginTop: 10 }}>
      {kept === 0 ? t('keep.noneLeft') : t('keep.someDropped', { n: total - kept, kept })}
    </p>
  )
}
