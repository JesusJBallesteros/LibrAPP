# Catalog schema

One JSON file holds the whole catalog. At this size — a few hundred books — a
database would cost more than it returns, and a plain file diffs cleanly in git
and is readable without any tool at all.

`tools/librapp/build_catalog.py` writes it, from one or more **source files**.
Nothing else should: hand-edits are lost on the next rebuild. Corrections
belong in the sources, or in the overrides file described at the end.

A source file is the envelope every ingester emits and the builder reads;
`tools/librapp/records.py` defines and validates it. That indirection is what
lets a catalog be built from a photograph alone, a list alone, or both, and
what makes adding a new kind of input a matter of writing one more ingester.

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
| `flags` | string[] | see below |

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

**The tag vocabulary is not controlled.** 338 books carry 126 distinct genre
labels, 78 of them used exactly once, mixing levels of abstraction freely —
`Fantasy` sits beside `Weird / cosmic horror` and `Philosophy of mind`. The tags
are recorded faithfully with their kind so a later pass can normalise them
against the whole distribution; until then, filtering by genre will behave
unevenly.

**Language is not recorded.** No source states a language reliably.

**No ISBNs or ASINs.** No source carries one, so `id` is a slug and the only
join key is author plus title.

## Overriding a value

Not built yet; specified in [roadmap.md](roadmap.md). Corrections belong in a
separate `overrides.json` applied after the merge, so that a rebuild never
discards them and the correction stays visible as a correction.

The catch worth knowing before relying on it: the catalog is rebuilt from its
sources every time, so **removing an entry cannot mean deleting it**. The next
rebuild would read the same sources and put it back. Removal has to be a
recorded suppression that outlives the rebuild.
