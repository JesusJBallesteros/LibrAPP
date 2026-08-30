// The questions the desk can put.
//
// Each is a prompt file, a tab, and three strings. The tab label and its two
// lines are built from the ask's id, so the literals never appear in the source
// and the key audit in i18n.test.js cannot see them. This is what checks them.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import en from '../src/i18n/en.js'
import es from '../src/i18n/es.js'

const desk = readFileSync(new URL('../src/views/Desk.jsx', import.meta.url), 'utf8')
const prompt = (name) => readFileSync(new URL(`../../prompts/${name}`, import.meta.url), 'utf8')

const ASKS = ['synopsis', 'recommend', 'next', 'portrait', 'quick', 'fill']

describe('every ask is wired end to end', () => {
  for (const id of ASKS) {
    it(`${id} has a tab and the words for it`, () => {
      expect(desk, id).toContain(`id: '${id}'`)
      for (const suffix of ['', '.blurb']) {
        expect(en, `${id}${suffix}`).toHaveProperty(`desk.${id}${suffix}`)
        expect(es, `${id}${suffix}`).toHaveProperty(`desk.${id}${suffix}`)
      }
    })
  }

  it('gives every prose ask a placeholder, and the structured one none', () => {
    // Fill in gaps has a checklist rather than a box to type in.
    for (const id of ASKS.filter((each) => each !== 'fill')) {
      expect(en, id).toHaveProperty(`desk.${id}.placeholder`)
    }
  })
})

describe('the prompts behind them', () => {
  const files = {
    next: 'next.md',
    portrait: 'portrait.md',
    quick: 'quick.md',
  }

  for (const [id, file] of Object.entries(files)) {
    it(`${file} is loaded by the desk`, () => {
      expect(desk).toContain(`prompts/${file}?raw`)
    })

    it(`${file} says the answer is plain text`, () => {
      // Every reply renders into a box that parses no formatting, and a prompt
      // written in bold-headed markdown is what a model mirrors.
      expect(prompt(file), file).toContain('**Plain text.**')
    })

    it(`${file} leaves the profile to describe itself`, () => {
      // These rules moved into readerProfile. A copy here would drift from it,
      // which is what happened to the two copies that were there before.
      expect(prompt(file), file).not.toContain('cross-section is a sample')
      expect(prompt(file), file).not.toContain('Never recorded" is not "unread')
    })
  }

  it('lets the portrait answer with nothing typed into it', () => {
    // It describes the collection, and the collection is already in the
    // profile. Every other ask needs a question before it can be sent.
    expect(desk).toContain("{ id: 'portrait', text: portraitPrompt, optionalQuestion: true }")
    expect(desk).toContain('chosen.optionalQuestion')
  })
})
