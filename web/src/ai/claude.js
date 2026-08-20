// Talking to Claude from the browser, when a key has been given.
//
// The SDK refuses to run in a browser unless you say `dangerouslyAllowBrowser`,
// and the name is fair: a key held in a browser is readable by anything running
// on this origin. LibrAPP accepts that trade knowingly and narrowly — the key is
// optional, it is yours, it stays on your device, and the app works without it.
// A workspace-scoped key with a spend limit bounds the worst case to a small
// bill rather than an open tap.
//
// Two jobs only: reading spines off photograph tiles, and answering a question
// about the catalog. Both have a copy-and-paste equivalent that needs no key.

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

export const MODEL = 'claude-opus-5'

// Published rates for the model above, per million tokens. Used only to show an
// estimate before spending anything; the real figure comes back in `usage`.
const PRICE_IN = 5.0
const PRICE_OUT = 25.0

/**
 * Claude sees an image as 28×28 patches, so a tile costs
 * ⌈width/28⌉ × ⌈height/28⌉ tokens. Worth showing: it is the whole reason tiles
 * are 1250px wide rather than the full photograph.
 */
export const visualTokens = (width, height) =>
  Math.ceil(width / 28) * Math.ceil(height / 28)

/** A cost estimate for reading a set of tiles, in dollars. */
export function estimateShelfCost(tiles, { promptTokens = 800, outputTokens = 2000 } = {}) {
  const input = tiles.reduce((sum, t) => sum + visualTokens(t.size[0], t.size[1]), promptTokens)
  return {
    inputTokens: input,
    outputTokens,
    dollars: (input / 1e6) * PRICE_IN + (outputTokens / 1e6) * PRICE_OUT,
  }
}

export const dollars = (value) =>
  value < 0.01 ? 'under a cent' : `about $${value.toFixed(2)}`

/** What a transcription must look like, mirroring what `loadTranscription` accepts. */
const Book = z.object({
  title: z.string().describe('exactly as printed on the spine, subtitle included'),
  authors: z.array(z.string()).describe('as printed, in normal order; empty if none is shown'),
  publisher: z.string().nullable(),
  series: z.string().nullable(),
  series_index: z.number().int().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.string().nullable().describe('anything a person should check: partial text, odd script'),
})
const Shelf = z.object({
  location: z.string().describe('where on the shelf, e.g. "top shelf, left"'),
  books: z.array(Book),
})
const Transcription = z.object({
  photo: z.string(),
  shelves: z.array(Shelf),
})

class KeyRejected extends Error {}

/** Turn an SDK error into something worth showing a person. */
function explain(error) {
  if (error instanceof Anthropic.AuthenticationError) {
    return new KeyRejected('That key was rejected. Check it was copied whole, and that it is still active.')
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return new Error('That key is not allowed to use this model. Check the workspace it belongs to.')
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new Error('Rate limited. Wait a moment and try again.')
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new Error(
      'Could not reach the API. If you are offline that is expected — everything else in LibrAPP still works.',
    )
  }
  if (error instanceof Anthropic.APIError) {
    return new Error(`The API refused the request (${error.status}): ${error.message}`)
  }
  return error
}

const clientFor = (apiKey) =>
  new Anthropic({
    apiKey,
    // See the note at the top of this file. The key is the user's own, stored
    // on their device, and every feature that uses it has a keyless path.
    dangerouslyAllowBrowser: true,
  })

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read a tile.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.readAsDataURL(blob)
  })

/**
 * Read the spines off a set of tiles.
 *
 * Images go before the instructions, and each is labelled, which is what the
 * vision guidance asks for. The response is constrained to the transcription
 * schema, so "the model wrote prose instead of JSON" stops being a failure
 * mode — what remains is whether it read the spines correctly, and that is why
 * the result is shown for review rather than imported straight away.
 */
export async function readShelf({ apiKey, tiles, photo, instructions }) {
  const content = []
  for (const tile of tiles) {
    content.push({ type: 'text', text: `Tile row ${tile.row}, column ${tile.column}:` })
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: await toBase64(tile.blob) },
    })
  }
  content.push({
    type: 'text',
    text:
      `${instructions}\n\n---\n\n` +
      `The photograph is named ${JSON.stringify(photo)}. Use that as "photo".\n` +
      `Read every tile above. Tiles overlap, so a book showing in two of them is ` +
      `one book: record it once. Group books by the shelf they stand on.`,
  })

  try {
    const client = clientFor(apiKey)
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content }],
      output_config: { format: zodOutputFormat(Transcription) },
    })

    if (response.stop_reason === 'refusal') {
      throw new Error('The model declined to answer this request.')
    }
    if (!response.parsed_output) {
      throw new Error('The reply did not match the transcription format. Nothing was imported.')
    }
    return { transcription: response.parsed_output, usage: response.usage }
  } catch (error) {
    throw explain(error)
  }
}

/**
 * Answer a question about the catalog, streaming the reply as it arrives.
 *
 * The prompt and the reader profile are the same text the copy button produces,
 * so the keyless path and this one ask exactly the same thing.
 */
export async function ask({ apiKey, request, onText, signal }) {
  try {
    const client = clientFor(apiKey)
    const stream = client.messages.stream(
      {
        model: MODEL,
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: request }],
      },
      { signal },
    )
    if (onText) stream.on('text', onText)
    const message = await stream.finalMessage()
    if (message.stop_reason === 'refusal') {
      throw new Error('The model declined to answer this request.')
    }
    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
    return { text, usage: message.usage }
  } catch (error) {
    throw explain(error)
  }
}

/** What a call actually cost, from the usage the API returned. */
export function actualCost(usage) {
  if (!usage) return null
  const input = (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0)
  return (input / 1e6) * PRICE_IN + ((usage.output_tokens || 0) / 1e6) * PRICE_OUT
}
