"""The local server behind the LibrAPP window.

    python tools/librapp/serve.py

A browser cannot read your disk or run the ingesters, so something has to sit
between the two. This is that, and no more than that: it binds to localhost
only, speaks to nothing on the network, and every file it touches is under this
project. Closing it stops the app.

It uses nothing outside the standard library. The catalog is a few hundred
books; a web framework and its dependency tree would cost more upkeep than the
whole program is worth, and this has to still run in five years.

Uploads arrive as a raw request body with the filename in the query string
rather than as multipart forms, which keeps the parsing here to nothing.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import shutil
import sys
import traceback
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))

import build_catalog
import parse_shelf
import parse_table
import records as rec
import query as query_mod

SOURCES_DIR = ROOT / "sources"
PRIVATE_DIR = ROOT / "data" / "private"
TILES_DIR = PRIVATE_DIR / "tiles"
PROMPTS_DIR = ROOT / "prompts"
WEB_DIST = ROOT / "web" / "dist"
CATALOG = PRIVATE_DIR / "catalog.json"

# Uploads are written under sources/, so a name that climbs out of it must
# never survive. Only the final component of whatever the browser sent is kept.
def safe_name(raw: str) -> str:
    name = Path(unquote(raw or "")).name
    name = "".join(c for c in name if c.isalnum() or c in " ._-()").strip()
    return name or "upload"


def source_files() -> list[Path]:
    """Every source file currently feeding the catalog."""
    return sorted(p for p in PRIVATE_DIR.glob("*.json")
                  if p.name not in {"catalog.json"} and _is_source(p))


def _is_source(path: Path) -> bool:
    try:
        with path.open(encoding="utf-8") as fh:
            head = fh.read(200)
        return '"librapp_source"' in head
    except OSError:
        return False


def rebuild() -> dict:
    """Rebuild the catalog from every source file present."""
    paths = source_files()
    if not paths:
        raise rec.SourceError("no sources yet - add a photograph, a list or an export first")
    sources = [rec.read(p) for p in paths]
    catalog = build_catalog.build(sources)
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    return catalog


def state() -> dict:
    """What the app needs to know on load: what exists and what is missing."""
    sources = []
    for path in source_files():
        try:
            payload = rec.read(path)
        except rec.SourceError as exc:
            sources.append({"file": path.name, "error": str(exc)})
            continue
        meta = payload["source"]
        sources.append({
            "file": path.name,
            "name": meta["name"],
            "kind": meta["kind"],
            "origin": meta["origin"],
            "format": meta["format"],
            "confidence": meta["confidence"],
            "records": len(payload["records"]),
            "stats": payload.get("stats", {}),
        })

    catalog_meta = None
    if CATALOG.exists():
        try:
            catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
            catalog_meta = {
                "generated_at": catalog.get("generated_at"),
                "counts": catalog.get("counts"),
            }
        except json.JSONDecodeError:
            catalog_meta = None

    return {
        "sources": sources,
        "catalog": catalog_meta,
        "prompts": sorted(p.name for p in PROMPTS_DIR.glob("*.md")) if PROMPTS_DIR.exists() else [],
        "root": str(ROOT),
    }


# --------------------------------------------------------------------------- #
# Ingest
# --------------------------------------------------------------------------- #

def ingest_photo(body: bytes, filename: str) -> dict:
    """Save a photograph and cut it into tiles a model can read."""
    shelf_dir = SOURCES_DIR / "shelf"
    shelf_dir.mkdir(parents=True, exist_ok=True)
    photo = shelf_dir / safe_name(filename)
    photo.write_bytes(body)

    out = TILES_DIR / photo.stem
    if out.exists():
        shutil.rmtree(out)
    manifest = parse_shelf.tile(photo, out, cols=4, rows=2)
    manifest["tiles_dir"] = str(out)
    manifest["stem"] = photo.stem
    manifest["prompt"] = (PROMPTS_DIR / "ingest-shelf.md").read_text(encoding="utf-8") \
        if (PROMPTS_DIR / "ingest-shelf.md").exists() else ""
    manifest["command"] = (
        f"python tools/librapp/parse_shelf.py import "
        f"{out.relative_to(ROOT).as_posix()}/spines.json -o data/private/shelf.json"
    )
    return manifest


def ingest_transcription(body: bytes, filename: str, name: str, confidence: str) -> dict:
    """Import a spine transcription written against prompts/ingest-shelf.md."""
    staged = TILES_DIR / safe_name(filename or "spines.json")
    staged.parent.mkdir(parents=True, exist_ok=True)
    staged.write_bytes(body)
    found, stats = parse_shelf.load_transcription(staged)
    out = PRIVATE_DIR / f"{safe_name(name) or 'shelf'}.json"
    rec.write(out, name=name, kind="photo",
              origin=str(stats.get("photo") or staged.name),
              format="physical", confidence=confidence, records=found, stats=stats)
    return {"file": out.name, "records": len(found), "stats": stats}


def probe_list(body: bytes, filename: str) -> dict:
    """What a list file contains, before committing to importing it.

    A file may hold several lists - books owned beside books merely wanted -
    and importing the wrong one silently is exactly the mistake worth one extra
    question.
    """
    staged = PRIVATE_DIR / "uploads" / safe_name(filename)
    staged.parent.mkdir(parents=True, exist_ok=True)
    staged.write_bytes(body)

    sections: list[str] = []
    suffix = staged.suffix.lower()
    try:
        if suffix == ".xml":
            rows = parse_table.read_xml(staged)
            sections = sorted({r.get("_section") or "" for r in rows if r.get("_section")})
        elif suffix in {".xlsx", ".xlsm"}:
            import xml.etree.ElementTree as ET
            import zipfile

            ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
            with zipfile.ZipFile(staged) as z:
                sections = [t.get("name", "") for t in
                            ET.fromstring(z.read("xl/workbook.xml")).iter(f"{ns}sheet")]
    except Exception as exc:  # a malformed upload should explain itself
        raise rec.SourceError(f"could not read {staged.name}: {exc}") from exc

    return {"staged": staged.name, "sections": [s for s in sections if s], "suffix": suffix}


def ingest_list(staged_name: str, name: str, section: str | None,
                fmt: str, confidence: str) -> dict:
    staged = PRIVATE_DIR / "uploads" / safe_name(staged_name)
    if not staged.exists():
        raise rec.SourceError(f"{staged_name} is no longer staged; upload it again")
    found = parse_table.load(staged, section or None)
    out = PRIVATE_DIR / f"{safe_name(name) or 'list'}.json"
    rec.write(out, name=name, kind="table", origin=staged.name,
              format=fmt, confidence=confidence, records=found,
              stats={"rows": len(found), "section": section})
    return {"file": out.name, "records": len(found)}


def ingest_export(body: bytes, filename: str, name: str) -> dict:
    """Import a store export PDF."""
    try:
        import fitz
    except ImportError:
        raise rec.SourceError("PyMuPDF is needed to read a PDF export: pip install pymupdf")
    import parse_kindle

    staged = SOURCES_DIR / safe_name(filename)
    staged.parent.mkdir(parents=True, exist_ok=True)
    staged.write_bytes(body)

    raw, declared = parse_kindle.parse(fitz.open(staged))
    parsed, dupes = parse_kindle.dedupe(raw)
    found = [{
        "title": r["title_raw"], "title_clipped": r["title_clipped"], "authors": r["authors"],
        "publisher": r["publisher"], "acquired_on": r["acquired_on"], "read": r["read"],
        "collections": r["collections"], "devices": r["devices"],
        "update_available": r["update_available"],
    } for r in parsed]
    out = PRIVATE_DIR / f"{safe_name(name) or 'export'}.json"
    stats = {"parsed_records": len(found), "declared_total": declared,
             "duplicate_blocks_merged": dupes}
    rec.write(out, name=name, kind="store-export", origin=staged.name,
              format="ebook", confidence="high", records=found, stats=stats)
    return {"file": out.name, "records": len(found), "stats": stats}


# --------------------------------------------------------------------------- #

class Handler(BaseHTTPRequestHandler):
    server_version = "LibrAPP"

    def log_message(self, fmt, *args):  # quieter than the default
        if "/api/" in (args[0] if args else ""):
            sys.stderr.write(f"  {datetime.now(timezone.utc):%H:%M:%S}  {args[0]}\n")

    # -- helpers ----------------------------------------------------------- #

    def _send(self, code: int, payload, content_type="application/json"):
        # Already-encoded bytes pass straight through, whatever the type says:
        # the catalog is served as the JSON file on disk rather than being
        # parsed and re-serialised on every request.
        if isinstance(payload, bytes):
            body = payload
        elif content_type == "application/json":
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        else:
            body = str(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _fail(self, code: int, message: str):
        self._send(code, {"error": message})

    def _body(self) -> bytes:
        length = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(length) if length else b""

    def _query(self) -> dict:
        return {k: v[0] for k, v in parse_qs(urlparse(self.path).query).items()}

    # -- routes ------------------------------------------------------------ #

    def do_GET(self):
        route = urlparse(self.path).path
        try:
            if route == "/api/state":
                return self._send(200, state())
            if route == "/api/catalog":
                if not CATALOG.exists():
                    return self._fail(404, "no catalog built yet")
                return self._send(200, CATALOG.read_bytes(), "application/json")
            if route == "/api/context":
                return self._send(200, {"markdown": reader_context()})
            if route.startswith("/api/prompt/"):
                path = PROMPTS_DIR / safe_name(route[len("/api/prompt/"):])
                if not path.exists():
                    return self._fail(404, f"no prompt named {path.name}")
                return self._send(200, {"name": path.name,
                                        "markdown": path.read_text(encoding="utf-8")})
            if route.startswith("/api/tile/"):
                return self._serve_tile(route[len("/api/tile/"):])
            if route.startswith("/api/"):
                return self._fail(404, f"no such endpoint: {route}")
            return self._serve_static(route)
        except rec.SourceError as exc:
            return self._fail(400, str(exc))
        except Exception as exc:
            traceback.print_exc()
            return self._fail(500, f"{type(exc).__name__}: {exc}")

    def do_POST(self):
        route = urlparse(self.path).path
        q = self._query()
        try:
            if route == "/api/upload/photo":
                return self._send(200, ingest_photo(self._body(), q.get("filename", "shelf.jpg")))
            if route == "/api/upload/transcription":
                return self._send(200, ingest_transcription(
                    self._body(), q.get("filename", "spines.json"),
                    q.get("name", "shelf"), q.get("confidence", "medium")))
            if route == "/api/probe/list":
                return self._send(200, probe_list(self._body(), q.get("filename", "list.csv")))
            if route == "/api/upload/list":
                return self._send(200, ingest_list(
                    q.get("staged", ""), q.get("name", "list"), q.get("section"),
                    q.get("format", "physical"), q.get("confidence", "medium")))
            if route == "/api/upload/export":
                return self._send(200, ingest_export(
                    self._body(), q.get("filename", "export.pdf"), q.get("name", "export")))
            if route == "/api/rebuild":
                catalog = rebuild()
                return self._send(200, {"counts": catalog["counts"],
                                        "review": catalog["review"],
                                        "generated_at": catalog["generated_at"]})
            if route == "/api/source/delete":
                target = PRIVATE_DIR / safe_name(q.get("file", ""))
                if not target.exists() or not _is_source(target):
                    return self._fail(404, "no such source")
                target.unlink()
                return self._send(200, {"removed": target.name})
            return self._fail(404, f"no such endpoint: {route}")
        except rec.SourceError as exc:
            return self._fail(400, str(exc))
        except Exception as exc:
            traceback.print_exc()
            return self._fail(500, f"{type(exc).__name__}: {exc}")

    # -- static ------------------------------------------------------------ #

    def _serve_tile(self, rest: str):
        parts = [safe_name(p) for p in rest.split("/") if p]
        if len(parts) != 2:
            return self._fail(400, "expected /api/tile/<photo>/<file>")
        path = TILES_DIR / parts[0] / parts[1]
        if not path.exists():
            return self._fail(404, "no such tile")
        kind, _ = mimetypes.guess_type(path.name)
        return self._send(200, path.read_bytes(), kind or "application/octet-stream")

    def _serve_static(self, route: str):
        if not WEB_DIST.exists():
            return self._send(200, NO_BUILD_PAGE, "text/html; charset=utf-8")
        rel = route.lstrip("/") or "index.html"
        path = (WEB_DIST / rel).resolve()
        if not str(path).startswith(str(WEB_DIST.resolve())) or not path.is_file():
            path = WEB_DIST / "index.html"  # single-page app: unknown routes are its own
        kind, _ = mimetypes.guess_type(path.name)
        return self._send(200, path.read_bytes(), kind or "application/octet-stream")


def reader_context() -> str:
    """The reader profile, captured as text rather than printed."""
    import io
    from contextlib import redirect_stdout

    if not CATALOG.exists():
        raise rec.SourceError("no catalog built yet")
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    args = argparse.Namespace(recent_years=2)
    buffer = io.StringIO()
    with redirect_stdout(buffer):
        query_mod.cmd_context(catalog, args)
    return buffer.getvalue()


NO_BUILD_PAGE = """<!doctype html><meta charset="utf-8">
<title>LibrAPP</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:34rem;margin:12vh auto;padding:0 1.5rem}
code{background:#eee;padding:.15em .4em;border-radius:.25em}</style>
<h1>LibrAPP</h1>
<p>The server is running, but the interface has not been built yet.</p>
<pre><code>cd web
npm install
npm run build</code></pre>
<p>Then reload this page. While working on the interface itself, run
<code>npm run dev</code> instead and use the address it prints.</p>
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--host", default="127.0.0.1",
                    help="localhost by default; changing it exposes your catalog")
    args = ap.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    where = f"http://{args.host}:{args.port}"
    print(f"LibrAPP is at  {where}")
    print(f"serving from   {ROOT}")
    print(f"interface      {'web/dist' if WEB_DIST.exists() else 'NOT BUILT - see the page'}")
    print("Ctrl-C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
