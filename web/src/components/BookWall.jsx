import { byline } from '../lib.js'
import { spineHeight, spineTint, spineWidth } from '../lib.js'
import { useT } from '../i18n/index.jsx'

/**
 * A set of books the desk has singled out, drawn as a shelf.
 *
 * The same spines the catalog draws, so a pile the desk has picked out looks
 * like the shelf it came off rather than like a report about it.
 *
 * Above each spine goes the one fact that section exists for: how long a book
 * has waited, who has it, that it was starred. A spine has no room for it and
 * the reader is here to see exactly that.
 *
 * The slot takes its width from the label rather than from the spine, because a
 * spine is 34 to 52 pixels and a name above it is wider, and fixing the slot to
 * the spine sets neighbouring labels overlapping.
 */
export default function BookWall({ books, authors, caption, onPick, label }) {
  const { t } = useT()

  return (
    <div className="spine-view">
      {/* A group rather than a list, for the same reason the catalog wall is
          one: role="listitem" on a button replaces the button role. */}
      <div className="spine-wall short" role="group" aria-label={label}>
        {books.map((book) => {
          const name = byline(book, authors)
          const above = caption(book)
          const whole = [book.title, name, above].filter(Boolean).join(' · ')
          return (
            <div className="spine-slot labelled" key={book.id}>
              <span className="waited-cell tabular">{above}</span>
              <button
                className="spine"
                title={whole}
                aria-label={whole}
                onClick={() => onPick(book)}
                style={{
                  width: spineWidth(book),
                  height: spineHeight(book),
                  background: `var(--spine-${spineTint(book)})`,
                  color: `var(--spine-${spineTint(book)}-ink)`,
                }}
              >
                <span className="spine-title">{book.title}</span>
              </button>
            </div>
          )
        })}
      </div>
      <div className="shelf-board" />
      {!books.length && <p className="muted tiny">{t('desk.nothingHere')}</p>}
    </div>
  )
}
