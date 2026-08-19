"""Parse an Amazon 'Manage Your Content and Devices' print-to-PDF into records.

The page renders one block per item:

    <title, possibly wrapped over several lines, possibly UI-truncated>
    <author[, author][, publisher]>
    Acquired on <D Month YYYY>
    [In N Collection(s)]
    [In N Device(s)  |  N Device(s)]
    [READ]
    [Update available]
    Deliver or remove from device
    Delete
    More actions

Two properties of the source make naive parsing lose records:

* The print-to-PDF splits blocks across page breaks. A record's title and
  author can sit at the foot of one page while its 'Acquired on' line opens the
  next, and the break leaves half-rendered fragments behind ('i', 'd', '2',
  'il 20'). Parsing page-at-a-time drops those records entirely, so the
  document is flattened into one continuous line stream first.
* Titles are clipped by the web UI to a fixed pixel width, mid-word and with no
  ellipsis. Nothing here can recover them; they are flagged for the merge step,
  which repairs them from the existing catalog.

Blocks are delimited by the 'More actions' line closing every record. Within a
block, 'Acquired on' is the anchor: the only line guaranteed present and
unambiguous. Everything else is located relative to it.

Screens are sometimes captured more than once, so records are deduplicated on
(title, author, acquired_on).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover
    sys.exit("PyMuPDF is required:  pip install pymupdf")

ACQUIRED_RE = re.compile(r"^Acquired on\s+(\d{1,2}\s+\w+\s+\d{4})\s*$")
COLLECTIONS_RE = re.compile(r"^(?:In\s+)?(\d+)\s+Collections?$")
DEVICES_RE = re.compile(r"^(?:In\s+)?(\d+)\s+Devices?$")
SHOWING_RE = re.compile(r"^Showing\s+\d+\s+to\s+\d+\s+of\s+(\d+)\s+items$")

RECORD_END = "More actions"
FOOTER_START = "Back to top"

# Page chrome: never part of a record, but kept in the stream as boundaries so
# that a record split across a page break is not silently glued to its neighbour.
CHROME = {
    "Deliver or remove from device",
    "Delete",
    "Select All",
    "Deselect All",
    "Digital Content",
    "View: Books",
    "All",
    "Sort by: Author: A-Z",
    "Search your content",
    "Go",
    "Deliver to device",
    "Mark as Read",
    "Mark as Unread",
    "Add to Collections",
}

# Icon glyphs from the page webfont land in the text layer as private-use
# codepoints. They carry no information and would otherwise prefix titles.
PUA_RE = re.compile("[-]")

# A real title or author always contains a word of three or more letters.
WORD_RE = re.compile(r"[^\W\d_]{3,}", re.UNICODE)

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11,
    "december": 12,
}

# Publisher-ish trailing segments on the author line. Amazon appends the imprint
# after a comma, indistinguishable from a co-author without a list to check.
PUBLISHER_HINTS = re.compile(
    r"\b(ediciones|editorial|editores|publishing|publications|press|books|"
    r"libros|verlag|edizioni|editions|s\.?l\.?|s\.?a\.?|ltd|inc|group|"
    r"maeva|planeta|anagrama|alianza|gredos|debolsillo|penguin|random\s+house)\b",
    re.IGNORECASE,
)


def norm(s: str) -> str:
    """Collapse whitespace and normalise unicode for comparison keys."""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", s)).strip()


def is_debris(s: str) -> bool:
    """True for a line carrying no recoverable content.

    Print-break debris and the pagination strip ('1', '2', '»', '10') are
    short and wordless; a bare year-like number is kept in case a title is one.
    """
    s = s.strip()
    if not s:
        return True
    if WORD_RE.search(s):
        return False
    return not (s.isdigit() and len(s) >= 4)


def parse_date(raw: str) -> str | None:
    """'3 September 2019' -> '2019-09-03'. None if unparseable."""
    m = re.match(r"^(\d{1,2})\s+(\w+)\s+(\d{4})$", raw.strip())
    if not m:
        return None
    day, month_name, year = m.groups()
    month = MONTHS.get(month_name.lower())
    if not month:
        return None
    try:
        return date(int(year), month, int(day)).isoformat()
    except ValueError:
        return None


def split_authors(line: str) -> tuple[list[str], str | None]:
    """Split the author line into authors and a probable publisher.

    Amazon writes 'Author', 'Author A, Author B', or 'Author, Publisher'. Only
    the last comma-separated segment is tested for publisher-ness; a middle
    segment that looks like an imprint is left as an author rather than risk
    dropping a real co-author.
    """
    parts = [p.strip() for p in line.split(",") if p.strip()]
    if not parts:
        return [], None
    publisher = None
    if len(parts) > 1 and PUBLISHER_HINTS.search(parts[-1]):
        publisher = parts[-1]
        parts = parts[:-1]
    return parts, publisher


def line_stream(doc) -> list[tuple[str, bool, int]]:
    """Flatten the document to (text, had_trailing_space, page) tuples.

    Per page the Amazon site footer is dropped and private-use glyphs stripped;
    page breaks are otherwise ignored so that records straddling them survive.
    """
    stream: list[tuple[str, bool, int]] = []
    for page_no, page in enumerate(doc):
        for raw in page.get_text().split("\n"):
            if raw.strip() == FOOTER_START:
                break
            cleaned = PUA_RE.sub("", raw)
            if not cleaned.strip():
                continue
            stream.append((cleaned.strip(), cleaned != cleaned.rstrip(), page_no))
    return stream


def parse_block(block: list[tuple[str, bool, int]]) -> dict | None:
    """Turn one record block into a record, or None if it holds no item."""
    anchor = next(
        (i for i, (text, _, _) in enumerate(block) if ACQUIRED_RE.match(text)), None
    )
    if anchor is None:
        return None
    acquired_raw = ACQUIRED_RE.match(block[anchor][0]).group(1)

    # Content lines before the anchor, with chrome, counts and print debris
    # removed. What remains is [title..., author]. The 'Showing N items' header
    # is skipped rather than treated as a boundary: it prints at the *foot* of a
    # page, so a block straddling the break has its title above it, not below.
    content: list[tuple[str, bool]] = []
    for text, trailing_space, _ in block[:anchor]:
        if SHOWING_RE.match(text):
            continue
        if text in CHROME or text == "READ" or text == "Update available":
            continue
        if COLLECTIONS_RE.match(text) or DEVICES_RE.match(text):
            continue
        if is_debris(text):
            continue
        content.append((text, trailing_space))

    author_line = content[-1][0] if content else ""
    title_parts = content[:-1]
    title = norm(" ".join(t for t, _ in title_parts))
    # PyMuPDF preserves the trailing space the UI leaves when it clips a title.
    title_clipped = bool(title_parts) and title_parts[-1][1]

    read = False
    update_available = False
    collections = devices = None
    for text, _, _ in block[anchor + 1:]:
        if text == "READ":
            read = True
        elif text == "Update available":
            update_available = True
        elif COLLECTIONS_RE.match(text):
            collections = int(COLLECTIONS_RE.match(text).group(1))
        elif DEVICES_RE.match(text):
            devices = int(DEVICES_RE.match(text).group(1))

    authors, publisher = split_authors(author_line)
    return {
        "title_raw": title,
        "title_clipped": title_clipped,
        "authors": authors,
        "publisher": publisher,
        "acquired_on": parse_date(acquired_raw),
        "acquired_on_raw": acquired_raw,
        "read": read,
        "collections": collections,
        "devices": devices,
        "update_available": update_available,
        "source_page": block[anchor][2],
    }


def parse(doc) -> tuple[list[dict], int | None]:
    """Every record in the document, plus the total Amazon claims it holds."""
    stream = line_stream(doc)
    declared_total = next(
        (int(SHOWING_RE.match(t).group(1)) for t, _, _ in stream if SHOWING_RE.match(t)),
        None,
    )

    records: list[dict] = []
    block: list[tuple[str, bool, int]] = []
    for entry in stream:
        if entry[0] == RECORD_END:
            record = parse_block(block)
            if record:
                records.append(record)
            block = []
        else:
            block.append(entry)
    record = parse_block(block)  # a final record with no closing terminator
    if record:
        records.append(record)
    return records, declared_total


def dedupe(records: list[dict]) -> tuple[list[dict], int]:
    """Collapse records repeated across re-captured screens.

    Duplicates keep the most complete copy: an unclipped title and a READ flag
    both beat their absence, since a clipped screen can lose either but never
    invent one.
    """
    by_key: dict[tuple, dict] = {}
    dupes = 0
    for r in records:
        key = (
            norm(r["title_raw"]).casefold(),
            tuple(a.casefold() for a in r["authors"]),
            r["acquired_on"],
        )
        prev = by_key.get(key)
        if prev is None:
            by_key[key] = r
            continue
        dupes += 1
        prev["read"] = prev["read"] or r["read"]
        prev["update_available"] = prev["update_available"] or r["update_available"]
        if prev["collections"] is None:
            prev["collections"] = r["collections"]
        if prev["devices"] is None:
            prev["devices"] = r["devices"]
        if prev["title_clipped"] and not r["title_clipped"]:
            prev["title_raw"], prev["title_clipped"] = r["title_raw"], False
    return list(by_key.values()), dupes


def sort_key(r: dict) -> tuple[str, str]:
    parts = r["authors"][0].split() if r["authors"] else []
    return (parts[-1].casefold() if parts else "￿", r["title_raw"].casefold())


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("pdf", type=Path, help="the Kindle 'Digital Content' print-to-PDF")
    ap.add_argument("-o", "--out", type=Path, required=True, help="where to write the JSON")
    args = ap.parse_args()

    raw, declared_total = parse(fitz.open(args.pdf))
    records, dupes = dedupe(raw)
    records.sort(key=sort_key)

    payload = {
        "source": args.pdf.name,
        "parsed_records": len(records),
        "raw_blocks": len(raw),
        "duplicate_blocks_merged": dupes,
        "amazon_declared_total": declared_total,
        "records": records,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"blocks found      : {len(raw)}  ({dupes} duplicate screens merged)")
    print(f"unique records    : {len(records)}")
    if declared_total:
        print(f"Amazon claims     : {declared_total}   -> delta {len(records) - declared_total:+d}")
    print(f"read              : {sum(1 for r in records if r['read'])}")
    print(f"unparseable dates : {sum(1 for r in records if not r['acquired_on'])}")
    print(f"clipped titles    : {sum(1 for r in records if r['title_clipped'])}")
    print(f"no title parsed   : {sum(1 for r in records if not r['title_raw'])}")
    print(f"no author parsed  : {sum(1 for r in records if not r['authors'])}")
    print(f"written           : {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
