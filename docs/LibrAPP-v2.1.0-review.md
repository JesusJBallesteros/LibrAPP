# LibrAPP v2.1.0 — adversarial review

**Reviewed** 28 August 2026
**Build** 2.1.0 · `d8d59f1`, built 12:02:26 · tagged [v2.1.0](https://github.com/JesusJBallesteros/LibrAPP/releases/tag/v2.1.0) (`d4abd97`, 27 Aug 13:30)
**Live** https://jesusjballesteros.github.io/LibrAPP/
**Environment** Brave, Windows 11, desktop, storage empty — so this is a genuine cold start

**Stance** Deliberately adversarial: written to find what is weakest. Strengths appear
only where they are load-bearing for a criticism, or where omitting them would make a
criticism dishonest.

**Coverage** Landing page from empty storage; the demo library (91 books, 73 authors,
57 read / 28 unread / 6 not recorded); catalog in spines and list; search and filters;
book detail; the desk in full including a live ISBN lookup; The stacks including version
and export. **Not exercised:** photograph import, spreadsheet import, export → re-import
round trip, PWA install, mobile, Firefox, Safari, the Python CLI, and the author's own
295-book catalog on this build.

**Methodological note** GitHub's own pages serve inconsistent cached state for this
repository — the releases *index* renders "There aren't any releases here" while the
tag page for v2.1.0 renders complete release notes. Everything below is taken from the
running application, which is the only reliable source.

---

## 1. The genre chart fails on data the author fully controls

**What the collection is made of**, on the curated demo library:

| | | |
|---|---|---|
| Science fiction | 19 | 21% |
| Literary fiction | 17 | 19% |
| History | 5 | 6% |
| Memoir | 5 | 6% |
| Software | 5 | 6% |
| **other · 17 more** | **38** | **43%** |

> The 5 largest genres cover 57% of tagged books. The other 17 labels are each too small
> to chart

This is the strongest form the criticism can take. Ninety-one books, hand-picked by the
author, tagged by the author, with no messy import in sight — and the largest wedge is
still *everything else*, at 43%. The problem is not dirty source data. **It is that free-text
genre labels fragment faster than any collection can grow**, and a five-slice donut is the
wrong instrument for a long-tailed categorical.

The **Name more genres** button underneath makes it worse, not better: it responds to a
broken visualisation by asking the user to perform taxonomy work. That is the app doing
data entry to itself.

Directly above it sits **What it keeps coming back to** — the keyword cloud — showing 36 of
228 keywords, sized by frequency, with the honest footnote *the rest are used once each*.
Same long tail, same fragmentation, and it degrades gracefully because it never pretends to
be exhaustive. **You have already built the correct answer and placed it immediately above
the incorrect one.**

Drop the donut. Promote the cloud. If a composition view is wanted, bin into a small fixed
set (fiction / non-fiction / reference, or five parent categories) and let the tags carry
the detail.

---

## 2. The barcode lookup is the best new feature and it is filed where nobody will find it

ISBN lookup now exists, and it is well built. Tested live with `9780547928227`:

> **1 book found.** Check these before keeping them. When the service does not hold an ISBN
> it returns a different book rather than an error, so an incorrect number produces a
> plausible but wrong record.
>
> *The Hobbit — J.R.R. Tolkien · Mariner Books · 2012 · 300 pages* → **Keep 1** / Cancel

Correct in every respect: a review step before anything is written, an explicit warning
about the specific failure mode of ISBN services, and a scoped privacy note — *what leaves
the device is a list of ISBNs and nothing else: no titles, no notes and no other catalog
data*. The barcode reader is self-hosted rather than pulled from a CDN.

**Three problems, none of them about the implementation.**

**It is on the wrong page.** The nav has *Shelf picture* and *Upload list* — the ingest
pages. Barcode lookup is an ingest feature. It has been placed at the very bottom of
*LibrAPPrian's desk*, the page whose own subtitle is "Enquiries", below the genre chart, at
the end of a long scroll. Someone with a stack of paper books to catalogue will use the
photograph flow, pay for it, proof-read the results, and never learn that the free exact
path exists. **Move it into the nav beside the other two ingest routes.**

**No live camera scanning.** The options are *Read a barcode from a photo* and *Read them
from a file*. On a phone that means photographing each barcode individually — slower per
book than the competitors whose entire pitch is scanning a shelf in a few minutes. The
scanning library is already loaded; a live viewfinder is the obvious next increment.

**The service is unnamed.** The copy says "an external service" three times. Every AI
provider in this app is named explicitly — Anthropic, OpenAI, Gemini, OpenRouter — and the
exact payload is printed before sending. The ISBN path gets a privacy assurance about a
third party the user is not permitted to identify. By this application's own standard, that
is a gap: a user cannot evaluate a privacy claim about an anonymous recipient. Name it.

---

## 3. The demo is excellent and is the least prominent thing on the page

The demo library retires the cold-start objection completely. 91 invented books,
genuinely well chosen and plausibly multilingual — *2666*, *Rayuela*, *Le città invisibili*,
*Pedro Páramo*, *El infinito en un junco* beside *Gödel, Escher, Bach*, *Blindsight*,
*Refactoring* and *Designing Data-Intensive Applications*. Read status, lending records,
notes and favourites are all populated, so every desk panel has something in it. The banner
is unambiguous: *These books are invented. Everything works, including editing and
importing, and all of it is gone when you reload. Your own catalog is untouched.*

Now look at where it sits. **Where would you like to start?** presents five bordered
full-width cards. Beneath them, after a greyed-out and disabled *I want to see my catalog*,
is a small unbordered secondary button reading *Look around a demo library*.

**The single element most likely to convert a visitor is rendered as the least important
thing on the page**, positioned after a disabled control that tells them they have nothing.
A first-time visitor's eye goes to the five cards, all but one of which demand an artefact
they do not have.

Promote it. It should be the first or second option, styled like the others or more
prominently, worded as an invitation rather than an afterthought.

**And there is a trap inside it.** The banner advertises that *importing* works in the
demo. The most natural thing an interested visitor will do is import their real Kindle
export to see what happens — and lose it on reload. The banner does say so, but it says so
before the user has done the work, not at the moment they choose to do it. Warn at the
import step while in demo mode, or offer *keep this* at that moment.

**And there is no exit ramp.** The demo shows exactly what the app is for, then offers
*Leave the demo*, which returns to the same five doors. There is no *start your own library
from here*, no *import your export now*, no path from being persuaded to being set up. The
conversion moment is identified and then discarded.

---

## 4. The spine view encodes the wrong variables, and admits it

The catalog's default view is a drawn shelf. Its legend:

> Thickness comes from the page count, where one was recorded; a book with none is drawn at
> the middle width rather than guessed at. Height comes from the length of the title and
> colour is fixed per book, so both are decoration.

The honesty is exemplary — refusing to imply that height means something, and refusing to
guess a width for books with no page count.

But it means **the two most visually salient variables carry no information while the least
salient carries all of it.** Human vision reads height differences before width differences,
and reads colour before either. A viewer scanning that shelf will form an impression driven
entirely by title length. The legend's remedy is to tell them, in eight lines of small type
below the fold, to disregard what they are looking at.

Read status, or acquisition age, or confidence, mapped to colour would make the shelf
*mean* something at a glance — and this app already has a distinctive position on all three.

**Related:** truncation is severe. *Designing Data-Intensive A…*, *Jonathan Strange & Mr
N…*, *Los renglones torcidos de …*, *La ridícula idea de no volver …*. The most beautiful
screen in the product is frequently unreadable, with no hover or tap reveal.

---

## 5. The best desk panels are the ones nobody will ever fill in

**The ones marked** is the most charming thing in the application:

> Books singled out by hand. These carry more weight than anything the catalog works out on
> its own.
>
> ★ *Norwegian Wood* — Bought in Kyoto, read on the train back.
> ★ *Pedro Páramo* — Shorter than it has any right to be.
> ★ *The Dispossessed* — The one I keep lending and never getting back.

**Away from the shelf** is the same: *Small Gods, with Diego, 2.2 yr*; *The Long Goodbye,
from Elena, 1.5 yr*.

Both are populated in the demo because the author populated them by hand. Both require
per-book manual entry — *Recorded by hand, one entry at a time, since nothing else can
know* — and for a real user both will be empty indefinitely. The panels that make this app
feel like a personal librarian rather than a database are precisely the ones that depend on
labour the app cannot help with.

That is not a flaw in the panels; it is a gap in the prompting. Nothing anywhere invites a
user to mark a book or record a loan at the moment they would want to. There is no
lightweight capture path — no "who has this?" on the detail panel's empty state, no nudge
after a book sits unread for years.

---

## 6. Trust is computed per source, not per value

The detail panel for *The Making of the Atomic Bomb*: `conf. medium`, *transcribed by eye or
by model*, `SOURCES shelf-photo`. Correct, and better than the previous behaviour — a
photograph-derived record cannot claim high trust.

But confidence still grades **where a value came from**, never **whether the value is
plausible**. A machine-readable file that matches its own row count earns *high* regardless
of what is in the cells. A user reads "high" as *this is correct*, not *this arrived tidily*.

Cheap checks that would close the gap: author matching a placeholder token (`reference`,
`various`, `anon`, `n/a`, `s.n.`); author string identical to a publisher; title containing
a bracketed ellipsis; a first-published year outside 1450–present; an identical value
repeated across an implausible share of rows. Any hit demotes to *medium* and queues the
entry for review — which is exactly what the barcode flow already does well.

---

## 7. Smaller findings

- **GitHub's release index and tag page disagree.** The index says no releases exist; the
  tag page renders v2.1.0 with full notes. A visitor checking whether the project is
  maintained may well land on the page that says nothing has ever shipped.
- **1 star, 0 forks, 1 open issue, 1 contributor.** Nothing yet signals the project will
  exist in a year — which matters when the ask is to build a catalog inside it.
- **PolyForm Noncommercial** suppresses the forks, contributors and aggregator listings the
  project most needs right now. Defensible eventually; mispriced today.
- **The name is unsearchable** and collides with existing library products.
- **No sync, by design.** *An export holds the sources, not the catalog* is the right model,
  but the natural workflow — capture on a phone, curate on a desktop — remains a manual file
  transfer. iOS has the best cameras, no folder access, and the most aggressive storage
  eviction.
- **API key held in browser storage.** Honestly disclosed; mitigation delegated to the user.
- **The reading profile is 9,413 characters** and printed in full before sending, with
  *Copy just the profile*. This is a stronger privacy position than most products manage —
  and it appears nowhere in the pitch, only at the bottom right of the desk.

---

## 8. What is genuinely right

A review that omitted these would be describing a different application.

- **Three-valued read status**, with *not recorded* never guessed into *unread*, and the
  desk's unread list openly stating how many books it had to exclude.
- **Bulk marking scoped to the current filter** — *Mark all 91 shown as…* — which is the
  correct scoping and rarely done.
- **Corrections kept apart from sources**, applied after every rebuild, individually
  undoable, with removal stored as a decision rather than a deletion.
- **The ISBN review step** and its warning about plausible-but-wrong records (§2).
- **The spine legend's refusal to imply meaning** where there is none (§4).
- **The privacy framing on the landing page** — *two optional steps can use an AI service,
  and they are the only things that ever send anything… Nothing goes anywhere unread* —
  paired with a printed, countable, copyable payload.
- **Cost shown as an estimate before the fact and actual after** — *about $0.05 · an
  estimate. What it actually cost appears with the answer.*
- **The demo banner is unambiguous** about what is invented and what is discarded.

---

## 9. Priority

Ordered by value per hour of work.

1. **Promote the demo to a primary option; add a conversion path out of it** (§3).
   The highest-converting element on the page is currently styled as an afterthought.
2. **Move barcode lookup into the nav as an ingest route, and name the service** (§2).
   The free, exact, no-key cataloguing path is hidden behind the paid, probabilistic one.
3. **Drop the genre donut; promote the keyword cloud** (§1). The replacement is already
   built and already sits directly above it.
4. **Warn at the import step inside the demo** (§3). Prevents a visitor losing real work.
5. **Map colour to read status; keep the honest legend** (§4). Makes the hero screen mean
   something.
6. **Plausibility checks at ingest, demoting trust on a hit** (§6).
7. **Add a live camera barcode mode** (§2). The library is already loaded.
8. **Invite marking and lending capture at the point of use** (§5).

---

## 10. Verdict

Between the previous build and this one, the two structural objections — no way to see the
app before committing, and no exact alternative to paying a vision model — have both been
answered properly rather than papered over. The ISBN flow in particular is built to the
standard the rest of the app sets: review before write, a named failure mode, a scoped
statement of what leaves the device.

What remains is almost entirely **placement**. The demo that sells the app is the smallest
control on the front page. The barcode lookup that removes the strongest competitive
objection is at the bottom of the enquiries page. The reading-profile preview that answers
the sharpest privacy attack is below the fold on the right-hand side. The keyword cloud
that works sits directly above the donut that does not.

Nothing in that list is architecture. It is ordering, defaults and one or two links — which
is a good problem to have and an embarrassing one to still have at launch.
