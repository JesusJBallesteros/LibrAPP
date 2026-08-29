# Changelog

## v2.3.0

A minor number rather than a patch. The last one was a patch carrying a
feature, which reads as smaller than it was.

### Forget the whole library, and be able to want it back

Reset the catalog is the only thing in the app that destroys work on purpose,
so it exists only alongside the way back from it. It copies everything first,
always, and the copy is listed underneath with every other one.

Recover puts a copy back and copies what it replaces on the way, because
choosing the wrong one out of a list is a mistake somebody will make, and it
should cost nothing but a second choice. What is here is read before anything
is removed: a backup that turns out to be unreadable must not empty the library
on its way to finding that out.

A backup is an export bundle written into the library instead of being
downloaded. Nothing about the format is private to backups, which is the point:
the file a reset leaves behind is the file the export button already writes, so
Download on any row is a real route to another device rather than a claim about
one. The extra facts it carries, what it held and why it was made, ride
alongside and are ignored by anything reading it as an export.

Each copy is listed with when it was made, what it was made for, what it holds
and how large it is. One that cannot be read is listed too, marked as such,
because a file that is invisible in the app and present on disk is worse than
one that can at least be deleted. Every destructive button asks first and names
what goes.

Two things follow from the shape rather than from the feature. A restore clears
the corrections as well as the sources, because override ids are handed out by
the builder and a correction that outlived its book would attach itself to
whichever book took its id next. And a reset removes the built catalog instead
of rebuilding it: rebuilding with no sources is refused, rightly, since an empty
catalog arriving by accident is worth shouting about, so what a reset leaves
behind is a library that looks exactly like one nothing has been added to yet.

Which is where the last piece came from. That empty page offered a photograph,
a list and typing a book in, and no way back to the copy made a moment earlier.
It counts the backups now and says so.

The README section on backups was about exporting by hand, which is still there
and still true. It leads with the copies the app keeps for itself now, and says
plainly that recovering replaces where importing adds.

---

## v2.2.1

All of this came out of one test on an Android phone. Barcodes read, every
book found, Keep pressed, and an answer about a field called spine several
screens above the button that had just been pressed.

### Say when the reading is done, and where the reading is

Reading a shelf takes a minute or more, and the button that starts it sits well
above where the answer lands. The page sat there and the list arrived off the
bottom of the screen, so there was no telling finished from still going without
scrolling to look.

The review says how many books came back and that the list is under it, and the
page goes there. Both, because scrolling moves the page and not a screen reader,
and somebody who looked away during a minute-long read needs telling rather than
showing. Brought to the top of the review rather than its middle, so the count
and the note about checking are the first things on the screen.

The button that throws a whole reading away said Discard, which is now also what
every row of that reading says. It says what it discards.

### One row of an import can be set aside

Every way in ends with a list to check, and until now that list was all or
nothing. One DVD case read as a book off a photograph, one header row that
parsed as a title, one wrong barcode among twenty right ones, and the only
answer was to discard the whole batch and do it again.

Each row of each list carries a discard now. Kept is the default, since the list
is the result of work already done and most of it is right, so the control names
the other thing. A discarded row stays where it is, struck through, rather than
vanishing: a list that reflowed under the finger that pressed it would slide the
next row into the place just tapped, and a discard that cannot be taken back is
a deletion rather than a review. The count on the button follows what survives,
and at nothing kept the button will not write.

Two of the three lists had to be built rather than changed. The list page wrote
a spreadsheet without ever showing what was in it, which made it the one way in
with nothing to check; the rows are parsed for the preview now, and the import
writes those rather than reading the file a second time. A transcription brought
in as a file went into the catalog with no review at all, and now goes through
the same one a read photograph does.

The owl says so on all three pages.

### Fixed: this app could not open a file this app had written

Between 2026-08-27 and the revert two days later, a shelf read wrote a spine
field on every record: a path to a crop of the photograph, cut around one book.
The field went when the feature did, and the unknown-field check then refused
every file written in that window, naming a field the reader had never heard of
and could do nothing about.

That check is strict on purpose, since it is what stops an ingester writing a
field the builder ignores. But refusing a record over something this app put
there itself is a bug in this app and not a fault in the file. Retired fields
are named, with the reason each one went, and dropped on the way in. Anything
else unknown still throws, including a typo standing next to a retired field.

The crop files themselves are still in the library folder of anyone who read a
shelf in that window. Nothing reads them, and nothing here deletes them.

### The README catches up

It described barcodes as something the desk does, when they have had a page of
their own since v2.2.0. That section moves in beside the other ways in and is
named the way the app names it. The read stamp on a spine, the three things a
book's card asks for, and the discard on every import list are written up where
each belongs, and the list of ways in says barcodes are one of them.

### A failure appears next to the button that caused it

Every failure went to the banner at the head of the page, which on a phone is
several screens above whatever was pressed, so the press looked like it had done
nothing at all.

The pages whose controls sit far down now put the message beside the control:
the barcode review above Keep, the list import above its own button, the shelf
above the books it is proposing. The book panel keeps its own, because the page
banner renders behind the overlay and could not be seen at all. Where there is
no room beside the control, a star at the foot of a long shelf, the banner stays
and the page scrolls to it.

---

## v2.2.0

A second adversarial review of the running app drove most of this. The barcode
lookup gets a page of its own and learns to read from the camera, the shelf says
which books have been read, and a book's card asks for the three things no
import can supply.

### The card asks for what only the reader knows

Read state, a loan and a note are the only fields on a book that have to come
from the reader. A spreadsheet, a store export and a barcode lookup all describe
the book, and none of them knows whether it was read, who has it, or what was
thought of it.

Nothing asked for them. They lived in the editor, and the editor is behind a
button called Edit, which is where a correction goes rather than where a first
answer goes. A book's card now lists the ones it is missing and offers to take
each of them, and shows nothing at all once all three are recorded.

Absent is read strictly. An unread book has a recorded read state, and a
borrowed book has a recorded loan running the other way. Neither is listed.

Each prompt opens the form at its own control rather than at the top, because
the form is long and the hunt down it for the loan boxes is most of the work of
writing one name into one of them.

### A stamp on the spines that have been read

The catalog opens as a shelf and read state was invisible on it. Colouring the
spine by it was the other way to do this, and it would have cost the wall its
identity: the eight fills are how a book is recognised across a re-sort or a
filter, and cutting them to two would have made the shelf a bar chart.

So a mark on top instead. A ring, a milled edge and a check, at the foot of the
spine, drawn in the ink that fill already uses for its lettering. That ink is
paired with each of the eight at 4.5:1, so the stamp is legible on all of them
without a palette of its own, and shape carries it as well as colour does.

Only read is stamped. Unread and not recorded are different answers and a check
cannot give either one, so both are left blank and the difference stays where it
is stated: the read filter, and the book's own record.

It costs the lettering some room. A read spine reserves 26px at its foot, and on
the 91-book demo that takes seven more titles to an ellipsis, 18 of the 57
rather than 11. The whole title is still in the tooltip and on the spine pulled
out to be read.

The favourite star is larger in both places it appears.

### Read barcodes, and doors that name what they do

Scan a barcode named one of the three ways that page works and not the other
two: a barcode can be photographed or typed in as well as scanned. It is Read
barcodes now, in the navigation and on the front page.

The doors on the front page were sentences that had to be read to the end. "I
have a picture of my shelf", "I have a list of the books I own". The heading is
the verb now and the hint under it carries the rest, so a door can be picked out
at a glance.

The owl had nothing to say on the barcode page and has three lines for it now.
One of the lines it already had said the spine view draws the same books as a
shelf, which was written when the list opened first. The catalog opens as a
shelf and the guide says so.

The word clouds ran some of their words vertically. Reading those meant turning
the head, so every word lies flat again.

### Three more things a tidy file cannot claim

Confidence grades where a value came from and not whether it is plausible, and
two checks already sat under that. Three more:

The catalogue abbreviations for an unnamed author, s.n., s.a. and sine nomine,
join the stand-in words already caught. They reach a spreadsheet by being copied
out of a library record.

The publisher's name in the author column, compared in the form the app compares
names in, so a difference of case or accent does not hide it. A source that puts
it there has filled the field rather than left it empty, which reads as an answer
and is not one.

A first-published year that has not happened yet. Only the future: the field is
when the work first appeared, and the obvious check, a floor at the invention of
printing, would demote Plato and Marcus Aurelius, both of whom are in this app's
own demo at -375 and 180. Next year is allowed, because a book can be announced.

Each demotes to medium and says why. Run against the demo, none of the three
fires on any of its ninety-one books.

Not done, deliberately: the same value repeated across an implausible share of
rows. A specialist collection legitimately has one publisher throughout, and a
check that fires on real data is worse than no check.

### The camera reads barcodes as they pass

Photographing a barcode, opening the file, waiting for it to decode and doing
that again for the next book is slower per book than typing the number, which
made the fast path the slow one. The same reader is now pointed at a live
picture, so a shelf of paper books is a few minutes rather than an evening.
Codes land in the same box the typed ones do, the same book twice counts once,
and nothing is written until the same review step as before.

The camera is a permission the app had never asked for, so the privacy notes
say what it does: barcodes are read on the device whether they come from a
picture or from the camera, neither the picture nor the view leaves or is
recorded, and what goes out is still thirteen digits.

It is handed back the moment it is not in use, including when the tab is
hidden. A camera light left on is the one bug that would cost this app the
trust the rest of it is built on, so that is checked rather than assumed: with
a stand-in stream the track reads live while open, ended when the tab hides,
and ended on close.

Where the camera cannot start, the reason says what to do about it: refused,
none fitted, or already in use by something else. "The camera could not be
started" is true of all three and useful for none.

### Fixed: an error with no message read as "[object Object]"

Both the shelf reader and the new camera fell back to stringifying the error
itself when it carried no message, which puts "[object Object]" in front of the
reader. Found by a test written for the camera, and the same line was already in
the shelf.

### A way out of the demo that goes somewhere

The demo showed what the app is for and then offered one door: leave, which
returned to the same five the visitor had already declined. Being persuaded and
being set up were two pages with nothing between them.

**Try yours now** leaves the demo and opens the front page at the ways in, with
the heading focused so it reaches a screen reader as well as an eye. A flag
through the reload, because leaving is a reload: the demo lives in memory and
starting the page again is the only way to be rid of it. The flag is taken as
it is read, so a later reload does not do it again.

### And a warning where it can cost something

The banner says the demo is discarded on reload, and says it before the reader
has done anything. The natural move for somebody the demo has persuaded is to
bring their real export in and watch it work, and lose it.

The three pages that write, the photograph, the list and the barcode, now say
so where the choice is made: what you bring in is read and merged exactly as it
would be in your own library, and it goes with the invented books. The way out
that keeps the work is offered in the same breath.

### The barcode lookup is a way in, and is filed as one

It was at the foot of the desk, under the enquiries, below the charts, at the
end of a long scroll. The nav offered two ways of getting books in, a photograph
and a list, and the third one, the exact one that costs nothing and needs no
key, was not among them. Somebody with a stack of paper books would photograph
the lot, pay for it, proof-read what came back, and never find out the other
path was there.

It has a page of its own now, beside the other two, and a door on the front
page: I have the books in front of me.

### A lookup says whether it joins a book or adds one

Both already happened: a lookup is a source like a photograph or a spreadsheet,
so the same clustering decides whether it merges into a book already on the
shelf or arrives as a new entry. What was missing is that the review step said
nothing about which, so the reader accepted a batch without knowing whether it
was about to add ten books or fill in ten they had.

Each row now says. Worked out by building the catalog that keeping them would
produce, rather than by matching titles at the point of asking: an
approximation of the clusterer that disagreed with the clusterer would be worse
than no answer, because it would be wrong exactly where it was being relied on.

Looking the same book up twice is a correction to that entry and is not
reported as joining anything, since saying otherwise would misdescribe where the
reader's copy came from.

### The service has a name

Every AI provider in the app is named: Anthropic, OpenAI, Gemini, OpenRouter.
The barcode lookup said "an external service" three times over, which is a
privacy assurance about a recipient the reader is not allowed to identify, and
a claim nobody can weigh. It is Open Library, the free catalogue run by the
Internet Archive, and it says so where it matters: on the page, in the note
about what leaves the device, and in the README's table of the same.

### Offer the example first, and stop the filter lists opening white

The demo was the last thing on the front page, under five doors that all ask for
a photograph or a spreadsheet the visitor has to go and find. It is the only way
in that costs them nothing, so it is the first thing under the tagline, and it
says what it is: check out this example.

The filter selects opened a list drawn in the browser's default white whatever
the theme said. The colour scheme is inherited correctly and the list is not
drawn from that: it takes the colour of the control, and the control had no
background of its own. It is painted the colour it already sits on, which
changes nothing on the page and everything in the list, and the options carry
the same colours for the browsers that draw those separately.

### Fixed: undoing a change still counted as a change

[#9](https://github.com/JesusJBallesteros/LibrAPP/issues/9). Star a book and
unstar it and the book was left listed among the corrections, saying
favourite: false, which is what it said before anybody touched it.

Putting a value back to what the sources say is not a correction, it is the
absence of one. A correction that agrees with the value underneath it is now
dropped when it is written, and ignored when it is applied. Both, because the
second is what the value underneath is actually in hand for, and because files
written before this carry entries of exactly that kind: they clean themselves up
on the next rebuild rather than needing anybody to go and find them.

An emptied box and a field nobody recorded count as the same thing. Unread and
not recorded do not, because for a read state false is an answer.

Underneath it was a smaller thing. The builder never stated whether a book was a
favourite, since a favourite is marked by the reader and never by a source, so
the property was simply absent and nothing could be compared against it. It now
says false, and a source claiming otherwise is still ignored.

### Barcodes on a desktop too

Chrome on Android has a barcode reader and uses it. No desktop browser has one,
so scanning was offered only on a phone and the page said as much. LibrAPP now
carries its own reader for the rest: a compiled decoder, imported the first time
something is scanned and never by a visit that scans nothing. It is a separate
43kB of code and about a megabyte of WebAssembly, so it stays out of the way of
everyone who does not use it.

Its own default is to fetch that megabyte from a public CDN, which would have
the app quietly making a third-party request on a page that says it makes none.
The file is served from LibrAPP instead, next to the fonts, for the same reason
the fonts are. Checked in a browser: the only request is to LibrAPP's own
address, and there is none to a CDN.

Verified by generating a real EAN-13 rather than a picture of stripes, and
reading it back on a desktop browser that has no reader of its own.

### The interface stops explaining itself

The copy in the working views had drifted into argument. "This matters more
than anything else here: a whole bookcase at one megapixel is unreadable, and
the same shelf at fifty is not" says less than "resolution determines how much
of the lettering can be read", and takes three times as long to say it. The
desk introduced itself as "where the catalog stops being a list and starts
being an argument", which describes nothing anybody can act on.

Twenty-two strings rewritten in English and nineteen in Spanish, across the
shelf, the desk, the list import, the barcode lookup, the stacks and the
catalog. They state what a thing does and what it affects, and stop. The
landing pitch and the About page are left as they are, being prose on purpose.

All twenty-nine em dashes are gone from the interface copy in both languages,
in favour of a colon, a comma or a full stop, whichever the sentence wanted.

### Grouping means something in the spine view now

The Title, Author and Series control sat above the shelf, showed itself
pressed, and changed nothing, because grouping was only ever drawn in the list.

The wall already separates books with bands, by first letter, so it now bands
by whatever the control says: by author it puts an author's books together
under their name, by series it gathers a series under its own. Ungrouped it
bands by letter as before. The list is unchanged.

### Also

Renaming the tab left the old name in the copy: three places in English and
four in Spanish still said Library or Biblioteca, including the line telling a
reader where to go when their browser is missing something.

### Fixed: grouping by author took the catalog down

Reported as the grouping control doing nothing in the spine view. It was worse
than nothing: it threw, and the whole catalog went with it.

A book nobody is credited on has no byline, and byline returns null for it so
the caller can name the gap in the reader's own language. Grouping by author
used that null as the key of a bucket and then sorted the keys, which called
localeCompare on null. Any real catalog has a book like that, an anthology, a
reference work, a spine nobody could read, so the crash was one click away on
most shelves.

Books with nobody credited now gather under a group of their own, after the
named ones, the way books in no series already gathered after the real series.

The other half of that report stands: in the spine view the control changes
nothing, because grouping is only drawn in the list. That is deliberate, since
headings cut a wall of spines into pieces and it stops looking like a shelf, but
a control that shows itself pressed and does nothing is not deliberate. It
wants either hiding there or turning into an ordering.

### The shelf page stops leaving a hole in itself

Step two runs long, a photograph does not, and the tiles were in a row of their
own below both, so on a wide screen the space under the photograph was empty
from the moment a picture was chosen: about five hundred pixels of nothing
beside the tallest column on the page.

Three areas now, rather than two columns and a row. Step two spans both rows on
the right, and the tiles sit under the photograph on the left, which is the
space they were leaving empty. On a narrow screen it is one column in the order
the work happens: photograph, then the reading, then the tiles.

The key box moves to the top, where it reads as the precondition it is: nothing
in step two can be pressed without it. It used to sit between the two steps and
the tiles, taking a full row to say so.

### Library is now The stacks

Two sections were called something close to "your books" and only one of them
held any: the catalog, and a tab called Library that holds none. What it holds
is where the catalog lives, what it was built from, the corrections made to it,
the browser check, the version and the export.

The stacks is what a library calls the part of itself the public does not
browse, where the collection is actually kept, which is what that tab is. It was
already the eyebrow above the heading, so the app had been calling it that all
along while the navigation said otherwise. In Spanish, El deposito. The eyebrow
becomes Housekeeping, since the name it was using has moved down.

### A link that opens the demo

`#demo` on the address opens the demo library and lands in the catalog with no
clicks, so a link from the README or from anywhere else arrives at a working
library rather than at a page asking for a photograph. It cannot harm a library
already on the device: the demo is held in memory and has nowhere to write.

Two things had to be fixed before that was true for somebody who already has
books in the app.

**A read of the old library could land on top of the new one.** Adopting a
library marks it ready before it has finished being read, so the demo opened
over a real catalog and then that catalog's own read, still in flight and slower
because it comes off disk rather than out of memory, arrived afterwards and
replaced it. What the reader saw was the demo banner sitting above their own
books, which is the worst of both. A read now checks that its library is still
the one on screen before it applies, so a stale answer is dropped instead.

**Leaving the demo walked back into it.** Leaving is a reload, and a reload with
`#demo` still on the address opens the demo again, so the way out was shut for
as long as the tab lived. The marker is taken out of the address once it has
been acted on.

The first of those is a race and is not covered by a test: the project has no
React testing library and is not worth adding one to for a single hook, so it is
covered by a comment at the place it happened instead.

### Looking a book up by its barcode

The number under a barcode names the exact edition, so where a library
catalogue holds it there is nothing to guess at. Paste the codes or read them
from a file, and the title, authors, publisher, year and page count come back as
recorded facts. No AI, no key, no cost.

A lookup is a source like a photograph or a spreadsheet, so the merge that
already exists does the attaching: a book you have takes the new details rather
than becoming a second entry, and anything that matched nothing is added. No new
matching was written for this.

**It is not the deterministic cousin of asking a model, and it was worth finding
that out before building on it.** Asked for an ISBN it does not hold, the
service answers with a real record belonging to some other book rather than with
an error: 0000000000000 returns a French novel, 9999999999999 an Argentine
painter's retrospective. That fails more quietly than a model does, because the
answer arrives with a publisher and a page count and looks authoritative. So a
code whose own check digit disagrees is refused before anything is sent, and
what does come back is shown and accepted rather than written, the same ending
the desk already gives a model's reply.

Subjects arrive as keywords rather than as a genre. There are twenty to ninety
per book and they include *American literature* and *New York Times reviewed*,
so the hope that a controlled vocabulary here would fix the genre chart does not
survive looking at the data.

### Barcodes from a photograph

Where the browser can read one, and Chrome on Android can, a photograph of a
barcode adds its code to the box beside the typed ones. One picture or several,
and a photograph of a pile gives up every code in it. A barcode that is not a
book fails the same checksum a typo does.

The picture is read on the device at its own resolution. Shrinking it is the
usual thing to do with a photograph and is exactly wrong here, since the detail
thrown away is the lines that carry the data, and there is nothing to save by
shrinking something that is never sent.

Desktop browsers have no barcode reader as of writing, Chrome and Brave
included, so the capability is asked about rather than assumed and the page says
plainly what it cannot do instead of offering a button that throws.

### The privacy claim now lists what leaves

"No third-party requests" was true when it was written and this makes it false.
The About page and the README now name the three things that can leave the
device, all optional and none of them on by default: the tiles of a shelf
photograph, the reading profile the desk prints in full first, and an ISBN.

The barcode case is the smallest by a distance, and the honest version is better
than the absolute was: a photograph of a barcode is decoded on the device and
never leaves, and what goes out is thirteen digits printed on the back of a book
anybody can buy.

---

## v2.1.0

Most of this came out of an adversarial review of the running app, and the
review was right more often than not. What it got wrong is noted where it
matters.


### A library to look around, before building one

Every door on the front page asked for something the visitor had to go and
fetch: a photograph, a spreadsheet, a store export, a catalog from another
device. Which meant everything worth seeing, the shelf, the unread pile with its
reasoning on every row, the chart, the keyword cloud, sat behind the evening of
work rather than in front of it, and the only way to find out whether the app
was worth that evening was to spend it.

**Look around a demo library** opens an invented one, here and now. Ninety-one
books that behave like a real shelf rather than a tidy one: some nobody recorded
a read state for, a couple with no genre, two lent out and one borrowed back,
and twenty-seven bought years ago and never opened. Everything works, including
editing, importing and the desk.

It is held in memory, which is what makes it safe rather than a mode the rest of
the app has to remember to check. There is nowhere for a write to land, so
nothing already on the device can be reached or changed, and everything done
while looking around is gone on reload. A banner says so on every page for as
long as it is open.

### Fixed: a loan recorded by a source never arrived

Found while building the demo. Where a book is when it is not on its shelf,
lent to whom and borrowed from whom, is part of what a source may record, and
the builder was not carrying any of the four fields into the catalog.

Loans have always worked, because they are usually written by hand and a
correction is applied after the build, which is the path that reaches the desk.
A source that carried them was ignored in silence.

### A floor under what a tidy file can claim

A source says how far it is to be trusted, and every row in it inherited that
wholesale. A spreadsheet declaring high confidence made every one of its rows
high, however implausible the row itself, which meant confidence graded the
format of the container and never the plausibility of the value. A reader takes
"high confidence" to mean the entry is right, not that it arrived in a neat
file.

Two checks now sit under that claim. Neither can raise a record, only lower it,
because the container is still what a source is able to vouch for.

**A stand-in title that carries on into a real-looking one.** Placeholder titles
were already caught and dropped to low, but only where the whole title was a
bracketed note. A title standing in for the half nobody could read and then
continuing, `[...] and Philosophy`, read as a real title and kept whatever its
source claimed.

**A stand-in word where the author should be.** `Reference`, `Various`,
`VV.AA.`, `Varios`, `Anonymous`, `Unknown` and their like are what a source
writes when it has no author to give. A book can honestly have no personal
author, which is recorded separately and is not on its own a reason to doubt
anything; this is the other case, and it drops the entry to medium and says why.

The check reads what the entry ends up showing rather than every record behind
it. A source that wrote `Varios` and lost the merge to one that named the
authors has been corrected rather than tolerated, and the finished entry is no
less trustworthy for it.

Existing catalogs pick this up on their next rebuild, from an import or from
**Rebuild catalog** under Library.

### Marking many books at once

Clearing the tail of books nobody ever recorded meant opening, editing, saving
and closing a dialog for each one, which on a real shelf is an afternoon rather
than a job.

The catalog can now set the read state of every book the filters have left on
screen. There is no multi-select, because there does not need to be: the search
and the filters above already say which books are meant. It asks before it
writes and the asking names the number, since "mark all as read" over an
unfiltered catalog is rarely what anybody meant, and it can put books back to
not recorded as well as forward, because the third state is not a shade of no.

Each one is a correction like any other, so the Library can undo them, and a
book already reading that way is left alone rather than given a correction that
changes nothing.

### An import says what the file did not carry

A spreadsheet with no read column quietly empties half the desk: every book from
it counts as not recorded, and the unread pile leaves those out on purpose. The
import said nothing about it, so the app looked broken rather than under-fed.
This is the failure that prompted the review in the first place.

It now names what the list did not bring and what each absence costs: no read
column and the unread pile stays empty, no date column and nothing can be ranked
by how long it has waited, no genre column and the composition chart gets
nothing. Judged on the records rather than the header row, because a column
that is present and empty in every row costs exactly the same and a reader would
call both "it's not in there".

### The desk leads with the cloud

Both panels answer what the collection is made of, and on a real shelf the cloud
answers it better: genre labels come from the sources uncontrolled, so a catalog
of any size fragments into a long tail and the chart's largest wedge becomes
everything else. The cloud degrades into a smaller cloud instead of into one
meaningless slice. The chart keeps its place underneath.

### The privacy claim is a conditional now, and points at its own answer

"Nothing is uploaded" sat awkwardly beside two steps that send a reading profile
to a third party. The app's real answer was already better than the claim and
was invisible: at the desk, **Your reading profile** prints the exact block that
would be sent, with its character count, and a button to copy that and nothing
else. Anybody suspicious can read every byte before any byte moves, or take it
elsewhere by hand.

The front page says so now, and the README says it where the profile is
described rather than leaving it to be discovered.

### The browser table stops claiming what was never tested

It answered "Everything works?" with Yes for Gecko and WebKit twenty lines above
admitting both are untested. The cells say *should* now, and a column says what
was actually checked.

### The shelf is what the catalog opens as

It opened as a list, which is the right shape for searching and the wrong one
for arriving: a catalog of books that first appears as rows of text looks like
an export of itself. It opens on the spines now, and the list is one button
away.

### A spine is measured where there is a measurement

Thickness now comes from the page count, in three bands: thin under 150 pages,
medium to 300, thick above. That is the one number on a shelf that is a fact
about the book, and it was previously spent on height, an axis nobody reads a
shelf by, while thickness was decided by whether the book was physical, which
says nothing about the book and only about how it was catalogued.

Height now comes from the length of the title, and the caption says it is
decoration. Titles are set at one size on every spine, chosen to be read on a
screen rather than to fit the longest name, so a thick book does not read as a
more important one. A title longer than its spine ends in an ellipsis; the whole
of it stays in the tooltip and in the accessible name.

A book with no page count is drawn at the middle width. Not because it is
average, but because nothing is known, and drawing it thin would be inventing a
fact about it.

### Fixed: one genre could hold two slices of the chart

Reported by a reader looking at the legend: *satire* in lower case sat beside
*Literary fiction* capitalised, and the widened chart put *Comic fantasy* and
*comic fantasy* next to each other as two separate genres.

Tags have carried a folded key beside their value since they were introduced,
with the accents and punctuation taken out and the case flattened, for exactly
this comparison. The chart counted the values instead. On the shelf this was
found on, that split 117 genres into 127 labels.

The chart counts keys now, and names each genre by whichever spelling the shelf
uses most, ties going the same way every time so a re-import cannot rename a
slice. It does not rescue the chart on its own: with eleven genres named, the
tail is still half the collection.

### The shelf mark says what it is

The letters and year on a book's card, `GAI 2017`, had nothing anywhere saying
they are the first letters of the author name and the year the book was
acquired. Hovering it now says so.

### The waiting books stand as a shelf

The pile the desk singles out is drawn the way the catalog draws a shelf, so a
list of books looks like books. How long each one has waited sits above its
spine, where the catalog puts the star: it is the reason the book is in the
list and the order it stands in, so it stays in view rather than in a tooltip.
The title, the author, the years and the reason are all still carried as the
accessible name, and the slot takes its width from the years rather than from
the spine, so neighbouring labels do not overlap.

The note above the list said the same thing three ways. It now says only what
cannot be worked out by looking: which books appear, and how many have no
reading record at all.

### The genre chart can be asked to name more

The chart names the genres that carry the collection and folds the rest into
one slice, which keeps a pie readable but leaves a real question unanswerable:
what is actually in the tail. A control under the legend now opens it up from
five named genres to eleven, changing the slices and the legend together, and
closes it again.

It appears only when there is something folded to open up, and it brings its
own colours. The six-step ramp is spaced for six slices and would crowd at
twelve, so a twelve-step ramp of the same hues serves the wider chart while the
chart as it first appears is untouched.

### The shelf photograph is shown where it was chosen

Choosing a photograph left the box looking exactly as it had before, so the only
sign that anything had happened was the tiles appearing further down. The
photograph now takes the place of the camera mark, with its filename under it,
and the box goes on working: clicking it is how to swap the photograph for
another. Nothing about it is uploaded, and the picture is released as soon as it
is replaced.

### Fixed: every photograph measured zero by zero

The size beside the filename read `0x0` whatever was chosen. The photograph was
being closed one line before its width and height were read, and a closed image
reports zero for both. The tiling was never affected, since it measured the
photograph while it was still open; only the line reporting it was wrong.

---

## v2.0.2

An accessibility pass, a field that could never arrive, and three things found
by using the app on a phone.

### Accessibility

Audited against WCAG 2.2, in the running app rather than by reading the source.
What was already sound stayed as it was: the language attribute follows the
language switch, no form field is unlabelled, spines and charts and word cloud
words all carry accessible names, read state is text rather than only colour,
and reduced motion is honoured.

What was not:

- **The detail panel and the editor were not dialogs.** Opening one from the
  keyboard left focus on the row behind it: nothing was announced, and tabbing
  walked through the whole catalog, two hundred and forty one stops on the
  shelf this was tested against, before arriving at the panel that had opened.
  Both are now proper dialogs, named after the book or the job, taking focus on
  open, keeping it inside while open, and handing it back to the row on close.
- **Quiet text did not have the contrast it needed.** The faintest colour
  measured between 3.15 and 3.96 depending on the surface under it, against the
  4.5 that text requires, and it carries the card's field labels, the format and
  year cells, the eyebrows and every hint. Both themes were moved one step
  further along the same hue. The description given when this first came up,
  that fixing it would shift the tone of the whole design, was an overstatement.
- **Controls had no visible boundary.** Since the redesign gave selects and
  inputs no box, their underline is the only thing identifying them, and it
  measured 1.19. Boundaries now have a token of their own that clears 3, while
  the hairlines between rows, which carry no meaning, are untouched.
- **Nothing was announced.** There was not one live region in the app. A failed
  read is now an alert.
- **Thirteen tab stops** stood between the top of every page and its content.
  There is a skip link now, visible when focused.
- **The page title never changed**, so every view announced the same name and a
  row of open tabs said nothing that told them apart. It names the view now.
- The navigation marked the current item as a pressed button rather than as the
  current page, and four text buttons were under the minimum target size.

### New: a contrast level of its own

Beside Day and Night rather than among them, because contrast is not a theme:
somebody who needs more of it may want it on either, and folding the two
together would make them choose. It raises the quiet colours of whichever theme
is in force to 7, the enhanced level, and gives the rules between rows a
contrast of their own, because at low vision the structure of a page matters as
much as the words on it.

Anyone who has turned contrast up in their operating system gets it without
finding a setting, the way the theme already follows the system, and choosing
normal in the app wins that back.

The arithmetic is checked rather than trusted: the tests parse the stylesheet
and measure every token against every surface it can appear on.

### Fixed: genre could never arrive from a photograph

The prompt mentioned it, the ingester read it, and neither schema listed it.
Both schemas are strict, so the field was rejected before it could reach
anything. Every catalog built from a photograph had no genre at all, which is
why the chart was thin and so many books were flagged as having none. On the
shelf this was tested against, genre was missing from 239 books of 241.

It is now a field the schemas allow and an extra that can be asked for, on the
recalled side with the other judgements.

### Fixed: a corrected genre did not reach the chart

Reported after filling gaps: the genres arrived, the books showed them, and
"What the collection is made of" did not change.

Tags are not stored. They are cut from genre and keywords when the catalog is
built, and everything that counts genres reads them rather than the field: the
chart, the word cloud, the tag filter, and the profile the desk sends. The
correction layer is applied after the build and was setting the field without
recutting them, so a genre added by hand or bought from a model was visible on
the card and nowhere else.

Corrections now recut the tags when they touch genre or keywords.

### Fill in gaps asks for more

It borrowed its field list from the recalled half of the shelf checklist, and
that split is shaped by a photograph: publisher and series count as read there
because a spine prints them. At the desk there is no spine, so everything is
recalled, and the borrowed list was leaving out fields a model can perfectly
well supply.

It now offers genre, series and volume, publisher, first published, pages,
rating, original language and abstract, with one tick that sets or clears the
lot. Ticking every field on every book is the largest request the app can make,
so it says so once that is what has been asked for.

Two kinds of field stay out. The ones only the owner knows, meaning read state,
acquisition date, shelf, notes, favourite and loans, because a model filling
those in would invent the reader's history rather than recall the book's. And
title and authors, which identify the entry: everything else is a correction,
and rewriting those is corruption.

### A book listed at the desk opens like one in the catalog

[#6](https://github.com/JesusJBallesteros/LibrAPP/issues/6). The unread pile,
the loans and the marked ones are all buttons now, opening the same panel the
catalog opens, with the same Edit and Remove behind it. Cancelling an edit
returns to the book rather than closing everything, which it used to do in the
catalog too.

### Also

- The contrast toggle pushed the landing page past the edge of a phone screen.
  Three controls needed more room than two, and the row did not wrap. It does
  now, checked at 320, 375 and 1502.
- An empty genre chart said only that no genres were recorded, which under a
  heading reads as a section that failed rather than one with nothing in it. It
  now says why it is empty and where the genres can be got.

---

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
