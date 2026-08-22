// Which AI service the app talks to, and how.
//
// LibrAPP started against Anthropic because that is what the author had a key
// for, and for a while the two were wired together. They are not the same
// thing: "read these spines" and "answer this about my catalog" are ordinary
// requests that several services can serve, and the person paying for one
// should not have to buy another.
//
// So there is a small registry here. Every provider offers the same two jobs
// and returns the same two shapes; everything above this file -- the shelf
// reader, the desk, the key box -- asks for a job and never asks who did it.
//
// Three families cover the field:
//
//   anthropic  the official SDK, kept because its structured-output path is
//              already proven here and its errors are worth translating well
//   openai     the /chat/completions shape, which OpenAI, OpenRouter, Groq,
//              Mistral, DeepSeek, xAI, LM Studio and llama.cpp all speak --
//              one adapter, several base URLs, plus a free slot for any
//              address you like
//   google     Gemini, which is close enough to be worth its own adapter and
//              different enough to need one
//
// A browser can only reach a service that allows cross-origin requests. The
// hosted ones here do. A server on your own machine usually has to be told to,
// and the error says so when it happens.

/**
 * What a transcription must look like, in plain JSON Schema.
 *
 * The Anthropic path builds this from zod; the others need the schema itself.
 * One definition, so a change cannot land on one provider and not the rest.
 */
export const TRANSCRIPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['photo', 'shelves'],
  properties: {
    photo: { type: 'string', description: 'the photograph filename, given to you' },
    shelves: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['location', 'books'],
        properties: {
          location: { type: 'string', description: 'where on the shelf, e.g. "top shelf, left"' },
          books: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: [
                'title',
                'authors',
                'publisher',
                'series',
                'series_index',
                'confidence',
                'notes',
              ],
              properties: {
                title: {
                  type: 'string',
                  description: 'exactly as printed on the spine, subtitle included',
                },
                authors: { type: 'array', items: { type: 'string' } },
                publisher: { type: ['string', 'null'] },
                series: { type: ['string', 'null'] },
                series_index: { type: ['integer', 'null'] },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                notes: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    },
  },
}

/** Gemini takes a near-miss of JSON Schema: no additionalProperties, nullable is a flag. */
export function toGeminiSchema(node) {
  if (Array.isArray(node)) return node.map(toGeminiSchema)
  if (!node || typeof node !== 'object') return node
  const out = {}
  for (const [key, value] of Object.entries(node)) {
    if (key === 'additionalProperties') continue
    if (key === 'type' && Array.isArray(value)) {
      out.type = value.find((t) => t !== 'null')
      if (value.includes('null')) out.nullable = true
      continue
    }
    out[key] = toGeminiSchema(value)
  }
  if (out.type === 'object' && out.properties) out.propertyOrdering = Object.keys(out.properties)
  return out
}

/**
 * The services LibrAPP knows how to reach.
 *
 * `keyPattern` is a hint, never a gate. It exists to catch a paste that went
 * obviously wrong before a request is spent, and the interface lets a person
 * overrule it — because a service can change its key format overnight, as
 * Google did when Gemini moved from AIza to AQ. keys, and a pattern that has
 * gone stale must never be the reason someone cannot use a key that works.
 * Being wrong the other way costs one refused request, which says so plainly.
 *
 * `models` are suggestions, not a fence -- every provider lets you type a model
 * name it does not list, because the list here goes stale and your account does
 * not. `prices` is filled in only where it has been checked; where it is absent
 * the estimate shows tokens and tells you to look up your own rate, rather than
 * inventing a number and putting a dollar sign in front of it.
 */
export const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Anthropic - Claude',
    family: 'anthropic',
    keysAt: 'https://console.anthropic.com/settings/keys',
    keyHint: 'sk-ant-…',
    keyPattern: /^sk-ant-[\w-]{20,}$/,
    host: 'api.anthropic.com',
    defaultModel: 'claude-opus-5',
    models: [
      { id: 'claude-opus-5', label: 'Opus 5 - most capable', prices: { in: 5, out: 25 } },
      { id: 'claude-sonnet-5', label: 'Sonnet 5 - balanced', prices: { in: 3, out: 15 } },
      { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 - cheapest', prices: { in: 1, out: 5 } },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    family: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    keysAt: 'https://platform.openai.com/api-keys',
    keyHint: 'sk-…',
    keyPattern: /^sk-[\w-]{20,}$/,
    host: 'api.openai.com',
    defaultModel: 'gpt-5',
    models: [{ id: 'gpt-5' }, { id: 'gpt-5-mini' }, { id: 'gpt-4.1' }, { id: 'gpt-4.1-mini' }],
  },
  {
    id: 'google',
    label: 'Google - Gemini',
    family: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keysAt: 'https://aistudio.google.com/apikey',
    keyHint: 'AIza… or AQ.…',
    // Google issues two shapes: the older Standard keys beginning AIza, and the
    // newer Auth keys beginning AQ. which contain dots. Matching on either
    // prefix would only postpone this, so the check is a length sanity test on
    // an opaque credential and nothing more.
    keyPattern: /^[\w.-]{30,}$/,
    host: 'generativelanguage.googleapis.com',
    defaultModel: 'gemini-2.5-pro',
    models: [{ id: 'gemini-2.5-pro' }, { id: 'gemini-2.5-flash' }],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter - many models, one key',
    family: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    keysAt: 'https://openrouter.ai/keys',
    keyHint: 'sk-or-…',
    keyPattern: /^sk-or-[\w-]{20,}$/,
    host: 'openrouter.ai',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    models: [
      { id: 'anthropic/claude-sonnet-4.5' },
      { id: 'openai/gpt-4.1' },
      { id: 'google/gemini-2.5-pro' },
      { id: 'meta-llama/llama-4-maverick' },
    ],
  },
  {
    id: 'custom',
    label: 'Anything else that speaks the OpenAI shape',
    family: 'openai',
    baseUrl: '',
    editableBaseUrl: true,
    keyHint: 'whatever your service expects',
    keyPattern: /.+/,
    optionalKey: true,
    defaultModel: '',
    models: [],
  },
]

export const providerById = (id) => PROVIDERS.find((p) => p.id === id) || PROVIDERS[0]

/** The published rate for a model, if it has been checked. Absent means: do not guess. */
export function pricesFor(providerId, modelId) {
  const model = providerById(providerId).models.find((m) => m.id === modelId)
  return model?.prices || null
}
