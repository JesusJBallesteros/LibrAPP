// The catalog's header and list rows after the redesign.
//
// Source checks, like the other layout tests: what regresses here is markup and
// stylesheet wiring.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
const catalog = read('views/Catalog.jsx')
const css = read('styles.css').split(String.fromCharCode(13)).join('')
const en = read('i18n/en.js')

describe('the header', () => {
  it('leads with the number of books shown, over a full-ink rule', () => {
    expect(catalog).toContain('<span className="count-big">{shown.length}</span>')
    const head = css.slice(css.indexOf('.catalog-head {'), css.indexOf('}', css.indexOf('.catalog-head {')))
    expect(head).toContain('border-bottom: 1px solid var(--ink)')
  })

  it('says the total when the filters have narrowed it', () => {
    expect(catalog).toContain("t('catalog.countOf', { n: prepared.length })")
    expect(en).toContain("'catalog.countOf': 'of {n} {n:book|books}'")
  })

  it('keeps the page name for a screen reader', () => {
    expect(catalog).toContain('<h2 className="offscreen">{t(\'nav.catalog\')}</h2>')
  })

  it('puts the build line behind the i, closed until pressed', () => {
    expect(catalog).toContain('<InfoBlock disclosure={figures}>')
    const info = read('components/Info.jsx')
    expect(info).toContain('const [open, setOpen] = useState(false)')
  })

  it('names every icon-only tool', () => {
    expect(catalog).toContain("aria-label={t('catalog.typeIn')}")
    expect(catalog).toContain('aria-label={t(`catalog.mode.${each}`)}')
    expect(catalog).toContain("<span className=\"offscreen\">{t('catalog.search')}</span>")
  })
})

describe('the list rows', () => {
  it('draw read state as three shapes, each with its word', () => {
    expect(catalog).toMatch(/const READ_GLYPH = \{ read: '.+', unread: '.+', unknown: '.+' \}/)
    expect(catalog).toContain('<span className="offscreen">{t(`read.${readState(item.book)}`)}</span>')
  })

  it('drop the author and formats on a phone', () => {
    const phone = css.slice(css.indexOf('/* A phone keeps the title, the marks and the year. */'))
    expect(phone).toContain('.book-row .byline,\n  .book-row .formats { display: none; }')
  })
})

describe('the width', () => {
  it('lets the catalog use the whole column', () => {
    expect(css).toContain(".shell[data-view='catalog'] .main { max-width: none; }")
  })
})
