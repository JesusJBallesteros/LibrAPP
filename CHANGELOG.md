# Changelog

## v2.0.1

Three things reported by testers reading real shelves with a real key, and one
change to how the desk shows its work.

### Fixed: everything the extras checklist asked for was thrown away

Reported as [#13](https://github.com/JesusJBallesteros/LibrAPP/issues/13).

`buildEntry` names the fields it keeps when it merges records into a book, and
`abstract`, `published_year`, `rating`, `original_language` and `pages` were not
among them. The request went out correctly and the model answered; the answer
was discarded on the way into the catalog. Every provider, every read, since the
checklist existed.

The flag beside those fields was carried, so a book could say it held recalled
details and show none of them, which is what made it look like a storage
problem rather than a merge one.

No test caught it because none asserted that a record carrying those fields
still has them once merged. One does now.

The Anthropic route also had a schema commented as matching the shared contract
while missing the page count, so that field was stripped before the ingester saw
it, on that route only.

### Fixed: a long read failed with a parser error

Reported as [#12](https://github.com/JesusJBallesteros/LibrAPP/issues/12).

A shelf read returns one JSON document covering every tile in the request, and
it grows with the tile count and again with every extra ticked. The ceiling was
16000 tokens on all three routes, shared with thinking on the Anthropic one.
Past that the document stops mid-string, which is not a short answer but an
unreadable one, and the SDK parses before any of our code runs. What reached the
reader was a parser complaint with a byte offset in it.

- Ceilings now live in one place, per provider family, because they differ and
  asking for more than a model allows is refused outright.
- All three routes check why the reply ended and say the same thing when it ran
  out of room: what happened, and that fewer tiles or fewer extras will fix it.
- The exact message from the report is a test case, so it cannot reach a reader
  raw again.

### A long shelf is now read in batches

The above makes running out of room fail clearly. This stops it happening.
Tiles go four at a time, each its own request, and the replies are joined back
into one reading.

Splitting them broke something the single request had for free. The prompt tells
the model that a book showing in two overlapping tiles is one book, and it can
obey that only as far as the request it is in. The builder is no help, since it
treats two rows from one source as two copies rather than as a duplicate, which
is right for a spreadsheet and wrong here. So the joining happens in the reader,
while this is still one read that merely travelled in pieces: same title and
same author is one book, and the more confident reading wins.

- A failed batch no longer costs the whole read. What arrived is kept and the
  missing tiles are named, so a partial reading is never imported as though it
  were the whole shelf.
- Nothing coming back at all still raises, because a silent empty result would
  import as an empty shelf.
- A cancelled read stops at once rather than paying for the batches after it.
- The button says which batch is running.

### Fill in gaps reports what it found, instead of printing its reply

The request returns JSON and the panel was printing it, so a wall of braces sat
beside a review listing the same books. It looked like the feature produced
text, the way a synopsis does, when what it produces is changes to the catalog.

The document is now collected for the parser and never shown. In its place are
the counts worth having before keeping anything: how many books are affected,
and which fields actually came back, since a request asking for five commonly
returns three and says nothing about the other two. The same counts appear again
after accepting, so the panel says what changed rather than emptying itself.

The answer panel, its copy button and its cost line belong to the two prose
requests and are now shown only for them. Switching between the three tabs
clears the previous answer, review, error and cost.

The write path is unchanged: still parsed, still reviewed, still written through
the corrections layer, still undone one book at a time.

### Still open

[#3](https://github.com/JesusJBallesteros/LibrAPP/issues/3), a tester reporting
that the read button produced no result, predates all of the above. If it was a
reply running out of room it now says so plainly.

---

## v2.0

Everything below is the difference from v1.0. Nothing in a v1 library needs
converting: the catalog format, the source envelope and the corrections file are
unchanged, and a v1 export opens in v2 as it stands.

Sixty-five files, roughly 4,800 lines added and 700 removed, across fourteen
commits.

---

### New: the LibrAPPrian in the corner

The librarian was a page in v1. It is now also a presence on every screen except
About.

- A badge at the bottom right opens a bubble carrying **up to three things
  about the page you are on**, stepped through one at a time: what is true of
  your collection and worth acting on, then how the page works.
- The guidance is the part a beginner needs, and it is per page: photographing
  a shelf, adjusting the tiles, which file formats are taken, what the three
  desk requests are, where the catalog lives. Before any books exist, all of it
  is how to begin.
- Observations are ordered by what they ask of you. A book belonging to somebody
  else outranks an unread pile, because one is an obligation and the other is
  only an opportunity. Below that: books lent out for more than a year, books
  still unopened, books with no read state recorded.
- Following a line **applies the filter it describes**, and a filter that lives
  behind the catalog's disclosure opens it rather than narrowing the list out of
  sight.
- It speaks while work is in progress: how many tiles are being read, that a
  question is in flight, how many books an import brought and how many were
  already there. Those clear when the work finishes rather than on a timer.
- **Every line is computed from the catalog.** It states nothing it cannot
  count.
- **It can be dismissed for good**, and the choice survives reloads. The way
  back is in Library, and appears only once there is something to undo.
- It is deliberately not a chat surface and has nowhere to type. Anything worth
  typing belongs at the desk, where the question gets the catalog as context and
  the cost is shown before it is spent.

### New: filling gaps from the desk

A third request beside Synopsis and Recommendation.

- Asks a model for the fields your catalog is missing, **for books already on
  the shelf**, instead of only while a photograph is being read.
- The checklist says how many books are missing each field, and the panel says
  how many books the request covers before anything is sent, because the cost
  scales with that number.
- **Nothing is written silently.** The reply is parsed, shown book by book and
  field by field, and kept only if you accept it.
- **Nothing already recorded is overwritten.** This fills gaps; a value that is
  there came from somewhere.
- Books are matched by id rather than by title, since a model tidies titles on
  the way through. Unrecognised ids, wrong types, out-of-range values and fields
  you did not ask for are all discarded and counted.
- Accepted values go in through the corrections layer, so each shows under
  Corrections, carries the reason *recalled by a model at the desk, not read
  from any source*, and can be undone one book at a time.
- Works without a key: copy the request, paste the answer back.

### New: favourites and notes

- **A star** on any book, pressed straight from the list or the spine wall
  without opening anything, and also settable in the editor. Shown on the card,
  with a filter of its own and a section at the desk.
- On the wall the star sits above each spine, quiet until the book is marked or
  the spine is pointed at, and always visible where there is no pointer to
  point with.
- **Notes** are no longer "noted when read". The field is now for whatever you
  want to say about a book, has more room in the editor, and appears above the
  abstract on the card, because your words come before anything a model wrote.
- **Both are read by the LibrAPPrian.** The profile sent with every question
  carries every star and every note in full, under a heading saying they are
  yours rather than a description of the book. The prompts are told these
  outrank genre counts, and to follow you where the two disagree.
- Both live in the corrections layer, so they survive rebuilds and undo one book
  at a time.

### New: page counts, and what the spine wall does with them

- **The page count of a typical edition** joins the extras checklist offered
  while a shelf photograph is read. It is recalled rather than read, since no
  spine states one, and is labelled that way wherever it appears.
- **No third-party lookup was added.** The app still makes zero requests to
  anyone but the AI service you choose.
- The spine wall prefers a recorded page count for a spine's height and falls
  back to the length of the title, both clamped to the same band. The caption
  says which rule applies rather than claiming one.

### Rewritten: the profile the desk sends

What a question arrives with, beyond the counts and genres v1 sent:

- **The shape of the shelf.** How long the books tend to be, when they were
  first published, what languages they were written in, how they are rated.
  None of it can be inferred from titles.
- **What the catalog records.** How much of each field is actually filled in, so
  a field blank across the whole shelf reads as nobody having recorded it rather
  than as an answer of no.
- **A proportional cross-section** instead of the thirty newest books. Each
  genre gets a share of the slots matching its share of the shelf; the books
  carrying the most information go first within a genre; anything starred or
  noted is always included. Deterministic, so the same catalog yields the same
  profile.
- **Favourites and notes**, as above.

### Prompts

- **Spine orientation.** The shelf prompt now says spine text may run upward,
  downward, horizontally, at an angle, or upside down relative to its
  neighbour, that British and American spines usually read downward while
  continental European ones read upward, and that a title facing the wrong way
  is one to transcribe rather than skip. A mixed shelf was previously being read
  as though every spine faced the same way.
- **No prompt tells a model to run a command any more.** All three desk prompts
  and the shelf prompt instructed the model to run Python scripts it has no
  shell to reach, which was an invitation to claim it had. The rules those
  blocks explained are kept where they are true of the app.
- Both desk prompts now say the profile is all there is, that the cross-section
  is a sample so absence from it proves nothing, and that a starred book
  outranks a genre total. The recommendation prompt is told that length and era
  are part of the answer.

### Interface

- **Day and Night**, chosen from the sidebar or the landing page, remembered
  across reloads, and following the system when unset. Applied before the first
  paint, so no page flashes the wrong theme.
- **A Spines view** of the catalog beside the list.
- **A favourites filter**, and a disclosure holding the less-used filters. When
  a hidden filter is narrowing the list, the page names it rather than letting
  it work unseen.
- **Band markers** through the list and the spine wall, showing where one run of
  the sort ends and the next begins: a letter for the two alphabetical sorts, a
  year for the two by date. The band is taken from the key the list was sorted
  by rather than from the visible text, which matters most under an author
  sort, where the row shows a given name and the order follows the surname.
- **The desk goes by its own name** in the sidebar, rather than "The desk".
- Every screen redesigned. Self-hosted fonts, so the app still makes no
  third-party request; the licences are listed in About.

### Fixed

- **The page count extra was asked for and thrown away.** It was added to the
  checklist but to none of the three places a returned value passes through, so
  the model answered and the answer never reached a record.
- **`abstract`, `published_year`, `rating` and `original_language` could not be
  corrected by anybody.** A wrong recalled rating from a shelf read was
  permanent. All four are now editable.
- **The correction notice claimed changes were made by hand** even when they
  came from a model. It now says a change was made after the sources were read,
  and carries the reason.
- **The correction notice printed the word `undefined`** as the previous value
  of a field no source had ever carried.
- **The author field showed a bare dash** where no author was recorded, in the
  catalog, on the card and in the profile sent to the model. Each now names the
  gap.
- **Spine lettering was unreadable on half the palette.** One fixed colour on
  eight fills measured 1.78:1 on the lightest. Each fill now names its own ink,
  worst pairing 4.78:1, checked by a test that parses the stylesheet.
- **The favourites filter narrowed nothing** on first implementation: correct
  predicate, incomplete dependency list.
- **`role="listitem"` on spine buttons** would have stopped screen readers
  announcing them as clickable.
- **The word cloud used a colour ramp whose pale end vanished** against paper
  after the palette changed.
- **The shelf board rendered flat** in the dark theme, where its two gradient
  stops were the same colour.
- Several drop zones rendered an empty bordered box after the emoji were
  replaced with drawn marks.

### Underneath

- `pages` and `favourite` added to the record schema; both default in a way that
  says what they mean, and both are editable.
- New modules: `core/sample.js` for the cross-section, `ai/gaps.js` for the
  gap-filling request and its parser, `store/theme.js`, `store/librarian.js`,
  `librarian.js` for what the owl may say.
- The dictionary understands `{name:one|many}`, so a sentence counting books
  reads correctly at one of them. Both languages.
- Tests went from 187 across 12 files to 356 across 19.

---

## v1.0

The first published version. Catalog building from photographs, spreadsheets,
store exports and hand entry; merging across sources; corrections that outlast a
rebuild; lending and borrowing; the desk with synopsis and recommendation; two
languages; optional AI key.
