# Development

Running it, testing it, and where each part of the code lives.

[← back to the README](../README.md)

---


```bash
cd web
npm install
npm run dev      # development server
npm run build    # production build into web/dist
npm test         # the test suite
npm run test:watch
```

### Tests

The suite covers the parts where being wrong is both easy and quiet:

| | |
|---|---|
| `tests/build.test.js` | merging — one book from several sources, and which source wins a disagreement |
| `tests/overrides.test.js` | corrections, and that a removal survives a rebuild |
| `tests/records.test.js` | the source contract, and everything it refuses |
| `tests/ingest.test.js` | spreadsheet and CSV reading, tiling geometry, transcription validation |
| `tests/matching.test.js` | title and author matching, the heuristics that decide identity |
| `tests/providers.test.js` | the AI registry, the schema in all three dialects, and cost arithmetic |
| `tests/i18n.test.js` | that both languages define the same keys with the same placeholders |

They are deliberately about behaviour rather than implementation: a test that
pins how merging works today would have to be rewritten every time merging
improves, and would catch nothing worth catching.

There are no browser tests. Everything here runs in Node against pure functions;
the interface is checked by hand, and the deploy checks that the built app can
actually be installed.

The app has no backend. Everything runs in the browser: spreadsheets are read
with a small zip reader, photographs are pieced on a canvas.

```
web/src/core/      matching, merging and the catalog format
web/src/ingest/    one module per kind of source
web/src/store/     where a library lives on disk
web/src/views/     the interface
web/tests/         the test suite
tools/librapp/     the Python command-line tools
prompts/           AI prompts, as plain text
docs/              this manual
```

- [`schema.md`](schema.md) — what the catalog contains

Your own library is never part of this repository: `sources/` and
`data/private/` are gitignored.
