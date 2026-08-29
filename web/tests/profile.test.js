// The rules for reading the reader profile, which travel with it.
//
// Five of them describe the document rather than any request made with it: the
// cross-section is a sample, a blank field means nobody recorded it, a rating is
// not the reader's, lent books are elsewhere, and never recorded is not unread.
// They lived in the prompts, where two were copied into both, three were in one
// only, and nothing kept the copies in step.
//
// The two that describe a section only present sometimes are stated only when
// that section is. A rule about a heading that is not in the document would be
// the same mistake as a prompt asking for a vocabulary nobody sent.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { makeSource, readSource } from '../src/core/records.js'
import { build } from '../src/core/build.js'
import { readerProfile } from '../src/core/profile.js'

const catalogOf = (records) =>
  build([
    readSource(
      makeSource({
        name: 'list',
        kind: 'table',
        origin: 'books.xlsx',
        format: 'physical',
        confidence: 'medium',
        records,
      }),
      'list',
    ),
  ])

const plain = [
  { title: 'Dune', authors: ['Frank Herbert'], read: true },
  { title: 'Solaris', authors: ['Stanislaw Lem'], read: false },
]

const header = (text) =>
  text.slice(text.indexOf('## How to read this document'), text.indexOf('## What the collection'))

describe('how to read this document', () => {
  it('stands before the document it describes', () => {
    const text = readerProfile(catalogOf(plain))
    expect(text.indexOf('## How to read this document')).toBeGreaterThan(-1)
    expect(text.indexOf('## How to read this document')).toBeLessThan(
      text.indexOf('## What the collection'),
    )
  })

  it('always says the three that are always true', () => {
    const rules = header(readerProfile(catalogOf(plain)))
    expect(rules).toContain('cross-section is a sample')
    expect(rules).toContain('blank across the whole shelf')
    expect(rules).toContain('Never recorded is not the same as unread')
  })

  it('says nothing about ratings when nothing is rated', () => {
    const text = readerProfile(catalogOf(plain))
    expect(text).not.toContain('Rated books:')
    expect(text).not.toContain('general reader consensus')
  })

  it('explains a rating wherever it prints one', () => {
    // A book line carries "rated 4.2" with nothing to say where it came from,
    // and a model will otherwise answer as though the reader had liked it.
    const text = readerProfile(catalogOf([{ ...plain[0], rating: 4.2 }, plain[1]]))
    expect(text).toContain('Rated books:')
    expect(header(text)).toContain('general reader consensus')
  })

  it('says nothing about loans when nothing is out', () => {
    const text = readerProfile(catalogOf(plain))
    expect(text).not.toContain('Not on the shelf right now')
    expect(header(text)).not.toContain('lent out')
  })

  it('explains the loans section wherever it prints one', () => {
    const text = readerProfile(catalogOf([{ ...plain[0], lent_to: 'Ana' }, plain[1]]))
    expect(text).toContain('## Not on the shelf right now')
    expect(header(text)).toContain('lent out')
  })
})

describe('the prompts no longer carry what moved', () => {
  const read = (name) =>
    readFileSync(new URL(`../../prompts/${name}`, import.meta.url), 'utf8')

  it('does not say the same thing in two places', () => {
    // Two copies of one rule is two things to keep in step, and the copies had
    // already drifted apart in wording.
    for (const name of ['synopsis.md', 'recommend.md']) {
      expect(read(name), name).not.toContain('cross-section, chosen to match')
      expect(read(name), name).not.toContain('A field\nblank across the whole shelf')
    }
  })

  it('still tells a model the answer is not markdown', () => {
    // The reply renders into a fixed-width box that parses nothing, and both
    // prompts are themselves written in bold-headed markdown, which is what a
    // model mirrors.
    for (const name of ['synopsis.md', 'recommend.md']) {
      expect(read(name), name).toContain('**Plain text.**')
    }
  })
})
