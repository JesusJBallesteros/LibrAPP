"""Turn a photograph of a shelf into a source file.

Reading spines is the one step that needs a model rather than a parser, so it
happens in two halves with a file in between:

    python parse_shelf.py tile   sources/shelf/shelf.jpg -o work/tiles
      -> numbered crops, plus tiles.json describing them

    <a model reads the tiles and writes a transcription, guided by
     prompts/ingest-shelf.md>

    python parse_shelf.py import work/spines.json -o data/private/shelf.json
      -> a source file the builder can merge

Splitting it this way keeps the model's output on disk where it can be read,
corrected and re-imported, instead of vanishing into a pipeline. It also means
the transcription can come from anywhere - an agent, an API call, or a person
typing what they see - since the only contract is the JSON in the middle.

Whole-shelf photographs defeat vision models: a spine is a few dozen pixels
wide in a picture scaled to fit a context window. Tiling at native resolution
is what makes the text legible, so `tile` never scales a crop up and only
scales down to the width a model can actually take.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import records as rec
from textmatch import clean

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None

# Wider than this and a model downsamples the tile anyway; narrower and spine
# text stops being legible. Chosen to leave a crop of ~2000px near 1:1.
TILE_WIDTH = 1250

# How much neighbouring tiles overlap, as a fraction. A book on the seam is
# then whole in one of them rather than split down the middle in both.
OVERLAP = 0.12

# Below this a photograph is left whole: a picture this size cannot hold enough
# books to need cutting, and cutting one up does far more harm than good.
WHOLE_BELOW_MEGAPIXELS = 20

# Roughly how many megapixels of original per tile, above that threshold.
MEGAPIXELS_PER_TILE = 6
MAX_TILES = 12


def suggest_grid(width: int, height: int) -> tuple[int, int]:
    """A starting grid for a photograph, to be adjusted by whoever took it.

    There is no way to get this right from the image alone. What decides a good
    tile is how many spines are in it, and that is a fact about the shelf, not
    about the file: 50 megapixels of a full bookcase wants eight tiles, and 12
    megapixels of three books wants one. So this errs towards leaving the
    photograph whole.

    Rows are kept as few as the shape allows, because the two cuts are not
    equally costly. Books stand upright, so a vertical cut crosses a spine's
    width and the overlap covers it, while a horizontal cut runs straight
    through the title and leaves half of it in each tile.
    """
    megapixels = width * height / 1e6
    if megapixels < WHOLE_BELOW_MEGAPIXELS:
        return 1, 1
    wanted = min(MAX_TILES, max(2, round(megapixels / MEGAPIXELS_PER_TILE)))
    rows = max(1, round((wanted / (width / height)) ** 0.5))
    cols = max(1, -(-wanted // rows))
    return cols, rows


def tile(photo: Path, out_dir: Path, cols: int | None = None, rows: int | None = None) -> dict:
    """Cut a photograph into overlapping crops a model can read."""
    if Image is None:
        sys.exit("Pillow is required to tile photographs:  pip install pillow")

    image = Image.open(photo)
    width, height = image.size
    if cols is None or rows is None:
        suggested = suggest_grid(width, height)
        cols = cols if cols is not None else suggested[0]
        rows = rows if rows is not None else suggested[1]
    out_dir.mkdir(parents=True, exist_ok=True)

    step_x, step_y = width / cols, height / rows
    pad_x, pad_y = step_x * OVERLAP, step_y * OVERLAP
    manifest = []

    for row in range(rows):
        for col in range(cols):
            left = max(0, int(col * step_x - pad_x))
            upper = max(0, int(row * step_y - pad_y))
            right = min(width, int((col + 1) * step_x + pad_x))
            lower = min(height, int((row + 1) * step_y + pad_y))
            crop = image.crop((left, upper, right, lower))
            if crop.width > TILE_WIDTH:
                crop = crop.resize(
                    (TILE_WIDTH, round(TILE_WIDTH * crop.height / crop.width)), Image.LANCZOS
                )
            name = f"tile-r{row + 1}c{col + 1}.jpg"
            crop.convert("RGB").save(out_dir / name, quality=92)
            manifest.append({
                "tile": name,
                "row": row + 1,
                "column": col + 1,
                "box": [left, upper, right, lower],
                "size": list(crop.size),
            })

    payload = {
        "photo": photo.name,
        "photo_size": [width, height],
        "grid": {"columns": cols, "rows": rows, "overlap": OVERLAP},
        "tiles": manifest,
    }
    (out_dir / "tiles.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return payload


def load_transcription(path: Path) -> tuple[list[dict], dict]:
    """Validate a transcription and turn it into source records.

    A shelf photograph yields a title, usually an author, sometimes a
    publisher, and nothing else: no acquisition date, no read flag. Saying so
    plainly is the point - a book that appears only here is one the catalog
    knows it cannot date.
    """
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise rec.SourceError(f"{path.name} is not valid JSON: {exc}") from exc

    groups = payload.get("shelves")
    if not isinstance(groups, list) or not groups:
        raise rec.SourceError(
            f"{path.name} has no 'shelves' list. Expected "
            '{"photo": ..., "shelves": [{"location": ..., "books": [...]}]}'
        )

    out: list[dict] = []
    uncertain = 0
    for group in groups:
        location = clean(str(group.get("location") or ""))
        for book in group.get("books") or []:
            title = clean(str(book.get("title") or ""))
            if not title:
                raise rec.SourceError(f"a book on shelf {location!r} has no title")
            confidence = book.get("confidence") or "medium"
            if confidence not in rec.CONFIDENCE:
                raise rec.SourceError(f"unknown confidence {confidence!r} for {title!r}")
            if confidence == "low":
                uncertain += 1
            authors = [clean(str(a)) for a in (book.get("authors") or []) if clean(str(a))]
            out.append({
                "title": title,
                "authors": authors,
                "publisher": clean(str(book["publisher"])) if book.get("publisher") else None,
                "series": clean(str(book["series"])) if book.get("series") else None,
                "series_index": book.get("series_index"),
                "genre": clean(str(book["genre"])) if book.get("genre") else None,
                "keywords": clean(str(book["keywords"])) if book.get("keywords") else None,
                "location": location or None,
                "confidence": confidence,
                "notes": clean(str(book["notes"])) if book.get("notes") else None,
                "flags": ["illegible_spine"] if confidence == "low" else [],
            })

    return out, {
        "photo": payload.get("photo"),
        "shelves": len(groups),
        "uncertain_spines": uncertain,
    }


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = ap.add_subparsers(dest="command", required=True)

    t = sub.add_parser("tile", help="cut a photograph into readable crops")
    t.add_argument("photo", type=Path)
    t.add_argument("-o", "--out", type=Path, required=True, help="directory for the tiles")
    t.add_argument("--columns", type=int, default=None,
                   help="tiles across; chosen from the photograph if omitted")
    t.add_argument("--rows", type=int, default=None,
                   help="tiles down; adding these is what splits a title in half")

    i = sub.add_parser("import", help="turn a transcription into a source file")
    i.add_argument("transcription", type=Path)
    i.add_argument("-o", "--out", type=Path, required=True)
    i.add_argument("--name", default="shelf", help="source name used when merging")
    i.add_argument("--confidence", default="medium", choices=sorted(rec.CONFIDENCE),
                   help="how much to trust this photograph against other sources")

    args = ap.parse_args()

    if args.command == "tile":
        payload = tile(args.photo, args.out, args.columns, args.rows)
        print(f"photo             : {payload['photo']}  {payload['photo_size'][0]}x{payload['photo_size'][1]}")
        print(f"tiles written     : {len(payload['tiles'])} in {args.out}")
        print(f"manifest          : {args.out / 'tiles.json'}")
        print()
        print("Next: read the tiles following prompts/ingest-shelf.md, then run")
        print(f"  python {Path(__file__).name} import <transcription>.json -o data/private/shelf.json")
        return 0

    try:
        found, stats = load_transcription(args.transcription)
        rec.write(
            args.out,
            name=args.name,
            kind="photo",
            origin=str(stats.get("photo") or args.transcription.name),
            format="physical",
            confidence=args.confidence,
            records=found,
            stats=stats,
        )
    except rec.SourceError as exc:
        sys.exit(f"error: {exc}")

    print(f"books read         : {len(found)}")
    print(f"shelves            : {stats['shelves']}")
    print(f"with an author     : {sum(1 for r in found if r['authors'])}")
    print(f"uncertain spines   : {stats['uncertain_spines']}")
    print(f"written            : {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
