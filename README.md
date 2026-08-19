# LibrAPP

A personal book catalog that works offline.

LibrAPP turns whatever record you already have of your books — a photo of a
shelf, a screenshot of a store library, a spreadsheet — into one clean local
catalog you can browse, search and filter without a network connection and
without asking anyone's permission.

AI is used at the edges, never in the middle:

| Stage | What happens | Needs AI |
|---|---|---|
| **Ingest** | Photos, screenshots and exports become structured records | yes, for photos |
| **Catalog** | Browse, search, filter, mark as read, check what you own | **no** |
| **Ask** | Recommendations, synopses, reading orders drawn from your catalog | yes |

The middle column is the point. Once a book is in the catalog, everything you
do with it day to day is local, fast, and yours.

## Status

Early. The ingest pipeline for Amazon Kindle exports works and is verified
against its source. The browse interface is not built yet.

- [x] Kindle "Manage Your Content and Devices" PDF parser (237/237 records)
- [ ] Catalog builder: merge sources, unroll series, authors, tags
- [ ] Browse interface
- [ ] Shelf-photo ingest
- [ ] Recommendations and synopses

## Your data stays yours

This repository is public. **Your catalog is not part of it.**

`sources/` and `data/private/` are gitignored. Raw inputs — your exports, your
shelf photographs — and the catalog built from them stay on your machine. What
ships here is the tooling and a small sample catalog.

If you want your own catalog version-controlled, keep `data/private/` as a
separate private repository.

## Requirements

- Python 3.11+
- [PyMuPDF](https://pymupdf.readthedocs.io/) for PDF ingest: `pip install pymupdf`

## Usage

Export your Kindle library from **Amazon → Manage Your Content and Devices**,
printing the paginated list to PDF. Then:

```bash
python tools/librapp/parse_kindle.py sources/kindle-all-titles.pdf -o data/private/kindle-raw.json
```

It reports what it found, so you can check the extraction rather than trust it:

```
blocks found      : 237  (0 duplicate screens merged)
unique records    : 237
Amazon claims     : 237   -> delta +0
read              : 159
unparseable dates : 0
clipped titles    : 3
```

`delta +0` means every item Amazon claims to have was recovered. Each record
carries its title, authors, publisher, acquisition date, read flag, and the
collection and device counts.

### Known limits of the source

Amazon's own page clips long titles to a fixed pixel width, mid-word and with
no ellipsis. Those records are flagged `title_clipped` rather than silently
kept — the catalog builder repairs them from other sources.

The print-to-PDF also splits records across page breaks, leaving half-rendered
fragments behind. The parser reads the document as one continuous stream to
stitch those back together; if you see `no title parsed` above zero, a record
was lost and the extraction should not be trusted.

## Layout

```
tools/librapp/     ingest and catalog-building scripts
prompts/           AI prompts, version-controlled as plain text
data/sample/       small anonymised catalog, committed
data/private/      your real catalog                  (gitignored)
sources/           your raw exports and photographs   (gitignored)
docs/              schema and design notes
```

Prompts live in `prompts/` as files rather than embedded in code, so they can
be read, edited and diffed without touching Python.

## Licence

MIT. See [LICENSE](LICENSE).
