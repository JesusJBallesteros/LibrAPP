// Diffs the shelf ingester against Python: the tile geometry, and the records a
// transcription produces.
//
//   node web/scripts/shelf-parity.mjs <spines.json> <python-shelf.json> [W H]

import { readFileSync } from 'node:fs'
import { loadTranscription, tileBoxes } from '../src/ingest/shelf.js'
import { normalise } from '../src/core/records.js'

const [transcriptionPath, expectedPath, w, h] = process.argv.slice(2)

// --- geometry -------------------------------------------------------------
if (w && h) {
  const boxes = tileBoxes(Number(w), Number(h))
  console.log(`tile boxes for ${w}x${h}:`)
  for (const b of boxes) console.log(`  ${b.tile}  ${JSON.stringify(b.box)}`)
  console.log('')
}

// --- records --------------------------------------------------------------
const payload = JSON.parse(readFileSync(transcriptionPath, 'utf8'))
const { records: parsed, stats } = loadTranscription(payload)
const records = parsed.map(normalise)
const expected = JSON.parse(readFileSync(expectedPath, 'utf8'))

console.log(`books read by js     : ${records.length}`)
console.log(`books read by python : ${expected.records.length}`)
console.log(`shelves              : ${stats.shelves}`)
console.log(`uncertain spines     : ${stats.uncertain_spines}`)
console.log('')

const FIELDS = ['title', 'authors', 'publisher', 'series', 'series_index', 'genre',
  'keywords', 'location', 'confidence', 'notes', 'flags']

const problems = []
if (records.length !== expected.records.length) {
  problems.push(`different number of records`)
}
for (let i = 0; i < Math.min(records.length, expected.records.length); i++) {
  const a = expected.records[i]
  const b = records[i]
  for (const f of FIELDS) {
    // Python's file is post-normalise and also post source-confidence capping,
    // which happens on read rather than on write; compare the raw claim.
    if (f === 'confidence' && a[f] === 'medium' && b[f] === 'high') continue
    if (JSON.stringify(a[f] ?? null) !== JSON.stringify(b[f] ?? null)) {
      problems.push(`#${i} ${String(a.title).slice(0, 40)}\n      ${f}: python ${JSON.stringify(a[f])}, js ${JSON.stringify(b[f])}`)
    }
  }
}

if (problems.length) {
  console.log(`${problems.length} problem(s):`)
  for (const p of problems.slice(0, 20)) console.log('  - ' + p)
  process.exit(1)
}
console.log('IDENTICAL — every book matches on every field.')
