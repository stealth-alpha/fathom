import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".pdf": "application/pdf",
};

export function getContentType(file) {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

/**
 * Start a static file server for `dir` bound to `host:port`.
 * Returns the created http.Server (not yet listening).
 */
export function createStaticServer(dir, { host = "127.0.0.1", port = 0 } = {}) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";
      const candidate = path.normalize(path.join(root, urlPath));
      if (!candidate.startsWith(root)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      let file = candidate;
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, "index.html");
      }
      if (!fs.existsSync(file)) {
        // SPA fallback.
        const index = path.join(root, "index.html");
        if (fs.existsSync(index)) {
          serveFile(index, res);
          return;
        }
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      serveFile(file, res);
    } catch {
      res.writeHead(500);
      res.end("Internal error");
    }
  });
  return { server, root };
}

function serveFile(file, res) {
  const stat = fs.statSync(file);
  res.writeHead(200, {
    "Content-Type": getContentType(file),
    "Content-Length": stat.size,
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(file).pipe(res);
}

export function listen(server, { host = "127.0.0.1", port = 0 } = {}) {
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, host, () => {
      resolve(server.address());
    });
  });
}
