// Getting text lines out of a PDF, the way the Kindle parser needs them.
//
// The parser downstream depends on line *order*: a record's title sits above
// its author, which sits above its 'Acquired on' line, and records split across
// a page break are stitched back together by reading the document as one
// stream. PyMuPDF gave that order for free and pdf.js agrees, but the two
// disagree about where a line ends.
//
// pdf.js marks end-of-line on the text item that closes a run in the content
// stream, and the page puts a book's title and the buttons beside it in the
// same run. Grouping on that flag alone glues two columns together
// ('Manifiesto del Partido Comunista Deliver or remove from device') and the
// title is then unusable. Lines are therefore also broken whenever the
// baseline moves, which is what PyMuPDF's own line boxes amount to.
//
// pdf.js is passed in rather than imported, because the browser build and the
// Node build come from different entry points and only the caller knows which.

// Two baselines further apart than this are different lines. Well below the
// leading of any text on the page, well above the jitter within one line.
const BASELINE_TOLERANCE = 1.5

// Items on one baseline are joined only while they nearly touch. pdf.js splits
// a word wherever the font changes. A ligature arrives as its own item, so
// 'La sociedad de la descon' 'fi' 'anza' is three of them at a gap of zero,
// while separate controls on the same row sit six points apart or more.
// Measured on this document the two populations do not overlap: joins happen at
// 0 to 2.33 points, and the nearest thing that must not join is 6.
const JOIN_GAP = 4

/**
 * Text lines of one page, in reading order.
 *
 * Each line carries the horizontal extent it was drawn at, because that is the
 * only remaining evidence of a title the page cut off: pdf.js discards the
 * trailing space PyMuPDF preserved, but it cannot hide where the ink stopped.
 */
export async function pageLines(page) {
  const { items } = await page.getTextContent()
  const lines = []
  let parts = []

  const flush = () => {
    if (!parts.length) return
    const text = parts.map((p) => p.str).join('')
    const visible = parts.filter((p) => p.str.trim())
    const first = visible[0]
    const last = visible[visible.length - 1]
    lines.push({
      text,
      left: first ? first.transform[4] : null,
      right: last ? last.transform[4] + (last.width || 0) : null,
    })
    parts = []
  }

  for (const item of items) {
    const y = item.transform?.[5]
    const open = parts.filter((p) => p.str.trim())
    const openY = open[0]?.transform?.[5]
    const previous = open[open.length - 1]

    const movedBaseline =
      openY !== undefined && y !== undefined && Math.abs(y - openY) > BASELINE_TOLERANCE
    const leftAGap =
      previous && item.str.trim() &&
      item.transform[4] - (previous.transform[4] + (previous.width || 0)) > JOIN_GAP

    if (parts.length && (movedBaseline || leftAGap)) flush()
    parts.push(item)
    if (item.hasEOL) flush()
  }
  flush()
  return lines
}

/** Every page of a document as an array of lines. */
export async function linesFromPdf(pdfjs, data) {
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
  const pages = []
  for (let n = 1; n <= doc.numPages; n++) {
    pages.push(await pageLines(await doc.getPage(n)))
  }
  return pages
}
