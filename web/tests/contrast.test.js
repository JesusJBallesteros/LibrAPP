// What the palette actually measures.
//
// Contrast is arithmetic over four numbers, so it can be checked here rather
// than trusted or eyeballed. Every figure below is computed from the stylesheet
// itself, which means a later edit to a colour cannot quietly drop the app
// under the line: it has to fail here first.
//
// Thresholds come from WCAG 2.2. Text needs 4.5 to meet AA and 7 to meet AAA.
// The visual boundary of a control needs 3, which is why a select underline is
// held to a different standard than a hairline drawn between two rows: one
// tells a reader where a control is, the other is decoration.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

// Parsed by hand rather than by regex: the pattern needs a backslash escape,
// and a mistyped one would match nothing and pass everything.
const value = (name) => {
  const at = css.indexOf(`--${name}:`)
  if (at < 0) return null
  const hash = css.indexOf('#', at)
  const end = css.indexOf(';', at)
  if (hash < 0 || end < 0 || hash > end) return null
  return css.slice(hash, end).trim()
}

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex) => {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Every surface a quiet colour is drawn on. The worst of them is the one that
// decides, since a token that passes on paper and fails on the catalog card
// still fails wherever the card is.
const SURFACES = {
  l: ['l-paper', 'l-raised', 'l-sunk', 'l-card'],
  d: ['d-paper', 'd-raised', 'd-sunk', 'd-card'],
}

const worst = (token, theme) =>
  Math.min(...SURFACES[theme].map((s) => contrast(value(token), value(s))))

describe('the palette is defined at all', () => {
  it('has every token these tests measure', () => {
    const needed = [
      'l-ink', 'l-ink-soft', 'l-ink-faint', 'l-control', 'l-rule',
      'd-ink', 'd-ink-soft', 'd-ink-faint', 'd-control', 'd-rule',
      ...SURFACES.l, ...SURFACES.d,
    ]
    for (const token of needed) expect(value(token), token).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('text at the ordinary level', () => {
  for (const theme of ['l', 'd']) {
    for (const token of ['ink', 'ink-soft', 'ink-faint']) {
      it(`--${theme}-${token} clears 4.5 on every surface`, () => {
        expect(worst(`${theme}-${token}`, theme)).toBeGreaterThanOrEqual(4.5)
      })
    }
  }

  it('holds the faintest colour to 7, which is the enhanced level', () => {
    // It carries the card's field labels, the year and format cells, the
    // eyebrows and every hint, and it used to be the one under the line. There
    // is one palette now and this is the level it is held at.
    expect(worst('l-ink-faint', 'l')).toBeGreaterThanOrEqual(7)
    expect(worst('d-ink-faint', 'd')).toBeGreaterThanOrEqual(7)
  })
})

describe('the boundary of a control', () => {
  for (const theme of ['l', 'd']) {
    it(`--${theme}-control clears 3 on every surface`, () => {
      // A select with no box is identified by its underline alone.
      expect(worst(`${theme}-control`, theme)).toBeGreaterThanOrEqual(3)
    })

    it(`--${theme}-control clears 4.5, above what a boundary is asked for`, () => {
      // The palette that shipped as an option is the whole palette now, and it
      // carried the control boundary well past the 3 a boundary needs.
      expect(worst(`${theme}-control`, theme)).toBeGreaterThanOrEqual(4.5)
    })
  }

  it('draws a hairline as strongly as the boundary of a control', () => {
    // These were two levels apart while the reader could choose. At the raised
    // level they are the same colour, which is what the raised level always
    // did: at low vision the structure of a page matters as much as the words.
    expect(worst('l-rule', 'l')).toBeGreaterThanOrEqual(3)
    expect(worst('d-rule', 'd')).toBeGreaterThanOrEqual(3)
  })
})

describe('there is one level, and nothing left to switch', () => {
  it('leaves no attribute for a level to be chosen with', () => {
    expect(css).not.toContain('data-contrast')
  })

  it('wires the quiet colours straight to the palette', () => {
    // No pair, no indirection, no rule choosing between them.
    expect(css).toContain('--ink-faint: var(--l-ink-faint)')
    expect(css).toContain('--ink-faint: var(--d-ink-faint)')
    expect(css).not.toContain('--faint-plain')
    expect(css).not.toContain('--faint-hi')
  })
})
