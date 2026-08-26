// A translation fails quietly. A missing key renders the key, a stray
// placeholder renders {name}, and neither throws, so nothing reports it until
// someone notices on screen. These checks catch both before a release.

import { describe, expect, it } from 'vitest'
import en from '../src/i18n/en.js'
import es from '../src/i18n/es.js'
import { LANGUAGES, translate } from '../src/i18n/index.jsx'

const placeholders = (value) =>
  [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

const DICTIONARIES = { en, es }

describe('the dictionaries', () => {
  it('has a file for every language the selector offers', () => {
    for (const { code } of LANGUAGES) expect(DICTIONARIES[code], code).toBeTruthy()
  })

  it.each(Object.keys(DICTIONARIES).filter((code) => code !== 'en'))(
    '%s covers every key English defines',
    (code) => {
      const missing = Object.keys(en).filter((key) => !(key in DICTIONARIES[code]))
      expect(missing).toEqual([])
    },
  )

  it.each(Object.keys(DICTIONARIES).filter((code) => code !== 'en'))(
    '%s defines nothing English does not',
    (code) => {
      // A key with no English counterpart is a typo: it can never be reached,
      // because every lookup starts from a key the code asked for.
      const orphans = Object.keys(DICTIONARIES[code]).filter((key) => !(key in en))
      expect(orphans).toEqual([])
    },
  )

  it.each(Object.keys(DICTIONARIES).filter((code) => code !== 'en'))(
    '%s uses the same placeholders as English in every string',
    (code) => {
      const wrong = Object.keys(en)
        .filter((key) => key in DICTIONARIES[code])
        .filter((key) => String(placeholders(en[key])) !== String(placeholders(DICTIONARIES[code][key])))
      expect(wrong).toEqual([])
    },
  )

  it.each(Object.entries(DICTIONARIES))('%s has no empty strings', (_code, dictionary) => {
    const blank = Object.entries(dictionary)
      .filter(([, value]) => typeof value !== 'string' || !value.trim())
      .map(([key]) => key)
    expect(blank).toEqual([])
  })
})

describe('translate', () => {
  it('falls back to English rather than showing nothing', () => {
    // A half-finished translation must still be usable. This is what makes
    // adding a language a safe thing to do.
    expect(translate('es', 'landing.tagline')).not.toBe(translate('en', 'landing.tagline'))
    expect(translate('zz', 'landing.tagline')).toBe(translate('en', 'landing.tagline'))
  })

  it('returns the key itself when nothing defines it', () => {
    // Deliberate: a visible key is a bug report. A blank space is not.
    expect(translate('en', 'nothing.defines.this')).toBe('nothing.defines.this')
  })

  it('fills placeholders, and leaves alone any it was not given', () => {
    expect(translate('en', 'catalog.countSome', { shown: 3, total: 9 })).toBe('3 of 9 books')
    expect(translate('en', 'catalog.countSome', { shown: 3 })).toContain('{total}')
  })
})

// Counting sentences have to read correctly at one. The dictionary carries a
// {name:one|many} form for that, and it is worth checking in both languages,
// since a mistyped form silently leaves the markup in the sentence.
describe('choosing a form by count', () => {
  it('picks the singular at one and the plural elsewhere', () => {
    expect(translate('en', 'librarian.unread', { n: 1 })).toBe('1 book here is still unopened.')
    expect(translate('en', 'librarian.unread', { n: 4 })).toBe('4 books here are still unopened.')
  })

  it('treats zero as plural, the way both languages do', () => {
    expect(translate('en', 'librarian.unread', { n: 0 })).toBe('0 books here are still unopened.')
  })

  it('picks each count separately in a sentence carrying two', () => {
    expect(translate('en', 'librarian.imported', { n: 1, known: 3 })).toBe(
      '1 book arrived, and 3 were already here. One entry each.',
    )
    expect(translate('en', 'librarian.imported', { n: 3, known: 1 })).toBe(
      '3 books arrived, and 1 was already here. One entry each.',
    )
  })

  it('leaves no unfilled form in any counting string, in either language', () => {
    const counted = [
      'librarian.unread', 'librarian.unrecorded', 'librarian.lentLong',
      'librarian.borrowedLong', 'librarian.imported', 'librarian.reading',
      'librarian.welcome', 'librarian.desk',
    ]
    for (const code of ['en', 'es']) {
      for (const key of counted) {
        for (const n of [0, 1, 2]) {
          const line = translate(code, key, { n, known: n })
          expect(line, `${code} ${key} at ${n}`).not.toMatch(/[{}]/)
        }
      }
    }
  })

  it('leaves the form alone when the count was not supplied', () => {
    expect(translate('en', 'librarian.unread', { other: 1 })).toContain('{n:book|books}')
  })
})
