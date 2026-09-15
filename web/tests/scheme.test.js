// Colour schemes.
//
// Every scheme is walnut turned to another hue and then pushed lighter or
// darker until it reads. These check that the pushing worked, for the presets
// and for colours somebody might pick: the pure primaries, white, black, grey,
// a pale cream, a deep navy, and a sweep round the hue circle.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PRESETS, SURFACES, WALNUT, contrast, paletteFor, toHsl } from '../src/store/scheme.js'

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

const sweep = Array.from({ length: 12 }, (_, i) => {
  const h = i * 30
  // A mid colour at each hue, written as hex by hand to keep this test free of
  // the module's own conversion.
  const f = (n) => {
    const k = (n + h / 60) % 6
    return Math.round(255 * (0.55 - 0.35 * Math.max(Math.min(k, 4 - k, 1), 0)))
  }
  return '#' + [f(5), f(3), f(1)].map((v) => v.toString(16).padStart(2, '0')).join('')
})

const PICKS = [
  ...PRESETS.filter((p) => p.hex).map((p) => p.hex),
  '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
  '#ffffff', '#000000', '#808080', '#f5e6c8', '#1a1a40',
  ...sweep,
]

const worst = (colour, surfaces) => Math.min(...surfaces.map((s) => contrast(colour, s)))

describe('walnut', () => {
  it('matches the palette styles.css ships', () => {
    for (const [name, value] of Object.entries(WALNUT)) {
      const at = css.indexOf(`--${name}:`)
      expect(at, name).toBeGreaterThan(-1)
      expect(css.slice(at, css.indexOf(';', at)).toLowerCase(), name).toContain(value)
    }
  })

  it('is the default, with nothing written over the stylesheet', () => {
    expect(PRESETS[0]).toEqual({ id: 'walnut', hex: null })
  })
})

describe('every scheme reads', () => {
  for (const pick of PICKS) {
    const p = paletteFor(pick)

    it(`${pick}: gives a value for every token walnut has`, () => {
      expect(Object.keys(p).sort()).toEqual(Object.keys(WALNUT).sort())
      for (const value of Object.values(p)) expect(value).toMatch(/^#[0-9a-f]{6}$/)
    })

    it(`${pick}: accent text clears 4.5 on every surface and on its tint`, () => {
      expect(worst(p['l-accent'], [...SURFACES.l, p['l-accent-soft']])).toBeGreaterThanOrEqual(4.5)
      expect(worst(p['d-accent'], [...SURFACES.d, p['d-accent-soft']])).toBeGreaterThanOrEqual(4.5)
    })

    it(`${pick}: a filled button's label clears 4.5`, () => {
      expect(contrast('#faf7f2', p['l-accent'])).toBeGreaterThanOrEqual(4.5)
      expect(contrast('#1c1915', p['d-accent'])).toBeGreaterThanOrEqual(4.5)
    })

    it(`${pick}: the faintest text clears 4.5 on the tint`, () => {
      expect(contrast('#564e43', p['l-accent-soft'])).toBeGreaterThanOrEqual(4.5)
      expect(contrast('#b6afa6', p['d-accent-soft'])).toBeGreaterThanOrEqual(4.5)
    })

    it(`${pick}: every spine's lettering clears 4.5`, () => {
      for (let i = 1; i <= 8; i += 1) {
        expect(contrast(p[`spine-${i}`], p[`spine-${i}-ink`]), `spine-${i}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})

describe('a scheme is its colour', () => {
  it('turns the accent to the hue it was given', () => {
    for (const { hex } of PRESETS.filter((p) => p.hex)) {
      const want = toHsl(hex)[0]
      const got = toHsl(paletteFor(hex)['l-accent'])[0]
      const apart = Math.min(Math.abs(want - got), 360 - Math.abs(want - got))
      expect(apart, hex).toBeLessThan(12)
    }
  })

  it('leaves paper, ink and rules alone', () => {
    const p = paletteFor('#4f6d8a')
    for (const name of ['l-paper', 'l-ink', 'l-ink-faint', 'l-rule', 'd-paper', 'd-ink']) {
      expect(p[name], name).toBeUndefined()
    }
  })
})

describe('it is on the page before the first paint', () => {
  it('is read by the inline script in index.html', () => {
    expect(html).toContain("localStorage.getItem('librapp-scheme')")
    expect(html).toContain("document.documentElement.style.setProperty('--' + k, s.vars[k])")
  })
})
