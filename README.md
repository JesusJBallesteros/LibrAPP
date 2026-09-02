# LibrAPP

[![Tests](https://github.com/JesusJBallesteros/LibrAPP/actions/workflows/tests.yml/badge.svg)](https://github.com/JesusJBallesteros/LibrAPP/actions/workflows/tests.yml)
[![Deploy](https://github.com/JesusJBallesteros/LibrAPP/actions/workflows/pages.yml/badge.svg)](https://github.com/JesusJBallesteros/LibrAPP/actions/workflows/pages.yml)
[![Licence: AGPL v3](https://img.shields.io/badge/licence-AGPL%20v3-blue)](LICENSE.md)

### Photograph your shelves. Get a catalog that answers questions.

[![The catalog drawn as a shelf, ninety-one spines standing side by side, thick books wider than thin ones](docs/images/shelf.png)](https://jesusjballesteros.github.io/LibrAPP/#demo)

## → [**See it with books in it**](https://jesusjballesteros.github.io/LibrAPP/#demo) ←

That link opens a working library of 91 example books: browse the shelf, open a
book, ask the desk something. Nothing to install, nothing to sign up for, nothing
saved to your device. Reload and it is gone.

When you want your own in it, [**open LibrAPP**](https://jesusjballesteros.github.io/LibrAPP/)
and photograph a shelf.

---

**Point a camera at a bookcase.** LibrAPP cuts the photograph up on your device
and reads the spines into a catalog you can search, filter and browse. Bring in a
spreadsheet or a barcode as well, and the same book arriving from three places
becomes one entry rather than three.

**Then ask it things.** The [LibrAPPrian's desk](docs/the-desk.md) takes your own
shelves as context: what to read next and why, which books by an author you have
collected unevenly are missing, what threads run through what you own, a list for
a long flight. The answers are about your books, not about books.

**It also tells you things you did not ask.** Which books you bought years ago
and never opened, ranked by how long they have waited and by how much you
evidently wanted them at the time. What is lent out and to whom. What the
collection keeps coming back to.

![The desk: a row of shelves the desk singles out with Bought, and never opened chosen, five spines under the years each has waited, the keyword cloud below, and the question panel on the right with Synopsis chosen](docs/images/desk.png)

**Your books stay on your device.** No account, no server, no sync. It works
offline once loaded and installs as an app on Windows, Linux, Android and, by
Add to Home Screen, on an iPhone. Three
optional steps can send something, all of them listed [below](#about-privacy-and-version), and each
shows you what it is sending first.

The interface is in English and Spanish, chosen on the opening page.

---

## The guides

The rest of the manual lives in [`docs/`](docs), one page per thing.

| | |
|---|---|
| [Adding your books](docs/adding-books.md) | A photograph, a list you already keep, a Kindle library, a barcode, or typing one in |
| [Using the catalog](docs/the-catalog.md) | Searching, the shelf view, favourites, corrections, lending |
| [The LibrAPPrian's desk](docs/the-desk.md) | What it works out on its own, what you can ask it, and what it sends |
| [Where your library lives](docs/your-library.md) | Storage, backups, and moving to another device |
| [Optional AI key](docs/ai-key.md) | Which services, what they cost, and working without one |
| [Browser support](docs/browsers.md) | What runs where, and what is missing |
| [Development](docs/development.md) | Running it, testing it, and how the code is laid out |

---

## What it does

| | |
|---|---|
| **Import** | shelf photographs, spreadsheets, CSV, barcodes |
| **Merge** | the same book from several sources becomes one entry, not duplicates |
| **Browse** | search, filter and group offline — no network, no waiting |
| **Correct** | edit or remove any entry; corrections outlast every rebuild |
| **Ask** | recommendations, synopses and reading lists, with your own shelves as the context |
| **Complete** | ask for the details the catalog is missing, and see them before they are kept |
| **Mark** | star the ones that matter and write your own notes, which the desk then reads |
| **Track** | who has the book you lent, and whose book you are still holding |

Two steps use AI: reading spines off a photograph, and asking the desk a
question. Both work without a key, by preparing the request for you to paste into
any AI session yourself, and both show what a request will cost before it is
sent. Everything else, meaning importing, merging, searching and filtering, is
plain code running locally. You choose which service to use and pay for it
directly.

---

## Language

LibrAPP is available in **English** and **Spanish**.

Adding a language:  add one file next to
[`web/src/i18n/en.js`](web/src/i18n/en.js) and listing it in
[`web/src/i18n/index.jsx`](web/src/i18n/index.jsx). Any key you leave out falls
back to English, so a partial translation still works.

---

## Getting at it

LibrAPP is built to be used by keyboard and by screen reader, not only by mouse
and eye. It is checked against WCAG 2.2 rather than guessed at, and the colour
arithmetic is measured by its own tests, so a later change to the palette has to
fail there before it can ship.

**Contrast is not a setting.** The palette everyone gets is the raised one:
quiet text reaches 7:1, which WCAG calls the enhanced level, and the hairlines
between rows are drawn as strongly as the boundary of a control, since at low
vision the structure of a page matters as much as the words. There used to be a
switch offering a lower level; there is nothing to switch to now.

**By keyboard**, a skip link is the first thing Tab reaches, past the sidebar
and into the catalog. The book panel is a real dialog: it takes focus when it
opens, keeps it while open, closes on Escape, and hands focus back to the row
you opened. The current page is marked as such, and the page title names the
view you are on.

**Everything that carries meaning carries it in words as well.** Read state is
written out, not only coloured. The genre chart is labelled and every slice is
named and counted in its legend. Spines keep their titles as their accessible
names, and word cloud entries say how many books use each word.

Nothing moves for anyone who has asked their system for less motion.

If something here does not work for you, that is a bug and worth
[reporting](https://github.com/JesusJBallesteros/LibrAPP/issues).

---

## Install

You do not have to install anything —
[the app](https://jesusjballesteros.github.io/LibrAPP/) runs in the browser. But
installing gives it its own icon and window, and makes offline use reliable.

**On your phone**, the front page offers to install where the browser supports
being asked, and writes out the manual route where it does not: on an iPhone,
*Share* then *Add to Home Screen*; on Android, the browser menu then *Install
app*. Both do the same thing.

<img src="docs/images/phone-desk.png" alt="The desk on a phone: the sidebar folded behind a Menu button, and the shelves shown one at a time with the names either side of the chosen one" width="320">

**Your catalog does not travel with it.** Each device keeps its own, so moving
one across is a file: export it in **The stacks** on one device, and bring that
file in on the other. A backup works for this too, since a backup is the same
file.

### Running your own copy

LibrAPP is a static site. Build it and serve the `web/dist` folder from
anywhere — a local server, a static host, GitHub Pages.

```bash
cd web && npm install && npm run build
```

Requirements: Node 20+ to build. Nothing to run it.

---

## About, privacy and version

The opening page has a footer: **About · Privacy · Licence · Source code ·
Report a problem**. They all lead to one page, each landing on its own section,
reachable from the sidebar once you are inside.

There is no contact form, because there is no server to receive one. Anything
about the app goes to
[GitHub Issues](https://github.com/JesusJBallesteros/LibrAPP/issues), where it
is public and does not get lost; anything else goes through the contact details
on [my own site](https://jesusjballesteros.github.io/).

There is no cookie banner either, because there are no cookies, no analytics and
no trackers. The only things remembered about you are which language you chose
and where your library is.

Three things can leave the device, all optional and none of them on by default:

| Step | What is sent | What is not |
|---|---|---|
| Reading a shelf photograph | The pieces of that photograph | Anything else about your catalog |
| Asking the desk a question | Your reading profile, printed in full first | The rest of the catalog |
| Scanning a barcode | The ISBN, to Open Library | The title, your notes, your shelf, you |

The barcode case is the smallest of the three by a distance. Barcodes are
decoded on the device, whether they come from a picture or from the camera, and
neither the picture nor the camera's view leaves or is recorded. What goes out
is thirteen digits printed on the back of a book anybody can buy.

**The camera** is asked for only when you press *Scan with the camera*, and it
is handed back the moment you stop, leave the page, or switch to another tab.

**Version.** **The stacks** shows which build you are running, when it was
made, and a button that throws the cached copy away and fetches the current one.
An installed app keeps a copy of itself so it can open offline, and that copy can
occasionally be older than what is published. The button discards only the app —
your library, sources and corrections are stored elsewhere and are not touched.

---

## How this was built

Written by **Jesús J. Ballesteros** working with **Claude**, an AI assistant.
Every decision about what to build was human made; most of the code was typed by
the model. A few early testers used it and said what did not work, and more than
one thing here exists because of that.

None of this touches the contents of your catalog. No entry is invented, every
book comes from a source you provided, and the AI features are optional and off
until you add a key.

---

## Command-line tools

The Python scripts under [`tools/librapp/`](tools/librapp) predate the app and
still read and write the same folder layout. They are unmaintained: the app does
everything they did, and nothing in it depends on them.

---
## Development

```bash
cd web
npm install
npm run dev      # development server
npm run build    # production build into web/dist
npm test         # the test suite
```

What the tests cover, how the code is laid out and why there are no browser
tests: [Development](docs/development.md).

---

## Licence

[GNU Affero General Public License v3](LICENSE.md), or any later version.

**Use it, change it, share it, for anything.** Including in a business.

**If you pass it on, pass the source on with it.** That applies to a modified
copy you host as well as one you hand over: this app is delivered to every
visitor as JavaScript, so putting it on the web is handing it over. Publish your
changes under the same licence and you have done what the licence asks.

**A commercial exception is available.** If you want to build LibrAPP into
something closed, [open an
issue](https://github.com/JesusJBallesteros/LibrAPP/issues) and ask. The
copyright is held in one place, so it can be given.

LibrAPP was under [PolyForm
Noncommercial](https://polyformproject.org/licenses/noncommercial/1.0.0) until
v2.6.1. That licence barred commercial use outright, which also kept the project
out of every free-software directory and off the list of things most people are
allowed to contribute to. Versions up to v2.6.0 remain available under it.

Its dependencies keep their own terms: React, Zod, the Anthropic SDK and the
barcode reader under MIT, the two typefaces under the SIL Open Font Licence. The
app lists them on its **About** page.
