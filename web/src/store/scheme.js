// Colour schemes.
//
// One palette ships in styles.css: walnut. Every other scheme is that palette
// turned to another hue, worked out here and written onto the document as
// overrides of the raw tokens. The presets and a colour somebody picks go
// through the same arithmetic, and each result is moved lighter or darker until
// it clears the contrast the stylesheet's own colours are held to.
//
// Only the colours that carry the scheme change: the accent, its tints, the
// spines and the genre chart. Paper, ink, rules and the good, warn and bad
// colours stay walnut's, so every contrast test on those still describes what
// is on screen.
//
// Stored in localStorage beside the theme, so index.html can put the colours on
// the document before the first paint. The computed tokens are stored with the
// choice, because the inline script has no room for the arithmetic; the app
// works them out again on start, so a change to this file reaches a saved
// scheme.

const KEY = 'librapp-scheme'

/** Walnut, exactly as styles.css defines it. A test holds the two together. */
export const WALNUT = {
  'l-accent': '#7a4a2b',
  'l-tan': '#d09a6e',
  'l-accent-soft': '#f2e6da',
  'd-accent': '#d09a6e',
  'd-tan': '#d09a6e',
  'd-accent-soft': '#33291f',
  'series-1': '#7a4a2b',
  'series-2': '#a4693e',
  'series-3': '#c68f63',
  'series-4': '#d9b189',
  'series-5': '#e8d3ba',
  'series-6': '#f0e4d2',
  'series-wide-1': '#6b4023',
  'series-wide-2': '#774f33',
  'series-wide-3': '#845e44',
  'series-wide-4': '#906d54',
  'series-wide-5': '#9c7c64',
  'series-wide-6': '#a88b74',
  'series-wide-7': '#b59b85',
  'series-wide-8': '#c1aa95',
  'series-wide-9': '#cdb9a5',
  'series-wide-10': '#d9c8b5',
  'series-wide-11': '#e6d7c6',
  'series-wide-12': '#f2e6d6',
  'spine-1': '#7a4a2b',
  'spine-2': '#d09a6e',
  'spine-3': '#9c5f38',
  'spine-4': '#c68f63',
  'spine-5': '#6b4023',
  'spine-6': '#b8794c',
  'spine-7': '#e0b489',
  'spine-8': '#8a5c3c',
  'spine-1-ink': '#faf7f2',
  'spine-2-ink': '#1c1508',
  'spine-3-ink': '#faf7f2',
  'spine-4-ink': '#1c1508',
  'spine-5-ink': '#faf7f2',
  'spine-6-ink': '#1c1508',
  'spine-7-ink': '#1c1508',
  'spine-8-ink': '#faf7f2',
}

/** The surfaces text is drawn on in each theme, and the paper a filled button's label uses. */
export const SURFACES = {
  l: ['#faf7f2', '#fffdf9', '#f3eee5', '#f7efe0'],
  d: ['#1c1915', '#23201b', '#15130f', '#2a251d'],
}
const PAPER = { l: '#faf7f2', d: '#1c1915' }
const FAINT = { l: '#564e43', d: '#b6afa6' }
const SPINE_INKS = ['#faf7f2', '#1c1508']

/** Held a little above 4.5, so rounding to whole hex steps cannot land under it. */
const TARGET = 5

export const PRESETS = [
  { id: 'walnut', hex: null },
  { id: 'slate', hex: '#4f6d8a' },
  { id: 'moss', hex: '#5d7a3c' },
  { id: 'plum', hex: '#7d4a78' },
]

// ------------------------------------------------------------------ colour --

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const hexOf = (rgb) =>
  '#' +
  rgb
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
    .join('')

export function luminance(hex) {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** [hue in degrees, saturation 0 to 1, lightness 0 to 1]. */
export function toHsl(hex) {
  const [r, g, b] = channels(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

export function fromHsl(h, s, l) {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    hue < 60 ? [c, x, 0]
      : hue < 120 ? [x, c, 0]
        : hue < 180 ? [0, c, x]
          : hue < 240 ? [0, x, c]
            : hue < 300 ? [x, 0, c]
              : [c, 0, x]
  return hexOf([(r + m) * 255, (g + m) * 255, (b + m) * 255])
}

/** Lighter (+1) or darker (-1) in small steps until the colour passes, or lightness runs out. */
function nudge(hex, direction, passes) {
  const [h, s] = toHsl(hex)
  let l = toHsl(hex)[2]
  let out = hex
  for (let i = 0; i < 100 && !passes(out); i += 1) {
    l = Math.min(1, Math.max(0, l + direction * 0.01))
    out = fromHsl(h, s, l)
  }
  return out
}

const worst = (colour, surfaces) => Math.min(...surfaces.map((s) => contrast(colour, s)))
const inkFor = (fill) =>
  SPINE_INKS.reduce((best, ink) => (contrast(fill, ink) > contrast(fill, best) ? ink : best))

const BASE_SATURATION = toHsl(WALNUT['l-accent'])[1]

/**
 * Every scheme token, for a scheme built around one colour.
 *
 * The colour gives the hue, and its saturation scales walnut's: a grey gives a
 * faint tint of its hue rather than nothing. Its lightness is not used, since
 * lightness is what the contrast work below has to be free to move.
 */
export function paletteFor(hex) {
  const [hue, saturation] = toHsl(hex)
  const scale = Math.min(1.6, Math.max(0.25, saturation / BASE_SATURATION))
  const turn = (colour) => {
    const [, s, l] = toHsl(colour)
    return fromHsl(hue, Math.min(1, s * scale), l)
  }

  const out = {}
  for (const [name, value] of Object.entries(WALNUT)) {
    if (!name.endsWith('-ink')) out[name] = turn(value)
  }

  // The tints first: the accent is drawn on them, so it is measured against them.
  out['l-accent-soft'] = nudge(out['l-accent-soft'], 1, (c) => contrast(FAINT.l, c) >= TARGET)
  out['d-accent-soft'] = nudge(out['d-accent-soft'], -1, (c) => contrast(FAINT.d, c) >= TARGET)

  // The accent is link text on every surface and the ground under a filled
  // button's label, so both have to read.
  out['l-accent'] = nudge(
    out['l-accent'],
    -1,
    (c) => worst(c, [...SURFACES.l, out['l-accent-soft']]) >= TARGET && contrast(PAPER.l, c) >= TARGET,
  )
  out['d-accent'] = nudge(
    out['d-accent'],
    1,
    (c) => worst(c, [...SURFACES.d, out['d-accent-soft']]) >= TARGET && contrast(PAPER.d, c) >= TARGET,
  )
  out['d-tan'] = out['d-accent']

  // Each spine takes whichever of the two inks reads better on it, and moves
  // away from the middle of the range if neither reads well enough.
  for (let i = 1; i <= 8; i += 1) {
    const fill = out[`spine-${i}`]
    const direction = toHsl(fill)[2] < 0.5 ? -1 : 1
    const settled = nudge(fill, direction, (c) => contrast(c, inkFor(c)) >= TARGET)
    out[`spine-${i}`] = settled
    out[`spine-${i}-ink`] = inkFor(settled)
  }

  return out
}

// ----------------------------------------------------------------- storage --

/** { id, hex } as chosen, or null for walnut. */
export function readScheme() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!stored?.id || stored.id === 'walnut' || !/^#[0-9a-f]{6}$/i.test(stored.hex || '')) return null
    return { id: stored.id, hex: stored.hex }
  } catch {
    return null
  }
}

/** Put a scheme's tokens on the document, or take every override off for walnut. */
export function applyScheme(vars) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const name of Object.keys(WALNUT)) root.style.removeProperty(`--${name}`)
  if (!vars) return
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(`--${name}`, value)
}

export function saveScheme(id, hex) {
  if (id === 'walnut' || !hex) {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // Nothing stored to clear.
    }
    applyScheme(null)
    return
  }
  const vars = paletteFor(hex)
  try {
    localStorage.setItem(KEY, JSON.stringify({ id, hex, vars }))
  } catch {
    // A browser refusing storage still gets the colours for this session.
  }
  applyScheme(vars)
}

/** Work the saved scheme out again and put it on the document. Called once on start. */
export function restoreScheme() {
  const saved = readScheme()
  if (saved) saveScheme(saved.id, saved.hex)
}
