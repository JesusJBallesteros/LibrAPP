# Changelog

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
