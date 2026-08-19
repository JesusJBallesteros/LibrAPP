"""Ask the catalog things, without a network and without a model.

    python query.py stats
    python query.py search kant
    python query.py unread --since 2023
    python query.py forgotten
    python query.py series
    python query.py context

Everything here is local and instant. `context` is the exception in purpose
rather than mechanism: it prints a compact picture of what you read, meant to
be handed to a model alongside one of the prompts in `prompts/`, so that asking
for a synopsis or a recommendation starts from your shelf instead of from
nothing.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from textmatch import fold

DEFAULT_CATALOG = Path("data/private/catalog.json")

# A book bought and never opened says more the longer it has sat there, but
# only if there was some sign of intent at the time. Pushing a book to several
# devices, or filing it into a collection, is that sign.
INTENT_PER_DEVICE = 0.5
INTENT_PER_COLLECTION = 1.0


def load(path: Path) -> dict:
    if not path.exists():
        sys.exit(
            f"error: no catalog at {path}\n"
            f"Build one first, e.g.\n"
            f"  python tools/librapp/build_catalog.py --source data/private/kindle.json -o {path}"
        )
    return json.loads(path.read_text(encoding="utf-8"))


def author_names(catalog: dict) -> dict[str, str]:
    return {a["id"]: a["display_name"] for a in catalog["authors"]}


def describe(book: dict, names: dict[str, str]) -> str:
    who = ", ".join(names.get(a, a) for a in book["authors"]) or (book.get("author_label") or "—")
    return f"{book['title']}  ·  {who}"


def years_since(iso: str | None, today: date) -> float | None:
    if not iso:
        return None
    try:
        then = date.fromisoformat(iso)
    except ValueError:
        return None
    return (today - then).days / 365.25


# --------------------------------------------------------------------------- #

def cmd_stats(catalog: dict, args) -> None:
    books = catalog["books"]
    c = catalog["counts"]
    print(f"books            : {c['books']}")
    print(f"authors          : {c['authors']}")
    print("formats          : " + ", ".join(f"{n} {f}" for f, n in c["by_format"].items()))
    print(f"read             : {c['read']}")
    print(f"unread           : {c['unread']}")
    print(f"not known        : {c['read_unknown']}  (nothing ever recorded it)")

    dated = [b for b in books if b["acquired_on"]]
    if dated:
        by_year = Counter(b["acquired_on"][:4] for b in dated)
        widest = max(by_year.values())
        print()
        print("acquired by year")
        for year in sorted(by_year):
            n = by_year[year]
            read = sum(1 for b in dated if b["acquired_on"][:4] == year and b["read"])
            bar = "#" * round(n * 40 / widest)
            print(f"  {year}  {bar:<40} {n:>3}   {read:>3} read")

    genres = Counter(t["value"] for b in books for t in b["tags"] if t["kind"] == "genre")
    if genres:
        print()
        print("most common genres")
        for value, n in genres.most_common(10):
            print(f"  {value:<34} {n}")


def cmd_search(catalog: dict, args) -> None:
    names = author_names(catalog)
    needle = fold(" ".join(args.text))
    hits = []
    for book in catalog["books"]:
        haystack = " ".join([
            book["title"],
            " ".join(names.get(a, "") for a in book["authors"]),
            book.get("series") or "",
            " ".join(t["value"] for t in book["tags"]),
        ])
        if needle in fold(haystack):
            hits.append(book)

    if not hits:
        print(f"nothing matches {' '.join(args.text)!r}")
        return
    print(f"{len(hits)} match(es)\n")
    for book in hits[: args.limit]:
        mark = {True: "read", False: "unread", None: "—"}[book["read"]]
        where = "+".join(book["formats"])
        print(f"  {describe(book, names)}")
        print(f"      {mark:<7} {where:<16} {book['acquired_on'] or 'no date':<12} {book.get('location') or ''}")


def cmd_unread(catalog: dict, args) -> None:
    names = author_names(catalog)
    books = [b for b in catalog["books"] if b["read"] is False]
    if args.since:
        books = [b for b in books if (b["acquired_on"] or "") >= str(args.since)]
    books.sort(key=lambda b: b["acquired_on"] or "")
    print(f"{len(books)} unread\n")
    for book in books[: args.limit]:
        print(f"  {book['acquired_on'] or '          '}  {describe(book, names)}")


def cmd_forgotten(catalog: dict, args) -> None:
    """Books bought with evident interest and never read.

    Only books explicitly marked unread are eligible. A physical book whose
    read state nobody ever recorded is not forgotten - it is unknown, and
    guessing would fill the list with books already read.
    """
    names = author_names(catalog)
    today = date.today()
    scored = []
    for book in catalog["books"]:
        if book["read"] is not False:
            continue
        age = years_since(book["acquired_on"], today)
        if age is None or age < args.min_years:
            continue
        intent = (
            INTENT_PER_DEVICE * (book["devices"] or 0)
            + INTENT_PER_COLLECTION * (book["collections"] or 0)
        )
        scored.append((age * (1 + intent), age, intent, book))

    scored.sort(key=lambda row: -row[0])
    if not scored:
        print(f"nothing unread for more than {args.min_years} year(s)")
        return

    print(f"{len(scored)} book(s) bought at least {args.min_years} year(s) ago and still unread.")
    print("Ordered by how long they have waited, weighted by how much you wanted them.\n")
    for _, age, intent, book in scored[: args.limit]:
        signal = []
        if book["collections"]:
            signal.append(f"filed in {book['collections']}")
        if book["devices"]:
            signal.append(f"on {book['devices']} device(s)")
        tail = f"   [{', '.join(signal)}]" if signal else ""
        print(f"  {age:4.1f} yr  {describe(book, names)}{tail}")


def cmd_series(catalog: dict, args) -> None:
    names = author_names(catalog)
    grouped: dict[str, list[dict]] = {}
    for book in catalog["books"]:
        if book["series"]:
            grouped.setdefault(book["series"], []).append(book)
    for series, books in sorted(grouped.items(), key=lambda kv: -len(kv[1])):
        books.sort(key=lambda b: b["series_index"] or 0)
        read = sum(1 for b in books if b["read"])
        print(f"\n{series}  ({len(books)} volumes, {read} read)")
        if args.volumes:
            for book in books:
                index = f"{book['series_index']:>3}" if book["series_index"] else "  —"
                mark = {True: "x", False: " ", None: "?"}[book["read"]]
                print(f"  [{mark}] {index}  {book['title']}")


def cmd_context(catalog: dict, args) -> None:
    """A compact picture of this reader, for handing to a model.

    Deliberately not the whole catalog: a few hundred titles crowd out the
    question being asked. What a recommender needs is the shape of the
    collection and how it has moved, plus enough named books to argue from.
    """
    books = catalog["books"]
    names = author_names(catalog)
    today = date.today()

    genres = Counter(t["value"] for b in books for t in b["tags"] if t["kind"] == "genre")
    keywords = Counter(t["value"] for b in books for t in b["tags"] if t["kind"] == "keyword")
    by_author = Counter(a for b in books for a in b["authors"])

    dated = sorted((b for b in books if b["acquired_on"]), key=lambda b: b["acquired_on"])
    recent = [b for b in dated if (years_since(b["acquired_on"], today) or 99) <= args.recent_years]
    early = dated[: max(1, len(dated) // 4)]
    late = dated[-max(1, len(dated) // 4):]

    def top_genres(subset):
        c = Counter(t["value"] for b in subset for t in b["tags"] if t["kind"] == "genre")
        return ", ".join(f"{v} ({n})" for v, n in c.most_common(6)) or "—"

    print("# Reader profile")
    print()
    print(f"Catalog of {len(books)} books by {len(catalog['authors'])} authors. "
          f"{catalog['counts']['read']} read, {catalog['counts']['unread']} explicitly unread, "
          f"{catalog['counts']['read_unknown']} never recorded.")
    print()
    print("## What the collection is made of")
    print()
    for value, n in genres.most_common(12):
        print(f"- {value}: {n}")
    print()
    print("## How it has moved")
    print()
    print(f"- Earliest quarter of acquisitions: {top_genres(early)}")
    print(f"- Most recent quarter: {top_genres(late)}")
    print()
    print("## Most represented authors")
    print()
    for aid, n in by_author.most_common(12):
        read = sum(1 for b in books if aid in b["authors"] and b["read"])
        print(f"- {names.get(aid, aid)}: {n} books, {read} read")
    print()
    print("## Recurring themes")
    print()
    print(", ".join(v for v, n in keywords.most_common(30) if n > 1))
    print()
    print(f"## Bought in the last {args.recent_years} years")
    print()
    for book in sorted(recent, key=lambda b: b["acquired_on"], reverse=True)[:30]:
        mark = "read" if book["read"] else "unread"
        print(f"- {describe(book, names)} — {book['acquired_on'][:4]}, {mark}")
    print()
    print("## Owned but never read, longest waiting")
    print()
    stale = [
        (years_since(b["acquired_on"], today), b)
        for b in books
        if b["read"] is False and b["acquired_on"]
    ]
    for age, book in sorted(stale, key=lambda row: -(row[0] or 0))[:15]:
        print(f"- {describe(book, names)} — bought {age:.0f} years ago")


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    sub = ap.add_subparsers(dest="command", required=True)

    sub.add_parser("stats", help="what the collection is made of").set_defaults(fn=cmd_stats)

    s = sub.add_parser("search", help="find a book by title, author, series or tag")
    s.add_argument("text", nargs="+")
    s.add_argument("--limit", type=int, default=40)
    s.set_defaults(fn=cmd_search)

    u = sub.add_parser("unread", help="everything explicitly marked unread")
    u.add_argument("--since", type=int, help="only books acquired in this year or later")
    u.add_argument("--limit", type=int, default=60)
    u.set_defaults(fn=cmd_unread)

    f = sub.add_parser("forgotten", help="bought with interest, never read")
    f.add_argument("--min-years", type=float, default=2.0)
    f.add_argument("--limit", type=int, default=20)
    f.set_defaults(fn=cmd_forgotten)

    r = sub.add_parser("series", help="series and how far through them you are")
    r.add_argument("--volumes", action="store_true", help="list the individual volumes")
    r.set_defaults(fn=cmd_series)

    c = sub.add_parser("context", help="a reader profile to hand to a model")
    c.add_argument("--recent-years", type=int, default=2)
    c.set_defaults(fn=cmd_context)

    args = ap.parse_args()
    args.fn(load(args.catalog), args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
