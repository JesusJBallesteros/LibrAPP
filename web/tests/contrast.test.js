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
import { LEVELS, applyContrast, effectiveContrast, readContrast } from '../src/store/contrast.js'

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
      'l-ink', 'l-ink-soft', 'l-ink-faint', 'l-ink-faint-hi', 'l-control', 'l-control-hi',
      'd-ink', 'd-ink-soft', 'd-ink-faint', 'd-ink-faint-hi', 'd-control', 'd-control-hi',
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

  it('holds the faintest colour to the same line as the rest', () => {
    // This is the one that was under it. It carries the card's field labels,
    // the year and format cells, the eyebrows and every hint.
    expect(worst('l-ink-faint', 'l')).toBeGreaterThanOrEqual(4.5)
    expect(worst('d-ink-faint', 'd')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('text with more contrast asked for', () => {
  for (const theme of ['l', 'd']) {
    it(`--${theme}-ink-faint-hi reaches 7`, () => {
      expect(worst(`${theme}-ink-faint-hi`, theme)).toBeGreaterThanOrEqual(7)
    })
  }

  it('is actually stronger than the ordinary one, not merely different', () => {
    expect(worst('l-ink-faint-hi', 'l')).toBeGreaterThan(worst('l-ink-faint', 'l'))
    expect(worst('d-ink-faint-hi', 'd')).toBeGreaterThan(worst('d-ink-faint', 'd'))
  })
})

describe('the boundary of a control', () => {
  for (const theme of ['l', 'd']) {
    it(`--${theme}-control clears 3 on every surface`, () => {
      // A select with no box is identified by its underline alone.
      expect(worst(`${theme}-control`, theme)).toBeGreaterThanOrEqual(3)
    })

    it(`--${theme}-control-hi is stronger still`, () => {
      expect(worst(`${theme}-control-hi`, theme)).toBeGreaterThan(worst(`${theme}-control`, theme))
    })
  }

  it('is held to a higher standard than a decorative hairline', () => {
    // --rule separates rows and means nothing on its own, so it is not asked
    // to clear 3. The point of a separate token is that the two can differ.
    expect(worst('l-control', 'l')).toBeGreaterThan(worst('l-rule', 'l'))
    expect(worst('d-control', 'd')).toBeGreaterThan(worst('d-rule', 'd'))
  })
})

describe('the stylesheet wires the levels up', () => {
  it('raises the quiet colours when contrast is set to high', () => {
    expect(css).toMatch(/\[data-contrast='high'\]/)
    expect(css).toContain('--ink-faint: var(--faint-hi)')
    expect(css).toContain('--control-line: var(--control-hi)')
  })

  it('follows the system when nobody has chosen', () => {
    expect(css).toMatch(/@media \(prefers-contrast: more\)/)
  })

  it('lets a choice of normal win back a system that asked for more', () => {
    // Without the guard, choosing normal would do nothing on a machine set to
    // high contrast, and the button would look broken.
    const at = css.indexOf('prefers-contrast: more')
    expect(css.slice(at, at + 200)).toContain(":not([data-contrast='normal'])")
  })

  it('names the pair in both themes, so one contrast rule covers both', () => {
    expect(css).toContain('--faint-plain: var(--l-ink-faint)')
    expect(css).toContain('--faint-plain: var(--d-ink-faint)')
    expect(css).toContain('--faint-hi: var(--l-ink-faint-hi)')
    expect(css).toContain('--faint-hi: var(--d-ink-faint-hi)')
  })
})

describe('remembering the choice', () => {
  const root = () => globalThis.document.documentElement

  const fresh = () => {
    globalThis.document = { documentElement: new (class {
      constructor() { this.attrs = new Map() }
      setAttribute(k, v) { this.attrs.set(k, v) }
      removeAttribute(k) { this.attrs.delete(k) }
      getAttribute(k) { return this.attrs.get(k) ?? null }
    })() }
    const store = new Map()
    globalThis.localStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    }
  }

  it('offers exactly the two levels a person can pick', () => {
    expect(LEVELS).toEqual(['high', 'normal'])
  })

  it('stamps a choice and takes it off again', () => {
    fresh()
    applyContrast('high')
    expect(root().getAttribute('data-contrast')).toBe('high')
    applyContrast(null)
    expect(root().getAttribute('data-contrast')).toBeNull()
  })

  it('leaves the attribute off rather than writing the system answer into it', () => {
    fresh()
    applyContrast(null)
    expect(root().getAttribute('data-contrast')).toBeNull()
  })

  it('ignores a stored value it does not recognise', () => {
    fresh()
    globalThis.localStorage.setItem('librapp-contrast', 'maximum')
    expect(readContrast()).toBeNull()
  })

  it('reads nothing rather than throwing where storage is refused', () => {
    fresh()
    globalThis.localStorage.getItem = () => { throw new Error('denied') }
    expect(readContrast()).toBeNull()
  })

  it('prefers a stored choice over what the system asks', () => {
    globalThis.matchMedia = () => ({ matches: true })
    expect(effectiveContrast('normal')).toBe('normal')
    expect(effectiveContrast(null)).toBe('high')
  })

  it('says normal where the browser cannot be asked', () => {
    globalThis.matchMedia = undefined
    expect(effectiveContrast(null)).toBe('normal')
  })
})
