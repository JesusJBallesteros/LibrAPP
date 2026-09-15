// The key box, folded.
//
// A key is optional on both pages that use one, and the open box stood over
// their steps as though it were one of them. It starts as one line with an i,
// opens on a press, and folds again at any time.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
const box = read('components/ApiKeyBox.jsx')
const en = read('i18n/en.js')

describe('the key box', () => {
  it('starts folded', () => {
    expect(box).toContain('const [open, setOpen] = useState(false)')
    expect(box).toContain('if (!open) {')
  })

  it('offers the key in one line, and says so when one is in use', () => {
    expect(box).toContain("t('key.compact')")
    expect(box).toContain("t('key.compact.active', { service: provider.label })")
    expect(en).toContain("'key.compact': 'If you have an API key…'")
  })

  it('puts what a key adds behind an i beside that line', () => {
    const folded = box.slice(box.indexOf('if (!open) {'), box.indexOf('const field = {'))
    expect(folded).toContain('<InfoMark disclosure={benefits}')
    expect(folded).toContain("t('key.benefits')")
  })

  it('opens on a press and folds again from inside the box', () => {
    expect(box).toContain('onClick={() => setOpen(true)}')
    expect(box).toContain('onClick={() => setOpen(false)}')
    expect(box).toContain("t('key.hide')")
  })

  it('is the same box on the photograph page and at the desk', () => {
    expect(read('views/Shelf.jsx')).toContain('<ApiKeyBox')
    expect(read('views/Desk.jsx')).toContain('<ApiKeyBox')
  })
})
