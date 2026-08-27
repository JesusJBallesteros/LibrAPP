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

  bitmap.close?.()
  return {
    photo: file.name,
    photoSize: [bitmap.width, bitmap.height],
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

// How much of the neighbouring picture to keep around a spine. A model places
// a box approximately, and a crop cut exactly on its estimate loses the edge of
// the lettering more often than it gains anything.
const PADDING = 0.02

/**
 * Where one book was seen, or null when it cannot be placed.
 *
 * A box is only usable if it is four numbers inside the tile that enclose some
 * area. Anything else is dropped rather than repaired: a book without a crop
 * is drawn the way every book was drawn before, which is a worse picture and
 * not a wrong one. A box cut from the wrong place would be a wrong one.
 */
export function placement(book) {
  const tile = typeof book?.tile === 'string' ? book.tile.trim() : ''
  const box = book?.box
  if (!tile || !Array.isArray(box) || box.length !== 4) return null
  if (!box.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)) return null
  const [left, top, right, bottom] = box
  if (right <= left || bottom <= top) return null
  return {
    tile,
    box: [
      Math.max(0, left - PADDING),
      Math.max(0, top - PADDING),
      Math.min(1, right + PADDING),
      Math.min(1, bottom + PADDING),
    ],
  }
}

/**
 * Cut one spine out of the tile it was seen in.
 *
 * The tile is already a JPEG in memory from the read that has just finished,
 * so this is the same photograph the model looked at and no larger. Nothing is
 * fetched and nothing is uploaded.
 */
export async function cropSpine(blob, box, { width = 220, quality = 0.85 } = {}) {
  const bitmap = await createImageBitmap(blob)
  const [left, top, right, bottom] = box
  const x = Math.round(left * bitmap.width)
  const y = Math.round(top * bitmap.height)
  const cropWidth = Math.max(1, Math.round((right - left) * bitmap.width))
  const cropHeight = Math.max(1, Math.round((bottom - top) * bitmap.height))
  const scale = cropWidth > width ? width / cropWidth : 1
  const outWidth = Math.max(1, Math.round(cropWidth * scale))
  const outHeight = Math.max(1, Math.round(cropHeight * scale))

  const canvas = new OffscreenCanvas(outWidth, outHeight)
  const context = canvas.getContext('2d')
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, x, y, cropWidth, cropHeight, 0, 0, outWidth, outHeight)
  const out = await canvas.convertToBlob({ type: 'image/jpeg', quality })
  bitmap.close?.()
  return out
}

/** The r2c3 in "r2c3", "Tile r2c3" or "tile-r2c3.jpg", so a near miss still lands. */
export const tileKey = (name) => {
  const found = /r(\d+)\s*c(\d+)/i.exec(String(name || ''))
  return found ? `r${Number(found[1])}c${Number(found[2])}` : null
}

/**
 * Cut every placed spine out of the tiles it was read from.
 *
 * Aligned with the records the placements came from, so index n is the crop for
 * record n, or null where the book could not be placed or names a tile that was
 * not part of the read. A tile dropped before reading is one such case: the
 * model never saw it, but a stale box could still name it.
 */
export async function cutSpines(placements, tiles) {
  const byKey = new Map()
  for (const tile of tiles || []) byKey.set(`r${tile.row}c${tile.column}`, tile.blob)

  const crops = []
  for (const place of placements || []) {
    const blob = place && byKey.get(tileKey(place.tile))
    // One bad box must not cost the whole read: the source is worth keeping
    // even when a picture of it is not.
    crops.push(blob ? await cropSpine(blob, place.box).catch(() => null) : null)
  }
  return crops
}

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
export function loadTranscription(payload) {
  const groups = payload?.shelves
  if (!Array.isArray(groups) || !groups.length) {
    throw new TranscriptionError(
      'no "shelves" list. Expected {"photo": …, "shelves": [{"location": …, "books": [...]}]}',
    )
  }

  const records = []
  // Index-aligned with records: where each book was seen, for the crop that
  // happens once a read is accepted. Not part of the record, which holds the
  // path of a crop already written and refuses fields it does not know.
  const placements = []
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

      placements.push(placement(book))
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
    placements,
    stats: {
      photo: payload.photo ?? null,
      shelves: groups.length,
      uncertain_spines: uncertain,
      recalled_details: recalledBooks,
    },
  }
}
