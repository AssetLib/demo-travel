"""Loopback-only static preview, including the two client-side Expo routes."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import os


class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path in ("/", "/travel", "/travel/", "/tasks", "/tasks/", "/connect", "/connect/"):
            self.path = "/index.html"
        return super().do_GET()


if __name__ == "__main__":
    directory = Path(__file__).resolve().parent.parent / "dist"
    if not (directory / "index.html").exists():
        raise SystemExit("Run npm run export:web first.")
    port = int(os.environ.get("ASSETLIB_PREVIEW_PORT", "4176"))
    if not 1024 <= port <= 65535:
        raise SystemExit("ASSETLIB_PREVIEW_PORT must be between 1024 and 65535.")
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(PreviewHandler, directory=str(directory)))
    print(f"Mobile Lab preview: http://127.0.0.1:{port}", flush=True)
    server.serve_forever()
