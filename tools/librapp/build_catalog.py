"""Merge any number of sources into one catalog.

    python build_catalog.py --source shelf.json -o catalog.json
    python build_catalog.py --source list.json -o catalog.json
    python build_catalog.py --source kindle.json --source shelf.json -o catalog.json

One source or several, in any combination: a photograph of a shelf, a store
export, a spreadsheet. The builder knows nothing about where a source came
from beyond the envelope in `records.py`, so a new kind of input needs a new
ingester and no change here.

Records describing the same book are clustered across sources and become one
entry that owns every format it was found in. Where sources disagree, the more
reliable one wins on matters of fact - a store export knows the acquisition
date, a photograph cannot - while judgements like genre are taken from whoever
troubled to make one.

Nothing is guessed silently. Every entry carries its sources and a confidence,
and whatever could not be resolved is listed in the report.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import records as rec
from textmatch import (
    TITLE_MATCH_THRESHOLD,
    UNCREDITED_MATCH_THRESHOLD,
    author_tokens,
    best_title_score,
    clean,
    detect_series,
    fold,
    index_keys,
    slugify,
    split_credits,
    title_head,
    title_key,
)

# A title that stands in for a book nobody could identify - what an earlier,
# worse photograph leaves behind. Worth keeping so the gap stays visible, but
# never worth trusting.
PLACEHOLDER = re.compile(r"^\s*\[.*\]\s*$|not legible|partly legible|illegible", re.IGNORECASE)

# Facts one source can know and another cannot; the most reliable source that
# has a value wins.
FACTS = ("acquired_on", "read", "collections", "devices", "publisher", "update_available")

# Judgements nobody can verify; the first source that made one wins.
JUDGEMENTS = ("genre", "keywords")


# --------------------------------------------------------------------------- #
# Authors
# --------------------------------------------------------------------------- #

class AuthorIndex:
    """Authors keyed by name-token set, accumulating every spelling seen."""

    def __init__(self) -> None:
        self._by_tokens: dict[frozenset[str], dict] = {}
        self.remap: dict[str, str] = {}

    def add(self, name: str) -> str | None:
        name = clean(name).strip(" ,;")
        tokens = author_tokens(name)
        if not name or not tokens:
            return None
        display = self._display_form(name)
        entry = self._by_tokens.get(tokens)
        if entry is None:
            entry = {
                "id": slugify(display),
                "display_name": display,
                "sort_name": self._sort_form(name),
                "aliases": [],
                "_tokens": tokens,
            }
            self._by_tokens[tokens] = entry
        # 'Pratchett, Terry' beside 'Terry Pratchett' is one spelling written
        # two ways, not an alias. Only different wording is recorded.
        if display != entry["display_name"] and display not in entry["aliases"]:
            entry["aliases"].append(display)
        return entry["id"]

    @staticmethod
    def _display_form(name: str) -> str:
        """'Pratchett, Terry' -> 'Terry Pratchett'; anything else left alone.

        Only a single comma with words either side is treated as inverted; a
        name with two commas is a compound the sources spell inconsistently and
        is safer verbatim.
        """
        if name.count(",") == 1:
            surname, _, forename = name.partition(",")
            if surname.strip() and forename.strip():
                return f"{forename.strip()} {surname.strip()}"
        return name

    @staticmethod
    def _sort_form(name: str) -> str:
        if "," in name:
            return name
        parts = name.split()
        return f"{parts[-1]}, {' '.join(parts[:-1])}" if len(parts) > 1 else name

    def merge_variants(self) -> list[dict]:
        """Fold together spellings of one author that the sources disagree on.

        Two shapes of disagreement occur: a truncated form ('Plato' for
        'Platon') and an abbreviated one ('Lovecraft, H. P.', whose initials
        are dropped, against 'Howard Phillips Lovecraft'). Both leave the
        surname intact, so a name whose tokens are a less complete spelling of
        exactly one other author is the same person.

        Ambiguity is never resolved by guessing: a name matching two or more
        candidates is left alone, because 'Shelley' beside both Mary and Percy
        is a real question rather than a merge.
        """
        entries = list(self._by_tokens.values())
        merges: list[dict] = []
        for entry in sorted(entries, key=lambda e: len(e["_tokens"] or ())):
            tokens = entry["_tokens"]
            if tokens is None:
                continue
            targets = [
                other
                for other in entries
                if other is not entry
                and other["_tokens"] is not None
                and self._is_variant(tokens, other["_tokens"])
            ]
            if len(targets) != 1:
                continue
            target = targets[0]
            for spelling in [entry["display_name"], *entry["aliases"]]:
                if spelling != target["display_name"] and spelling not in target["aliases"]:
                    target["aliases"].append(spelling)
            merges.append({"merged": entry["display_name"], "into": target["display_name"]})
            self.remap[entry["id"]] = target["id"]
            entry["_tokens"] = None
            self._by_tokens[tokens] = target
        return merges

    @staticmethod
    def _is_variant(smaller: frozenset[str], larger: frozenset[str]) -> bool:
        """True if `smaller` is a less complete spelling of `larger`."""
        if len(smaller) > len(larger) or smaller == larger:
            return False
        if smaller <= larger:
            return True  # dropped initials or forenames
        # Every token is a prefix of some token in the fuller name, and long
        # enough that short words cannot carry a match on their own.
        return all(
            any(t == o or (len(t) >= 4 and o.startswith(t)) for o in larger) for t in smaller
        )

    def finalise(self) -> list[dict]:
        out, seen = [], set()
        for entry in self._by_tokens.values():
            if entry["id"] in seen:
                continue  # a merge target reached through several spellings
            seen.add(entry["id"])
            entry = {k: v for k, v in entry.items() if k != "_tokens"}
            out.append(entry)
        out.sort(key=lambda a: fold(a["sort_name"]))
        return out


# --------------------------------------------------------------------------- #
# Clustering
# --------------------------------------------------------------------------- #

class Cluster:
    """Records from different sources believed to describe one book."""

    __slots__ = ("records", "keys")

    def __init__(self, record: dict) -> None:
        self.records: list[dict] = [record]
        self.keys: set[str] = set()
        self._index(record)

    def _index(self, record: dict) -> None:
        for name in record["authors"]:
            self.keys |= index_keys(name)

    def add(self, record: dict) -> None:
        self.records.append(record)
        self._index(record)

    def sources(self) -> set[str]:
        return {r["_source"] for r in self.records}

    def score(self, record: dict) -> float:
        """How well a record fits this cluster, 0 if it cannot.

        Authors must agree before titles are compared at all: a title score
        alone would happily merge two different books in the same series.
        """
        if record["_source"] in self.sources():
            return 0.0  # a source's own rows are distinct books by construction
        candidate_keys = set()
        for name in record["authors"]:
            candidate_keys |= index_keys(name)
        # Neither side naming an author is not agreement, so the title has to
        # carry the match by itself and is held to a far higher standard.
        uncredited = not candidate_keys or not self.keys
        if not uncredited and not (candidate_keys & self.keys):
            return 0.0
        floor = UNCREDITED_MATCH_THRESHOLD if uncredited else TITLE_MATCH_THRESHOLD
        best = max(best_title_score(record["title"], r["title"]) for r in self.records)
        return best if best >= floor else 0.0


def cluster_records(sources: list[dict]) -> tuple[list[Cluster], list[dict]]:
    """Group every record across every source into one cluster per book.

    Sources are visited most-reliable first, so a cluster is founded on the
    best evidence available and weaker sources attach to it.
    """
    ordered = sorted(sources, key=lambda s: -rec.rank(s["source"]["confidence"]))
    clusters: list[Cluster] = []
    collapsed: list[dict] = []

    for source in ordered:
        for record in source["records"]:
            if record["collapsed"]:
                collapsed.append(record)  # stands for a series, not a book
                continue
            best, best_score = None, 0.0
            for cluster in clusters:
                score = cluster.score(record)
                if score > best_score:
                    best, best_score = cluster, score
            if best is None:
                clusters.append(Cluster(record))
            else:
                best.add(record)
    return clusters, collapsed


def collapsed_index(collapsed: list[dict]) -> dict[frozenset[str], list[dict]]:
    """What collapsed rows can tell the volumes they stand for, keyed by author.

    An author may have more than one - Pratchett has Discworld and the Long
    Earth - so each keeps its own entry and the volume chooses between them.
    Keeping only the last would give every Discworld book the Long Earth's
    keywords, which is exactly the kind of quiet wrongness that survives review.
    """
    out: dict[frozenset[str], list[dict]] = {}
    for record in collapsed:
        # The row's title lists the volumes as well as naming the series; only
        # the part before the first list separator is the name itself.
        name = record["series"] or re.split(r"[-–—;(]|\bvols?\.", record["title"])[0]
        name = name.strip(" ,;")
        entry = {
            "genre": record["genre"],
            "keywords": record["keywords"],
            "series": name if 3 <= len(name) <= 60 else None,
            "listed": fold(f"{record['title']} {record['listed_volumes'] or ''}"),
            "record": record,
        }
        # Keyed per credit, so a series written by several people is inherited
        # by volumes a source files under any one of them alone.
        for name in record["authors"]:
            for credit in split_credits(name):
                out.setdefault(author_tokens(credit), []).append(entry)
    return out


def inherited_from(candidates: list[dict], title: str) -> dict | None:
    """Which of an author's collapsed rows, if any, stands for this book.

    A row that names the book wins. Where none does, a lone row is still worth
    inheriting a genre from - one series, one judgement - but several rows are
    not, because picking between them would be a guess.
    """
    if not candidates:
        return None
    opening = " ".join(title_head(title).split()[:5])
    if len(opening.split()) >= 2:
        for entry in candidates:
            if opening in entry["listed"]:
                return entry
    return candidates[0] if len(candidates) == 1 else None


# --------------------------------------------------------------------------- #
# Building an entry
# --------------------------------------------------------------------------- #

def pick_title(cluster: Cluster) -> tuple[str, bool]:
    """The fullest title anyone recorded.

    A clipped title is a prefix of the true one, so a longer unclipped title
    from any source repairs it - which is how a spreadsheet fixes what a store
    page cut off mid-word.
    """
    whole = [r for r in cluster.records if not r["title_clipped"]]
    if whole:
        return max(whole, key=lambda r: len(r["title"]))["title"], False
    return max(cluster.records, key=lambda r: len(r["title"]))["title"], True


def build_entry(cluster: Cluster, collapsed: dict, authors: AuthorIndex, ids: set[str]) -> dict:
    by_rank = sorted(cluster.records, key=lambda r: -rec.rank(r["confidence"]))

    def first_fact(field):
        for record in by_rank:
            value = record[field]
            if value not in (None, "", False):
                return value
        return next((r[field] for r in by_rank if r[field] is not None), None)

    def first_judgement(field):
        return next((r[field] for r in by_rank if r[field]), None)

    title, clipped = pick_title(cluster)
    # Every spelling seen goes into the index, so that a shorter form on a
    # spine ('M. Oquendo') survives as an alias of the fuller one; the entry
    # itself is credited from the most reliable source that named anyone.
    for record in by_rank:
        for name in record["authors"]:
            for credit in split_credits(name):
                authors.add(credit)
    credits = next((r["authors"] for r in by_rank if r["authors"]), [])
    author_ids = [aid for aid in (authors.add(c) for n in credits for c in split_credits(n)) if aid]

    genre = first_judgement("genre")
    keywords = first_judgement("keywords")
    series = first_fact("series")
    series_index = first_fact("series_index")
    if not series:
        series, series_index = detect_series(title)

    inherited = inherited_from(collapsed.get(author_tokens(credits[0]), []), title) if credits else None
    if inherited:
        genre = genre or inherited["genre"]
        keywords = keywords or inherited["keywords"]
        # The series name only covers volumes the row actually lists, otherwise
        # a standalone book by the same author is filed into it. Compared on
        # the opening words: a row listing 'La Guerra de los Cielos, vols. 1-4'
        # never matches the tail of '... Volumen 3'.
        opening = " ".join(title_head(title).split()[:5])
        if not series and len(opening.split()) >= 2 and opening in inherited["listed"]:
            series = inherited["series"]

    formats = sorted({f for r in cluster.records for f in r["formats"]})
    flags = sorted({f for r in cluster.records for f in r["flags"]})
    if clipped:
        flags.append("title_clipped")
    if not genre:
        flags.append("no_genre")
    if not author_ids:
        flags.append("no_personal_author")
    placeholder = bool(PLACEHOLDER.search(title))
    if placeholder:
        flags.append("placeholder")

    base = slugify(credits[0] if credits else "", title)
    entry_id, n = base, 2
    while entry_id in ids:
        entry_id, n = f"{base}-{n}", n + 1
    ids.add(entry_id)

    return {
        "id": entry_id,
        "title": title,
        "title_key": title_key(title),
        "authors": author_ids,
        "author_label": first_fact("author_label") if not author_ids else None,
        "notes": first_fact("notes"),
        "series": series,
        "series_index": series_index,
        "formats": formats,
        "publisher": first_fact("publisher"),
        "acquired_on": first_fact("acquired_on"),
        "read": next((r["read"] for r in by_rank if r["read"] is not None), None),
        "collections": first_fact("collections"),
        "devices": first_fact("devices"),
        "update_available": bool(first_fact("update_available")),
        "location": first_fact("location"),
        "genre": genre,
        "tags": split_tags(genre, keywords),
        "sources": sorted(cluster.sources()),
        "confidence": "low" if placeholder else max(
            (r["confidence"] for r in cluster.records), key=rec.rank
        ),
        "flags": sorted(set(flags)),
    }


def split_tags(genre: str | None, keywords: str | None) -> list[dict]:
    """Freeform genre and keyword strings as typed tags.

    The vocabulary is not controlled - sources mix levels of abstraction badly
    - so the kind is recorded and normalisation left to a later pass that can
    see the whole distribution.
    """
    import re

    tags: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for kind, blob in (("genre", genre), ("keyword", keywords)):
        for part in re.split(r"[,;/]| - ", blob or ""):
            value = part.strip()
            if not value or (kind, fold(value)) in seen:
                continue
            seen.add((kind, fold(value)))
            tags.append({"kind": kind, "value": value, "key": fold(value)})
    return tags


# --------------------------------------------------------------------------- #

def build(sources: list[dict]) -> dict:
    clusters, collapsed_records = cluster_records(sources)
    collapsed = collapsed_index(collapsed_records)
    authors = AuthorIndex()
    ids: set[str] = set()

    books = [build_entry(c, collapsed, authors, ids) for c in clusters]

    # A collapsed row whose volumes no source lists individually would vanish
    # otherwise, which is how a list-only build silently loses a whole series.
    # A row counts as expanded only when the catalog holds a book the row
    # actually names. Merely sharing an author is not enough: Pratchett has
    # standalones beside the Discworld row, and treating those as coverage
    # drops all 38 volumes.
    by_author: dict[str, list[dict]] = {}
    for book in books:
        for aid in book["authors"]:
            by_author.setdefault(aid, []).append(book)

    orphans = []
    for record in collapsed_records:
        credits = [c for c in (authors.add(n) for name in record["authors"]
                               for n in split_credits(name)) if c]
        siblings = [b for c in credits for b in by_author.get(c, [])]
        listed = fold(f"{record['title']} {record['listed_volumes'] or ''}")
        expanded = any(
            " ".join(title_head(b["title"]).split()[:4]) in listed
            for b in siblings
            if len(title_head(b["title"]).split()) >= 2
        )
        # A row that names no volumes at all - a placeholder for spines nobody
        # could read - is answered by any book from that author appearing.
        if not expanded and siblings and PLACEHOLDER.search(record["title"]):
            expanded = True
        if expanded:
            continue

        entry = build_entry(Cluster(record), {}, authors, ids)
        entry["flags"] = sorted(set(entry["flags"]) | {"series_not_expanded"})
        books.append(entry)
        orphans.append({"title": record["title"], "source": record["_source"]})

    author_merges = authors.merge_variants()
    for book in books:
        book["authors"] = list(dict.fromkeys(authors.remap.get(a, a) for a in book["authors"]))

    books.sort(key=lambda b: (
        fold(b["authors"][0]) if b["authors"] else fold(b["title"]),
        b["series"] or "",
        b["series_index"] or 0,
        fold(b["title"]),
    ))
    author_list = authors.finalise()

    multi = [b for b in books if len(b["sources"]) > 1]
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sources": [s["source"] for s in sources],
        "counts": {
            "books": len(books),
            "authors": len(author_list),
            "by_format": {
                f: sum(1 for b in books if f in b["formats"])
                for f in sorted({f for b in books for f in b["formats"]})
            },
            "in_multiple_sources": len(multi),
            "read": sum(1 for b in books if b["read"] is True),
            "unread": sum(1 for b in books if b["read"] is False),
            "read_unknown": sum(1 for b in books if b["read"] is None),
        },
        "books": books,
        "authors": author_list,
        "review": {
            "author_variants_merged": author_merges,
            "matched_across_sources": [
                {"title": b["title"], "sources": b["sources"]} for b in multi
            ],
            "series_not_expanded": orphans,
            "clipped_titles": [b["title"] for b in books if "title_clipped" in b["flags"]],
            "low_confidence": [
                {"title": b["title"], "sources": b["sources"]}
                for b in books
                if b["confidence"] == "low"
            ],
            "no_genre": [b["title"] for b in books if "no_genre" in b["flags"]],
        },
    }


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--source", type=Path, action="append", required=True, metavar="FILE",
                    help="a source file; repeat for as many sources as you have")
    ap.add_argument("-o", "--out", type=Path, required=True)
    args = ap.parse_args()

    try:
        sources = [rec.read(p) for p in args.source]
    except rec.SourceError as exc:
        sys.exit(f"error: {exc}")

    names = [s["source"]["name"] for s in sources]
    if len(set(names)) != len(names):
        sys.exit(f"error: source names must be unique, got {names}")

    catalog = build(sources)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

    c, r = catalog["counts"], catalog["review"]
    formats = ", ".join(f"{n} {f}" for f, n in c["by_format"].items())
    print("sources           : " + ", ".join(
        f"{s['name']} ({s['confidence']})" for s in catalog["sources"]))
    print(f"books             : {c['books']}   ({formats})")
    print(f"authors           : {c['authors']}")
    print(f"read / unread     : {c['read']} / {c['unread']}   ({c['read_unknown']} unknown)")
    print(f"in >1 source      : {c['in_multiple_sources']}")
    print()
    print("needs a look:")
    print(f"  authors merged  : {len(r['author_variants_merged'])}")
    print(f"  series unopened : {len(r['series_not_expanded'])}")
    print(f"  clipped titles  : {len(r['clipped_titles'])}")
    print(f"  low confidence  : {len(r['low_confidence'])}")
    print(f"  no genre        : {len(r['no_genre'])}")
    print()
    print(f"written           : {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
