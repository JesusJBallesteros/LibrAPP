// A mistake in the provider registry costs real money at somebody else's API.
// Nothing here makes a request. What is checked is that the registry is
// internally consistent, that the schema handed to a model says the same thing
// in all three dialects, and that no price is invented.
//
// keyPattern is a hint and not a gate, since the key box can save a key it does
// not recognise. A wrong pattern is therefore a nuisance and not a lockout, so
// these tests hold it to catching obvious rubbish rather than to knowing every
// shape a service will ever issue.

import { describe, expect, it } from 'vitest'
import { explain } from '../src/ai/anthropic.js'
import {
  PROVIDERS,
  ReplyTruncated,
  TRANSCRIPTION_SCHEMA,
  pricesFor,
  providerById,
  replyTokens,
  toGeminiSchema,
} from '../src/ai/providers.js'
import { estimateAskCost, estimateShelfCost, visualTokens } from '../src/ai/model.js'

const FAMILIES = new Set(['anthropic', 'openai', 'google'])

describe('the registry', () => {
  it.each(PROVIDERS.map((p) => [p.id, p]))('%s is completely described', (_id, provider) => {
    expect(FAMILIES).toContain(provider.family)
    expect(provider.label).toBeTruthy()
    expect(provider.keyPattern).toBeInstanceOf(RegExp)
    expect(Array.isArray(provider.models)).toBe(true)
  })

  it.each(PROVIDERS.filter((p) => !p.editableBaseUrl).map((p) => [p.id, p]))(
    '%s knows where to send a request without being told',
    (_id, provider) => {
      // Only the free-slot provider may start without an address; everything
      // else must work the moment a key is pasted in.
      expect(provider.family === 'anthropic' || provider.baseUrl).toBeTruthy()
      expect(provider.defaultModel).toBeTruthy()
      expect(provider.models.map((m) => m.id)).toContain(provider.defaultModel)
    },
  )

  it.each(PROVIDERS.filter((p) => p.keysAt).map((p) => [p.id, p]))(
    '%s sends people somewhere over https for a key',
    (_id, provider) => {
      expect(provider.keysAt).toMatch(/^https:\/\//)
    },
  )

  it('has key patterns that accept their own example', () => {
    const anthropic = providerById('anthropic')
    const openai = providerById('openai')
    expect(anthropic.keyPattern.test('sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaa')).toBe(true)
    // An Anthropic key pasted into the OpenAI slot is a mistake worth catching,
    // but not one this check can make: sk-ant- starts with sk-. What must not
    // happen is the reverse.
    expect(anthropic.keyPattern.test('sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(false)
    expect(openai.keyPattern.test('not-a-key')).toBe(false)
  })

  describe('Google, which has issued two shapes of key', () => {
    const google = providerById('google')

    it('accepts the older Standard key beginning AIza', () => {
      expect(google.keyPattern.test('AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r')).toBe(true)
    })

    it('accepts the newer Auth key beginning AQ., dots and all', () => {
      // The bug this test exists for: the pattern was built out of \w, which
      // does not include a dot, so every new Gemini key was refused before a
      // request was ever made.
      expect(google.keyPattern.test('AQ.Ab8RN6JJmHwZq3tVx7Yn2Kd9Lf4Gs1Pc0Wu5Er6Ty8Ui3Oa')).toBe(true)
    })

    it('still turns away something that is plainly not a key', () => {
      expect(google.keyPattern.test('hello')).toBe(false)
      expect(google.keyPattern.test('')).toBe(false)
    })
  })

  it('falls back to a real provider when asked for one that does not exist', () => {
    expect(providerById('nonesuch').id).toBe(PROVIDERS[0].id)
    expect(providerById(undefined).id).toBe(PROVIDERS[0].id)
  })
})

describe('the transcription schema', () => {
  const book =
    TRANSCRIPTION_SCHEMA.properties.shelves.items.properties.books.items

  it('demands a title and a confidence from every book', () => {
    expect(book.required).toContain('title')
    expect(book.required).toContain('confidence')
    expect(book.properties.confidence.enum).toEqual(['high', 'medium', 'low'])
  })

  it('allows the fields a spine may not show to be null', () => {
    for (const field of ['publisher', 'series', 'series_index', 'notes']) {
      expect(book.properties[field].type, field).toContain('null')
    }
  })
})

describe('translating the schema for Gemini', () => {
  it('turns a nullable union into the flag Gemini expects', () => {
    expect(toGeminiSchema({ type: ['string', 'null'] })).toEqual({ type: 'string', nullable: true })
  })

  it('leaves a plain type alone', () => {
    expect(toGeminiSchema({ type: 'string' })).toEqual({ type: 'string' })
  })

  it('drops additionalProperties, which Gemini rejects outright', () => {
    const out = toGeminiSchema(TRANSCRIPTION_SCHEMA)
    expect(JSON.stringify(out)).not.toContain('additionalProperties')
  })

  it('keeps every property, and says what order they come in', () => {
    const out = toGeminiSchema(TRANSCRIPTION_SCHEMA)
    expect(Object.keys(out.properties)).toEqual(['photo', 'shelves'])
    expect(out.propertyOrdering).toEqual(['photo', 'shelves'])
  })

  it('reaches all the way down, not just the top level', () => {
    const out = toGeminiSchema(TRANSCRIPTION_SCHEMA)
    const geminiBook = out.properties.shelves.items.properties.books.items
    expect(geminiBook.properties.publisher).toEqual({ type: 'string', nullable: true })
    expect(geminiBook.required).toContain('title')
  })
})

describe('what a shelf will cost', () => {
  const tiles = [{ size: [1250, 1000] }, { size: [1250, 1000] }]

  it('counts a tile as the patches a vision model sees', () => {
    expect(visualTokens(28, 28)).toBe(1)
    expect(visualTokens(1250, 1000)).toBe(Math.ceil(1250 / 28) * Math.ceil(1000 / 28))
  })

  it('gives a figure when the rate is known', () => {
    const priced = estimateShelfCost(tiles, { in: 5, out: 25 })
    expect(priced.dollars).toBeGreaterThan(0)
    expect(priced.inputTokens).toBeGreaterThan(2 * visualTokens(1250, 1000))
  })

  it('gives tokens and no figure when the rate is not', () => {
    // A guessed price with a dollar sign in front of it is worse than none.
    const unpriced = estimateShelfCost(tiles, null)
    expect(unpriced.dollars).toBeNull()
    expect(unpriced.inputTokens).toBeGreaterThan(0)
  })

  it('estimates a question from the text that will be sent', () => {
    const short = estimateAskCost('a'.repeat(400), null)
    const long = estimateAskCost('a'.repeat(4000), null)
    expect(long.inputTokens).toBeGreaterThan(short.inputTokens)
    expect(short.inputTokens).toBeGreaterThan(0)
  })

  it('prices a question where the rate is known, and not where it is not', () => {
    expect(estimateAskCost('a'.repeat(4000), { in: 5, out: 25 }).dollars).toBeGreaterThan(0)
    expect(estimateAskCost('a'.repeat(4000), null).dollars).toBeNull()
  })

  it('estimates an empty question as costing the answer alone', () => {
    const empty = estimateAskCost('', { in: 5, out: 25 })
    expect(empty.inputTokens).toBe(0)
    expect(empty.dollars).toBeGreaterThan(0)
  })

  it('only claims a price for a model whose rate has been checked', () => {
    expect(pricesFor('anthropic', 'claude-opus-5')).toEqual({ in: 5, out: 25 })
    expect(pricesFor('anthropic', 'some-model-invented-later')).toBeNull()
    expect(pricesFor('custom', 'llama-on-my-laptop')).toBeNull()
  })
})

// A reply that runs out of room does not come back short, it comes back
// unparseable: a JSON document that stops mid-string. Every route has to
// recognise that and say the same thing, because the cause and the remedy are
// the same wherever it happens.
describe('running out of room for the reply', () => {
  it('gives a shelf read more room than a question', () => {
    // A shelf read returns one document covering every tile; a question returns
    // prose. They are not the same size of answer.
    for (const family of ['anthropic', 'openai', 'google']) {
      expect(replyTokens(family, 'shelf'), family).toBeGreaterThan(replyTokens(family, 'ask'))
    }
  })

  it('has a budget for every family in the registry', () => {
    for (const provider of PROVIDERS) {
      expect(replyTokens(provider.family, 'shelf'), provider.id).toBeGreaterThan(0)
      expect(replyTokens(provider.family, 'ask'), provider.id).toBeGreaterThan(0)
    }
  })

  it('falls back rather than returning nothing for a family it does not know', () => {
    // A budget of undefined reaches the API as a missing field and the request
    // behaves differently per host. A wrong number is better than no number.
    expect(replyTokens('a-family-added-later', 'shelf')).toBeGreaterThan(0)
  })

  it('says what happened and what to do about it', () => {
    const message = new ReplyTruncated().message
    expect(message).toMatch(/cut off/i)
    expect(message).toMatch(/fewer tiles|untick/i)
    // No offsets, no parser vocabulary: the reader cannot act on either.
    expect(message).not.toMatch(/JSON|position \d+/)
  })

  it('is recognisable as its own kind of failure', () => {
    // The shelf view needs to tell this apart from a rejected key.
    expect(new ReplyTruncated()).toBeInstanceOf(Error)
    expect(new ReplyTruncated().name).toBe('ReplyTruncated')
  })
})

// The Anthropic route hands the reply to the SDK, which parses it internally.
// A document that stopped mid-string therefore arrives as a parser complaint
// with a byte offset in it, and that is what a reader saw reported in issue 12.
describe('an SDK parse failure reaching the reader', () => {
  it('maps the message from the field report onto something actionable', () => {
    const reported = new Error(
      'Failed to parse structured output as JSON: Unterminated string in JSON at position 25599',
    )
    expect(explain(reported)).toBeInstanceOf(ReplyTruncated)
  })

  it('maps the other shapes a JSON parser produces', () => {
    for (const message of [
      'Unexpected end of JSON input',
      'Failed to parse structured output as JSON: Unexpected token } in JSON at position 8',
    ]) {
      expect(explain(new Error(message)), message).toBeInstanceOf(ReplyTruncated)
    }
  })

  it('leaves an unrelated error alone rather than blaming the length', () => {
    // Calling every failure a truncation would send people to shorten a request
    // that was never too long.
    const other = new Error('The network connection was lost.')
    expect(explain(other)).toBe(other)
  })

  it('does not swallow a stop the caller already recognised', () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' })
    expect(explain(abort)).toBe(abort)
  })
})

// The SDK will not send a request it judges could run past ten minutes unless
// it is streamed, and it judges that from max_tokens alone, before anything
// leaves the browser. Raising the shelf budget to 32000 crossed that line and
// broke every Anthropic read, including a single tile, until the read was
// streamed. The arithmetic is the SDK's own, copied here so a later change to
// the budget has to face it.
describe('the ceiling on a request that is not streamed', () => {
  // client.js: expectedTime = (60 min * maxTokens) / 128000, refused above 10.
  const NON_STREAMING_CEILING = (10 * 60 * 1000) * 128000 / (60 * 60 * 1000)

  it('sits at 21333 tokens', () => {
    expect(Math.floor(NON_STREAMING_CEILING)).toBe(21333)
  })

  it('is one the shelf budget deliberately exceeds', () => {
    // Not a mistake to correct by lowering it. A shelf read needs the room,
    // which is why that call streams.
    expect(replyTokens('anthropic', 'shelf')).toBeGreaterThan(NON_STREAMING_CEILING)
  })

  it('leaves the question budget under it, since that call is short', () => {
    for (const family of ['anthropic', 'openai', 'google']) {
      expect(replyTokens(family, 'ask'), family).toBeLessThan(NON_STREAMING_CEILING)
    }
  })
})
