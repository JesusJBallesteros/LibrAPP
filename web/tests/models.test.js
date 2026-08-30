// A model name is the one setting in this app that goes stale on somebody
// else's schedule.
//
// A reader pasted a key, took the model the app suggested, and months later
// Google stopped answering to it: still documented, still spelled right, and
// refused for anyone who had not used it before. The list in the registry
// cannot prevent that, because the list is written here and the retirement
// happens there.
//
// So two things are checked. That a refusal of this kind is recognised as its
// own kind and says which name was refused, rather than arriving as a 404 about
// "that model or that address". And that each family can be asked what it
// actually offers, which is the only list that cannot be out of date.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { KeyRejected, ModelUnknown, google, openai } from '../src/ai/rest.js'

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
})

const answering = (status, body) => {
  const fetch = vi.fn(async () => reply(status, body))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const shelf = {
  baseUrl: 'https://example.test/v1',
  apiKey: 'k',
  model: 'gemini-2.5-pro',
  host: 'example.test',
  content: [],
}

afterEach(() => vi.unstubAllGlobals())

describe('a model the service will not answer to', () => {
  it('is its own kind of failure, and names the model', async () => {
    answering(404, {
      error: { message: 'This model models/gemini-2.5-pro is no longer available to new users.' },
    })
    const failure = await google.readShelf(shelf).catch((e) => e)
    expect(failure).toBeInstanceOf(ModelUnknown)
    expect(failure.model).toBe('gemini-2.5-pro')
    expect(failure.message).toContain('gemini-2.5-pro')
  })

  it('says the one thing there is to do about it', async () => {
    answering(404, { error: { message: 'no such model' } })
    const failure = await google.readShelf(shelf).catch((e) => e)
    // Not the key, not the connection, not the request. The field.
    expect(failure.message).toMatch(/AI service box/)
    expect(failure.message).toMatch(/retire/)
  })

  it('keeps what the service itself said', async () => {
    answering(404, { error: { message: 'Please update your code to use models/gemini-3.1-pro' } })
    const failure = await google.readShelf(shelf).catch((e) => e)
    expect(failure.message).toContain('gemini-3.1-pro')
  })

  it('recognises the 400 that some services send instead', async () => {
    // The OpenAI shape is spoken by a dozen services and they do not agree on
    // the status for this. What they agree on is saying "model" in the body.
    answering(400, { error: { message: 'The model `gpt-4.1` does not exist' } })
    const failure = await openai
      .readShelf({ ...shelf, provider: { id: 'openai' }, model: 'gpt-4.1' })
      .catch((e) => e)
    expect(failure).toBeInstanceOf(ModelUnknown)
  })

  it('leaves a 400 about anything else alone', async () => {
    answering(400, { error: { message: 'image too large' } })
    const failure = await openai
      .readShelf({ ...shelf, provider: { id: 'openai' } })
      .catch((e) => e)
    expect(failure).not.toBeInstanceOf(ModelUnknown)
    expect(failure.message).toContain('image too large')
  })

  it('is not what a refused key looks like', async () => {
    answering(401, { error: { message: 'invalid key' } })
    const failure = await google.readShelf(shelf).catch((e) => e)
    expect(failure).toBeInstanceOf(KeyRejected)
    expect(failure).not.toBeInstanceOf(ModelUnknown)
  })
})

describe('asking a service what it offers', () => {
  it('reads the OpenAI shape, in order', async () => {
    answering(200, { data: [{ id: 'gpt-5.6-terra' }, { id: 'gpt-5.6-luna' }] })
    const ids = await openai.listModels({ baseUrl: 'https://example.test/v1', apiKey: 'k' })
    expect(ids).toEqual(['gpt-5.6-luna', 'gpt-5.6-terra'])
  })

  it('sends the key as a bearer token, and asks rather than tells', async () => {
    const fetch = answering(200, { data: [] })
    await openai.listModels({ baseUrl: 'https://example.test/v1', apiKey: 'secret' })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://example.test/v1/models')
    expect(init.method).toBeUndefined()
    expect(init.headers.authorization).toBe('Bearer secret')
  })

  it('asks a keyless address without an empty authorization header', async () => {
    // A model on the reader's own machine has nobody to bill, and some of those
    // servers refuse a header they were not expecting.
    const fetch = answering(200, { data: [] })
    await openai.listModels({ baseUrl: 'http://localhost:1234/v1', apiKey: null })
    expect(fetch.mock.calls[0][1].headers).toEqual({})
  })

  it('drops the models/ prefix Google writes and the box does not', async () => {
    answering(200, {
      models: [
        { name: 'models/gemini-3.7-flash', supportedGenerationMethods: ['generateContent'] },
      ],
    })
    const ids = await google.listModels({ baseUrl: 'https://example.test/v1beta', apiKey: 'k' })
    expect(ids).toEqual(['gemini-3.7-flash'])
  })

  it('leaves out the Google models that cannot answer this kind of request', async () => {
    // Google returns everything it hosts: embeddings, speech, transcription.
    // Offering one of those would hand the reader a name that fails on use.
    answering(200, {
      models: [
        { name: 'models/gemini-3.7-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-005', supportedGenerationMethods: ['embedContent'] },
        { name: 'models/gemini-3.5-transcribe', supportedGenerationMethods: ['transcribe'] },
      ],
    })
    const ids = await google.listModels({ baseUrl: 'https://example.test/v1beta', apiKey: 'k' })
    expect(ids).toEqual(['gemini-3.7-flash'])
  })

  it('sends the Google key in the header rather than the address', async () => {
    // A key in a query string is a key in a log.
    const fetch = answering(200, { models: [] })
    await google.listModels({ baseUrl: 'https://example.test/v1beta', apiKey: 'secret' })
    const [url, init] = fetch.mock.calls[0]
    expect(url).not.toContain('secret')
    expect(init.headers['x-goog-api-key']).toBe('secret')
  })

  it('returns nothing rather than throwing when a service answers with nothing', async () => {
    answering(200, {})
    expect(await openai.listModels({ baseUrl: 'https://example.test/v1', apiKey: 'k' })).toEqual([])
    expect(await google.listModels({ baseUrl: 'https://example.test/v1', apiKey: 'k' })).toEqual([])
  })

  it('reports a refused key as a refused key', async () => {
    answering(401, { error: { message: 'invalid key' } })
    const failure = await openai
      .listModels({ baseUrl: 'https://example.test/v1', apiKey: 'k', host: 'example.test' })
      .catch((e) => e)
    expect(failure).toBeInstanceOf(KeyRejected)
  })
})
