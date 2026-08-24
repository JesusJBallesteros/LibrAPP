# Catalog schema

One JSON file holds the whole catalog. At this size — a few hundred books — a
database would cost more than it returns, and a plain file diffs cleanly in git
and is readable without any tool at all.

It is built from one or more **source files** — by the app, or by
`tools/librapp/build_catalog.py`, which produce the same thing. Nothing else
should write it: hand-edits are lost on the next rebuild. Corrections belong in
the overrides file described below, which survives every rebuild.

A source file is the envelope every ingester emits and the builder reads,
defined and validated by `web/src/core/records.js` and its Python twin
`tools/librapp/records.py`. That indirection is what lets a catalog be built
from a photograph alone, a list alone, or both, and what makes adding a new kind
of input a matter of writing one more ingester.

## Top level

```jsonc
{
  "generated_at": "2026-08-19T14:22:07+00:00",
  "counts":   { ... },   // summary, for a quick sanity check
  "sources":  [ ... ],   // the source files this was built from
  "books":    [ ... ],
  "authors":  [ ... ],
  "review":   { ... }    // everything the merge could not settle
}
```

## `books[]`

| field | type | notes |
|---|---|---|
| `id` | string | stable slug, `author-title` |
| `title` | string | as displayed |
| `title_key` | string | folded form used for matching; not for display |
| `authors` | string[] | ids into `authors[]`; empty for corporate or anonymous works |
| `author_label` | string? | shown instead when there is no personal author (`Reference`, `Varios`) |
| `series` | string? | |
| `series_index` | int? | |
| `formats` | string[] | every format the book was found in: `ebook`, `physical`, `audio` |
| `publisher` | string? | only where a source named one |
| `acquired_on` | date? | ISO date; `null` where no source records one |
| `read` | bool? | **`null` means unknown, not unread** — see below |
| `collections` | int? | how many store collections it is filed in |
| `devices` | int? | how many devices it sits on |
| `update_available` | bool | |
| `genre` | string? | the original freeform label |
| `tags` | object[] | `{kind: "genre"｜"keyword", value, key}` |
| `sources` | string[] | names of the source files this entry was seen in |
| `confidence` | string | `high`, `medium`, `low` |
| `location` | string? | where it physically sits, when a photograph said |
| `lent_to` | string? | who has the book, when it was lent out |
| `lent_on` | date? | ISO date; `null` where the loan was recorded without one |
| `borrowed_from` | string? | who the book belongs to, when it is not yours |
| `borrowed_on` | date? | ISO date; `null` where the loan was recorded without one |
| `abstract` | string? | recalled by a model, never read from a photograph |
| `published_year` | int? | recalled by a model |
| `rating` | number? | recalled by a model, out of 5 |
| `original_language` | string? | recalled by a model |
| `flags` | string[] | see below |

`lent_to` and `borrowed_from` are mutually exclusive: a lent book is owned and
away, a borrowed one is not owned. They are written by the corrections layer
rather than by any ingester, since no source can know them.

The four recalled fields are only ever filled in when the shelf checklist asked
for them. They are not present in the photograph, and every book carrying one is
flagged `recalled_details`.

### `read` is three-valued

`true` and `false` come from a source that records it, such as a store export.
A book seen only on a shelf carries `null`: nothing has ever recorded whether
it was read. Treating `null` as `false` would invent a hundred unread books, so
any filter or count has to handle the three cases separately - which is why
`query.py forgotten` considers only books explicitly marked unread.

### `confidence`

| value | meaning |
|---|---|
| `high` | machine-readable and verifiable — a store export checked against its own item count |
| `medium` | transcribed by eye or by model — a photograph, a hand-kept list |
| `low` | a guess; the entry is a placeholder |

An entry takes the confidence of the best source that found it, so a book seen
both in a photograph and in an export is `high`. The exception is a placeholder
title, which is forced to `low` however it arrived.

### `flags`

| flag | meaning |
|---|---|
| `title_clipped` | a source cut the title mid-word and no other had it whole |
| `illegible_spine` | the photograph could not resolve the text |
| `no_personal_author` | a reference work, anthology or anonymous text |
| `no_genre` | no genre judgement exists for this book yet |
| `placeholder` | the title is a stand-in (`[spine partly legible]`), not a title |
| `series_not_expanded` | a row standing for several volumes that no source lists individually |
| `recalled_details` | one or more fields here were recalled by a model, not read from the photograph |
| `corrected` | a field here was set by hand and overrides the sources |

## `authors[]`

```jsonc
{
  "id": "howard-phillips-lovecraft",
  "display_name": "Howard Phillips Lovecraft",
  "sort_name": "Lovecraft, Howard Phillips",
  "aliases": ["H. P. Lovecraft"]
}
```

The sources spell people inconsistently — `Platón` against `Plato`,
`Aristóteles` against `Aristóteles Estagirita`, initials against full forenames.
A name whose tokens are a less complete spelling of exactly *one* other author
is merged into it, and the discarded spelling is kept as an alias. Where a name
could belong to two authors it is left alone: `Shelley` beside both Mary and
Percy is a real question, not a merge.

Every merge is listed in `review.author_variants_merged`, so the decision is
auditable rather than silent.

## `review`

Not diagnostics — a work queue. Each key lists what the merge could not resolve
on its own:

| key | meaning |
|---|---|
| `author_variants_merged` | author spellings folded together; check none is a false merge |
| `matched_across_sources` | entries built from more than one source; check none is a false merge |
| `series_not_expanded` | collapsed rows kept whole because nothing supplied their volumes |
| `low_confidence` | placeholders and unreadable spines |
| `clipped_titles` | titles no source has in full |
| `no_genre` | books carrying no genre judgement |

## Known gaps

**The tag vocabulary is not controlled.** A catalog of 338 books carries around
126 distinct genre labels, most used once or twice, mixing levels of abstraction
freely — `Fantasy` sits beside `Weird / cosmic horror` and `Philosophy of mind`.
Tags are recorded faithfully with their kind, so a later pass could normalise
them against the whole distribution.

Two visible consequences until then: filtering by genre behaves unevenly, and
the composition chart on the desk shows the five largest genres covering only
about a third of the collection, with the rest grouped as *other*. The chart
says so rather than implying the tail is uninteresting.

**Language is not recorded.** No source states a language reliably.

**No ISBNs or ASINs.** No source carries one, so `id` is a slug and the only
join key is author plus title.

## Corrections

Corrections live in `overrides.json`, beside the catalog, and are applied after
the merge. The merge never sees them, so a correction cannot change how two
sources are reconciled — only what the finished entry says.

```jsonc
{
  "librapp_overrides": 1,
  "entries": {
    "<book id>": {
      "set":     { "genre": "Reference" },   // only fields actually changed
      "removed": false,
      "at":      "2026-08-20",
      "title":   "…",                        // as it was when the note was made
      "authors": ["…"]                       // so an orphan can still be named
    }
  }
}
```

A corrected entry carries `overridden: {fields, was, at, why}` and the flag
`corrected`, so what a value used to be is never lost.

**Removal is a suppression, not a deletion.** The catalog is rebuilt from its
sources every time, so deleting an entry would simply bring it back on the next
rebuild. Removed entries appear in `review.removed_by_hand`.

**An override is keyed on the entry id**, which is a slug of author and title,
and therefore changes when a better source supplies a fuller title. Each
override stores the title and authors it was made against, so one that no
longer resolves is listed in `review.orphaned_overrides` rather than silently
dropped.
