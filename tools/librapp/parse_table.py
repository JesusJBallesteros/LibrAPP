"""Read a list of books from a spreadsheet, CSV or XML file.

This is the path for a catalog you already keep by hand, in whatever shape you
kept it. Columns are matched by name in several languages rather than by
position, so a sheet headed `Autor / Título / Género` works as well as
`author / title / genre`.

    python parse_table.py library.xlsx -o data/private/list.json
    python parse_table.py books.csv    -o data/private/list.json
    python parse_table.py catalog.xml  -o data/private/list.json

Rows standing for several volumes at once - a whole series squeezed into one
cell - are marked `collapsed` rather than silently treated as one book. The
builder uses them to label the individual volumes when another source has
them, and keeps them as a single flagged entry when nothing else does.
"""

from __future__ import annotations

import argparse
import csv
import io
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import records as rec
from textmatch import clean, credits_and_label

# Column names understood, in the order they are searched. Lower-case, accents
# already stripped by `header_key`.
COLUMNS: dict[str, tuple[str, ...]] = {
    "title": ("title", "titulo", "titel", "titre", "book", "libro", "obra", "name", "nombre"),
    "authors": ("author", "authors", "autor", "autores", "writer", "by", "verfasser"),
    "genre": ("genre", "genero", "genre/subject", "subject", "categoria", "category", "materia"),
    "keywords": ("keywords", "keyword", "tags", "palabras clave", "temas", "notes", "notas"),
    "series": ("series", "serie", "saga", "collection", "coleccion"),
    "series_index": ("series index", "series_index", "volume", "volumen", "vol", "numero", "n"),
    "publisher": ("publisher", "editorial", "editor", "verlag", "imprint"),
    "acquired_on": ("acquired", "acquired on", "acquired_on", "adquirido", "fecha", "date",
                    "purchased", "comprado"),
    "read": ("read", "leido", "gelesen", "status", "estado"),
    "format": ("format", "formato", "media", "soporte", "source", "fuente", "edition"),
    "location": ("location", "shelf", "estanteria", "ubicacion", "where"),
}

# Words a `read` column may hold, in the languages the sheets tend to use.
TRUE_WORDS = {"y", "yes", "true", "1", "x", "si", "sí", "leido", "leído", "read", "ja", "gelesen"}
FALSE_WORDS = {"n", "no", "false", "0", "", "unread", "pendiente", "nein", "ungelesen"}

# What a format or provenance cell may say. A row can name more than one, which
# is how a hand-kept list records a book owned both on paper and on a device.
FORMAT_WORDS = {
    "ebook": "ebook", "e book": "ebook", "ebooks": "ebook", "kindle": "ebook",
    "digital": "ebook", "epub": "ebook", "mobi": "ebook",
    "physical": "physical", "paper": "physical", "papel": "physical",
    "print": "physical", "impreso": "physical", "shelf": "physical",
    "estanteria": "physical", "hardback": "physical", "paperback": "physical",
    "tapa dura": "physical", "bolsillo": "physical",
    "audio": "audio", "audiobook": "audio", "audiolibro": "audio",
}

# A cell standing for more than one book.
MULTI_VOLUME = re.compile(r"\bvol(?:s|umes|umen|\.)?\b|\btomos?\b", re.IGNORECASE)


def header_key(text: str) -> str:
    import unicodedata

    text = unicodedata.normalize("NFD", str(text or "")).casefold()
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]+", " ", text).strip()


def map_columns(headers: list[str]) -> dict[str, int]:
    """Which column holds which field. Unrecognised columns are ignored."""
    keys = [header_key(h) for h in headers]
    mapping: dict[str, int] = {}
    for field, names in COLUMNS.items():
        for i, key in enumerate(keys):
            if key in names and field not in mapping:
                mapping[field] = i
    return mapping


def parse_read(value: str) -> bool | None:
    """A read column is three-valued; an empty cell means nobody said."""
    word = header_key(value)
    if word in TRUE_WORDS:
        return True
    if word in FALSE_WORDS:
        return None if word == "" else False
    return None


def parse_date(value: str) -> str | None:
    value = str(value or "").strip()
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", value)
    if m:
        return "-".join(m.groups())
    m = re.match(r"^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$", value)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{int(mo):02d}-{int(d):02d}"
    return None


def parse_formats(value: str) -> list[str]:
    """Which formats a cell names, if any.

    Handles a provenance column as well as a format one: a list that records
    where a book came from ('shelf', 'kindle', 'shelf,kindle') is saying what
    it owns and in what form.
    """
    found = []
    for part in re.split(r"[,;/+&]| and ", str(value or "")):
        word = FORMAT_WORDS.get(header_key(part))
        if word and word not in found:
            found.append(word)
    return found


def is_collapsed(title: str, series_index: str | None) -> bool:
    """A row standing for several volumes rather than one book.

    Two slashes means a list of titles ('La Tierra Larga / La Guerra Larga /
    El Marte Largo'); one means an alternative name for a single book
    ('Historia de los visigodos / Los visigodos'), which is not collapsed.
    """
    if series_index:
        return False  # a numbered volume is one book, however it is worded
    return bool(
        MULTI_VOLUME.search(title)
        or title.count(";") >= 1
        or title.count("/") >= 2
        or len(title) > 150
    )


# --------------------------------------------------------------------------- #
# Readers
# --------------------------------------------------------------------------- #

def read_csv(path: Path) -> list[list[str]]:
    text = path.read_text(encoding="utf-8-sig")
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    return [row for row in csv.reader(io.StringIO(text), dialect) if any(c.strip() for c in row)]


def read_xlsx(path: Path, sheet: str | None = None) -> list[list[str]]:
    """Read the first worksheet without a spreadsheet library.

    An xlsx is a zip of XML; the few parts needed here are small enough that
    depending on openpyxl only to read a flat table is not worth it.
    """
    ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
    with zipfile.ZipFile(path) as z:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall(f"{ns}si"):
                shared.append("".join(t.text or "" for t in si.iter(f"{ns}t")))

        names = [n for n in z.namelist() if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", n)]
        if not names:
            raise rec.SourceError(f"{path.name} contains no worksheet")
        names.sort()
        titles = [t.get("name", "") for t in
                  ET.fromstring(z.read("xl/workbook.xml")).iter(f"{ns}sheet")]
        chosen = names[0]
        if sheet and sheet.lower() != "all":
            matches = [n for n, t in zip(names, titles) if header_key(t) == header_key(sheet)]
            if not matches:
                raise rec.SourceError(f"{path.name} has no sheet {sheet!r}; it has {titles}")
            chosen = matches[0]
        root = ET.fromstring(z.read(chosen))

    rows: list[list[str]] = []
    for row in root.iter(f"{ns}row"):
        cells: dict[int, str] = {}
        for cell in row.findall(f"{ns}c"):
            ref = cell.get("r") or ""
            col = 0
            for ch in re.match(r"[A-Z]*", ref).group(0):
                col = col * 26 + (ord(ch) - 64)
            value_node = cell.find(f"{ns}v")
            text = value_node.text if value_node is not None else None
            if cell.get("t") == "s" and text is not None:
                text = shared[int(text)]
            elif cell.get("t") == "inlineStr":
                text = "".join(t.text or "" for t in cell.iter(f"{ns}t"))
            cells[col - 1] = text or ""
        if cells:
            width = max(cells) + 1
            rows.append([cells.get(i, "") for i in range(width)])
    return [r for r in rows if any(c.strip() for c in r)]


def read_xml(path: Path) -> list[dict]:
    """Read a nested XML catalog, using child element names as columns.

    A file may hold more than one list - books owned beside books merely
    wanted - so each row remembers the named group it came from, and the
    caller decides which groups to keep.
    """
    root = ET.parse(path).getroot()
    out: list[dict] = []

    def walk(node, section: str | None) -> None:
        section = node.get("name") or node.get("id") or section
        for child in node:
            if child.tag.lower() in {"book", "item", "entry", "record"} and len(child):
                row = {header_key(gc.tag): clean(gc.text or "") for gc in child}
                for key, value in (child.attrib or {}).items():
                    row.setdefault(header_key(key), clean(value))
                row["_section"] = section
                out.append(row)
            else:
                walk(child, section)

    walk(root, None)
    return out


# --------------------------------------------------------------------------- #

def rows_to_records(rows: list[dict], section: str | None = None) -> list[dict]:
    """Turn already-keyed rows into source records, optionally one group only."""
    field_for = {name: field for field, names in COLUMNS.items() for name in names}
    out: list[dict] = []
    for row in rows:
        if section and header_key(row.get("_section") or "") != header_key(section):
            continue
        picked: dict[str, str] = {}
        for key, value in row.items():
            field = field_for.get(key)
            if field and value and field not in picked:
                picked[field] = value
        title = clean(picked.get("title", ""))
        if not title:
            continue

        authors, label = credits_and_label(picked.get("authors", ""))
        index_raw = picked.get("series_index", "")
        collapsed = is_collapsed(title, index_raw)
        record = {
            "title": title,
            "authors": authors,
            "genre": picked.get("genre") or None,
            "keywords": picked.get("keywords") or None,
            "series": picked.get("series") or None,
            "series_index": int(index_raw) if str(index_raw).strip().isdigit() else None,
            "publisher": picked.get("publisher") or None,
            "acquired_on": parse_date(picked.get("acquired_on", "")),
            "read": parse_read(picked.get("read", "")),
            "location": picked.get("location") or None,
            "collapsed": collapsed,
            "notes": label,
        }
        if collapsed:
            record["listed_volumes"] = title
        record["formats"] = parse_formats(picked.get("format", ""))
        out.append(record)
    return out


def load(path: Path, section: str | None = None) -> list[dict]:
    suffix = path.suffix.lower()
    if suffix == ".xml":
        rows = read_xml(path)
        groups = sorted({r.get("_section") or "" for r in rows})
        if section and header_key(section) not in {header_key(g) for g in groups}:
            raise rec.SourceError(f"{path.name} has no section {section!r}; it has {groups}")
        if not section and len(groups) > 1:
            raise rec.SourceError(
                f"{path.name} holds several lists: {groups}. "
                f"Choose one with --section, or pass --section all to take every row"
            )
        return rows_to_records(rows, None if (section or "").lower() == "all" else section)

    if suffix in {".csv", ".tsv", ".txt"}:
        table = read_csv(path)
    elif suffix in {".xlsx", ".xlsm"}:
        table = read_xlsx(path, section)
    else:
        raise rec.SourceError(f"cannot read {suffix or 'a file with no extension'}")

    if not table:
        raise rec.SourceError(f"{path.name} is empty")
    mapping = map_columns(table[0])
    if "title" not in mapping:
        raise rec.SourceError(
            f"{path.name}: no title column found. Headers were {table[0]!r}; "
            f"name one of them {COLUMNS['title']}"
        )
    keyed = [
        {header_key(table[0][i]): row[i] for i in range(min(len(row), len(table[0])))}
        for row in table[1:]
    ]
    return rows_to_records(keyed)


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("table", type=Path, help="an .xlsx, .csv, .tsv or .xml list of books")
    ap.add_argument("-o", "--out", type=Path, required=True)
    ap.add_argument("--name", default="list", help="source name used when merging")
    ap.add_argument("--section", help="worksheet, or named list within an XML file")
    ap.add_argument("--format", default="physical", choices=sorted(rec.FORMATS),
                    help="what these books are, when the file does not say")
    ap.add_argument("--confidence", default="medium", choices=sorted(rec.CONFIDENCE),
                    help="how much to trust this list against other sources")
    args = ap.parse_args()

    try:
        found = load(args.table, args.section)
        rec.write(
            args.out,
            name=args.name,
            kind="table",
            origin=args.table.name,
            format=args.format,
            confidence=args.confidence,
            records=found,
            stats={"rows": len(found)},
        )
    except (rec.SourceError, ET.ParseError, zipfile.BadZipFile) as exc:
        sys.exit(f"error: {exc}")

    collapsed = sum(1 for r in found if r["collapsed"])
    print(f"rows read         : {len(found)}")
    print(f"with an author    : {sum(1 for r in found if r['authors'])}")
    print(f"with a genre      : {sum(1 for r in found if r['genre'])}")
    print(f"multi-volume rows : {collapsed}")
    print(f"written           : {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
