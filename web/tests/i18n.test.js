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
