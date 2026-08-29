# Reading a shelf photograph

Turn pieces of a bookshelf photograph into a transcription file.

Read **every** piece, one at a time, at full size. Do not work from a
scaled-down view of the whole shelf: at that size spine text is a few pixels
tall and you will invent titles that look plausible.

A close-up of three books is often a single piece, and a wide bookcase may be
eight. If a piece arrives with a title cut in half across its top or bottom
edge, say so rather than guessing the rest — the grid can be changed and the
photograph cut again.

## What to record

For each book you can see, record what is **printed on the spine** — not what
you believe the book to be.

- `title` — as printed. Keep the subtitle if the spine shows one.
- `authors` — as printed, in normal order (`Terry Pratchett`, not
  `Pratchett, Terry`). Several authors, several entries.
- `publisher` — only if the spine or the imprint logo says so.
- `series` / `series_index` — only if printed. Numbered uniform editions
  (Gredos, Penguin Classics) usually print a volume number at the foot.
- `confidence` — `high` when you read it cleanly, `medium` when you are
  reconstructing from partial text, `low` when you are guessing.
- `notes` — anything worth a human's attention: a script you cannot read, a
  spine hidden behind another book, two copies of the same title.

## Rules

**Transcribe, do not identify.** If a spine reads `KANT · Crítica de la razón
pura · taurus`, that is the record. Do not expand it to a full bibliographic
title, do not add a publication year, do not correct the edition. The catalog
would rather hold what is on the shelf than what a database thinks should be.

**A guess is `low`, not a title.** If you can make out `La ciencia del ...
umbral` and no more, record what you can read and mark it `low`, with the
uncertainty in `notes`. Do not silently complete it. A wrong title read
confidently is worse than an honest fragment: the fragment gets fixed, the
confident error propagates into recommendations.

**Spines run in every direction.** On one shelf the text may run vertically
upward, vertically downward, horizontally across a short spine, at an angle on
a book leaning against its neighbour, or upside down relative to the book beside
it. British and American spines are usually printed to read downward and
continental European ones upward, so a shelf holding both has titles facing
opposite ways. Rotate each spine as needed and read it. A title that is not the
same way up as its neighbours is a title to transcribe, never one to skip. Order
the books by where they stand, left to right along the shelf, whatever direction
their lettering runs.

**Non-Latin scripts.** Record them in their own script. If you can also give a
transliteration or a translation, put it in `notes`. Do not replace the title
with a translation.

**Count carefully.** Pieces overlap, so a book at the edge of one piece appears
again in the next. Record it once. Books lying flat on top of a row are still
books. A spine you can see but not read is still worth an entry with
`confidence: "low"` and whatever colour or size detail helps find it again.

**Shelves hold things that are not books.** DVDs, box files, magazines, framed
photographs, a plant. Record books. A boxed set is one entry unless the
individual spines are visible, and say in `notes` that it is a set.

**Do not extrapolate along a run.** Volumes 1, 2 and 4 of a uniform edition are
three books, not four. Record what you can see.

**A spine can be blocked as well as dark.** Where a book in front hides part of
a spine, record what is visible, mark it `low`, and say in `notes` what is in
the way. Whoever took the photograph can move the book and take another.

**The same author is not always printed the same way.** `T. Pratchett` on one
spine and `Terry Pratchett` on another are both transcribed as printed, which is
the rule above. Where both appear in what you have been given, say so in
`notes`. Only within what you have been given: a long shelf is read in several
requests, so you cannot see what was on the pieces in another one.

**Do not fill in what a photograph cannot see.** No acquisition dates, no read
flags, no ISBNs, and no genre of your own unless the checklist below asks for
one or the spine states a collection. The catalog
treats a missing value as unknown, which is the truth here, and other sources
may supply it later.

## Output

Write one JSON file:

```json
{
  "photo": "shelf.jpg",
  "shelves": [
    {
      "location": "top-left",
      "books": [
        {
          "title": "Ethics in the Conflicts of Modernity",
          "authors": ["Alasdair MacIntyre"],
          "publisher": "Cambridge",
          "confidence": "high"
        },
        {
          "title": "La ciencia del último umbral",
          "authors": ["Álex Gómez-Marín"],
          "confidence": "medium",
          "notes": "lower half of the spine is in shadow"
        }
      ]
    }
  ]
}
```

`location` is free text — whatever will help you find the book again
(`top-left`, `bottom shelf, right of the divider`). Group books by the shelf
they sit on, in the order they stand, so the file reads like the shelf looks.

The file is checked before any of it reaches the catalog, and it is refused
whole if a book has no title or carries a confidence value other than the three
above. That is deliberate: a transcription that does not survive the check is
one worth looking at before it becomes a catalog.
