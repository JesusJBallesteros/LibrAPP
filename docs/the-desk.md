# The LibrAPPrian's desk

What the desk works out on its own, what you can ask it, and what it knows when it answers.

[← back to the README](../README.md)

---

#The desk

The **LibrAPPrian's desk** is the half of LibrAPP that a spreadsheet cannot do.
A catalog tells you what you own. The desk reads the shape of it and answers
from that, which is why the answers are about your books rather than books in
general.

### What it shows you without being asked

Three shelves, one at a time. The arrows move between them, and so do the names
either side. All three are drawn as spines, and any book on one opens the same
panel the catalog opens, so it can be read, corrected or removed without going
looking for it.

**Bought, and never opened** — books you own and have not read, ordered by how
long they have waited and weighted by how much you evidently wanted them at the
time: filing a book into a collection, or putting it on several devices, is a
record of intent that a purchase date alone is not. Only books *known* to be
unread appear. The years each has waited sit above its spine.

**Your favourites** — the books you starred, with a link through to the same
filter in the catalog. See [Favourites and notes](the-catalog.md#favourites-and-notes).

**Lent and borrowed** — what you lent and to whom, what you borrowed and from
whom, with the name above each spine. See
[Lending and borrowing](the-catalog.md#lending-and-borrowing).

**Genres** — the largest genres as a share of the whole, with the long tail
grouped as *other*. Genre labels come from your sources and are not a controlled
list, so the chart says how much of the collection the named genres actually
cover. Genres are matched ignoring case and accents, so one written two ways is
one slice, named by whichever spelling your shelf uses most. **Name more
genres** opens it up from five to eleven, slices and legend together, and
appears only when there is a tail to open up.

**Keywords** — the words used by more than two books, drawn larger the more
often they appear. Pick one to open the catalog filtered to it.

### What you can ask it

Six requests, one at a time on a row that wraps at both ends. The arrows move
along it, and the faint names either side are pressable too.

**Synopsis.** Any book described to somebody whose shelf is already known: what
it argues, where it sits, what it does that the books you own do not, and
whether reading it would give you anything the shelf does not already have. The
book does not have to be one you own.

**Recommendation.** Two or three books, never more, each with the book on your
shelf it follows from or argues with. It is told to read the trajectory rather
than the pile, to consider your unread books before suggesting a purchase, and
not to recommend by resemblance.

**What to read next.** Chosen from the books you already own, for the week you
describe: a long flight, a free evening, something short, something that is not
a novel. Nothing to buy.

**Read the shelf.** The collection described to the person who built it. This is
the one request that answers with nothing typed into it, since the collection is
already in the profile. A box is there if you want a particular angle.

**Quick question.** Your own words, sent with your catalog attached and no
framing beyond it.

**Fill in gaps.** Described below. Unlike the others, this one writes to your
catalog, and only after you have seen what it wants to write.

![The question panel: Synopsis chosen with Fill in gaps and Recommendation faint either side, a box to type the book into, and buttons to copy the whole request or just the profile](images/desk-questions.png)

### Keeping an answer

An answer appears below the box and the page moves to it. **Keep this answer**
writes it to `answers.json` beside the catalog, and the ones kept are listed at
the bottom of the desk behind **See them**, newest first, each with the question
it came from and the date. Delete one from there.

Kept answers are not part of the catalog. A rebuild does not touch them, a reset
leaves them, and an export does not carry them: a bundle is what a catalog is
built from, and an answer is not a source. To move one, copy it.

### What it knows when it answers

**You can read every byte of it before any of it is sent.** At the bottom of the
desk, **Your reading profile** prints the exact block that would go to a model,
with its character count and a scrollable preview, and **Copy just the profile**
puts that text on your clipboard and nothing else. There is no separate summary
of what is sent, because that block *is* what is sent. If you would rather not
send it from here at all, copy it and paste it into an AI session yourself: the
keyless route exists for exactly that.

LibrAPP builds a profile of your reading and sends it with the question. In v2
that profile carries:

- **The counts.** How many books, how many read, how many never recorded.
- **What the collection is made of**, and how that has changed between the
  earliest quarter of your buying and the most recent.
- **The shape of the shelf** — how long the books tend to be, when they were
  first published, what languages they were written in, how they are rated.
  None of this can be inferred from titles.
- **What the catalog records** — how much of each field is actually filled in,
  so a field blank across your whole shelf reads as *nobody has recorded this*
  rather than as an answer of no.
- **A cross-section** of the books themselves, described below.
- **Your favourites and your notes**, in full.
- **What is out of the house**, so nothing at a friend's is recommended.

#### The cross-section

Naming every book would crowd out the question and be paid for on every
request. Naming the thirty most recent would describe the last two years and
imply the shelf began then.

So the sample is proportional. Each genre gets a share of the slots matching its
share of the shelf, the books carrying the most information go first within a
genre, and anything you starred or wrote about is always included whatever its
genre's share. It is the same every time for the same catalog.

The prompts are told this is a sample, so absence from it is never treated as
proof you do not own something.

### Filling gaps in the records

The extras checklist is offered once, while a photograph is being read. Anything
you did not tick then was lost until the photograph was read again, which for a
catalog built from a spreadsheet never happens at all.

**Fill in gaps** asks for the same fields later, for books already on the shelf.

1. Tick the fields you want, or tick everything at once. Genre, series and
   volume, publisher, first published, pages, rating, original language and
   abstract. Each says how many books are missing it.

   The fields only you can know are deliberately absent: whether a book was
   read, when it was bought, where it sits, what you thought of it, who has it.
   So are the title and the authors, which identify the entry rather than
   describe the work.
2. The panel says how many books the request covers. The cost goes up with that
   number, so it is stated before anything is sent.
3. Send it, or copy it and paste the answer back if you have no key.
4. **What came back is shown before anything is written.** Not as text: as a
   count of how many books are affected and which fields actually came back,
   over the list of books themselves. A request asking for five fields commonly
   returns three. Keep it or discard it.

What it will not do:

- **It will not overwrite anything.** This fills gaps. A value already recorded
  came from somewhere, and this is not the thing to replace it.
- **It will not write silently.** Nothing reaches the catalog that you have not
  seen listed, book by book, field by field.
- **It will not keep what it cannot verify.** A value of the wrong type, a book
  it does not recognise, a field you did not ask for: all discarded, and the
  count of what was dropped is shown next to what survived.

Everything it writes goes in as a correction, so each one appears under
[Corrections](the-catalog.md#corrections), carries the reason *recalled by a model at the
desk, not read from any source*, and can be undone one book at a time. Once
kept, the same counts are shown again, so the panel says what changed rather
than emptying itself.

### With and without a key

With an AI key the desk asks directly, showing the cost before sending and the
real figure afterwards. Without one it assembles the whole request for you to
paste into any AI session, and takes the answer back. Both routes ask exactly
the same question of the same prompt.

The prompts live in [`prompts/`](../prompts) as plain text. Edit them to change how
LibrAPP asks.

### The owl in the corner

The LibrAPPrian also keeps a small presence at the bottom right of every screen
except About. Press it and it has up to three things to say about the page you
are on, stepped through one at a time.

**What is true of your collection, and worth doing something about** comes
first, where there is any:

- How many books are owed back to someone, or out with someone, for more than a
  year.
- How many are still unopened, with a link that filters the catalog to them,
  oldest first.
- How many have no read state recorded, with the same kind of link.

Following one of these applies the filter it describes.

**Then how the page works**, which is the part worth reading the first time you
open it. Each page has its own: how to photograph a shelf and why pieces are
adjusted before spending anything, which file formats the list page takes and
what happens when a file holds several lists, what the three desk requests are
and that all of them work without a key, where your catalog lives and what an
export is for.

Before any books exist, all three are about how to begin.

It also speaks while something is happening, and then it says only that: how
many pieces are being read, that a question is in flight, how many books an
import brought and how many were already there.

It is not a chat surface, and it has nowhere to type on purpose. Anything worth
typing belongs at the desk, where the question gets your catalog as context and
the cost is shown before it is spent.

**Every line it says is computed from your catalog.** It never states anything
it cannot count. If your books have no read state recorded, it says that, rather
than congratulating you on having read them all.

**Press *Not again* in its bubble to dismiss it for good.** That choice survives
reloads. The way back is in **The stacks**, with the other settings, and appears
only once there is something to undo.
