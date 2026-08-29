// Port of tools/librapp/parse_shelf.py. Turns a photograph of a shelf into
// source records.
//
// Reading spines needs a model rather than a parser, so it happens in two
// halves with a file in between. This cuts the photograph into tiles a model
// can read, and later validates the transcription that comes back. Keeping the
// halves apart leaves the model's output somewhere it can be inspected,
// corrected and re-imported.
//
// Whole-shelf photographs defeat vision models, because a spine is a few dozen
// pixels wide once the picture is scaled to fit a context window. Tiling at
// native resolution keeps the text legible, so a crop is never scaled up and
// is scaled down only to the width a model accepts.

import { clean } from '../core/textmatch.js'
import { CONFIDENCE } from '../core/records.js'

// Wider than this and a model downsamples the tile anyway; narrower and spine
// text stops being legible. Chosen to leave a crop of about 2000px near 1:1.
export const TILE_WIDTH = 1250

// How much neighbouring tiles overlap, as a fraction. A book on the seam is
// then whole in one of them instead of halved in both. Wide enough to cover a
// spine on a normal shelf shot. A close-up where one spine spans a third of the
// frame is served by fewer tiles rather than by more overlap.
export const OVERLAP = 0.12

// Below this, a photograph is left whole. A picture this size cannot hold
// enough books to need dividing, and cutting one up costs more than it gains.
const WHOLE_BELOW_MEGAPIXELS = 20

// Roughly how many megapixels of original per tile, above that threshold.
// Calibrated on a 50 MP shot of two full shelves, which reads well at eight.
const MEGAPIXELS_PER_TILE = 6
const MAX_TILES = 12

/**
 * A starting grid for a photograph, to be adjusted by whoever took it.
 *
 * The image alone does not determine this. What makes a good tile is how many
 * spines are in it, which is a fact about the shelf rather than about the file:
 * 50 megapixels of a full bookcase wants eight tiles, 12 megapixels of three
 * books wants one. Four times the pixels, thirty times the books. This errs
 * towards leaving the photograph whole and expects to be overridden.
 */
export function suggestGrid(width, height) {
  const megapixels = (width * height) / 1e6
  if (megapixels < WHOLE_BELOW_MEGAPIXELS) return { cols: 1, rows: 1 }

  const wanted = Math.min(MAX_TILES, Math.max(2, Math.round(megapixels / MEGAPIXELS_PER_TILE)))
  // Rows are decided first and kept as few as the shape allows, because the
  // two cuts differ in cost. Books stand upright, so a vertical cut crosses a
  // spine's width and the overlap covers it, while a horizontal cut runs
  // through the title and leaves half of it in each tile.
  const aspect = width / height
  const rows = Math.max(1, Math.round(Math.sqrt(wanted / aspect)))
  const cols = Math.max(1, Math.ceil(wanted / rows))
  return { cols, rows }
}

/**
 * Where each tile is cut from, given a photograph's size.
 *
 * Kept apart from any drawing so the geometry can be checked without pixels,
 * and so it matches the Python original exactly, truncation included.
 */
export function tileBoxes(width, height, cols = 4, rows = 2) {
  const stepX = width / cols
  const stepY = height / rows
  const padX = stepX * OVERLAP
  const padY = stepY * OVERLAP
  const boxes = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const left = Math.max(0, Math.trunc(col * stepX - padX))
      const upper = Math.max(0, Math.trunc(row * stepY - padY))
      const right = Math.min(width, Math.trunc((col + 1) * stepX + padX))
      const lower = Math.min(height, Math.trunc((row + 1) * stepY + padY))
      boxes.push({
        tile: `tile-r${row + 1}c${col + 1}.jpg`,
        row: row + 1,
        column: col + 1,
        box: [left, upper, right, lower],
      })
    }
  }
  return boxes
}

/**
 * Cut a photograph into tiles, in the browser.
 *
 * Takes anything createImageBitmap accepts, including a File straight from a
 * camera, and returns blobs. Nothing is uploaded. The photograph never leaves
 * the device, which on a phone also avoids sending fifty megapixels over a
 * network.
 */
export async function tileImage(file, { cols, rows, quality = 0.92 } = {}) {
  const bitmap = await createImageBitmap(file)
  const suggested = suggestGrid(bitmap.width, bitmap.height)
  const across = cols ?? suggested.cols
  const down = rows ?? suggested.rows
  const boxes = tileBoxes(bitmap.width, bitmap.height, across, down)
  const tiles = []

  for (const spec of boxes) {
    const [left, upper, right, lower] = spec.box
    const cropWidth = right - left
    const cropHeight = lower - upper
    const scale = cropWidth > TILE_WIDTH ? TILE_WIDTH / cropWidth : 1
    const outWidth = Math.round(cropWidth * scale)
    const outHeight = Math.round(cropHeight * scale)

    const canvas = new OffscreenCanvas(outWidth, outHeight)
    const context = canvas.getContext('2d')
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, left, upper, cropWidth, cropHeight, 0, 0, outWidth, outHeight)
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
    tiles.push({ ...spec, size: [outWidth, outHeight], blob, url: URL.createObjectURL(blob) })
  }

  // Read before closing. A closed ImageBitmap reports zero for both, which is
  // what the size beside the filename used to say for every photograph.
  const photoSize = [bitmap.width, bitmap.height]
  bitmap.close?.()
  return {
    photo: file.name,
    photoSize,
    grid: { cols: across, rows: down },
    suggested,
    tiles,
  }
}

// Which fields a model may only have recalled, and the flag that says so.
// Kept next to the checklist that asks for them.
const RECALLED_FIELDS = [
  'abstract',
  'published_year',
  'rating',
  'original_language',
  'pages',
  // A spine sometimes prints a collection, so a genre can be read rather than
  // recalled. The two arrive in one field and cannot be told apart afterwards,
  // so both are flagged. Marking a read genre as recalled claims less than is
  // known, which is the side to err on.
  'genre',
]
const RECALLED_FLAG = 'recalled_details'

export class TranscriptionError extends Error {}

/**
 * Validate a transcription and turn it into source records.
 *
 * A shelf photograph yields a title, usually an author, sometimes a publisher,
 * and nothing else. No acquisition date, no read flag. A book appearing only
 * here is one the catalog records as undateable.
 *
 * A file with an untitled book or an unknown confidence value is refused, so
 * that a bad read stops here rather than reaching the catalog.
 */
/** Where a book sits in a transcription. Stable for as long as that transcription is. */
export const bookKey = (shelfIndex, bookIndex) => `${shelfIndex}:${bookIndex}`

/**
 * A transcription with the set-aside books taken out.
 *
 * A shelf left holding nothing is dropped rather than written as an empty
 * group. The reader discarded every book on it, and a location with no books
 * under it is not something the photograph showed.
 */
export function withoutDropped(transcription, dropped) {
  return {
    ...transcription,
    shelves: (transcription?.shelves || [])
      .map((shelf, i) => ({
        ...shelf,
        books: (shelf.books || []).filter((_, j) => !dropped.has(bookKey(i, j))),
      }))
      .filter((shelf) => shelf.books.length),
  }
}

export function loadTranscription(payload) {
  const groups = payload?.shelves
  if (!Array.isArray(groups) || !groups.length) {
    throw new TranscriptionError(
      'no "shelves" list. Expected {"photo": …, "shelves": [{"location": …, "books": [...]}]}',
    )
  }

  const records = []
  let uncertain = 0
  let recalledBooks = 0
  for (const group of groups) {
    const location = clean(String(group?.location ?? ''))
    for (const book of group?.books || []) {
      const title = clean(String(book?.title ?? ''))
      if (!title) throw new TranscriptionError(`a book on shelf ${JSON.stringify(location)} has no title`)
      const confidence = book.confidence || 'medium'
      if (!(confidence in CONFIDENCE)) {
        throw new TranscriptionError(`unknown confidence ${JSON.stringify(confidence)} for ${title}`)
      }
      if (confidence === 'low') uncertain++

      // A model can claim a field was recalled, or forget to. Neither is
      // trusted: the flag is derived from which recalled fields are actually
      // present, so the catalog cannot be told a recalled abstract was read.
      const recalled = RECALLED_FIELDS.filter((field) => book[field] != null)
      if (recalled.length) recalledBooks += 1

      records.push({
        title,
        authors: (book.authors || []).map((a) => clean(String(a))).filter(Boolean),
        publisher: book.publisher ? clean(String(book.publisher)) : null,
        series: book.series ? clean(String(book.series)) : null,
        series_index: book.series_index ?? null,
        genre: book.genre ? clean(String(book.genre)) : null,
        keywords: book.keywords ? clean(String(book.keywords)) : null,
        location: location || null,
        confidence,
        notes: book.notes ? clean(String(book.notes)) : null,
        abstract: book.abstract ? clean(String(book.abstract)) : null,
        published_year: Number.isInteger(book.published_year) ? book.published_year : null,
        rating: typeof book.rating === 'number' ? book.rating : null,
        original_language: book.original_language ? clean(String(book.original_language)) : null,
        pages: Number.isInteger(book.pages) && book.pages > 0 ? book.pages : null,
        flags: [
          ...(confidence === 'low' ? ['illegible_spine'] : []),
          ...(recalled.length ? [RECALLED_FLAG] : []),
        ],
      })
    }
  }

  return {
    records,
    stats: {
      photo: payload.photo ?? null,
      shelves: groups.length,
      uncertain_spines: uncertain,
      recalled_details: recalledBooks,
    },
  }
}
