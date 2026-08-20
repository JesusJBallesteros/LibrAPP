# Roadmap

What is planned, and the constraints each piece has to respect. Written down
rather than remembered, because the awkward parts are awkward for reasons that
are easy to forget and expensive to rediscover.

---

## 1 · Manual entry

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

## 2 · Edit and remove, overriding every source

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

### Effect on the port

This changes `build()`, which is the function currently proved byte-identical
between the Python and JavaScript implementations. Adding it to one and not the
other retires that check. Sequencing matters — see below.

---

## 3 · Finish the JavaScript port

Remaining: `parse_kindle` (PDF via pdf.js), `parse_table` (xlsx/csv/xml), and
`parse_shelf` tiling (Canvas). Then storage, then the app becomes installable
on Android as well as on a desktop.

The parity harness (`web/scripts/parity.mjs`) is the safety net for all of it.
It only works while both implementations are meant to agree.

**Known risk:** `parse_kindle` stitches records split across page breaks, and
that logic depends on the *order* PyMuPDF emits text lines. pdf.js makes no
such guarantee. The bar is the one the Python meets: 237 records, `delta +0`,
every record with a title, an author and a parseable date.

**Open question:** reading spines needs a vision model. On a phone, copy-pasting
eight tiles into an AI app is unpleasant enough that the Android path probably
wants an optional API key — which cuts against the earlier decision to hold no
keys. To be decided when the shelf ingest is built, not before.

---

## Order

**3 before 2.** The override layer changes `build()`, and `build()` is what the
parity harness checks. Changing it in one language would blunt the harness
precisely while porting the riskiest code that depends on it. Once the port is
done and proved, the Python becomes a frozen reference and the override layer
gets written once, in one place.

**1 can go whenever.** Manual entry adds a source and does not touch `build()`,
so it does not disturb the harness at all. If something useful is wanted before
the port lands, this is the safe one to pull forward — at the cost of writing
the form twice, once against the Python server and again after the port.
