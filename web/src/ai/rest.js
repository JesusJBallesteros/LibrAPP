// The two provider families that are reached with plain fetch.
//
// Neither needs an SDK. Both are a POST with a JSON body, and both can stream
// their answer as server-sent events, so most of what follows is the same
// request expressed twice and normalised to one shape.
//
// The shape everything above expects:
//
//   readShelf -> { transcription, usage }
//   ask       -> { text, usage }
//   usage     -> { input_tokens, output_tokens }
//
// Errors are turned into sentences a person can act on. A browser cannot tell
// "the server refused the origin" apart from "there is no server", since both
// arrive as a bare TypeError, so one message has to cover both.

import { ReplyTruncated, TRANSCRIPTION_SCHEMA, replyTokens, toGeminiSchema } from './providers.js'

export class KeyRejected extends Error {}

/**
 * The model in the box is not one this service will answer to.
 *
 * Its own kind, because the remedy is its own: nothing about the key, the
 * request or the connection is wrong, and the one thing to do about it is
 * choose a different model. The box that holds that field says so when it sees
 * this.
 */
export class ModelUnknown extends Error {
  constructor(host, model, detail) {
    super(
      `${host} will not answer to the model ${JSON.stringify(model || '(none)')}. ` +
        `Services retire model names on their own schedule, so a name that worked ` +
        `before can stop. Choose another in the AI service box. ${detail}`.trim(),
    )
    this.name = 'ModelUnknown'
    this.model = model
  }
}

const dataUrl = (base64) => `data:image/jpeg;base64,${base64}`

/** Whatever the service put in its error body, or the status if it said nothing. */
async function describe(response) {
  let detail = ''
  try {
    const body = await response.json()
    detail = body?.error?.message || body?.error?.status || body?.message || ''
  } catch {
    detail = (await response.text().catch(() => '')).slice(0, 300)
  }
  return detail || `HTTP ${response.status}`
}

async function check(response, host, model) {
  if (response.ok) return response
  const detail = await describe(response)
  if (response.status === 401 || response.status === 403) {
    throw new KeyRejected(`${host} rejected that key: ${detail}`)
  }
  // A retired model is a 404 at OpenAI and Google and a 400 at some of the
  // services wearing the same interface, and either way the body says so. The
  // status alone cannot tell a wrong model from a wrong address, so the body
  // is read before deciding which of the two this is.
  if (response.status === 404 || (response.status === 400 && /model/i.test(detail))) {
    if (model && (response.status === 404 || /model/i.test(detail))) {
      throw new ModelUnknown(host, model, detail)
    }
    throw new Error(`${host} does not know that model or that address: ${detail}`)
  }
  if (response.status === 429) {
    throw new Error(`Rate limited by ${host}. Wait a moment and try again.`)
  }
  throw new Error(`${host} refused the request (${response.status}): ${detail}`)
}

/** A failed fetch says nothing useful on its own, so say what it usually means. */
const unreachable = (host) =>
  new Error(
    `Could not reach ${host}. Either you are offline, or that service does not allow requests ` +
      `from a web page. A server running on your own machine has to be told to accept this ` +
      `address before a browser is allowed to talk to it.`,
  )

async function post(url, { headers, body, signal, host, model }) {
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw unreachable(host)
  }
  return check(response, host, model)
}

/** The same, for the one thing that is asked rather than told: what is on offer. */
async function get(url, { headers, signal, host }) {
  let response
  try {
    response = await fetch(url, { headers, signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw unreachable(host)
  }
  return check(response, host)
}

/** Walk a server-sent-event body, yielding each data payload that is not [DONE]. */
async function* events(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })
    let cut
    while ((cut = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, cut).trim()
      buffer = buffer.slice(cut + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return
      try {
        yield JSON.parse(payload)
      } catch {
        // A frame split across reads; the next one completes it.
      }
    }
  }
}

/* ------------------------------------------------------------------ openai -- */

const openaiUsage = (usage) => ({
  input_tokens: usage?.prompt_tokens || 0,
  output_tokens: usage?.completion_tokens || 0,
})

/**
 * The newest OpenAI models refuse `max_tokens` and want `max_completion_tokens`;
 * most services wearing the same interface only know the older name. Send the
 * one the host in front of us understands.
 */
const tokenCap = (provider, value) =>
  provider.id === 'openai' ? { max_completion_tokens: value } : { max_tokens: value }

export const openai = {
  /**
   * What this key can actually ask for.
   *
   * Every service in this family answers GET /models with the names it will
   * take. A hand-typed address may not, and the caller shows what came back
   * rather than insisting.
   */
  async listModels({ baseUrl, apiKey, host, signal }) {
    const response = await get(`${baseUrl}/models`, {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
      host,
      signal,
    })
    const body = await response.json()
    return (body?.data || [])
      .map((model) => model?.id)
      .filter(Boolean)
      .sort()
  },

  /** Images first, each labelled, then the instructions. */
  shelfContent({ tiles, tail }) {
    const content = []
    for (const tile of tiles) {
      content.push({ type: 'text', text: `Piece at row ${tile.row}, column ${tile.column}:` })
      content.push({ type: 'image_url', image_url: { url: dataUrl(tile.base64) } })
    }
    content.push({ type: 'text', text: tail })
    return content
  },

  async readShelf({ provider, baseUrl, apiKey, model, content, host, signal }) {
    const response = await post(`${baseUrl}/chat/completions`, {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
      signal,
      host,
      model,
      body: {
        model,
        messages: [{ role: 'user', content }],
        ...tokenCap(provider, replyTokens(provider.family, 'shelf')),
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'transcription', strict: true, schema: TRANSCRIPTION_SCHEMA },
        },
      },
    })
    const body = await response.json()
    const choice = body.choices?.[0]
    if (choice?.message?.refusal) throw new Error(choice.message.refusal)
    // Said before the empty and unparseable checks below, because both are
    // symptoms of this and neither names the cause.
    if (choice?.finish_reason === 'length') throw new ReplyTruncated()
    const text = choice?.message?.content
    if (!text) throw new Error('The reply was empty. Nothing was imported.')
    let transcription
    try {
      transcription = JSON.parse(text)
    } catch {
      throw new Error('The reply was not the transcription format asked for. Nothing was imported.')
    }
    return { transcription, usage: openaiUsage(body.usage) }
  },

  async ask({ provider, baseUrl, apiKey, model, request, onText, signal, host }) {
    const response = await post(`${baseUrl}/chat/completions`, {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
      signal,
      host,
      model,
      body: {
        model,
        messages: [{ role: 'user', content: request }],
        ...tokenCap(provider, replyTokens(provider.family, 'ask')),
        stream: true,
        stream_options: { include_usage: true },
      },
    })
    let text = ''
    let usage = null
    for await (const frame of events(response)) {
      if (frame.usage) usage = openaiUsage(frame.usage)
      const piece = frame.choices?.[0]?.delta?.content
      if (!piece) continue
      text += piece
      onText?.(piece)
    }
    return { text, usage }
  },
}

/* ------------------------------------------------------------------ google -- */

const googleUsage = (meta) => ({
  input_tokens: meta?.promptTokenCount || 0,
  output_tokens: meta?.candidatesTokenCount || 0,
})

const googleText = (body) =>
  (body?.candidates?.[0]?.content?.parts || []).map((part) => part.text || '').join('')

export const google = {
  /**
   * What this key can actually ask for.
   *
   * Google returns every model it hosts, most of which cannot answer this kind
   * of request at all: transcription, speech, embeddings. Only the ones that
   * generate content are offered, and the models/ prefix is dropped because
   * that is not how the name is written in the box.
   */
  async listModels({ baseUrl, apiKey, host, signal }) {
    const response = await get(`${baseUrl}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': apiKey },
      host,
      signal,
    })
    const body = await response.json()
    return (body?.models || [])
      .filter((model) => (model?.supportedGenerationMethods || []).includes('generateContent'))
      .map((model) => String(model?.name || '').replace(/^models\//, ''))
      .filter(Boolean)
      .sort()
  },

  shelfContent({ tiles, tail }) {
    const parts = []
    for (const tile of tiles) {
      parts.push({ text: `Piece at row ${tile.row}, column ${tile.column}:` })
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: tile.base64 } })
    }
    parts.push({ text: tail })
    return parts
  },

  async readShelf({ baseUrl, apiKey, model, content, host, signal }) {
    const response = await post(`${baseUrl}/models/${model}:generateContent`, {
      headers: { 'x-goog-api-key': apiKey },
      signal,
      host,
      model,
      body: {
        contents: [{ role: 'user', parts: content }],
        generationConfig: {
          maxOutputTokens: replyTokens('google', 'shelf'),
          responseMimeType: 'application/json',
          responseSchema: toGeminiSchema(TRANSCRIPTION_SCHEMA),
        },
      },
    })
    const body = await response.json()
    const text = googleText(body)
    // Google reports the cut in the candidate rather than in the body, and it
    // reports it whether or not any text came back, so this is asked first.
    if (body?.candidates?.[0]?.finishReason === 'MAX_TOKENS') throw new ReplyTruncated()
    if (!text) {
      const why = body?.candidates?.[0]?.finishReason
      throw new Error(
        why && why !== 'STOP'
          ? `The model stopped early (${why}). Nothing was imported.`
          : 'The reply was empty. Nothing was imported.',
      )
    }
    let transcription
    try {
      transcription = JSON.parse(text)
    } catch {
      throw new Error('The reply was not the transcription format asked for. Nothing was imported.')
    }
    return { transcription, usage: googleUsage(body.usageMetadata) }
  },

  async ask({ baseUrl, apiKey, model, request, onText, signal, host }) {
    const response = await post(`${baseUrl}/models/${model}:streamGenerateContent?alt=sse`, {
      headers: { 'x-goog-api-key': apiKey },
      signal,
      host,
      model,
      body: {
        contents: [{ role: 'user', parts: [{ text: request }] }],
        generationConfig: { maxOutputTokens: replyTokens('google', 'ask') },
      },
    })
    let text = ''
    let usage = null
    for await (const frame of events(response)) {
      if (frame.usageMetadata) usage = googleUsage(frame.usageMetadata)
      const piece = googleText(frame)
      if (!piece) continue
      text += piece
      onText?.(piece)
    }
    return { text, usage }
  },
}
