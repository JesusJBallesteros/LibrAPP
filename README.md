# LibrAPP

A personal book catalog that works offline.

LibrAPP turns whatever record you already have of your books — a photograph of
a shelf, a store export, a spreadsheet — into one clean local catalog you can
browse, search and filter without a network connection and without asking
anyone's permission.

AI is used at the edges, never in the middle:

| Stage | What happens | Needs AI |
|---|---|---|
| **Ingest** | Photos, exports and lists become structured records | only for photos |
| **Catalog** | Browse, search, filter, check what you own and what you have read | **no** |
| **Ask** | Recommendations, synopses, what you forgot you bought | yes |

The middle column is the point. Once a book is in the catalog, everything you
do with it day to day is local, fast, and yours.

## Any source, or all of them

The three inputs are independent. A catalog can be built from a photograph
alone, a list alone, or every source you have:

```bash
# a photograph of a shelf, and nothing else
python tools/librapp/build_catalog.py --source shelf.json -o catalog.json

# an exported list, and nothing else
python tools/librapp/build_catalog.py --source list.json -o catalog.json

# everything, merged
python tools/librapp/build_catalog.py --source kindle.json --source shelf.json --source list.json -o catalog.json
```

Each ingester writes the same envelope ([`records.py`](tools/librapp/records.py))
and the builder reads nothing else, so a new kind of input means one more
ingester and no change to anything downstream.

Sources that describe the same book are merged into one entry owning every
format it was found in. Where they disagree, the more reliable source wins on
matters of fact — a store export knows the acquisition date, a photograph
cannot — while judgements like genre come from whoever troubled to make one.

## Status

- [x] Store export ingest — Amazon Kindle "Manage Your Content and Devices" PDF
- [x] List ingest — `.xlsx`, `.csv`, `.tsv`, `.xml`
- [x] Shelf-photo ingest — tiling, transcription, validation
- [x] Catalog builder — any number of sources, in any combination
- [x] Offline queries, including books you bought and forgot
- [x] Prompts for synopses and recommendations
- [x] Browse interface — a local window over all of it
- [x] Installable on Windows, Linux and Android — no terminal, no server, no Python
- [ ] Manual entry, and editing that overrides every source — see [docs/roadmap.md](docs/roadmap.md)

## Your data stays yours

This repository is public. **Your catalog is not part of it.**

`sources/` and `data/private/` are gitignored. Raw inputs — your exports, your
shelf photographs — and the catalog built from them stay on your machine. What
ships here is the tooling and a small sample catalog.

## The app

```bash
cd web && npm install && npm run build
```

Serve `web/dist` from anywhere — including a static host like GitHub Pages —
and open it. Chrome and Edge will offer to **install** it, on Windows, Linux
and Android alike: its own window, its own icon, no browser chrome, and it
keeps working with no network.

There is no server and no Python behind it. Every ingester runs in the browser:
the PDF is read with pdf.js, the spreadsheet with a zip reader over the
platform's own `DecompressionStream`, the photograph is cut up on a canvas.
Nothing is uploaded, because there is nowhere to upload it to.

Five places:

| | |
|---|---|
| **Catalog** | everything you own — search, filter by read state, format or source, group by title, author or series, click any book for the whole record |
| **Shelf picture** | drop a photograph, get tiles, bring back the transcription |
| **Upload list** | drop a spreadsheet, CSV, XML or store export |
| **LibrAPPrian's desk** | what you bought and forgot, what the collection is made of, and questions to put to a model |
| **Library** | where it lives, what it was built from, and export or import |

### Where your library lives

On a desktop, LibrAPP asks for **a folder you choose**. The files are yours:
plain JSON you can read, back up, or keep in a private repository, laid out
exactly as the command-line tools expect, so both can work on the same folder.

Android Chrome has no folder picker, so there it uses **browser storage** —
same file semantics, managed by the browser, invisible outside the app. Export
and import are how a library moves between devices. An export holds the
sources, not the catalog: the catalog is rebuilt on the other side, so two
copies cannot drift into disagreeing about which is current.

Working on the interface itself:

```bash
cd web && npm run dev
```

## Requirements

- Python 3.11+
- [PyMuPDF](https://pymupdf.readthedocs.io/) for PDF ingest — `pip install pymupdf`
- [Pillow](https://python-pillow.org/) for photo ingest — `pip install pillow`

Nothing is needed for lists or for querying. Node is needed only to build the
interface, never to run it — the built files are plain HTML, CSS and JavaScript.

## Ingesting

### A photograph of a shelf

Photograph the shelf at **full resolution**, straight on. This is the one step
that matters more than any code here: a whole bookcase at 1 megapixel is
unreadable, and the same shelf at 50 is not.

```bash
python tools/librapp/parse_shelf.py tile sources/shelf/shelf.jpg -o work/tiles
```

That cuts the photograph into overlapping crops at native resolution. Read them
following [`prompts/ingest-shelf.md`](prompts/ingest-shelf.md) — point Claude
Code at the tiles, or use any model that can see — and write the transcription
it describes. Then:

```bash
python tools/librapp/parse_shelf.py import work/spines.json -o data/private/shelf.json
```

The import refuses a transcription with an untitled book or an unknown
confidence value, which is the point: a bad read should stop before it reaches
the catalog rather than after.

A photograph yields a title, usually an author, sometimes a publisher — and
nothing else. No dates, no read flags. The catalog records that as *unknown*
rather than guessing, and another source can fill it in later.

### A list you already keep

```bash
python tools/librapp/parse_table.py library.xlsx -o data/private/list.json
python tools/librapp/parse_table.py books.csv    -o data/private/list.json --format physical
```

Columns are matched by name, in several languages — a sheet headed `Autor /
Título / Género` works as well as `author / title / genre`. A file holding more
than one list is refused until you name which one with `--section`, so a
wishlist is never silently imported as books you own.

Rows standing for a whole series in one cell are marked rather than counted as
one book. If another source has the individual volumes, they inherit the row's
genre; if nothing does, the row survives as a single flagged entry instead of
quietly disappearing.

### A store export

Export from **Amazon → Manage Your Content and Devices**, printing the
paginated list to PDF.

```bash
python tools/librapp/parse_kindle.py sources/kindle.pdf -o data/private/kindle.json
```

```
blocks found      : 237  (0 duplicate screens merged)
unique records    : 237
Amazon claims     : 237   -> delta +0
read              : 159
clipped titles    : 3
```

`delta +0` means every item Amazon claims to have was recovered.

Two things about that source are worth knowing. Its own page clips long titles
mid-word with no ellipsis, so those are flagged and repaired later from any
source that has them whole. And the print-to-PDF splits records across page
breaks, leaving half-rendered fragments behind; the parser reads the document
as one continuous stream to stitch them back together. If `no title parsed` is
ever above zero, a record was lost and the extraction should not be trusted.

## Using the catalog from a terminal

Everything the window does is also a command, and the commands came first.

```bash
python tools/librapp/query.py stats
python tools/librapp/query.py search kant
python tools/librapp/query.py series --volumes
python tools/librapp/query.py unread --since 2024
```

### What you bought and forgot

```bash
python tools/librapp/query.py forgotten
```

Books explicitly marked unread, ordered by how long they have waited and
weighted by how much you evidently wanted them — filing a book into a
collection, or pushing it to several devices, is a record of intent that a
purchase date alone is not.

Only books *known* to be unread are eligible. A physical book whose read state
nobody ever recorded is unknown, not unread, and guessing would fill the list
with books already finished.

## Asking

The prompts live in [`prompts/`](prompts) as plain text, so they can be read and
edited without touching code.

```bash
python tools/librapp/query.py context > profile.md
```

`context` prints a compact picture of the collection — what it is made of, how
it has moved over the years, which authors dominate, what is waiting unread.
Hand that to a model along with [`prompts/synopsis.md`](prompts/synopsis.md) or
[`prompts/recommend.md`](prompts/recommend.md).

The book you ask about does **not** have to be in the catalog. The profile is
there to say who is asking, not to limit what can be asked — the difference
between a generic synopsis and one that tells you how the book stands against
the shelf you already own.

## Layout

```
tools/librapp/     ingest, build, query and serve
  serve.py         the local server behind the window
web/               the interface (React, built with Vite)
  records.py       the envelope every source writes and the builder reads
  textmatch.py     deciding when two records mean the same book or person
prompts/           AI prompts, version-controlled as plain text
data/sample/       small invented catalog, committed
data/private/      your real catalog                  (gitignored)
sources/           your raw exports and photographs   (gitignored)
docs/              schema and design notes
```

[`docs/schema.md`](docs/schema.md) describes what the catalog contains. The
short version: `read` is three-valued, because a book nobody ever recorded
reading is not the same as one known to be unread.

## Licence

MIT. See [LICENSE](LICENSE).
