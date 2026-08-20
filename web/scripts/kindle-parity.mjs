// Parses the Kindle export with the JavaScript ingester and diffs the records
// against the ones Python produced.
//
//   node web/scripts/kindle-parity.mjs sources/kindle.pdf data/private/kindle.json
//
// The bar is the one the Python meets: every item Amazon claims, each with a
// title, an author and a parseable date.

import { readFileSync } from 'node:fs'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { linesFromPdf } from '../src/ingest/pdftext.js'
import { parseKindle } from '../src/ingest/kindle.js'

const [pdfPath, expectedPath] = process.argv.slice(2)
const pages = await linesFromPdf(pdfjs, new Uint8Array(readFileSync(pdfPath)))
const { records, stats } = parseKindle(pages)
const expected = JSON.parse(readFileSync(expectedPath, 'utf8'))

console.log(`declared by Amazon : ${stats.amazon_declared_total}`)
console.log(`parsed by js       : ${records.length}   -> delta ${records.length - stats.amazon_declared_total}`)
console.log(`parsed by python   : ${expected.records.length}`)
console.log(`no title           : ${records.filter((r) => !r.title).length}`)
console.log(`no author          : ${records.filter((r) => !r.authors.length).length}`)
console.log(`unparseable dates  : ${records.filter((r) => !r.acquired_on).length}`)
console.log(`read               : ${records.filter((r) => r.read).length}`)
console.log(`clipped titles     : ${records.filter((r) => r.title_clipped).length}`)
console.log('')

// Match on title + date, which no two records share, so a diff points at the
// book rather than at a position in a list.
const key = (r) => `${r.title}||${r.acquired_on}`
const py = new Map(expected.records.map((r) => [key(r), r]))
const js = new Map(records.map((r) => [key(r), r]))

const problems = []
for (const [k, r] of py) if (!js.has(k)) problems.push(`only python has: ${r.title} (${r.acquired_on})`)
for (const [k, r] of js) if (!py.has(k)) problems.push(`only js has:     ${r.title} (${r.acquired_on})`)

const FIELDS = ['authors', 'publisher', 'acquired_on', 'read', 'collections', 'devices', 'update_available']
let differing = 0
const perField = {}
for (const [k, a] of py) {
  const b = js.get(k)
  if (!b) continue
  for (const f of FIELDS) {
    if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) {
      differing++
      perField[f] = (perField[f] || 0) + 1
      if (differing <= 10) {
        problems.push(`${a.title.slice(0, 46)}\n      ${f}: python ${JSON.stringify(a[f])}, js ${JSON.stringify(b[f])}`)
      }
    }
  }
}

// title_clipped is reported apart: the two implementations detect it by
// different evidence, because pdf.js discards the trailing space PyMuPDF keeps.
let clipDiff = 0
for (const [k, a] of py) {
  const b = js.get(k)
  if (b && a.title_clipped !== b.title_clipped) clipDiff++
}

if (problems.length) {
  console.log(`${problems.length} problem(s):`)
  for (const p of problems.slice(0, 24)) console.log('  - ' + p)
  if (Object.keys(perField).length) console.log('\nfields differing:', JSON.stringify(perField))
} else {
  console.log('Every record matches on every field except title_clipped.')
}
console.log(`\ntitle_clipped differs on ${clipDiff} record(s) — see the note in kindle.js.`)
process.exit(problems.length ? 1 : 0)
