// The way back to the top of a long page.
//
// The catalog in list mode is ten screens tall, and on a phone the shelf is
// five. Getting back meant the same distance in reverse.
//
// Two decisions are worth holding still. It appears by how long the page is
// rather than by how far down it somebody has scrolled, because a control that
// turns up partway through a scroll is one nobody knows is there until they
// have already done without it. And it clears the sidebar, which is 252 pixels
// of sticky column with its own links along the bottom.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../src/components/ToTop.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

/** The block of rules for one selector. */
const rule = (selector) => {
  const at = css.indexOf(`${selector} {`)
  expect(at, selector).toBeGreaterThan(-1)
  return css.slice(at, css.indexOf('}', at))
}

describe('when it is there', () => {
  it('appears on a page of three screens or more', () => {
    expect(source).toContain('window.innerHeight * 3')
  })

  it('is decided by the length of the page, not by the scroll', () => {
    // Otherwise it is a control that appears halfway down, which is after the
    // moment somebody wanted it.
    expect(source).toContain('document.documentElement.scrollHeight')
    expect(source).not.toContain('scrollY')
    expect(source).not.toMatch(/addEventListener\('scroll'/)
  })

  it('measures again when the page changes shape', () => {
    // A filter narrowing a list and a step opening both change the length
    // without anybody scrolling or resizing anything.
    expect(source).toContain('new ResizeObserver(measure)')
    expect(source).toMatch(/addEventListener\('resize', measure\)/)
  })

  it('draws nothing at all on a short page', () => {
    expect(source).toContain('if (!tall) return null')
  })
})

describe('where it is', () => {
  it('sits opposite the owl', () => {
    expect(rule('.to-top')).toMatch(/left: 26px/)
    expect(rule('.librarian')).toMatch(/right: 26px/)
  })

  it('clears the sidebar on a screen wide enough to have one', () => {
    // 252px of sticky column, with About, Privacy and Licence along its foot.
    expect(css).toContain('.to-top { left: calc(252px + 26px); }')
    expect(css).toContain('@media (min-width: 821px) {')
    expect(css).toContain('.shell { grid-template-columns: 1fr; }')
  })

  it('is smaller and quieter than the owl, which has something to say', () => {
    const mine = rule('.to-top')
    const owl = rule('.owl-badge')
    const px = (block, prop) => Number(/(\d+)px/.exec(block.slice(block.indexOf(prop)))[1])
    expect(px(mine, 'width')).toBeLessThan(px(owl, 'width'))
    expect(mine).toMatch(/opacity: \.45/)
    expect(css).toMatch(/\.to-top:hover,\s+\.to-top:focus-visible \{[^}]*opacity: 1/)
  })
})

describe('what it does', () => {
  it('goes to the top', () => {
    expect(source).toContain('window.scrollTo({ top: 0')
  })

  it('takes the keyboard with it', () => {
    // Scrolling leaves focus where it was, so the next Tab would jump back down
    // to whatever was under the finger a moment ago.
    expect(source).toContain("document.getElementById('content')?.focus?.()")
    expect(app).toContain('id="content"')
  })

  it('says what it is to anybody who cannot see the arrow', () => {
    expect(source).toContain("aria-label={t('common.toTop')}")
    expect(source).toContain('aria-hidden="true"')
  })

  it('is drawn, not typed, so it is one shape everywhere', () => {
    expect(source).toContain('<svg viewBox="0 0 24 24"')
    expect(source).toMatch(/d="M4 15\.5 L12 8\.5 L20 15\.5"/)
  })
})
