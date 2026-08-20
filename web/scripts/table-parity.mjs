// Reads a list file with the JavaScript ingester and diffs the records against
// the ones Python produced.
//
//   node web/scripts/table-parity.mjs sources/biblioteca.xml Owned data/private/list.json

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { loadTable } from '../src/ingest/table.js'
import { normalise } from '../src/core/records.js'

const [path, section, expectedPath] = process.argv.slice(2)
const bytes = new Uint8Array(readFileSync(path))
const parsed = await loadTable({
  name: basename(path),
  bytes,
  text: new TextDecoder('utf-8').decode(bytes),
  section: section === '-' ? null : section,
})
// Python's file has been through records.normalise, which fills defaults and
// sorts the format list; compare like against like.
const records = parsed.map(normalise)

console.log(`rows read by js     : ${records.length}`)
if (!expectedPath) {
  console.log(JSON.stringify(records.slice(0, 3), null, 2))
  process.exit(0)
}

const expected = JSON.parse(readFileSync(expectedPath, 'utf8')).records
console.log(`rows read by python : ${expected.length}`)
console.log(`with an author      : ${records.filter((r) => r.authors.length).length}`)
console.log(`with a genre        : ${records.filter((r) => r.genre).length}`)
console.log(`multi-volume rows   : ${records.filter((r) => r.collapsed).length}`)
console.log('')

// Python's output has been through records.normalise, which fills defaults the
// ingester leaves out; compare only the fields the ingester actually sets.
const FIELDS = ['title', 'authors', 'author_label', 'genre', 'keywords', 'series',
  'series_index', 'publisher', 'acquired_on', 'read', 'location', 'collapsed',
  'listed_volumes', 'formats']

const key = (r) => `${r.title}||${(r.authors || []).join('|')}`
const py = new Map(expected.map((r) => [key(r), r]))
const js = new Map(records.map((r) => [key(r), r]))

const problems = []
for (const [k, r] of py) if (!js.has(k)) problems.push(`only python has: ${r.title}`)
for (const [k, r] of js) if (!py.has(k)) problems.push(`only js has:     ${r.title}`)

const perField = {}
let differing = 0
for (const [k, a] of py) {
  const b = js.get(k)
  if (!b) continue
  for (const f of FIELDS) {
    const want = a[f] === undefined ? null : a[f]
    const got = b[f] === undefined ? (f === 'formats' || f === 'authors' ? [] : null) : b[f]
    if (JSON.stringify(want) !== JSON.stringify(got)) {
      differing++
      perField[f] = (perField[f] || 0) + 1
      if (differing <= 10) {
        problems.push(`${a.title.slice(0, 46)}\n      ${f}: python ${JSON.stringify(want)}, js ${JSON.stringify(got)}`)
      }
    }
  }
}

if (problems.length) {
  console.log(`${problems.length} problem(s):`)
  for (const p of problems.slice(0, 24)) console.log('  - ' + p)
  if (Object.keys(perField).length) console.log('\nfields differing:', JSON.stringify(perField))
  process.exit(1)
}
console.log('IDENTICAL — every row matches on every field the ingester sets.')
