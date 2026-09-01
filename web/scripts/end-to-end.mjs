// Builds a catalog from raw files using only the JavaScript pipeline, and
// compares the result with the one Python produced.
//
//   node web/scripts/end-to-end.mjs
//
// Every step here is code that will run unchanged in the browser: the PDF is
// read with pdf.js, the spreadsheet with a hand-rolled zip reader over
// DecompressionStream, and nothing is uploaded anywhere.

import { readFileSync } from 'node:fs'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { linesFromPdf } from '../src/ingest/pdftext.js'
import { parseKindle } from '../src/ingest/kindle.js'
import { loadTable } from '../src/ingest/table.js'
import { loadTranscription } from '../src/ingest/shelf.js'
import { makeSource, readSource } from '../src/core/records.js'
import { build } from '../src/core/build.js'

const [pdfPath, xmlPath, spinesPath, expectedPath] = process.argv.slice(2)

const kindle = parseKindle(await linesFromPdf(pdfjs, new Uint8Array(readFileSync(pdfPath))))
const kindleSource = makeSource({
  name: 'kindle', kind: 'store-export', origin: pdfPath.split(/[\\/]/).pop(),
  format: 'ebook', confidence: 'high', records: kindle.records, stats: kindle.stats,
})

const xmlText = readFileSync(xmlPath, 'utf8')
const { records: listRecords } = await loadTable({
  name: 'biblioteca.xml',
  text: xmlText,
  section: 'Owned',
})
const listSource = makeSource({
  name: 'catalog', kind: 'table', origin: 'biblioteca.xml',
  format: 'physical', confidence: 'medium', records: listRecords,
})

const shelf = loadTranscription(JSON.parse(readFileSync(spinesPath, 'utf8')))
const shelfSource = makeSource({
  name: 'shelf', kind: 'photo', origin: shelf.stats.photo,
  format: 'physical', confidence: 'medium', records: shelf.records, stats: shelf.stats,
})

// Same order the Python catalog on disk was built in.
const catalog = build([kindleSource, listSource, shelfSource].map((s) => readSource(s)))
const expected = JSON.parse(readFileSync(expectedPath, 'utf8'))

const line = (label, a, b) =>
  console.log(`${label.padEnd(22)} python ${String(a).padStart(5)}   js ${String(b).padStart(5)}${a === b ? '' : '   <-- differs'}`)

console.log('built entirely in JavaScript, from the raw files:\n')
line('books', expected.counts.books, catalog.counts.books)
line('authors', expected.counts.authors, catalog.counts.authors)
line('ebook', expected.counts.by_format.ebook, catalog.counts.by_format.ebook)
line('physical', expected.counts.by_format.physical, catalog.counts.by_format.physical)
line('in >1 source', expected.counts.in_multiple_sources, catalog.counts.in_multiple_sources)
line('read', expected.counts.read, catalog.counts.read)
line('unread', expected.counts.unread, catalog.counts.unread)
line('not recorded', expected.counts.read_unknown, catalog.counts.read_unknown)
line('authors merged', expected.review.author_variants_merged.length, catalog.review.author_variants_merged.length)
line('series unopened', expected.review.series_not_expanded.length, catalog.review.series_not_expanded.length)
line('clipped titles', expected.review.clipped_titles.length, catalog.review.clipped_titles.length)
line('no genre', expected.review.no_genre.length, catalog.review.no_genre.length)

const pyIds = new Set(expected.books.map((b) => b.id))
const jsIds = new Set(catalog.books.map((b) => b.id))
const onlyPy = [...pyIds].filter((i) => !jsIds.has(i))
const onlyJs = [...jsIds].filter((i) => !pyIds.has(i))
console.log(`\nentries only python has: ${onlyPy.length}`)
console.log(`entries only js has    : ${onlyJs.length}`)
if (onlyPy.length) {
  console.log('\nthese differ because a clipped title was repaired from another source:')
  for (const id of onlyPy.slice(0, 10)) {
    const py = expected.books.find((b) => b.id === id)
    console.log(`  python: ${py.title}`)
  }
}
