// Which theme wins.
//
// Three states, and the awkward one is the middle: a stored choice has to beat
// the system in both directions. The stylesheet does that with
// :root:not([data-theme='light']) inside the media query, and without the
// :not() a Day button cannot win back a dark system. These tests cover the
// state that drives the attribute; the CSS guard itself was checked in a
// browser.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyTheme,
  effectiveTheme,
  followSystem,
  readTheme,
  saveTheme,
  systemTheme,
} from '../src/store/theme.js'

const root = () => globalThis.document.documentElement

beforeEach(() => {
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
})

describe('putting the choice on the document', () => {
  it('stamps an explicit choice', () => {
    applyTheme('dark')
    expect(root().getAttribute('data-theme')).toBe('dark')
    applyTheme('light')
    expect(root().getAttribute('data-theme')).toBe('light')
  })

  it('takes the attribute off when the system decides', () => {
    applyTheme('dark')
    applyTheme(null)
    expect(root().getAttribute('data-theme')).toBeNull()
  })

  it('takes it off for anything it does not recognise, rather than stamping rubbish', () => {
    applyTheme('dark')
    applyTheme('sepia')
    expect(root().getAttribute('data-theme')).toBeNull()
  })

  it('leaves the attribute off rather than writing the system value into it', () => {
    // Writing 'dark' because the system is dark would look identical today and
    // stop tracking a system that changes tomorrow.
    applyTheme(null)
    expect(root().getAttribute('data-theme')).toBeNull()
  })
})

describe('which theme is in force', () => {
  const withSystem = (dark) => {
    globalThis.matchMedia = vi.fn(() => ({ matches: dark }))
  }

  it('is the stored one when there is a stored one', () => {
    withSystem(true)
    expect(effectiveTheme('light')).toBe('light')
    withSystem(false)
    expect(effectiveTheme('dark')).toBe('dark')
  })

  it('is the system one when nothing is stored', () => {
    withSystem(true)
    expect(effectiveTheme(null)).toBe('dark')
    withSystem(false)
    expect(effectiveTheme(null)).toBe('light')
  })

  it('reads the system preference through the media query', () => {
    withSystem(true)
    expect(systemTheme()).toBe('dark')
    withSystem(false)
    expect(systemTheme()).toBe('light')
  })

  it('says light where there is no matchMedia at all', () => {
    globalThis.matchMedia = undefined
    expect(systemTheme()).toBe('light')
    expect(effectiveTheme(null)).toBe('light')
  })
})

describe('remembering the choice', () => {
  it('survives a reload, which is the point of storing it', () => {
    saveTheme('light')
    expect(readTheme()).toBe('light')
    expect(root().getAttribute('data-theme')).toBe('light')
  })

  it('forgets it again when the system takes over', () => {
    saveTheme('dark')
    followSystem()
    expect(readTheme()).toBeNull()
    expect(root().getAttribute('data-theme')).toBeNull()
  })

  it('reads nothing from an empty store', () => {
    expect(readTheme()).toBeNull()
  })

  it('ignores a stored value it does not recognise', () => {
    globalThis.localStorage.setItem('librapp-theme', 'sepia')
    expect(readTheme()).toBeNull()
  })

  it('still applies the theme when storage refuses to co-operate', () => {
    // Private windows can throw on setItem. The session should still change.
    globalThis.localStorage.setItem = () => { throw new Error('denied') }
    saveTheme('light')
    expect(root().getAttribute('data-theme')).toBe('light')
  })

  it('reads nothing rather than throwing when storage is unavailable', () => {
    globalThis.localStorage.getItem = () => { throw new Error('denied') }
    expect(readTheme()).toBeNull()
  })
})
