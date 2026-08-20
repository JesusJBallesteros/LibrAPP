# Roadmap

What is planned, and the constraints each piece has to respect. Written down
rather than remembered, because the awkward parts are awkward for reasons that
are easy to forget and expensive to rediscover.

---

## 0 · The desk on a phone

Reported after using LibrAPP on Android, where the desk is the view that fares
worst.

**Widgets overflow the screen width.** The desk lays out two columns and its
cards assume room they do not have on a phone. Everything there should fit a
narrow screen without sideways scrolling.

**Replace the composition bar chart with a pie chart.** Name the categories
that make up the first 80% explicitly and collapse the remainder into a single
"other" slice — a long list of thin bars says less than a few named wedges, and
costs more width.

**"Bought, and never opened" should start at five titles**, with a control to
expand to the full list. It currently renders up to fourteen, which on a phone
pushes everything below it off the screen.

---

## 1 · Manual entry — done

**Add a book by typing it.** A form with the fields the schema already has —
title, authors, series and volume, formats, read state, acquired date, genre,
keywords, location, notes.

For a book no photograph caught and no export lists: something borrowed, a gift,
a book read but not owned, anything the automated paths cannot see.

### How it fits

A manual entry is **a source like any other**, not a special case:

```jsonc
{ "source": { "name": "manual", "kind": "manual",
              "format": "physical", "confidence": "high" } }
```

That means `kind` gains a fourth value and nothing else changes. Manual records
cluster and merge exactly like the rest — so typing in a book the export
already has produces one entry owning both, not a duplicate.

`confidence: high` is right: a person who has the book in their hand outranks
a model reading a spine. It does not outrank a store export on the facts that
export owns, which is the correct outcome — you know the title better than
Amazon does, Amazon knows the purchase date better than you do.

### Constraints

- Appending to the manual source must never rewrite the other records in it.
  It is the one source a person edits by hand; corrupting it loses work that
  exists nowhere else.
- Keep it human-readable and diffable. It is the only source that cannot be
  regenerated from something upstream.

---

## 2 · Edit and remove, overriding every source — done

**Correct any field on any entry, or take an entry out**, and have that decision
win over whatever the sources say — permanently, across every future rebuild.

Needed today for: the six low-confidence placeholders left by the old
photograph, the `Berlitz Spanish course; Farsi phrasebook; …` bundle row that is
four books in one, wrong genres, and any future mis-merge.

### The hard part: removal cannot be deletion

The catalog is **rebuilt from its sources every time**. Deleting an entry from
`catalog.json` therefore deletes nothing: the next rebuild reads the same
sources and puts it straight back.

So removal has to be a **tombstone** — a recorded decision that this entry is
suppressed — and it has to key on something that survives a rebuild. The
entry `id` is a slug of author and title, so it is stable while those are
stable, and *changes* if a better source later supplies a fuller title. A
tombstone keyed on `id` alone will silently stop working exactly when the
catalog improves.

Worth resolving before building: key on `id`, and additionally record the title
and authors so a tombstone whose `id` no longer resolves can be reported rather
than silently ignored.

### Shape

A separate `overrides.json`, applied **after** the merge, never mixed into it:

```jsonc
{
  "librapp_overrides": 1,
  "entries": {
    "<book id>": {
      "set":     { "genre": "Reference", "title": "…" },
      "removed": false,
      "why":     "optional note",
      "at":      "2026-08-20"
    }
  }
}
```

Kept separate for three reasons:

1. A rebuild regenerates the catalog and would discard anything written into it.
2. An override is a different kind of claim from a source record — it is a
   person overruling the evidence, and that distinction should survive.
3. It stays reviewable. One small file answers "what have I corrected by hand?"

### Constraints

- **An override must stay visible as an override.** An entry carrying one
  should say so, and say what it was before. A correction that becomes
  indistinguishable from source data cannot be audited or undone, and the whole
  catalog is built on being able to see where a value came from.
- **Reversible.** Clearing an override returns the entry to what the sources
  say.
- **A removed entry is still counted somewhere.** Suppressed books should not
  vanish from the review section, or the tombstone becomes invisible and the
  next confused rebuild has no explanation.
- Overrides apply to the merged entry, not to a source record. Editing a source
  record would mean rewriting an ingested file, and ingested files should stay
  exactly as their source produced them.

### How it was built

`build()` is untouched. Corrections are applied to the finished catalog by
`core/overrides.js`, so the merge never sees them and a correction cannot
quietly change how two sources are reconciled — it only changes what the
finished entry says.

Two things came out of using it that were not in this specification:

**Only changed fields are recorded.** The first version stored every field on
the form, which pinned each one to its current value so no later improvement to
a source could ever reach the entry again — and it invented a duplicate author
by re-resolving a name that had not changed. The editor now records the
difference, and refuses a save that changes nothing.

**Restoring a removed book is not the same as undoing every correction.** A
book can be both edited and removed; bringing it back should not silently
discard the edit. `Restore` clears only the removal, while `Undo` on an edited
entry drops the correction entirely.

---

## 3 · The JavaScript port — done

Done: the matching and merging core, proved byte-identical against Python
(`web/scripts/parity.mjs`). And `parse_kindle`, via pdf.js — 237 records,
`delta +0`, every field identical to Python's except the two noted below
(`web/scripts/kindle-parity.mjs`).

Also done: `parse_table`, identical on XML, .xlsx and CSV — the spreadsheet
path reads the zip with `DecompressionStream` and a hand-rolled central-
directory walk, so nothing has to be bundled. And `parse_shelf`, whose tile
geometry matches Python's exactly and whose transcription reader produces the
same 98 records; tiling itself moves to Canvas, so a photograph never leaves
the device.

The whole pipeline now runs end to end in JavaScript from the raw files
(`web/scripts/end-to-end.mjs`) and produces the same catalog: 338 books, 236
authors, every count matching. 33 entries differ, all of them titles.

**What "repaired" means here, precisely.** Nothing reconstructs the words the
browser cut off — they are gone, and no source has them. A repair means the
merge stops preferring a clipped title and takes a *complete* one from another
source instead, which is usually **shorter**:

| | |
|---|---|
| Kindle export | `Heroínas: Cuentos en torno al 8 de marzo, Día Internacional de la Muje` |
| hand-kept catalog | `Heroínas: Cuentos en torno al 8 de marzo` |
| what the merge keeps | the second |

Of the 40 titles flagged, 33 have a complete alternative and are swapped. The
other 7 have none, so they keep the truncated text and carry the flag, which is
the honest outcome: the catalog says the title is cut rather than pretending
otherwise.

Remaining: storage, then the app becomes installable on Android as well as on
a desktop.

### Two places the JavaScript deliberately differs from the Python

Both are the port being more correct, and both are why the Kindle harness
compares every field *except* `title_clipped`.

**Clipped titles: 40 detected, against Python's 3.** Python infers a clipped
title from a trailing space PyMuPDF happens to preserve, which catches almost
none of them. pdf.js discards that space, so the port uses the evidence that
actually exists — where the ink stopped. A title drawn to the column's edge was
cut off by the browser rather than written that short. The rest of the flagged
titles end mid-word (`…investigación cient`, `…(Bloomsbury Sigma) (E`), which
is what a fixed-width clip looks like.

**A soft hyphen.** PyMuPDF reports `César Garcí­a Muñoz`, with a soft
hyphen inside the name; pdf.js does not. The port's spelling is the right one.

The parity harnesses are the safety net for all of it. They only work while
both implementations are meant to agree.

**The risk that mattered, now settled:** `parse_kindle` stitches records split
across page breaks, and that logic depends on the order the PDF library emits
text in. pdf.js agrees with PyMuPDF about order — but not about where a line
*ends*. It marks end-of-line on the item closing a run in the content stream,
and the page puts a title and the buttons beside it in the same run, so grouping
on that flag glues two columns together. Lines are broken on baseline changes
and on horizontal gaps instead. The two populations do not overlap on this
document: pdf.js splits a word wherever the font changes, so a ligature is its
own item at a gap of zero, while separate controls on a row sit six points apart
or more.

**Settled:** an optional API key, held in the browser, entered through an
explicit box that appears wherever it is about to be used and shows which of
three states it is in — absent, in use, or stored but switched off. Every
feature keeps a route that needs no key, so the earlier "agent-first" decision
survives: the key is a convenience, never a dependency.

Direct browser access was the thing worth checking first, and it works — a
request from the page reaches `api.anthropic.com` and comes back with a real
status, so no proxy is needed. The trade accepted knowingly: a key in a browser
is readable by anything on the origin, which is why the interface says so and
recommends a workspace-scoped key with a spend limit.

---

## What is left

**0 · the desk on a phone**, above. The only outstanding item.

The Python tools remain as a working command-line path over the same folder
layout, and as the reference the JavaScript was proved against. They do not
apply corrections, which exist only in the app.
