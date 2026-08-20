"""The contract between ingesting a source and building the catalog.

Every ingester - store export, photograph, spreadsheet - writes the same
envelope, and the builder reads nothing else. That is what lets the catalog be
built from a photograph alone, a list alone, or any combination: the builder
never learns where a record came from beyond what this file records.

Adding a new kind of source means writing one more ingester that emits this
shape. It means no change to the builder.

    {
      "librapp_source": 1,
      "source": {
        "name":       "kindle",          # unique among the sources you merge
        "kind":       "store-export",    # store-export | photo | table
        "origin":     "kindle.pdf",      # the file it was read from
        "format":     "ebook",           # default for records that name none
        "confidence": "high"             # default confidence for its records
      },
      "records": [ ... ]
    }

`confidence` is the source's claim about itself, and decides who wins when two
sources disagree about the same book. A record may lower its own confidence but
never raise it above the source's:

    high    machine-readable and verifiable - a store export
    medium  transcribed by eye or by model - a photograph, a scanned list
    low     guessed; the entry is a placeholder

A record needs only a title. Everything else is optional, because a photograph
cannot see an acquisition date and a plain list cannot see a cover.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from textmatch import clean

SCHEMA_VERSION = 1

KINDS = {"store-export", "photo", "table"}
FORMATS = {"ebook", "physical", "audio"}
CONFIDENCE = {"high": 3, "medium": 2, "low": 1}

# Every field a record may carry, with the value meaning "not known". A source
# that cannot see a field leaves it out; None always means unknown, never no.
RECORD_FIELDS: dict[str, Any] = {
    "title": "",
    "title_clipped": False,      # the source cut the title off mid-word
    "authors": [],
    "author_label": None,        # stands in where there is no personal author
    "publisher": None,
    "acquired_on": None,         # ISO date
    "read": None,                # True | False | None=unknown
    "series": None,
    "series_index": None,
    "genre": None,
    "keywords": None,
    "collections": None,
    "devices": None,
    "update_available": False,
    "formats": [],               # falls back to the source default
    "confidence": None,          # falls back to the source default
    "location": None,            # where it physically is, for photo sources
    "collapsed": False,          # stands for several volumes, not one book
    "listed_volumes": None,      # their titles, when collapsed
    "flags": [],
    "notes": None,
}


class SourceError(ValueError):
    """A source file that cannot be trusted to mean what it says."""


def normalise(record: dict) -> dict:
    """One record with every field present and defaults filled in."""
    out = {k: (list(v) if isinstance(v, list) else v) for k, v in RECORD_FIELDS.items()}
    unknown = set(record) - set(RECORD_FIELDS)
    if unknown:
        raise SourceError(f"unknown field(s) {sorted(unknown)} in record {record.get('title')!r}")
    out.update(record)

    out["title"] = clean(str(out["title"] or ""))
    out["authors"] = [clean(a) for a in (out["authors"] or []) if clean(a)]
    for key in ("publisher", "genre", "keywords", "series", "location", "notes", "author_label"):
        if out[key]:
            out[key] = clean(str(out[key]))
    out["formats"] = sorted({f for f in (out["formats"] or []) if f})
    unknown_formats = set(out["formats"]) - FORMATS
    if unknown_formats:
        raise SourceError(f"unknown format(s) {sorted(unknown_formats)}")
    if out["confidence"] and out["confidence"] not in CONFIDENCE:
        raise SourceError(f"unknown confidence {out['confidence']!r}")
    return out


def write(
    path: Path,
    *,
    name: str,
    kind: str,
    origin: str,
    format: str,
    confidence: str,
    records: list[dict],
    stats: dict | None = None,
) -> dict:
    """Write a source file, refusing anything the builder could not trust."""
    if kind not in KINDS:
        raise SourceError(f"kind must be one of {sorted(KINDS)}, not {kind!r}")
    if format not in FORMATS:
        raise SourceError(f"format must be one of {sorted(FORMATS)}, not {format!r}")
    if confidence not in CONFIDENCE:
        raise SourceError(f"confidence must be one of {sorted(CONFIDENCE)}, not {confidence!r}")

    normalised = [normalise(r) for r in records]
    untitled = [i for i, r in enumerate(normalised) if not r["title"]]
    if untitled:
        raise SourceError(f"{len(untitled)} record(s) have no title, at index {untitled[:5]}")

    payload = {
        "librapp_source": SCHEMA_VERSION,
        "source": {
            "name": name,
            "kind": kind,
            "origin": origin,
            "format": format,
            "confidence": confidence,
        },
        "stats": stats or {},
        "records": normalised,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def read(path: Path) -> dict:
    """Read a source file, with its records normalised and defaults applied."""
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SourceError(f"{path.name} is not valid JSON: {exc}") from exc

    version = payload.get("librapp_source")
    if version != SCHEMA_VERSION:
        raise SourceError(
            f"{path.name} is not a LibrAPP source file "
            f"(expected librapp_source {SCHEMA_VERSION}, found {version!r})"
        )
    meta = payload.get("source") or {}
    for key in ("name", "kind", "origin", "format", "confidence"):
        if not meta.get(key):
            raise SourceError(f"{path.name} is missing source.{key}")

    records = []
    for record in payload.get("records", []):
        r = normalise(record)
        r["formats"] = r["formats"] or [meta["format"]]
        # A record may lower its own confidence - one illegible spine among
        # many clear ones - but never raise it above its source. However
        # cleanly a model read a photograph, it is still reading a photograph.
        r["confidence"] = min(
            (r["confidence"] or meta["confidence"], meta["confidence"]), key=rank
        )
        r["_source"] = meta["name"]
        records.append(r)

    payload["records"] = records
    return payload


def rank(confidence: str) -> int:
    """How much a source's claim outweighs another's. Higher wins."""
    return CONFIDENCE.get(confidence, 0)
