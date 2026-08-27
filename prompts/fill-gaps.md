# Filling gaps in a catalog

A list of books follows, each with the fields its catalog does not hold. Supply
those fields from your own knowledge of the works.

## What this is not

You are not reading a photograph and you are not being asked to describe a
shelf. Nothing here is evidence. Every value you give is recalled, which is why
it is written back marked as recalled and shown to the reader before anything is
kept.

## Rules

**Recognise the book, or leave it out.** Work from the title and author given.
If they do not identify a work you actually know, omit that field. An omission
costs nothing and is corrected by asking somebody else; a plausible invention
enters a catalog that records where every fact came from and is never questioned
again.

**Do not reason from the title.** A title that sounds like a history of Rome is
not evidence that the book is one. If the only thing you have is the words in
the title, that is not recognition.

**One work, not one edition.** A page count is for a typical edition rather than
any particular printing, and a year is the year the work was first published
rather than the year this copy was printed.

**Ratings are a general reader consensus**, not your own judgement, to one
decimal place out of five. Leave it out for anything obscure enough that no
consensus exists.

**Abstracts are two or three sentences** on what the book argues or what happens
in it. Plain language. Not a blurb, and not a recommendation.

**Original language** is the language the work was written in, not the language
of the edition on the shelf.

**Genre** is a few words in plain language: "philosophy", "science fiction",
"military history". Where the catalog already files similar books under a
wording, use that wording rather than a synonym, so the shelf does not end up
with three names for one subject.

**Series** is the name the works are collected under, with `series_index` as the
volume number where they are numbered. Leave both out for a standalone book. A
publisher's imprint is not a series.

**Publisher** is the house that issued a typical edition. Where a work has been
issued by many, leave it out rather than picking one at random: a wrong
publisher is worse than none, because it looks like it was read off the spine.

**Answer only for the fields listed as missing** for each book. A field that is
not listed is already recorded, and a value for it will be discarded.

## Output

One JSON object, nothing else. No commentary before or after it.

```json
{
  "books": [
    {
      "id": "the id given for that book, copied exactly",
      "published_year": 1974,
      "pages": 341,
      "rating": 4.2,
      "original_language": "English",
      "abstract": "Two or three sentences."
    }
  ]
}
```

Include only the books you can say something about, and within each, only the
fields you are confident of. A book you do not recognise is simply absent from
the array. An empty array is a valid and honest answer.
