// A tiny file server for the tests: serves src/ on the port given (default 8767).
// Uses only what comes with Node, so there's nothing to install.
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const port = Number(process.argv[2] || 8767);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".pdf": "application/pdf" };

http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (file.endsWith(path.sep)) file = path.join(file, "index.html");
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  });
}).listen(port, "127.0.0.1");
