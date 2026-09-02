# Using the catalog

Searching, filtering, the shelf view, and the three things only you can record.

[← back to the README](../README.md)

---

#Using the catalog

**Search** opens the controls: search across titles, authors, series and tags,
filter by read status, format, source, whether a book is away from the shelf and
whether you marked it a favourite, and group and sort the result.

They stay folded until you press it, and while they are folded the button
carries a count of anything still narrowing the list, so a shelf that looks
short always says why.

**Mark many books at once.** Under the count is *Mark all N shown as read /
unread / not recorded*, which applies to every book the search and filters have
left on screen. It asks first and names the number, and each one is a correction
like any other, so any of them can be undone.

**The catalog opens as a shelf.** Spines draws the filtered books standing
side by side; **List** is one button away and is where searching and sorting are
easiest to read.

**Thickness is the one real measurement.** It follows the page count in
proportion, so fifty pages either way is a different spine. It stops narrowing
at the point where a spine can no longer hold its own lettering, and stops
widening before one long book takes a row to itself. A book with no page count
recorded is drawn at an unremarkable width, because nothing is known about it
and drawing it thin or thick would be inventing a fact. Page counts arrive from
the extras checklist while a photograph is read, or from **Fill in gaps** at the
desk.

**Height and colour are decoration.** Height comes from the length of the
title, so a tall spine means a long name and not a big book. Colour is fixed per book so a spine keeps its own. Titles are set at
one size on every spine, large enough to read across a room, and a title longer
than its spine ends in an ellipsis. The whole title is always in the tooltip and
in the accessible name.

**Every book that has been answered for carries a stamp** at the foot of its
spine: a ring with a check in it for read, the same ring with a cross for
unread. A book nobody has recorded is left bare, which is what makes that state
readable from the shelf at all.

**Point at a spine, or tap one on a phone, and it offers both.** Read and unread
as one choice, and the star. Pressing the state a book is already in puts it
back to not recorded.

**Switch between Day and Night** from the sidebar, or leave it alone and it
follows whatever your system asks for. The landing page has it too.

**On a narrow screen** the sidebar folds behind a **Menu** button and opens on
a press. Choosing a page closes it again.

**Click any book** for the full record: series and volume, formats, purchase
date, publisher, genre and tags, where it is shelved, which sources know about
it, and how confident LibrAPP is about the entry.

<img src="images/book.png" alt="A book's record drawn as a catalogue card: shelf mark, title, author, then formats, read state, date acquired, page count, first published, original language, genre and sources, with the confidence in the corner" width="400">

**The record asks for what nothing else can tell it.** Read state, a loan and a
note have to come from you: no photograph, spreadsheet or lookup knows whether a
book was read, who has it, or what you thought of it. A book missing any of the
three lists them under *Still to record*, and each opens the form at its own
box.

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

A source declares how far it is trusted, and its rows start from there. Two
checks can lower a row below its source, never raise it, because a tidy file can
vouch for its own format and not for what somebody typed into it:

- A title standing in for something nobody could read, whether the whole title
  is a note in brackets or it starts with one and carries on, drops to **low**
  and is marked as a stand-in to re-photograph.
- An author column holding a word rather than a name, such as *Reference*,
  *Various*, *VV.AA.*, *Unknown* or the catalogue abbreviations *s.n.* and
  *s.a.*, drops the entry to **medium** and says so. A book that honestly has no
  personal author, like a reference work or an anthology, is recorded as such and
  is not doubted for it.
- The publisher's name sitting in the author column drops it to **medium** too.
- A first-published year that has not happened yet does the same. Only the
  future is doubted: that field is when the work first appeared, so an ancient
  text with a year of 180 is right and is left alone.

When two sources disagree, the more reliable one wins on facts it can know. A
spreadsheet knows the purchase date; a photograph does not. Judgements like
genre come from whichever source recorded one.

---

#Favourites and notes

Two things in a record come from nobody but you. Everything else arrives from a
spine, a spreadsheet or a model.

**The star.** Open any book, press Edit, and mark it. Starred books show the
star in the list and on the card, filter on their own, and get a section at the
desk.

**The note.** The same form has a box for whatever you want to say about the
book. It is not a summary and it is not for the catalog's benefit. "Bought in
Lisbon, never got past chapter three" is a perfectly good note.

Both live in the corrections layer, so they survive every rebuild and can be
undone one book at a time. See [Corrections](#corrections).

### The LibrAPPrian reads them

This is the point of both. When you ask the desk anything, LibrAPP sends a
profile of your reading with the question, and that profile now carries every
star and every note, quoted in your own words under a heading that says they are
yours rather than a description of the book.

The prompts say plainly that these outrank the counting. Genre totals are what
is left when nobody has said anything; a starred book and a sentence you wrote
are you saying something outright. Where the two disagree, the answer is meant
to follow you.

Practically: a shelf of ninety history books and one starred volume of poetry
will not be told to buy more history. Three notes complaining that a subject was
handled badly are a stronger signal than a genre count, and they are the kind of
thing no amount of counting would reveal.

Neither field is required, and the desk works without them. They are simply the
cheapest way to make the answers better.

---

#Corrections

Anything LibrAPP got wrong can be fixed, and the fix outlasts every rebuild.

**Edit** any entry from its detail panel. Only the fields you actually change
are recorded, so later improvements to your sources still reach the rest of the
entry. A corrected entry says so, shows what it said before, and can be undone.

**Remove** an entry to take it out of the catalog. Because the catalog is
rebuilt from your sources every time, a removal is stored as a decision rather
than a deletion — otherwise the next rebuild would bring the book straight
back.

Everything you have corrected is listed under **The stacks → Corrections you have
made**, where removals can be restored and edits undone.

Three other things land here, because they are corrections in the same sense:
your stars, your notes, and anything the desk fills in when you accept it. A
desk entry carries the reason *recalled by a model at the desk, not read from
any source*, and the notice on the book says it was changed after the sources
were read rather than corrected by hand, because it was not.

---

#Lending and borrowing

Open a book, choose **Edit**, and record who has it under *Away from the shelf*.
Two states, and a book can only be in one of them:

- **Lent to** somebody. The book is yours and it is not here.
- **Borrowed from** somebody. The book is here and it is not yours.

The date is optional, because it is the part people forget. A loan with no date
is kept and simply sorts last.

The catalog gains a **Where** filter for books on the shelf, lent out or
borrowed, and rows carry a pill for each. The desk lists what is away and how
long it has been gone, and the reader profile names those books, so a
recommendation does not suggest something that is currently at a friend's house.

Loans are stored with your [corrections](#corrections), which means they survive
every rebuild and travel with an export.
