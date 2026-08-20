# LibrAPP

### Create your full book catalog from a picture of your shelf.

## → [**Open LibrAPP**](https://jesusjballesteros.github.io/LibrAPP/) ←

No account, no signup, nothing to install first. Works offline once loaded, and
installs as an app on Windows, Linux and Android.

---

Photograph a shelf and LibrAPP reads the spines into a catalog you can search,
filter and browse. You can also import a spreadsheet, a CSV, or a store export
— and combine all of them into one catalog with no duplicates.

Your books stay on your device. There is no account, no server and no sync.

---

## Contents

- [What it does](#what-it-does)
- [Browser support](#browser-support)
- [Install](#install)
- [Adding your books](#adding-your-books)
- [Using the catalog](#using-the-catalog)
- [Corrections](#corrections)
- [The desk](#the-desk)
- [Where your library lives](#where-your-library-lives)
- [Optional API key](#optional-api-key)
- [Command-line tools](#command-line-tools)
- [Development](#development)
- [Licence](#licence)

---

## What it does

| | |
|---|---|
| **Import** | shelf photographs, spreadsheets, CSV, XML, store exports as PDF |
| **Merge** | the same book from several sources becomes one entry, not duplicates |
| **Browse** | search, filter and group offline — no network, no waiting |
| **Correct** | edit or remove any entry; corrections outlast every rebuild |
| **Ask** | recommendations and synopses, using your catalog as context |

Only two steps involve AI: reading spines off a photograph, and asking
questions. Everything else — importing, merging, searching, filtering — is
plain code running locally. You can use LibrAPP without any AI at all.

### Why it might suit you

- **Nothing leaves your device.** No account to create, nothing uploaded.
- **Works offline.** The catalog is a file on your device, not a web service.
- **Reads what you already have.** Most catalogs make you type everything in.
- **Your data is plain JSON.** Readable, transferable and always yours.

---

## Browser support

| Engine | Browsers | Everything works? |
|---|---|---|
| **Chromium** | Chrome, Edge, **Brave**, Opera, Vivaldi, Arc, **Comet**, Samsung Internet | Yes |
| **Gecko** | Firefox 113+ | Yes, except saving to a folder and installing as an app |
| **WebKit** | Safari 16.4+, all iOS browsers | Yes, except saving to a folder; install via Add to Home Screen |

Only Chromium browsers on a desktop can save your library to a folder you
choose; everywhere else it goes into browser storage, which works identically
from inside the app but is not visible to other programs. See [where your
library lives](#where-your-library-lives).

**Not sure about yours?** Open LibrAPP and go to **Library → Your browser**. It
tests each feature and tells you what works, which is more reliable than any
table — including this one.

### If you use strict privacy settings

Brave's Shields, Firefox's strict mode and similar features do not stop LibrAPP
working. But **anything set to clear site data when you close the browser will
delete a library kept in browser storage.** If you use those settings:

- prefer saving to a folder (Chromium desktop), or
- allow LibrAPP's storage as an exception, or
- keep an export — **Library → Export**.

LibrAPP warns you when its storage is not marked persistent.

### Tested on

Chrome on W11 and Android. Firefox and Safari meet the
requirements below but are untested. If something breaks in yours, please
open an issue.

Internet Explorer and browsers older than the versions above are not supported.

<details>
<summary>What LibrAPP needs from a browser</summary>

| Feature | Used for | Without it |
|---|---|---|
| Secure context (HTTPS) | everything | nothing works |
| IndexedDB | settings and where your library is | nothing works |
| Origin Private File System | keeping the catalog | nothing works |
| Regex lookbehind and Unicode escapes | matching titles and names | nothing works |
| File System Access API | saving to a folder you choose | browser storage is used instead |
| `DecompressionStream` | reading `.xlsx` spreadsheets | CSV, XML and PDF still import |
| `OffscreenCanvas`, `createImageBitmap` | tiling a photograph | import from a list instead |
| Service workers | installing, and offline use | runs online only |

</details>

---

## Install

You do not have to install anything —
[the app](https://jesusjballesteros.github.io/LibrAPP/) runs in the browser. But
installing gives it its own icon and window, and makes offline use reliable.

### On a phone or tablet

Open [LibrAPP](https://jesusjballesteros.github.io/LibrAPP/) in Chrome and
choose **Install app** (or **Add to Home screen**) from the browser menu.

### On a desktop

Open [LibrAPP](https://jesusjballesteros.github.io/LibrAPP/) in Chrome or Edge
and click the **install icon** in the address bar.

### Running your own copy

LibrAPP is a static site. Build it and serve the `web/dist` folder from
anywhere — a local server, a static host, GitHub Pages.

```bash
cd web && npm install && npm run build
```

Requirements: Node 20+ to build. Nothing to run it.

---

## Adding your books

You need at least one source. Any one of these is enough on its own.

### A photograph of a shelf

Photograph the shelf straight on at your camera's **full resolution**.

1. Open **Shelf picture** and choose the photo.
2. LibrAPP cuts it into tiles at full resolution. A close-up of a few books
   stays whole; a wide bookcase is split into several tiles. Adjust the grid
   with the **across** and **down** buttons if the default does not suit your
   shelf.
3. Read the tiles:
   - With an [API key](#optional-api-key): press **Read these tiles for me**.
   - Without one: press **Copy the instructions**, save the tiles, and give
     both to any AI assistant. Bring back the JSON it writes.
4. Check what it read, then import.

Aim for tiles showing a handful of whole spines with the title readable top to
bottom. Adding **rows** splits titles in half — only do it when the photo
really shows shelves stacked above one another.

A photograph shows a title, usually an author, sometimes a publisher. It cannot
show when you bought a book or whether you read it, so those stay blank until
another source fills them in.

### A list you already keep

Open **Upload list** and drop in a `.xlsx`, `.csv`, `.tsv` or `.xml` file.

Columns are matched by name in English, Spanish and German, so a sheet headed
`Autor / Título / Género` works as well as `author / title / genre`. Recognised
columns include title, author, genre, keywords, series, volume, publisher,
acquired date, read status, format and location. Unrecognised columns are
ignored.

If a file holds more than one list, LibrAPP asks which one you want before
importing anything.

### A store export

Export your library from Amazon's **Manage Your Content and Devices** page,
printing the list to PDF, then drop the PDF into **Upload list**.

This recovers the title, authors, publisher, purchase date, read status and how
many devices and collections each book is in.

### Typing a book in

Press **Type a book in** from the catalog for anything the other sources cannot
see — a gift, a borrowed book, something read but not owned.

Typed entries merge with the same book from other sources rather than
duplicating it.

---

## Using the catalog

**Search** across titles, authors, series and tags.

**Filter** by read status, format (paper, ebook, audio) and which source a book
came from.

**Group** by title, author or series.

**Sort** by title, author, newest or oldest.

**Click any book** for the full record: series and volume, formats, purchase
date, publisher, genre and tags, where it is shelved, which sources know about
it, and how confident LibrAPP is about the entry.

### Read status has three values

| | |
|---|---|
| **read** | a source recorded it as read |
| **unread** | a source recorded it as unread |
| **not recorded** | nothing has ever said either way |

### Confidence

| | |
|---|---|
| **high** | from a machine-readable source, checked against its own count |
| **medium** | transcribed by eye or by a model — a photograph, a hand-kept list |
| **low** | a guess, or a placeholder for something illegible |

When two sources disagree, the more reliable one wins on facts it can know. A
store export knows the purchase date; a photograph does not. Judgements like
genre come from whichever source recorded one.

---

## Corrections

Anything LibrAPP got wrong can be fixed, and the fix outlasts every rebuild.

**Edit** any entry from its detail panel. Only the fields you actually change
are recorded, so later improvements to your sources still reach the rest of the
entry. A corrected entry says so, shows what it said before, and can be undone.

**Remove** an entry to take it out of the catalog. Because the catalog is
rebuilt from your sources every time, a removal is stored as a decision rather
than a deletion — otherwise the next rebuild would bring the book straight
back.

Everything you have corrected is listed under **Library → Corrections you have
made**, where removals can be restored and edits undone.

---

## The desk

The **LibrAPPrian's desk** is where the catalog stops being a list.

**Bought, and never opened** — books you own and have not read, ordered by how
long they have waited and weighted by how much you evidently wanted them at the
time: filing a book into a collection, or putting it on several devices, is a
record of intent that a purchase date alone is not. Only books *known* to be
unread appear.

**What the collection is made of** — the largest genres as a share of the
whole, with the long tail grouped as *other*. Genre labels come from your
sources and are not a controlled list, so the chart says how much of the
collection the named genres actually cover.

**Ask** — a synopsis of any book, or a recommendation. LibrAPP builds a profile
of your reading (what the collection contains, how it has changed over the
years, which authors dominate, what is waiting unread) and sends it with your
question, so the answer is about your shelf rather than books in general.

With an API key it asks directly. Without one it assembles the whole request
for you to paste into any AI assistant.

The book you ask about does not have to be one you own.

The prompts live in [`prompts/`](prompts) as plain text. Edit them to change how
LibrAPP asks.

---

## Where your library lives

LibrAPP asks once, the first time you open it.

**A folder you choose** (desktop). Plain JSON files you can read, back up, or
keep in a private repository:

```
sources/       one file per import, exactly as it was read
catalog.json   rebuilt from all of them
overrides.json your corrections
```

**Browser storage** (phone, or if you prefer). Managed by the browser and
private to LibrAPP. Not visible to other apps, so export is how a copy leaves
the device.

Either can be changed later from **Library**.

### Moving between devices

**Library → Export** writes one file holding your sources and corrections.
Import it on the other device and the catalog is rebuilt there.

This is a copy, not a sync. Changes on one device do not appear on the other.

### Backups

If you chose a folder, back it up like any other folder. If you use browser
storage, export periodically — browsers can clear their own storage when a
device runs short of space. LibrAPP warns you if your storage is not marked
persistent.

---

## Optional API key

LibrAPP works with no key. A key only lets it do two things itself instead of
preparing them for you: reading spines from a photograph, and answering
questions on the desk.

The key box is in **Shelf picture** and on the **desk**, and always shows one of
three states:

| | |
|---|---|
| **no key stored** | LibrAPP prepares requests for you to paste elsewhere |
| **stored · in use** | LibrAPP may read spines and answer questions |
| **stored · switched off** | the key is kept but not used |

Switching off keeps the key for later. Deleting removes it from the device.

**Cost.** Reading a full 50-megapixel shelf costs roughly 28 cents. A close-up
of a few books costs under three. LibrAPP shows an estimate before spending and
the actual cost afterwards.

**Security.** A key stored in a browser can be read by anything running on the
page. Use a key scoped to its own workspace with a spend limit. The key is sent
only to the API, is never written into your catalog, and is never included in an
export.

**Review.** Books read from a photograph are shown for your approval before
they enter the catalog, with each entry's confidence beside it. A model reading
a spine can be wrong in ways nothing downstream can detect.

Get a key from the [Anthropic Console](https://console.anthropic.com/).

---

## Command-line tools

Everything LibrAPP imports is also available as Python scripts in
[`tools/librapp/`](tools/librapp), which read and write the same folder layout.

```bash
python tools/librapp/parse_kindle.py export.pdf -o data/private/kindle.json
python tools/librapp/parse_table.py library.xlsx -o data/private/list.json
python tools/librapp/parse_shelf.py tile shelf.jpg -o work/tiles
python tools/librapp/build_catalog.py --source data/private/kindle.json -o catalog.json

python tools/librapp/query.py stats
python tools/librapp/query.py search kant
python tools/librapp/query.py series --volumes
python tools/librapp/query.py forgotten
python tools/librapp/query.py context
```

Requires Python 3.11+, plus [PyMuPDF](https://pymupdf.readthedocs.io/) for PDF
import and [Pillow](https://python-pillow.org/) for photo tiling.

The command-line tools do not apply corrections — those are added by the app
after the merge.

---

## Development

```bash
cd web
npm install
npm run dev      # development server
npm run build    # production build into web/dist
```

The app has no backend. Everything runs in the browser: PDFs are read with
pdf.js, spreadsheets with a small zip reader, photographs are tiled on a canvas.

```
web/src/core/      matching, merging and the catalog format
web/src/ingest/    one module per kind of source
web/src/store/     where a library lives on disk
web/src/views/     the interface
tools/librapp/     the Python command-line tools
prompts/           AI prompts, as plain text
docs/              the catalog format
```

- [`docs/schema.md`](docs/schema.md) — what the catalog contains

Your own library is never part of this repository: `sources/` and
`data/private/` are gitignored.

---

## Licence

[PolyForm Noncommercial 1.0.0](LICENSE.md).

**Free for any non-commercial use** — personal, hobby, study, research, and use
by charities, schools, universities, and public institutions. Use it, change it,
share it.

**Commercial use requires a separate licence.** If you want to use LibrAPP in or
for a business, [open an
issue](https://github.com/JesusJBallesteros/LibrAPP/issues) to ask.

Note that this is a source-available licence, not an OSI-approved open source
one. LibrAPP's own dependencies (React, pdf.js, and others) remain under their
own MIT and Apache-2.0 terms.
