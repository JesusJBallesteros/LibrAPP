// Dumps the text lines pdf.js sees, so they can be diffed against PyMuPDF's.
//
//   node web/scripts/pdf-lines.mjs <file.pdf>   -> JSON [[line, ...], ...]
import { readFileSync } from 'node:fs'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { linesFromPdf } from '../src/ingest/pdftext.js'

const pages = await linesFromPdf(
  pdfjs,
  new Uint8Array(readFileSync(process.argv[2])),
)
process.stdout.write(JSON.stringify(pages))
