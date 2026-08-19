"""Deciding whether two records name the same book or the same person.

Every source spells things differently. A store export writes 'Terry
Pratchett', a spreadsheet writes 'Pratchett, Terry', a photograph shows only
what fits on a spine. Nothing here is about a particular source; it is the
shared vocabulary the merge uses to reconcile them.

Folded forms are for comparison only. Display always uses the original.
"""

from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher

# Title similarity above this counts as the same book, given the authors
# already match. Tuned so that edition noise ('(Biblioteca Clasica Gredos n 387)')
# does not separate a book from itself.
TITLE_MATCH_THRESHOLD = 0.62

# Where no author is known on either side, the title carries the match alone
# and has to be all but identical.
UNCREDITED_MATCH_THRESHOLD = 0.95

# Parenthetical or trailing edition noise, stripped before comparison only.
EDITION_NOISE = re.compile(
    r"\((?:[^()]*\b(?:biblioteca|cl[aá]sica|gredos|bolsillo|edici[oó]n|ed\.|"
    r"vol\.|n[oº]?\s*\d+|divulgaci[oó]n|runas|bloomsbury|sigma)\b[^()]*)\)",
    re.IGNORECASE,
)

# Series stated inside the title, e.g. '(Los casos del Departamento Q 1)' or
# 'La Primera Ley: Libro II'. Deliberately conservative: anything not matching
# these shapes is left for review rather than invented.
SERIES_PATTERNS = [
    re.compile(r"\((?P<series>[^()]+?)\s+(?P<index>\d{1,2})\)\s*$"),
    re.compile(r"\((?P<series>[^()]+?)\s+(?P<index>[IVX]{1,5})\)\s*$"),
    re.compile(r":\s*(?P<series>[^:]+?):\s*Libro\s+(?P<index>[IVX]{1,5}|\d{1,2})\b"),
]
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7,
         "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c))


def clean(s: str) -> str:
    """Whitespace and unicode tidied, but the text otherwise untouched.

    Safe for display: NFKC also turns the non-breaking spaces some sources hide
    inside words into ordinary ones.
    """
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", s)).strip()


def fold(s: str) -> str:
    """Aggressive normalisation for comparison keys only, never for display."""
    s = strip_accents(unicodedata.normalize("NFKC", s)).casefold()
    s = re.sub(r"[^\w\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def author_tokens(name: str) -> frozenset[str]:
    """Comparable token set for a personal name.

    Sources disagree on order and punctuation: 'Pratchett, Terry' against
    'Terry Pratchett'. A set ignores order. Bare initials ('H. P.') carry no
    signal and are dropped, leaving the surname to do the work.
    """
    return frozenset(t for t in fold(name.replace(",", " ")).split() if len(t) > 1)


def split_credits(name: str) -> list[str]:
    """Split a multi-author credit into individual names.

    Semicolons separate co-authors ('Herbert, Frank; Ransom, Bill'); commas
    cannot, because they already mean the surname-first inversion.
    """
    parts = [p.strip() for p in re.split(r";|\s+&\s+|\s+y\s+otros\b", name) if p.strip()]
    return parts or ([name.strip()] if name.strip() else [])


# A bracketed stand-in where a person's name would go: '[Anonimo]', '[Varios]',
# '[Reference]'. It labels the entry rather than naming anybody.
LABEL = re.compile(r"\[([^\]]+)\]")

# A parenthetical crediting whoever prepared the edition rather than wrote it.
EDITORIAL = re.compile(
    r"\((?:\s*(?:eds?\.|edited by|trans\.|translated by|coord\.|comp\.)\s*)(?P<who>[^)]*)\)",
    re.IGNORECASE,
)


def credits_and_label(field: str) -> tuple[list[str], str | None]:
    """Pull the people out of a hand-written author field.

    Hand-kept lists put more than a name in that column: a stand-in for an
    anonymous work, the editors of an edition, a real name behind a pen name.
    Left alone these become authors called '[Varios] (eds. Meyer' - which then
    merge with real people and corrupt the author list - so they are separated
    here, where the mess is, rather than defended against everywhere else.

    Returns the personal names, and any bracketed label that stood in for one.
    """
    field = clean(field)
    if not field:
        return [], None

    label = None
    match = LABEL.search(field)
    if match:
        label = match.group(1).strip()
        field = LABEL.sub(" ", field)

    people: list[str] = []
    for editorial in EDITORIAL.finditer(field):
        # Inside an editorial credit a comma separates people, not surname
        # from forename, so it is safe to split on here and nowhere else.
        people += [p.strip() for p in re.split(r",|\s+&\s+|;", editorial.group("who")) if p.strip()]
    field = EDITORIAL.sub(" ", field)

    # Anything left in brackets or parentheses is an aside, not a name.
    field = re.sub(r"\([^)]*\)", " ", field)
    people = [p for p in (clean(x) for x in split_credits(field)) if p] + people
    return [p for p in people if author_tokens(p)], label


def index_keys(name: str) -> set[str]:
    """Keys a name is filed under when looking for candidate matches.

    Includes a five-character prefix of every token, so spellings differing
    only in their tail - 'Platon' against 'Plato' - still meet. Loose indexing
    is safe: it only proposes candidates, and the title comparison decides.
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
    return fold(re.sub(r"\([^()]*\)", " ", t))


def title_head(title: str) -> str:
    """Just the main title, with any subtitle after a colon or dash dropped.

    Sources disagree about subtitles far more than about titles: a spreadsheet
    records 'Los tonicos de la voluntad' where a store carries the full
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


def best_title_score(a: str, b: str) -> float:
    """Title agreement, judged on the full titles and on the main titles."""
    return max(title_score(title_key(a), title_key(b)),
               title_score(title_head(a), title_head(b)))


def slugify(*parts: str) -> str:
    joined = "-".join(p for p in parts if p)
    return re.sub(r"[^\w]+", "-", strip_accents(joined).casefold()).strip("-")[:80] or "untitled"


def detect_series(title: str) -> tuple[str | None, int | None]:
    """Series name and volume number, when the title states them plainly."""
    for pattern in SERIES_PATTERNS:
        m = pattern.search(title)
        if not m:
            continue
        raw_index = m.group("index").upper()
        index = int(raw_index) if raw_index.isdigit() else ROMAN.get(raw_index)
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
