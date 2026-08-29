// Which AI service the app talks to, and how.
//
// LibrAPP was wired directly to Anthropic at first. Reading spines and
// answering a question about a catalog are ordinary requests that several
// services can serve, so the wiring is now a registry. Every provider offers
// the same two jobs and returns the same two shapes, and everything above this
// file asks for a job without naming a service.
//
// Three families cover the field:
//
//   anthropic  the official SDK, kept for its structured-output path and its
//              typed errors
//   openai     the /chat/completions shape, spoken by OpenAI, OpenRouter, Groq,
//              Mistral, DeepSeek, xAI, LM Studio and llama.cpp. One adapter,
//              several base URLs, and a free slot for any other address
//   google     Gemini, close enough to share the shape and different enough to
//              need its own adapter
//
// A browser can only reach a service that allows cross-origin requests. The
// hosted ones here do. A local server usually has to be configured to, and the
// error says so when it happens.

/**
 * What a transcription must look like, in plain JSON Schema.
 *
 * The Anthropic path builds this from zod; the others need the schema itself.
 * One definition, so a change cannot reach one provider and miss the others.
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
                'genre',
                'confidence',
                'notes',
                'abstract',
                'published_year',
                'rating',
                'original_language',
                'pages',
                'flags',
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
                genre: { type: ['string', 'null'] },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                notes: { type: ['string', 'null'] },
                // Only filled in when the extras checklist asked for them, and
                // recalled rather than read. See ai/extras.js.
                abstract: { type: ['string', 'null'] },
                published_year: { type: ['integer', 'null'] },
                rating: { type: ['number', 'null'] },
                original_language: { type: ['string', 'null'] },
                pages: { type: ['integer', 'null'] },
                flags: { type: 'array', items: { type: 'string' } },
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
 * `keyPattern` is a hint and not a gate, and the key box lets it be overruled.
 * A service can change its key format overnight, as Google did when Gemini
 * moved from AIza to AQ. keys, and a stale pattern must not stop a working key
 * from being used. A pattern that is too loose costs one refused request, which
 * explains itself.
 *
 * `models` are suggestions. Every provider accepts a model name it does not
 * list, because this list goes stale and an account does not. `prices` is
 * filled in only where the rate has been checked. Where it is absent the
 * estimate shows tokens instead of a figure.
 */
/**
 * How much room a reply is given, in tokens.
 *
 * A shelf read returns one JSON document covering every tile, so its size grows
 * with the number of tiles and again with every extra ticked: an abstract is
 * two or three sentences per book. Running out mid-document does not produce a
 * short answer, it produces an unparseable one, so the ceiling has to sit well
 * above the largest honest reply.
 *
 * Per family, because the ceilings differ and asking for more than a model
 * allows is refused outright. Claude takes far more than this; the OpenAI
 * figure is what the smaller models in that family accept.
 */
export const REPLY_TOKENS = {
  anthropic: { shelf: 32000, ask: 8000 },
  openai: { shelf: 16000, ask: 8000 },
  google: { shelf: 16000, ask: 8000 },
}

export const replyTokens = (family, kind) =>
  REPLY_TOKENS[family]?.[kind] ?? REPLY_TOKENS.openai[kind]

/**
 * The same message for every route, because the cause and the remedy are the
 * same wherever it happens. Named rather than inline so the shelf view can
 * recognise it.
 */
export class ReplyTruncated extends Error {
  constructor() {
    super(
      'The reply was cut off before it finished, so none of it could be read. ' +
        'This happens when one request covers more books than a single answer has room for. ' +
        'Read fewer pieces at a time, or untick some of the extras, and try again.',
    )
    this.name = 'ReplyTruncated'
  }
}

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

/** The published rate for a model where it has been checked, otherwise null. */
export function pricesFor(providerId, modelId) {
  const model = providerById(providerId).models.find((m) => m.id === modelId)
  return model?.prices || null
}
