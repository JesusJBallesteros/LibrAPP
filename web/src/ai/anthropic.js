// Anthropic, through the official SDK.
//
// The other providers are reached with plain fetch, and this one could be too.
// It keeps the SDK because two things here are worth having: `messages.parse`
// with a zod schema, which is the sturdiest of the structured-output paths, and
// typed errors, which turn a status code into a sentence naming what to do.
//
// The SDK refuses to run in a browser unless you say `dangerouslyAllowBrowser`,
// and the name is fair: a key held in a browser is readable by anything running
// on this origin. LibrAPP accepts that trade knowingly and narrowly — the key is
// optional, it is yours, it stays on your device, and the app works without it.
// A workspace-scoped key with a spend limit bounds the worst case to a small
// bill rather than an open tap.

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { KeyRejected } from './rest.js'

/** The same contract as TRANSCRIPTION_SCHEMA, in the form this SDK wants. */
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

/** Turn an SDK error into something worth showing a person. */
function explain(error) {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return error
  if (error instanceof Anthropic.AuthenticationError) {
    return new KeyRejected(
      'That key was rejected. Check it was copied whole, and that it is still active.',
    )
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

export const anthropic = {
  /** Images first, each labelled, then the instructions. */
  shelfContent({ tiles, tail }) {
    const content = []
    for (const tile of tiles) {
      content.push({ type: 'text', text: `Tile row ${tile.row}, column ${tile.column}:` })
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: tile.base64 },
      })
    }
    content.push({ type: 'text', text: tail })
    return content
  },

  async readShelf({ apiKey, model, content, signal }) {
    try {
      const response = await clientFor(apiKey).messages.parse(
        {
          model,
          max_tokens: 16000,
          thinking: { type: 'adaptive' },
          messages: [{ role: 'user', content }],
          output_config: { format: zodOutputFormat(Transcription) },
        },
        { signal },
      )
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
  },

  async ask({ apiKey, model, request, onText, signal }) {
    try {
      const stream = clientFor(apiKey).messages.stream(
        {
          model,
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
  },
}
