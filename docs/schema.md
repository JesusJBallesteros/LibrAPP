# Catalog schema

One JSON file holds the whole catalog. At this size — a few hundred books — a
database would cost more than it returns, and a plain file diffs cleanly in git
and is readable without any tool at all.

`tools/librapp/build_catalog.py` writes it. Nothing else should: hand-edits are
lost on the next rebuild. Corrections belong in the sources, or in the overrides
file described at the end.

## Top level

```jsonc
{
  "generated_at": "2026-08-19T14:22:07+00:00",
  "counts":   { ... },   // summary, for a quick sanity check
  "books":    [ ... ],
  "authors":  [ ... ],
  "recommendations": [ ... ],
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
| `formats` | string[] | `ebook`, `physical`, or both |
| `publisher` | string? | only where the export named one |
| `acquired_on` | date? | ISO date; `null` for physical books, which have no record |
| `read` | bool? | **`null` means unknown, not unread** — see below |
| `collections` | int? | how many Kindle collections it is filed in |
| `devices` | int? | how many devices it sits on |
| `update_available` | bool | |
| `genre` | string? | the original freeform label |
| `tags` | object[] | `{kind: "genre"｜"keyword", value, key}` |
| `sources` | string[] | `kindle`, `shelf` |
| `confidence` | string | `high`, `medium`, `low` |
| `flags` | string[] | see below |

### `read` is three-valued

`true` and `false` come from the Kindle export, which marks read items
explicitly. Physical books carry `null`: nothing has ever recorded whether they
were read. Treating `null` as `false` would invent 53 unread books, so any
filter or count has to handle the three cases separately.

### `confidence`

| value | meaning |
|---|---|
| `high` | from the Kindle export — machine-readable and verified against its own item count |
| `medium` | read off a shelf photograph; usually right, checked against nothing |
| `low` | the spine was partly or wholly illegible; the entry is a placeholder |

### `flags`

| flag | meaning |
|---|---|
| `title_clipped` | Amazon cut the title mid-word and no other source had it whole |
| `illegible_spine` | the photograph could not resolve the text |
| `no_personal_author` | a reference work, anthology or anonymous text |
| `no_genre` | no genre judgement exists for this book yet |

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
| `xml_rows_unmatched` | catalog rows with no counterpart in the export |
| `merged_formats` | books detected as owned in both formats by title similarity |
| `clipped_titles` | titles no source has in full |
| `illegible` | shelf entries that need re-photographing |
| `no_genre` | books carrying no genre judgement |

## Known gaps

**The tag vocabulary is not controlled.** 290 books carry 124 distinct genre
labels, 76 of them used exactly once, mixing levels of abstraction freely —
`Fantasy` sits beside `Weird / cosmic horror` and `Philosophy of mind`. The tags
are recorded faithfully with their kind so a later pass can normalise them
against the whole distribution; until then, filtering by genre will behave
unevenly.

**Language is not recorded.** The library is trilingual with a Persian thread,
and nothing in either source states a language reliably.

**No ISBNs or ASINs.** Neither source carries one, so `id` is a slug and the
only join key is author plus title.

## Overriding a value

Not built yet. When it is, corrections belong in a separate `overrides.json`
applied after the merge, so that a rebuild never discards them and the
correction stays visible as a correction.
