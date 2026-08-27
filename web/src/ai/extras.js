// Things a model can be asked for beyond transcribing what is on the spine.
//
// The list splits in two, and the split governs everything downstream.
//
// A `read` extra is physically present in the photograph. Asking for it is
// asking the model to transcribe more carefully, and the answer is evidence of
// the same kind as the title.
//
// A `recalled` extra is not in the photograph at all. The model produces it
// from training data, so it is a claim about the world rather than a reading of
// the image. Those answers arrive flagged and at reduced confidence, and the
// book card shows which fields came that way. Without that, one ticked box
// would turn a catalog that records where every fact came from into one that
// cannot be checked.
//
// Cover images are absent on purpose. A model replying with JSON cannot return
// an image, only a link, and following a link would put a network request into
// an app that makes none and would tell whoever hosts the image which books
// somebody owns.

export const EXTRAS = [
  { id: 'publisher', kind: 'read', field: null },
  { id: 'edition', kind: 'read', field: null },
  { id: 'language', kind: 'read', field: null },
  { id: 'series', kind: 'read', field: null },
  { id: 'duplicates', kind: 'read', field: null },

  { id: 'abstract', kind: 'recalled', field: 'abstract' },
  { id: 'published', kind: 'recalled', field: 'published_year' },
  { id: 'rating', kind: 'recalled', field: 'rating' },
  { id: 'original', kind: 'recalled', field: 'original_language' },
  { id: 'pages', kind: 'recalled', field: 'pages' },
  { id: 'genre', kind: 'recalled', field: 'genre' },
]

export const extraById = (id) => EXTRAS.find((e) => e.id === id) || null

/** The flag put on any book carrying a field the model recalled rather than read. */
export const RECALLED_FLAG = 'recalled_details'

// The instruction text is English because it is sent to a model, not shown to a
// reader. The checkbox labels beside it are translated.
const INSTRUCTIONS = {
  publisher: 'Record the publisher or imprint printed on the spine, where it is legible.',
  edition: 'Record the edition or printing where the spine states one, in `notes`.',
  language: 'Record the language the title is printed in, in `notes`.',
  series: 'Record the series name and volume number wherever the spine shows them.',
  duplicates:
    'If the same book appears twice across the tiles because they overlap, record it once.',
  abstract: 'Add a two or three sentence `abstract` of the book from your own knowledge.',
  published: 'Add the year the work was first published as `published_year`.',
  rating: 'Add a general reader rating out of 5 as `rating`, to one decimal place.',
  original:
    'Add the language the work was originally written in as `original_language`, and say in ' +
    '`notes` whether this edition looks like a translation.',
  pages:
    'Add the page count of a typical edition as `pages`, as a whole number. No spine states ' +
    'this, so give a representative figure for the work rather than a measurement of the copy ' +
    'in the photograph, and leave it null for anything you do not recognise.',
  genre:
    'Add a `genre` for each book you recognise: a few words in plain language, such as ' +
    '"philosophy", "science fiction" or "military history". Prefer the wording the catalog ' +
    'already uses where a book is like one it holds. Leave it null rather than inventing a ' +
    'category for a book you do not know.',
}

/**
 * The section appended to the shelf prompt for the ticked extras.
 *
 * Returns an empty string when nothing is ticked, so the prompt is byte for
 * byte the one in prompts/ingest-shelf.md unless something was asked for.
 */
export function extrasPrompt(ticked) {
  const chosen = EXTRAS.filter((extra) => ticked.includes(extra.id))
  if (!chosen.length) return ''

  const lines = ['', '---', '', '## Also asked for', '']
  const read = chosen.filter((e) => e.kind === 'read')
  const recalled = chosen.filter((e) => e.kind === 'recalled')

  if (read.length) {
    lines.push('From the photograph itself:', '')
    for (const extra of read) lines.push(`- ${INSTRUCTIONS[extra.id]}`)
    lines.push('')
  }

  if (recalled.length) {
    lines.push('From your own knowledge, for books you recognise:', '')
    for (const extra of recalled) lines.push(`- ${INSTRUCTIONS[extra.id]}`)
    lines.push(
      '',
      'These last fields are not in the photograph. Fill one in only for a book you actually',
      'recognise from the title and author you read, leave it null otherwise, and never guess',
      'from the title alone. Add "recalled" to that book\'s `flags` whenever you fill in any of',
      'them, so the catalog can show which details were not read off the shelf.',
      '',
    )
  }

  return lines.join('\n')
}

/** Which recalled fields a returned book actually carries. */
export const recalledIn = (book) =>
  EXTRAS.filter((e) => e.kind === 'recalled' && e.field && book?.[e.field] != null).map(
    (e) => e.field,
  )
