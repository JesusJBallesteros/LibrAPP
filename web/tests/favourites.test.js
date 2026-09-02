// The mark a reader puts on a book, and the words they write about it.
//
// Both are the reader's own, which is what separates them from everything else
// in a record. A title comes from a spine and an abstract comes from a model,
// but a favourite and a note come from nobody else, so they must survive a
// rebuild and must reach the librarian labelled as opinion rather than as
// catalog data.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EDITABLE, applyOverrides, emptyOverrides, setOverride } from '../src/core/overrides.js'
import { RECORD_FIELDS, makeSource, normalise, readSource } from '../src/core/records.js'
import { build } from '../src/core/build.js'
import { readerProfile } from '../src/core/profile.js'
import { hiddenActiveFilters, stillToRecord } from '../src/lib.js'
import { toForm } from '../src/components/BookEditor.jsx'

const names = new Map([['ursula', { id: 'ursula', display_name: 'Ursula K. Le Guin' }]])

const catalogOf = (books) => ({
  books: books.map((b) => ({ authors: [], tags: [], ...b })),
  authors: [{ id: 'ursula', display_name: 'Ursula K. Le Guin' }],
  counts: { read: 0, unread: 0, read_unknown: books.length },
})

describe('the field itself', () => {
  it('exists on every record, defaulting to not a favourite', () => {
    expect(RECORD_FIELDS).toHaveProperty('favourite')
    expect(normalise({ title: 'A' }).favourite).toBe(false)
  })

  it('defaults to false rather than null', () => {
    // Elsewhere null means unknown. Nothing but the reader can mark a
    // favourite, so an unmarked book is not one, and there is no source that
    // could ever say otherwise.
    expect(RECORD_FIELDS.favourite).toBe(false)
  })

  it('can be corrected, so a mark can be taken back', () => {
    expect(EDITABLE).toContain('favourite')
    expect(EDITABLE).toContain('notes')
  })

  it('survives a rebuild by living in the override layer', () => {
    const book = { id: 'b1', title: 'The Dispossessed', favourite: false, notes: null }
    const corrected = applyOverrides(
      catalogOf([book]),
      setOverride(emptyOverrides(), book, { favourite: true, notes: 'The one I lend out.' }),
    )
    expect(corrected.books[0].favourite).toBe(true)
    expect(corrected.books[0].notes).toBe('The one I lend out.')
  })

  it('records what it was before, so the mark can be undone', () => {
    const book = { id: 'b1', title: 'A', favourite: false }
    const corrected = applyOverrides(
      catalogOf([book]),
      setOverride(emptyOverrides(), book, { favourite: true }),
    )
    expect(corrected.books[0].overridden.fields).toContain('favourite')
    expect(corrected.books[0].overridden.was.favourite).toBe(false)
  })
})

describe('the form', () => {
  it('carries the mark as a boolean the toggle can press', () => {
    expect(toForm({ title: 'A', favourite: true }, names).favourite).toBe(true)
    expect(toForm({ title: 'A' }, names).favourite).toBe(false)
  })

  it('treats a missing field as not marked rather than as unknown', () => {
    expect(toForm({ title: 'A', favourite: null }, names).favourite).toBe(false)
    expect(toForm({ title: 'A', favourite: undefined }, names).favourite).toBe(false)
  })
})

describe('filtering by it', () => {
  it('is named on screen when it is set while hidden', () => {
    expect(hiddenActiveFilters({ favourite: 'yes' })).toEqual(['favourite'])
  })

  it('is not named when it is off', () => {
    expect(hiddenActiveFilters({ favourite: 'all' })).toEqual([])
    expect(hiddenActiveFilters()).toEqual([])
  })

  it('is named alongside the others rather than instead of them', () => {
    expect(hiddenActiveFilters({ loan: 'lent', favourite: 'yes' })).toEqual(['loan', 'favourite'])
  })
})

describe('what the librarian is told', () => {
  it('lists the favourites, and says who marked them', () => {
    const profile = readerProfile(
      catalogOf([
        { id: '1', title: 'The Dispossessed', authors: ['ursula'], favourite: true },
        { id: '2', title: 'Another', authors: ['ursula'] },
      ]),
    )
    expect(profile).toContain('Marked as favourites by the reader')
    expect(profile).toContain('The Dispossessed')
  })

  it('leaves the section out entirely when nothing is marked', () => {
    // The profile is sent with every request, so an empty heading is paid for
    // on each one.
    const profile = readerProfile(catalogOf([{ id: '1', title: 'Another' }]))
    expect(profile).not.toContain('Marked as favourites')
  })

  it('passes a note through in the reader\'s own words', () => {
    const note = 'Bought in Lisbon, never got past chapter three.'
    const profile = readerProfile(catalogOf([{ id: '1', title: 'A Book', notes: note }]))
    expect(profile).toContain(note)
  })

  it('says a note is an opinion, so it is not read as a description', () => {
    const profile = readerProfile(catalogOf([{ id: '1', title: 'A Book', notes: 'Dull.' }]))
    expect(profile).toContain("The reader's own notes")
    expect(profile).toContain("the reader's words, not a description")
  })

  it('leaves the notes section out when no book carries one', () => {
    const profile = readerProfile(catalogOf([{ id: '1', title: 'A Book' }]))
    expect(profile).not.toContain("The reader's own notes")
  })

  it('names a missing author rather than printing a bare dash', () => {
    // The profile is read by a model, and a dash says nothing about why the
    // author is absent.
    const profile = readerProfile(catalogOf([{ id: '1', title: 'Beowulf', favourite: true }]))
    expect(profile).toContain('author not recorded')
    expect(profile).not.toContain('Beowulf  ·  —')
  })
})

// Marking a shelf one book at a time means a dialog per book, which for the
// tail nobody ever recorded is the difference between a job and an afternoon.
// The filters already say which books are meant, so that is what bulk marking
// applies to, and the three-valued read state has to move in both directions.
describe('marking many books at once', () => {
  const shelf = () =>
    build([
      readSource(
        makeSource({
          name: 'list',
          kind: 'table',
          origin: 'list.json',
          format: 'physical',
          confidence: 'high',
          records: [
            { title: 'One', authors: ['A'], read: null },
            { title: 'Two', authors: ['B'], read: null },
            { title: 'Three', authors: ['C'], read: true },
          ],
        }),
        'list',
      ),
    ])

  // What the view does: fold setOverride across the books on screen.
  const markAll = (books, value, overrides) =>
    books.reduce(
      (acc, book) => (book.read === value ? acc : setOverride(acc, book, { read: value }, 'bulk')),
      overrides,
    )

  it('marks every book it is given', () => {
    const catalog = shelf()
    const after = applyOverrides(shelf(), markAll(catalog.books, true, emptyOverrides()))
    expect(after.books.every((b) => b.read === true)).toBe(true)
  })

  it('can put books back to not recorded, which is not a shade of unread', () => {
    const catalog = shelf()
    const after = applyOverrides(shelf(), markAll(catalog.books, null, emptyOverrides()))
    expect(after.books.every((b) => b.read === null)).toBe(true)
  })

  it('leaves a book that already reads that way uncorrected', () => {
    // Three is already read, so marking the shelf as read must not record a
    // correction against it: the Library would then offer to undo a change
    // that never happened.
    const catalog = shelf()
    const overrides = markAll(catalog.books, true, emptyOverrides())
    expect(Object.keys(overrides.entries)).toHaveLength(2)
  })

  it('touches nothing but the read state', () => {
    const catalog = shelf()
    const before = catalog.books.find((b) => b.title === 'One')
    const after = applyOverrides(shelf(), markAll(catalog.books, false, emptyOverrides())).books.find(
      (b) => b.title === 'One',
    )
    expect(after.title).toBe(before.title)
    expect(after.authors).toEqual(before.authors)
    expect(after.favourite).toBe(before.favourite)
  })

  it('is a correction like any other, so each one can be undone', () => {
    const catalog = shelf()
    const overrides = markAll(catalog.books, true, emptyOverrides())
    const after = applyOverrides(shelf(), overrides)
    expect(after.books.filter((b) => b.overridden).length).toBe(2)
  })
})

// What the card asks for. Read state, a loan and a note are the three fields
// no import can supply, and before this nothing in the app ever asked: the
// editor held them, and the editor is behind a button called Correct.
describe('the three things only the reader knows', () => {
  const bare = { id: 'b1', title: 'Middlemarch', read: null, notes: null }

  it('asks for all three when a book carries none of them', () => {
    expect(stillToRecord(bare)).toEqual(['read', 'lent_to', 'notes'])
  })

  it('asks for nothing once all three are recorded', () => {
    expect(stillToRecord({ ...bare, read: true, lent_to: 'Marta', notes: 'Slow start.' })).toEqual([])
  })

  it('counts unread as recorded, because it is', () => {
    // The whole point of the three-valued field is that false is an answer.
    expect(stillToRecord({ ...bare, read: false })).not.toContain('read')
    expect(stillToRecord({ ...bare, read: null })).toContain('read')
  })

  it('counts a borrowed book as having its loan recorded', () => {
    // The loan runs the other way, but it is recorded, and asking who has a
    // book that is on loan from somebody else is asking the wrong question.
    expect(stillToRecord({ ...bare, borrowed_from: 'Elena' })).not.toContain('lent_to')
    expect(stillToRecord({ ...bare, lent_to: 'Marta' })).not.toContain('lent_to')
  })

  it('does not count whitespace as a note', () => {
    expect(stillToRecord({ ...bare, notes: '   ' })).toContain('notes')
    expect(stillToRecord({ ...bare, notes: 'Finished on the train.' })).not.toContain('notes')
  })

  it('names fields the editor can actually open at', () => {
    // Each name is a prompt on the card and a control in the form, and the two
    // are joined by a string. A rename on one side only would leave the button
    // opening the form at the top with no sign anything was wrong.
    const editor = readFileSync(new URL('../src/components/BookEditor.jsx', import.meta.url), 'utf8')
    for (const field of stillToRecord(bare)) {
      expect(editor).toContain(`focusField === '${field}'`)
    }
  })
})

// What a spine offers without being opened.
//
// Read state and the star are the two things about a book that can only come
// from the reader, and both needed the card open. They are on the spine that is
// pulled out now, which meant deciding three things that source assertions are
// the right shape for: that the pair does not lose the third read value, that
// the controls are reachable without a mouse, and that there is one star per
// slot rather than two.
describe('the controls on a spine', () => {
  const wall = readFileSync(new URL('../src/views/Catalog.jsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

  /** One spine's slot, from the markup, which is where its order lives. */
  const sliceSlot = (source) => {
    const from = source.indexOf('className={`spine-slot')
    return source.slice(from, source.indexOf('shelf-board', from))
  }

  it('offers read and unread as one choice, not two switches', () => {
    expect(wall).toContain("<div className=\"segmented\" role=\"group\"")
    expect(wall).toMatch(/\['read', 'unread'\]\.map/)
    expect(wall).toContain("aria-pressed={book.read === value}")
  })

  it('puts a book back to not recorded when its own state is pressed again', () => {
    // The catalog holds three values and a pair of buttons can show two. Without
    // this the third would be reachable from the book's form and nowhere else,
    // and a state set by a slip of the finger could not be undone here.
    expect(wall).toContain('const next = book.read === value ? null : value')
  })

  it('hands focus back after a press that came from a pointer', () => {
    // The controls are shown while the slot holds focus, which is what makes
    // them reachable by keyboard. But focus outlives the pointer, so a spine
    // pressed with a mouse stood out until something else was clicked.
    expect(wall).toContain('const letGo = (e) => {')
    expect(wall).toContain('if (e.detail > 0) e.currentTarget.blur()')
  })

  it('keeps the focus a key press needs', () => {
    // detail is the click count and it is zero when the click came from the
    // keyboard. Blurring there would drop somebody out of the wall mid-press,
    // so no blur in this file may stand without that guard beside it.
    for (const line of wall.split(String.fromCharCode(10))) {
      if (line.includes('.blur()')) expect(line, line).toContain('detail > 0')
    }
  })

  it('uses it on both controls, since both are pressed the same way', () => {
    const uses = (wall.match(/letGo\(e\)/g) || []).length
    expect(uses).toBe(2)
  })

  it('shows the controls on focus, not only on hover', () => {
    // A keyboard cannot hover, and an element that is display:none is not in
    // the tab order to be focused in the first place. Both rules: the one for
    // a pointer that hovers and the one for a screen that does not.
    const rules = css.match(/\.spine-slot:focus-within \.spine-tools/g) || []
    expect(rules.length).toBe(2)
  })

  it('draws them after the spine, so a tab from it lands on them', () => {
    const slot = sliceSlot(wall)
    expect(slot.indexOf('spine-tools')).toBeGreaterThan(slot.indexOf('className={`spine${marked'))
  })

  it('leaves one star per slot, and it is the one in the controls', () => {
    // The mark above a resting spine says which books were singled out. As a
    // second button with the same name it offered every book twice to anybody
    // listening rather than looking.
    const slot = sliceSlot(wall)
    expect(slot).toContain('<span className="star-mark" aria-hidden="true">')
    expect((slot.match(/<Star /g) || []).length).toBe(1)
  })

  it('keeps the mark above the spine, where a wall can be read at a glance', () => {
    // It travelled below the spine when the controls moved after it, which
    // lifted every starred book off the shelf line by the height of a star.
    const slot = sliceSlot(wall)
    expect(slot.indexOf('star-mark')).toBeLessThan(slot.indexOf('className={`spine${marked'))
  })

  it('does not pull a spine out on a touch screen, and keeps the controls by it', () => {
    // A tapped spine at nearly twice its height is most of a phone. Nothing
    // grows there, so the controls sit against the top of the spine rather than
    // at the height a pulled-out one would have reached.
    const touch = css.slice(css.indexOf('@media (hover: none) {', css.indexOf('.spine-slot:hover .spine,')))
    expect(touch).toMatch(/\.spine-slot\.peeked \.spine \{ transform: none/)
    expect(css).toContain('.spine-tools { bottom: var(--spine-h, 200px); }')
  })

  it('hangs them clear of the spine at its pulled-out height', () => {
    // The spine scales from its foot, so it covers anything sitting at the top
    // of the slot. Which is what it had been doing to the star.
    expect(wall).toContain("'--spine-h': `${spineHeight(book)}px`")
    expect(css).toContain('bottom: calc(var(--spine-h, 200px) * 1.75)')
  })
})
