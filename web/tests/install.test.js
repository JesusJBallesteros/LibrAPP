// Offering to install, without being the kind of app that asks.
//
// LibrAPP has been installable since the beginning and never said so: the
// manifest was complete and nothing in the interface mentioned it. The risk in
// fixing that is the obvious one, so it is the thing pinned here.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../src/components/OnYourPhone.jsx', import.meta.url), 'utf8')
const manifest = JSON.parse(
  readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'),
)

describe('the offer to install', () => {
  it('holds the browser event rather than acting on it', () => {
    // Firing the prompt the moment the event arrives is the thing that makes
    // install prompts hated. The answer belongs to whoever presses the button.
    expect(source).toContain('event.preventDefault()')
    const listener = source.slice(source.indexOf('const held ='), source.indexOf('const finished ='))
    expect(listener).not.toContain('.prompt()')
  })

  it('spends the event once, because it cannot be used twice', () => {
    const install = source.slice(source.indexOf('const install ='))
    expect(install).toContain('offer.prompt()')
    expect(install).toContain('await offer.userChoice')
    expect(install).toContain('setOffer(null)')
  })

  it('writes out the manual route as well as offering the button', () => {
    // Safari on iOS never fires the event and never will, and somebody on an
    // iPhone is exactly the person asking how to get this on their phone.
    expect(source).toContain("t('phone.byHand')")
    const en = readFileSync(new URL('../src/i18n/en.js', import.meta.url), 'utf8')
    expect(en).toMatch(/phone\.byHand[\s\S]{0,200}Add to Home Screen/)
  })

  it('knows when it is already the installed app', () => {
    expect(source).toContain("'(display-mode: standalone)'")
    // The iOS spelling, which is not the standard one.
    expect(source).toContain('navigator?.standalone')
  })
})

describe('the manifest behind the offer', () => {
  it('says everything a browser needs before it will offer at all', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toBe('standalone')
  })

  it('carries the two icon sizes an install needs, and a maskable one', () => {
    const sizes = (manifest.icons || []).map((i) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect((manifest.icons || []).some((i) => i.purpose === 'maskable')).toBe(true)
  })
})
