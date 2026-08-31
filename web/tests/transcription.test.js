// Bringing a transcription back, when the reading happened somewhere else.
//
// This is the whole keyless route: cut the photograph here, take the pieces and
// the prompt to an AI session, come back with what it wrote. Coming back is the
// step that was worst served. The box asked for a file, so on a phone the
// picker offered the camera, which is the wrong end of this page; and the box
// only existed while the pieces did, so a reader who had left the page and come
// back had nowhere to put the answer.
//
// Source assertions, because the reply arrives as text through the interface
// and the interface is what was wrong with it.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { loadTranscription } from '../src/ingest/shelf.js'

const source = readFileSync(new URL('../src/views/Shelf.jsx', import.meta.url), 'utf8')
const en = readFileSync(new URL('../src/i18n/en.js', import.meta.url), 'utf8')

/** The step-five section, from its heading to the end of its section. */
const stepFive = source.slice(source.indexOf("t('shelf.stepFive')"))

describe('the box that takes a transcription back', () => {
  it('names the file types it takes', () => {
    // Without this the picker on a phone offers the camera, and photographing
    // a shelf is what the reader did four steps ago.
    expect(stepFive).toMatch(/accept="[^"]*\.json[^"]*"/)
    expect(stepFive).not.toMatch(/accept="[^"]*image[^"]*"/)
  })

  it('takes the reply as text as well as a file', () => {
    // An answer in an AI session is text on a screen. Saving it to a file first
    // is a step that existed only because this box asked for a file.
    expect(stepFive).toContain('<textarea')
    expect(stepFive).toContain("t('shelf.useThisText')")
    expect(en).toContain("'shelf.useThisText'")
    expect(en).toContain("'shelf.pasteTranscription'")
  })

  it('will not act on an empty box', () => {
    expect(stepFive).toMatch(/disabled=\{lib\.busy \|\| !pasted\.trim\(\)\}/)
  })

  it('reads a file and a paste through one path', () => {
    // Two readers would drift, and the parse is the part that decides whether
    // a reader sees a review or an error.
    expect(source).toContain('const takeTranscription = (text, name)')
    expect(source).toMatch(/onTranscription = async \(file\) => takeTranscription\(await file\.text\(\)/)
    expect(source).toContain('takeTranscription(pasted.trim()')
  })

  it('clears the box only when the paste was good', () => {
    expect(source).toMatch(/if \(takeTranscription\(pasted\.trim\(\), .+\)\) setPasted\(''\)/)
  })
})

describe('what step five depends on', () => {
  it('stands whether or not a photograph has been cut', () => {
    // The reader is coming back from somewhere else, and a page reloaded on the
    // way has no pieces in it. Gating the way back on them put it behind the
    // very thing that had been lost.
    const before = source.slice(0, source.indexOf("t('shelf.stepFive')"))
    const opened = (before.match(/\{tiles && \(/g) || []).length
    const closed = (before.match(/^ {6}\)\}$/gm) || []).length
    expect(opened).toBeLessThanOrEqual(closed)
  })

  it('shows the review the same way, since a paste can produce one', () => {
    // The list of what was read used to be inside the same gate. A transcription
    // pasted with no photograph loaded would have been accepted and then shown
    // to nobody.
    const review = source.slice(source.indexOf('{proposed && ('))
    expect(review.indexOf("t('shelf.checkWhatItRead')")).toBeGreaterThan(-1)
    expect(source).toMatch(/^ {6}\{proposed && \($/m)
  })
})

describe('a transcription that arrives as text', () => {
  const written = {
    photo: 'from-elsewhere.jpg',
    shelves: [
      {
        location: 'top shelf',
        books: [
          { title: 'The Peregrine', authors: ['J A Baker'], confidence: 'high' },
          { title: 'Pale Fire', authors: ['Vladimir Nabokov'], confidence: 'medium' },
        ],
      },
    ],
  }

  it('is the same document whether it came from a file or a box', () => {
    const { records } = loadTranscription(JSON.parse(JSON.stringify(written)))
    expect(records.map((r) => r.title)).toEqual(['The Peregrine', 'Pale Fire'])
  })

  it('says what it expected when the text is not one', () => {
    // Parsing as JSON is not the same as being a transcription, and a reader
    // who pasted the wrong half of a reply needs telling which.
    expect(() => loadTranscription({ photo: 'a.jpg', shelves: [] })).toThrow(/shelves/)
    expect(() => loadTranscription({ hello: 'world' })).toThrow(/Expected/)
  })
})
