import { useState } from 'react'
import BookDetail from './BookDetail.jsx'
import BookEditor from './BookEditor.jsx'
import { clearOverride, setOverride, setRemoved } from '../core/overrides.js'

/**
 * One book, opened from wherever it was listed.
 *
 * The catalog had this wiring inline, and the desk needed the same thing to let
 * a book be opened from the unread pile, from the loans, or from the ones
 * marked. Two copies of the same forty lines would drift, and the half that
 * drifted would be the one writing corrections.
 *
 * Everything here closes the panel when it writes, because the catalog is
 * rebuilt afterwards and the book held here is then a stale copy of an entry
 * that has moved on.
 */
export default function BookPanel({ book, authors, lib, onClose }) {
  // false, or the field the editor should open at. The card can ask for one
  // thing to be recorded as well as offer to correct the whole book, and the
  // two open the same form at different places in it.
  const [editing, setEditing] = useState(false)

  if (!book) return null

  const write = (change) =>
    lib.run(async (library) => {
      await library.writeOverrides(change(await library.readOverrides()))
      await library.rebuild()
      setEditing(false)
      onClose()
    })

  if (editing) {
    return (
      <BookEditor
        book={book}
        authorNames={authors}
        busy={lib?.busy}
        focusField={typeof editing === 'string' ? editing : null}
        // Back to the book rather than out of it. Cancelling an edit is not a
        // reason to lose the entry that was being read.
        onCancel={() => setEditing(false)}
        onSave={(changes) => write((overrides) => setOverride(overrides, book, changes))}
      />
    )
  }

  return (
    <BookDetail
      book={book}
      authors={authors}
      busy={lib?.busy}
      onClose={onClose}
      onEdit={(_book, field) => setEditing(field || true)}
      onRemove={(b) => write((overrides) => setRemoved(overrides, b, true))}
      onRevert={(b) => write((overrides) => clearOverride(overrides, b.id))}
    />
  )
}
