"""Merge the parsed sources into one catalog.

Two inputs describe the same library from different angles:

* the Kindle export (``parse_kindle.py``) is *complete and reliable* but
  metadata-poor: one row per volume, with dates and read flags, no genres.
* the hand-built XML is *rich but lossy*: it carries genre and keyword
  judgements, and the physical shelf, but it collapsed whole series into single
  rows and read spine text off a photograph.

So the Kindle export is the spine for e-books - it already has one row per
volume, which unrolls the collapsed series for free - and the XML is joined
onto it to donate genre and keywords. XML rows that never match are physical
books, and become catalog entries in their own right.

Nothing is guessed silently. Every entry carries the sources it came from and a
confidence, and anything the merge could not resolve is listed in the report so
it can be fixed by hand rather than discovered later.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path

# Title similarity above this counts as the same book, given the authors
# already match. Tuned so that edition noise ('(Biblioteca Clasica Gredos n 387)')
# does not separate a book from itself.
TITLE_MATCH_THRESHOLD = 0.62

# Where the export names no author, the title carries the match by itself and
# has to be all but identical.
UNCREDITED_MATCH_THRESHOLD = 0.95

# A clipped Kindle title is a strict prefix of the true one, so prefix
# agreement over this many characters is treated as a match on its own.
CLIPPED_PREFIX_CHARS = 18

# Parenthetical or trailing edition noise, stripped before comparison only.
EDITION_NOISE = re.compile(
    r"\((?:[^()]*\b(?:biblioteca|cl[aá]sica|gredos|bolsillo|edici[oó]n|ed\.|"
    r"vol\.|n[oº]?\s*\d+|divulgaci[oó]n|runas|bloomsbury|sigma)\b[^()]*)\)",
    re.IGNORECASE,
)

# Series marked inside the title, e.g. '(Los casos del Departamento Q 1)' or
# 'La Primera Ley: Libro II'. Deliberately conservative: anything not matching
# these shapes is left for review rather than invented.
SERIES_PATTERNS = [
    re.compile(r"\((?P<series>[^()]+?)\s+(?P<index>\d{1,2})\)\s*$"),
    re.compile(r"\((?P<series>[^()]+?)\s+(?P<index>[IVX]{1,5})\)\s*$"),
    re.compile(r":\s*(?P<series>[^:]+?):\s*Libro\s+(?P<index>[IVX]{1,5}|\d{1,2})\b"),
]
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7,
         "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12}

# Placeholders standing in for spines the photograph could not resolve.
ILLEGIBLE = re.compile(r"\[(?:[^\]]*not legible|[^\]]*partly legible|…|\.\.\.)\]", re.I)
BRACKETED = re.compile(r"^\[(?P<inner>[^\]]+)\]")


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c))


def fold(s: str) -> str:
    """Aggressive normalisation for comparison keys only, never for display."""
    s = strip_accents(unicodedata.normalize("NFKC", s)).casefold()
    s = re.sub(r"[^\w\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def author_tokens(name: str) -> frozenset[str]:
    """Comparable token set for a personal name.

    The two sources disagree on order and on punctuation: the XML writes
    'Pratchett, Terry' and the Kindle export 'Terry Pratchett'. A set ignores
    order. Bare initials ('H. P.') carry no signal and are dropped, leaving the
    surname to do the work.
    """
    cleaned = fold(name.replace(",", " "))
    return frozenset(t for t in cleaned.split() if len(t) > 1)


def split_credits(name: str) -> list[str]:
    """Split a multi-author credit into individual names.

    The XML separates co-authors with a semicolon ('Herbert, Frank; Ransom,
    Bill'); commas cannot be used for this, because they already mean the
    surname-first inversion.
    """
    parts = [p.strip() for p in re.split(r";|\s+&\s+|\s+y\s+otros\b", name) if p.strip()]
    return parts or ([name.strip()] if name.strip() else [])


def index_keys(name: str) -> set[str]:
    """Keys a name is filed under when looking for candidate matches.

    Includes a five-character prefix of every token, so that spellings which
    differ only in their tail - 'Platon' against 'Plato' - still meet. Loose
    indexing is safe here: it only proposes candidates, and the title
    comparison decides.
    """
    keys: set[str] = set()
    for credit in split_credits(name):
        for token in author_tokens(credit):
            keys.add(token)
            keys.add(token[:5])
    return keys


def title_key(title: str) -> str:
    """Title reduced for comparison: edition noise and parentheses removed."""
    t = EDITION_NOISE.sub(" ", title)
    t = re.sub(r"\([^()]*\)", " ", t)
    return fold(t)


def title_head(title: str) -> str:
    """Just the main title, with any subtitle after a colon or dash dropped.

    The two sources disagree about subtitles far more than about titles: the
    XML records 'Los tonicos de la voluntad' where Amazon carries the full
    'Los tonicos de la voluntad: Reglas y consejos sobre investigacion...'.
    """
    return title_key(re.split(r"[:–—]|\s-\s", title, maxsplit=1)[0])


def similar(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def title_score(a: str, b: str) -> float:
    """How strongly two titles denote the same book.

    Containment matters more than edit distance here. One source routinely
    holds a longer form of the other - a subtitle, an edition line, a series
    note - which wrecks a plain ratio while being near-proof of identity.
    """
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    short, long = sorted((a, b), key=len)
    # Whole-word containment only: 'obras' inside 'obras de howard phillips
    # lovecraft' is the same book, but inside 'obrass' it would be noise.
    if len(short) >= 5 and f" {short} " in f" {long} ":
        return 0.97 if long.startswith(short) else 0.90
    return similar(a, b)


def slugify(*parts: str) -> str:
    joined = "-".join(p for p in parts if p)
    s = re.sub(r"[^\w]+", "-", strip_accents(joined).casefold()).strip("-")
    return s[:80] or "untitled"


def detect_series(title: str) -> tuple[str | None, int | None]:
    """Series name and volume number, when the title states them plainly."""
    for pattern in SERIES_PATTERNS:
        m = pattern.search(title)
        if not m:
            continue
        raw_index = m.group("index").upper()
        index = ROMAN.get(raw_index) if not raw_index.isdigit() else int(raw_index)
        if index is None:
            continue
        series = re.sub(r"\s+", " ", m.group("series")).strip(" :,-")
        # Publisher collections number themselves 'Solaris ficcion no 12',
        # leaving a dangling 'no' once the number is taken as the index.
        series = re.sub(r"\s+n[oº°]?\.?$", "", series, flags=re.IGNORECASE).strip(" :,-")
        if len(series) < 3:
            continue
        return series, index
    return None, None


def split_tags(genre: str | None, keywords: str | None) -> list[dict]:
    """Freeform genre and keyword strings as typed tags.

    The vocabulary is not yet controlled - the source mixes levels of
    abstraction badly - so the kind is recorded and normalisation left to a
    later pass that can see the whole distribution.
    """
    tags: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for kind, blob in (("genre", genre), ("keyword", keywords)):
        for part in re.split(r"[,;/]| - ", blob or ""):
            value = part.strip()
            if not value:
                continue
            key = (kind, fold(value))
            if key in seen:
                continue
            seen.add(key)
            tags.append({"kind": kind, "value": value, "key": fold(value)})
    return tags


# --------------------------------------------------------------------------- #
# Authors
# --------------------------------------------------------------------------- #

class AuthorIndex:
    """Authors keyed by name-token set, accumulating every spelling seen."""

    def __init__(self) -> None:
        self._by_tokens: dict[frozenset[str], dict] = {}
        self.remap: dict[str, str] = {}

    def add(self, name: str) -> str | None:
        # Some source names carry a non-breaking space inside a word
        # ('Garc<nbsp>ia'); NFKC turns it into an ordinary space so the name
        # displays and sorts like every other.
        name = re.sub(r"\s+", " ", unicodedata.normalize("NFKC", name)).strip(" ,;")
        if not name:
            return None
        tokens = author_tokens(name)
        if not tokens:
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
        # two ways, not an alias. Only genuinely different wording is recorded.
        if display != entry["display_name"] and display not in entry["aliases"]:
            entry["aliases"].append(display)
        return entry["id"]

    def merge_variants(self) -> list[dict]:
        """Fold together spellings of one author that the sources disagree on.

        Two shapes of disagreement occur: a truncated form ('Plato' for
        'Platon') and an abbreviated one ('Lovecraft, H. P.', whose initials
        are dropped, against 'Howard Phillips Lovecraft'). Both leave the
        surname intact, so a name whose tokens are a subset of exactly one
        other author's is the same person.

        Ambiguity is never resolved by guessing: a name matching two or more
        candidates is left alone, because 'Shelley' beside both Mary and Percy
        is a real question rather than a merge.
        """
        entries = list(self._by_tokens.values())
        merges: list[dict] = []
        for entry in sorted(entries, key=lambda e: len(e["_tokens"])):
            tokens = entry["_tokens"]
            targets = [
                other
                for other in entries
                if other is not entry
                and other["_tokens"] is not None
                and tokens is not None
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
        if len(smaller) > len(larger):
            return False
        if smaller == larger:
            return False
        if smaller <= larger:
            return True  # dropped initials or forenames
        # Every token is a prefix of some token in the fuller name, and at
        # least five characters long so that short words cannot carry a match.
        return all(
            any(t == o or (len(t) >= 4 and o.startswith(t)) for o in larger) for t in smaller
        )

    def id_for(self, name: str) -> str | None:
        tokens = author_tokens(name)
        entry = self._by_tokens.get(tokens)
        return entry["id"] if entry else None

    @staticmethod
    def _display_form(name: str) -> str:
        """'Pratchett, Terry' -> 'Terry Pratchett'; leave anything else alone.

        Only a single comma with words either side is treated as inverted; a
        name with two commas is a compound the sources spell inconsistently and
        is safer left verbatim.
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
        if len(parts) < 2:
            return name
        return f"{parts[-1]}, {' '.join(parts[:-1])}"

    def resolve(self, tokens: frozenset[str]) -> dict | None:
        return self._by_tokens.get(tokens)

    def finalise(self) -> list[dict]:
        out, seen = [], set()
        for entry in self._by_tokens.values():
            if entry["id"] in seen:
                continue  # a merge target reached through several spellings
            seen.add(entry["id"])
            entry = dict(entry)
            entry.pop("_tokens", None)
            out.append(entry)
        out.sort(key=lambda a: fold(a["sort_name"]))
        return out


# --------------------------------------------------------------------------- #
# Loading
# --------------------------------------------------------------------------- #

def load_kindle(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))["records"]


def load_xml(path: Path) -> tuple[list[dict], list[dict]]:
    root = ET.parse(path).getroot()

    def rows(collection_name: str) -> list[dict]:
        node = root.find(f"collection[@name='{collection_name}']")
        if node is None:
            return []
        out = []
        for book in node.findall("book"):
            out.append(
                {
                    "author": (book.findtext("author") or "").strip(),
                    "title": re.sub(r"\s+", " ", (book.findtext("title") or "")).strip(),
                    "genre": (book.findtext("genre") or "").strip() or None,
                    "keywords": (book.findtext("keywords") or "").strip() or None,
                    "why": (book.findtext("why-this-one") or "").strip() or None,
                    "source": (book.get("source") or "").strip(),
                }
            )
        return out

    return rows("Owned"), rows("Recommendations")


def is_collapsed(row: dict) -> bool:
    """A row standing for several volumes rather than one book.

    Two slashes means a list of titles ('La Tierra Larga / La Guerra Larga /
    El Marte Largo'); one means an alternative name for a single book
    ('Historia de los visigodos / Los visigodos'), which is not collapsed.
    """
    title = row["title"]
    return bool(
        re.search(r"\bvol(?:s|umes|\.)?\b", title, re.I)
        or re.search(r"\btomos?\b", title, re.I)
        or title.count(";") >= 1
        or title.count("/") >= 2
        or len(title) > 150
    )


# --------------------------------------------------------------------------- #
# Merge
# --------------------------------------------------------------------------- #

def match_xml_to_kindle(xml_rows: list[dict], kindle: list[dict]) -> tuple[dict[int, int], list[dict]]:
    """Map XML row index -> Kindle record index.

    Authors must agree before titles are compared at all; a title score alone
    would happily merge two different books in the same series.
    """
    by_author: dict[str, list[int]] = {}
    for i, rec in enumerate(kindle):
        for name in rec["authors"]:
            for key in index_keys(name):
                by_author.setdefault(key, []).append(i)

    taken: set[int] = set()
    mapping: dict[int, int] = {}
    ambiguous: list[dict] = []

    # Some items credit only the imprint, so the export names no author at all
    # ('El Paciente'). Those can still be matched, but on the title alone, which
    # is far weaker evidence and so demands a near-exact score.
    authorless = {i for i, rec in enumerate(kindle) if not rec["authors"]}

    scored: list[tuple[float, int, int]] = []
    for xi, row in enumerate(xml_rows):
        if is_collapsed(row):
            continue  # handled separately; a blob title cannot be scored
        candidates: set[int] = set()
        for key in index_keys(row["author"]):
            candidates.update(by_author.get(key, ()))
        xkey, xhead = title_key(row["title"]), title_head(row["title"])
        for ki in candidates | authorless:
            rec = kindle[ki]
            kkey, khead = title_key(rec["title_raw"]), title_head(rec["title_raw"])
            score = max(title_score(xkey, kkey), title_score(xhead, khead))
            if rec["title_clipped"] and kkey and xkey.startswith(kkey[:CLIPPED_PREFIX_CHARS]):
                score = max(score, 0.95)
            floor = UNCREDITED_MATCH_THRESHOLD if ki in authorless else TITLE_MATCH_THRESHOLD
            if score >= floor:
                scored.append((score, xi, ki))

    # Best-scoring pairs win, so a strong match is never blocked by a weak one
    # that happened to be considered first.
    for score, xi, ki in sorted(scored, key=lambda s: -s[0]):
        if xi in mapping or ki in taken:
            continue
        mapping[xi] = ki
        taken.add(ki)

    for xi, row in enumerate(xml_rows):
        if xi not in mapping and not is_collapsed(row) and "kindle" in row["source"]:
            ambiguous.append(row)
    return mapping, ambiguous


def collapsed_tags_by_author(xml_rows: list[dict]) -> dict[frozenset[str], dict]:
    """Genre and keywords from collapsed rows, keyed by author.

    Every volume of a collapsed series shares the row's judgement, so the whole
    series inherits it; the series name is taken from the text before the
    volume list.
    """
    out: dict[frozenset[str], dict] = {}
    for row in xml_rows:
        if not is_collapsed(row):
            continue
        series = re.split(r"[-–—;(]|\bvols?\.", row["title"])[0].strip(" ,;")
        entry = {
            "genre": row["genre"],
            "keywords": row["keywords"],
            "series": series if 3 <= len(series) <= 60 else None,
            # The row lists the volumes it stands for, so a book can check
            # whether it is one of them before claiming the series name.
            "listed": fold(row["title"]),
        }
        # Keyed per credit, so a series written by several people is inherited
        # by volumes the export files under any one of them alone.
        for credit in split_credits(row["author"]):
            out[author_tokens(credit)] = entry
    return out


def build(kindle: list[dict], xml_rows: list[dict], recommendations: list[dict]) -> dict:
    authors = AuthorIndex()
    mapping, ambiguous = match_xml_to_kindle(xml_rows, kindle)
    kindle_to_xml = {ki: xi for xi, ki in mapping.items()}
    collapsed = collapsed_tags_by_author(xml_rows)

    books: list[dict] = []
    ids: set[str] = set()

    def unique_id(*parts: str) -> str:
        base = slugify(*parts)
        candidate, n = base, 2
        while candidate in ids:
            candidate, n = f"{base}-{n}", n + 1
        ids.add(candidate)
        return candidate

    # --- e-books: one entry per Kindle record --------------------------------
    for ki, rec in enumerate(kindle):
        author_ids = [aid for aid in (authors.add(a) for a in rec["authors"]) if aid]
        xml_row = xml_rows[kindle_to_xml[ki]] if ki in kindle_to_xml else None

        genre = xml_row["genre"] if xml_row else None
        keywords = xml_row["keywords"] if xml_row else None
        series, series_index = detect_series(rec["title_raw"])

        inherited = collapsed.get(author_tokens(rec["authors"][0])) if rec["authors"] else None
        if inherited:
            genre = genre or inherited["genre"]
            keywords = keywords or inherited["keywords"]
            # The genre judgement covers everything the author wrote in that
            # vein, but the series name only covers volumes the row actually
            # lists - otherwise a standalone book by the same author (Buenos
            # presagios, next to the Long Earth trilogy) is filed into it.
            # Compared on the opening words only: the row lists 'La Guerra de
            # los Cielos, vols. 1-4' where the volume itself is titled '...
            # Volumen 3', so the tail never matches even though it is listed.
            opening = " ".join(title_head(rec["title_raw"]).split()[:5])
            if not series and len(opening.split()) >= 2 and opening in inherited["listed"]:
                series = inherited["series"]

        title = rec["title_raw"]
        flags: list[str] = []
        if rec["title_clipped"]:
            # The XML kept the full title where the Amazon page clipped it.
            if xml_row and len(xml_row["title"]) > len(title):
                title = xml_row["title"]
            else:
                flags.append("title_clipped")
        if not xml_row and not inherited:
            flags.append("no_genre")

        # The XML already knows which books are owned on paper as well; trust
        # that over any fuzzy re-derivation.
        formats = ["ebook"]
        sources = ["kindle"]
        if xml_row and "shelf" in xml_row["source"]:
            formats.append("physical")
            sources.append("shelf")

        books.append(
            {
                "id": unique_id(rec["authors"][0] if rec["authors"] else "", title),
                "title": title,
                "title_key": title_key(title),
                "authors": author_ids,
                "series": series,
                "series_index": series_index,
                "formats": formats,
                "publisher": rec["publisher"],
                "acquired_on": rec["acquired_on"],
                "read": rec["read"],
                "collections": rec["collections"],
                "devices": rec["devices"],
                "update_available": rec["update_available"],
                "tags": split_tags(genre, keywords),
                "genre": genre,
                "sources": sources,
                "confidence": "high",
                "flags": flags,
            }
        )

    # --- physical books: XML rows with no Kindle counterpart -----------------
    for xi, row in enumerate(xml_rows):
        if xi in mapping or is_collapsed(row):
            continue
        if "shelf" not in row["source"]:
            continue  # a kindle-sourced row that failed to match; see report

        raw_author = row["author"]
        bracket = BRACKETED.match(raw_author)
        corporate = bool(bracket)
        author_ids = (
            []
            if corporate
            else [aid for aid in (authors.add(c) for c in split_credits(raw_author)) if aid]
        )

        flags = []
        confidence = "high"
        if ILLEGIBLE.search(row["title"]) or ILLEGIBLE.search(raw_author):
            flags.append("illegible_spine")
            confidence = "low"
        elif "shelf" == row["source"]:
            # Read off a photograph: right far more often than not, but not
            # verified against any authority.
            confidence = "medium"
        if corporate:
            flags.append("no_personal_author")

        series, series_index = detect_series(row["title"])
        books.append(
            {
                "id": unique_id(raw_author, row["title"]),
                "title": row["title"],
                "title_key": title_key(row["title"]),
                "authors": author_ids,
                "author_label": bracket.group("inner") if corporate else None,
                "series": series,
                "series_index": series_index,
                "formats": ["physical"],
                "publisher": None,
                "acquired_on": None,
                "read": None,
                "collections": None,
                "devices": None,
                "update_available": False,
                "tags": split_tags(row["genre"], row["keywords"]),
                "genre": row["genre"],
                "sources": ["shelf"],
                "confidence": confidence,
                "flags": flags,
            }
        )

    # --- books owned in both formats -----------------------------------------
    merged_pairs = merge_duplicate_formats(books)

    # --- one author per person, however the sources spelled them -------------
    author_merges = authors.merge_variants()
    for book in books:
        book["authors"] = list(
            dict.fromkeys(authors.remap.get(aid, aid) for aid in book["authors"])
        )

    books.sort(key=lambda b: (
        fold(b["title"]) if not b["authors"] else fold(b["authors"][0]),
        b.get("series") or "",
        b.get("series_index") or 0,
        fold(b["title"]),
    ))

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "counts": {
            "books": len(books),
            "authors": len(authors.finalise()),
            "ebooks": sum(1 for b in books if "ebook" in b["formats"]),
            "physical": sum(1 for b in books if "physical" in b["formats"]),
            "both_formats": sum(1 for b in books if len(b["formats"]) > 1),
            "read": sum(1 for b in books if b["read"]),
            "unread": sum(1 for b in books if b["read"] is False),
            "read_unknown": sum(1 for b in books if b["read"] is None),
        },
        "books": books,
        "authors": authors.finalise(),
        "recommendations": [
            {
                "author": r["author"],
                "title": r["title"],
                "genre": r["genre"],
                "tags": split_tags(r["genre"], r["keywords"]),
                "why": r["why"],
            }
            for r in recommendations
        ],
        "review": {
            "author_variants_merged": author_merges,
            "xml_rows_unmatched": [
                {"author": r["author"], "title": r["title"], "source": r["source"]}
                for r in ambiguous
            ],
            "merged_formats": merged_pairs,
            "clipped_titles": [b["title"] for b in books if "title_clipped" in b["flags"]],
            "illegible": [
                {"author_label": b.get("author_label"), "title": b["title"]}
                for b in books
                if "illegible_spine" in b["flags"]
            ],
            "no_genre": [b["title"] for b in books if "no_genre" in b["flags"]],
        },
    }


def merge_duplicate_formats(books: list[dict]) -> list[dict]:
    """Fold a physical entry into its e-book twin, in place.

    Same author and near-identical title means one book owned twice, not two
    books. The e-book entry wins because it carries the acquisition date and
    read flag; the physical entry only contributes its format.
    """
    merged: list[dict] = []
    physical = [b for b in books if b["formats"] == ["physical"]]
    ebooks = [b for b in books if b["formats"] == ["ebook"]]
    by_author: dict[str, list[dict]] = {}
    for b in ebooks:
        for aid in b["authors"]:
            by_author.setdefault(aid, []).append(b)

    absorbed: set[str] = set()
    for phys in physical:
        best, best_score = None, 0.0
        for aid in phys["authors"]:
            for cand in by_author.get(aid, ()):
                score = similar(phys["title_key"], cand["title_key"])
                if score > best_score:
                    best, best_score = cand, score
        if best is None or best_score < 0.80:
            continue
        best["formats"] = ["ebook", "physical"]
        best["sources"] = sorted(set(best["sources"]) | {"shelf"})
        if not best["genre"] and phys["genre"]:
            best["genre"], best["tags"] = phys["genre"], phys["tags"]
            best["flags"] = [f for f in best["flags"] if f != "no_genre"]
        absorbed.add(phys["id"])
        merged.append({"title": best["title"], "score": round(best_score, 3)})

    books[:] = [b for b in books if b["id"] not in absorbed]
    return merged


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--kindle", type=Path, required=True, help="output of parse_kindle.py")
    ap.add_argument("--xml", type=Path, required=True, help="the hand-built biblioteca.xml")
    ap.add_argument("-o", "--out", type=Path, required=True, help="where to write catalog.json")
    args = ap.parse_args()

    kindle = load_kindle(args.kindle)
    xml_rows, recommendations = load_xml(args.xml)
    catalog = build(kindle, xml_rows, recommendations)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

    c = catalog["counts"]
    r = catalog["review"]
    print(f"books             : {c['books']}   ({c['ebooks']} ebook, {c['physical']} physical, {c['both_formats']} both)")
    print(f"authors           : {c['authors']}")
    print(f"read / unread     : {c['read']} / {c['unread']}   ({c['read_unknown']} unknown, all physical)")
    print()
    print("needs a look:")
    print(f"  formats merged  : {len(r['merged_formats'])}")
    print(f"  xml unmatched   : {len(r['xml_rows_unmatched'])}")
    print(f"  clipped titles  : {len(r['clipped_titles'])}")
    print(f"  illegible spines: {len(r['illegible'])}")
    print(f"  no genre        : {len(r['no_genre'])}")
    print(f"  authors merged  : {len(r['author_variants_merged'])}")
    print()
    print(f"written           : {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
