// The provider registry is the one place a mistake costs somebody real money at
// somebody else's API. Nothing here makes a request; what is checked is that the
// registry is internally consistent, that the schema a model is handed says the
// same thing in all three dialects, and that a price is never invented.

import { describe, expect, it } from 'vitest'
import {
  PROVIDERS,
  TRANSCRIPTION_SCHEMA,
  pricesFor,
  providerById,
  toGeminiSchema,
} from '../src/ai/providers.js'
import { estimateShelfCost, visualTokens } from '../src/ai/model.js'

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

  it('has key patterns that accept their own example and reject each other', () => {
    const anthropic = providerById('anthropic')
    const openai = providerById('openai')
    expect(anthropic.keyPattern.test('sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaa')).toBe(true)
    // An Anthropic key pasted into the OpenAI slot is a mistake worth catching,
    // but not one this check can make: sk-ant- starts with sk-. What must not
    // happen is the reverse.
    expect(anthropic.keyPattern.test('sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(false)
    expect(openai.keyPattern.test('not-a-key')).toBe(false)
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

  it('only claims a price for a model whose rate has been checked', () => {
    expect(pricesFor('anthropic', 'claude-opus-5')).toEqual({ in: 5, out: 25 })
    expect(pricesFor('anthropic', 'some-model-invented-later')).toBeNull()
    expect(pricesFor('custom', 'llama-on-my-laptop')).toBeNull()
  })
})
