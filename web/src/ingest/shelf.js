// Port of tools/librapp/parse_shelf.py — turn a photograph of a shelf into
// source records.
//
// Reading spines is the one step that needs a model rather than a parser, so it
// happens in two halves with a file in between: this cuts the photograph into
// tiles a model can actually read, and later validates the transcription that
// comes back. Splitting it keeps the model's output somewhere it can be read,
// corrected and re-imported, instead of vanishing into a pipeline.
//
// Whole-shelf photographs defeat vision models: a spine is a few dozen pixels
// wide in a picture scaled to fit a context window. Tiling at native resolution
// is what makes the text legible, so a crop is never scaled up and only scaled
// down to the width a model can take.

import { clean } from '../core/textmatch.js'
import { CONFIDENCE } from '../core/records.js'

// Wider than this and a model downsamples the tile anyway; narrower and spine
// text stops being legible. Chosen to leave a crop of ~2000px near 1:1.
export const TILE_WIDTH = 1250

// How much neighbouring tiles overlap, as a fraction. A book on the seam is
// then whole in one of them rather than split down the middle in both.
export const OVERLAP = 0.06

/**
 * Where each tile is cut from, given a photograph's size.
 *
 * Kept apart from any drawing so the geometry can be checked without pixels —
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
 * Takes anything createImageBitmap accepts — a File straight from a camera —
 * and gives back blobs. Nothing is uploaded: the photograph never leaves the
 * device, which on a phone also means not waiting for fifty megapixels to
 * cross a network.
 */
export async function tileImage(file, { cols = 4, rows = 2, quality = 0.92 } = {}) {
  const bitmap = await createImageBitmap(file)
  const boxes = tileBoxes(bitmap.width, bitmap.height, cols, rows)
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
  return { photo: file.name, photoSize: [bitmap.width, bitmap.height], tiles }
}

export class TranscriptionError extends Error {}

/**
 * Validate a transcription and turn it into source records.
 *
 * A shelf photograph yields a title, usually an author, sometimes a publisher,
 * and nothing else: no acquisition date, no read flag. Saying so plainly is the
 * point — a book that appears only here is one the catalog knows it cannot
 * date.
 *
 * This refuses a file with an untitled book or an unknown confidence value,
 * which is deliberate: a bad read should stop here rather than turn up in the
 * catalog later.
 */
export function loadTranscription(payload) {
  const groups = payload?.shelves
  if (!Array.isArray(groups) || !groups.length) {
    throw new TranscriptionError(
      'no "shelves" list. Expected {"photo": …, "shelves": [{"location": …, "books": [...]}]}',
    )
  }

  const records = []
  let uncertain = 0
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
        flags: confidence === 'low' ? ['illegible_spine'] : [],
      })
    }
  }

  return {
    records,
    stats: { photo: payload.photo ?? null, shelves: groups.length, uncertain_spines: uncertain },
  }
}
