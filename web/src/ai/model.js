// The two jobs an AI service is asked to do, and the one place that decides who
// does them.
//
// Everything above this file asks for a job. It does not name a service, hold a
// key, or know which dialect is spoken on the other side. That is settled here,
// from the choice made in the key box.

import { anthropic } from './anthropic.js'
import { google, openai } from './rest.js'
import { pricesFor } from './providers.js'
import { usableConfig } from './key.js'
import { fold } from '../core/textmatch.js'

const ADAPTERS = { anthropic, openai, google }

/**
 * A vision model sees an image as 28×28 patches, so a tile costs roughly
 * ⌈width/28⌉ × ⌈height/28⌉ tokens. That arithmetic is why tiles are 1250px wide
 * rather than the full photograph.
 */
export const visualTokens = (width, height) => Math.ceil(width / 28) * Math.ceil(height / 28)

/**
 * What reading a set of tiles will cost.
 *
 * The token count is arithmetic and holds everywhere. The price is only filled
 * in for models whose published rate has been checked; for the rest this returns
 * the tokens and no figure, because a made-up number with a dollar sign in front
 * of it is worse than none.
 */
export function estimateShelfCost(tiles, prices, { promptTokens = 800, outputTokens = 2000 } = {}) {
  const inputTokens = tiles.reduce(
    (sum, tile) => sum + visualTokens(tile.size[0], tile.size[1]),
    promptTokens,
  )
  return {
    inputTokens,
    outputTokens,
    dollars: prices
      ? (inputTokens / 1e6) * prices.in + (outputTokens / 1e6) * prices.out
      : null,
  }
}

/**
 * What a question will cost, before it is sent.
 *
 * The input side is measured from the assembled text at roughly four characters
 * per token. That is accurate enough to warn with and not accurate enough to
 * quote. The output side cannot be known in advance at all, so a typical answer
 * is assumed.
 */
export function estimateAskCost(request, prices, { outputTokens = 1200 } = {}) {
  const inputTokens = Math.ceil(String(request || '').length / 4)
  return {
    inputTokens,
    outputTokens,
    dollars: prices ? (inputTokens / 1e6) * prices.in + (outputTokens / 1e6) * prices.out : null,
  }
}

export const dollars = (value) => (value < 0.01 ? 'under a cent' : `about $${value.toFixed(2)}`)

/** What a call actually cost, from the usage the service returned. Null if unpriced. */
export function actualCost(usage, prices) {
  if (!usage || !prices) return null
  const input = (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0)
  return (input / 1e6) * prices.in + ((usage.output_tokens || 0) / 1e6) * prices.out
}

/** The rate for whatever is chosen right now, or null where none is known. */
export const pricesForChoice = (choice) =>
  choice?.provider ? pricesFor(choice.provider, choice.model) : null

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read a piece.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.readAsDataURL(blob)
  })

async function chosen() {
  const config = await usableConfig()
  if (!config) {
    throw new Error('No AI service is set up and switched on.')
  }
  const adapter = ADAPTERS[config.provider.family]
  if (!adapter) throw new Error(`No adapter for ${config.provider.label}.`)
  return { ...config, adapter }
}

/**
 * Read the spines off a set of tiles.
 *
 * Images go before the instructions and each is labelled, following vision
 * guidance. The reply is constrained to the transcription schema, so prose in
 * place of JSON is no longer a failure mode. What remains is whether the spines
 * were read correctly, so the result is shown for review rather than imported
 * directly.
 */
export async function readShelf({ tiles, photo, instructions, signal, onProgress }) {
  const { adapter, provider, apiKey, model, baseUrl, host } = await chosen()
  const groups = batches(tiles)

  const shelves = []
  const usage = { input_tokens: 0, output_tokens: 0 }
  const failures = []
  let done = 0

  for (const group of groups) {
    onProgress?.({ done, total: groups.length })
    const withData = []
    for (const tile of group) withData.push({ ...tile, base64: await toBase64(tile.blob) })
    const content = adapter.shelfContent({ tiles: withData, tail: tail(instructions, photo) })
    try {
      const reply = await adapter.readShelf({
        provider, apiKey, model, baseUrl, host, content, signal,
      })
      shelves.push(...(reply.transcription?.shelves || []))
      usage.input_tokens += reply.usage?.input_tokens || 0
      usage.output_tokens += reply.usage?.output_tokens || 0
    } catch (error) {
      // A cancelled read is not a failed batch, and carrying on after one would
      // spend money the reader has already asked to stop spending.
      if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error
      failures.push({ tiles: group.map((t) => t.tile), error })
    }
    done += 1
    onProgress?.({ done, total: groups.length })
  }

  // Nothing came back at all, so there is no partial result to offer and the
  // first failure is the one worth reporting.
  if (!shelves.length && failures.length) throw failures[0].error

  return {
    transcription: { photo, shelves: dedupe(shelves) },
    usage,
    failures,
    batches: groups.length,
  }
}

/**
 * How many tiles go in one request.
 *
 * The reply is one JSON document covering every tile in the request, so its
 * length grows with this number and again with every extra ticked. Four keeps
 * the largest honest reply well inside what any of the models will return,
 * which is what stops a long shelf coming back truncated and unreadable.
 */
export const TILES_PER_BATCH = 4

const batches = (tiles, size = TILES_PER_BATCH) => {
  const out = []
  for (let i = 0; i < tiles.length; i += size) out.push(tiles.slice(i, i + size))
  return out
}

const tail = (instructions, photo) =>
  `${instructions}\n\n---\n\n` +
  `The photograph is named ${JSON.stringify(photo)}. Use that as "photo".\n` +
  `Read every piece above. Pieces overlap, so a book showing in two of them is ` +
  `one book: record it once. Group books by the shelf they stand on.\n` +
  `Reply only with the transcription, in the format required.`

/**
 * One book seen in two batches is still one book.
 *
 * Within a single request the model is told to record an overlapping book once,
 * and it can, because it sees both tiles together. Split across requests it
 * cannot: each reply is honest about what its own tiles showed. The builder is
 * no help either, since it treats two rows from one source as two copies rather
 * than as a duplicate, which is the right rule for a spreadsheet and the wrong
 * one here.
 *
 * So the joining happens here, while this is still one read that merely
 * travelled in pieces. Same folded title and same folded author is the test;
 * the more confident record wins, and its shelf keeps the entry.
 */
function dedupe(shelves) {
  const rank = { high: 3, medium: 2, low: 1 }
  const seen = new Map()
  const out = shelves.map((shelf) => ({ ...shelf, books: [] }))

  shelves.forEach((shelf, at) => {
    for (const book of shelf.books || []) {
      const key = `${fold(book.title)}\u0000${fold((book.authors || [])[0] || '')}`
      const already = seen.get(key)
      if (!already) {
        seen.set(key, { at, index: out[at].books.length })
        out[at].books.push(book)
        continue
      }
      const kept = out[already.at].books[already.index]
      if ((rank[book.confidence] || 0) > (rank[kept.confidence] || 0)) {
        out[already.at].books[already.index] = book
      }
    }
  })

  return out.filter((shelf) => shelf.books.length)
}

/**
 * Answer a question about the catalog, streaming the reply as it arrives.
 *
 * The prompt and the reader profile are the same text the copy button produces,
 * so the keyless path and this one ask exactly the same thing.
 */
export async function ask({ request, onText, signal }) {
  const { adapter, provider, apiKey, model, baseUrl, host } = await chosen()
  return adapter.ask({ provider, apiKey, model, baseUrl, host, request, onText, signal })
}
