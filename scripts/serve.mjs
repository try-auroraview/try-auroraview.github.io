import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.drawio': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
export function serve(port = 4173) {
  const root = resolve(import.meta.dirname, '../dist');
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch { res.writeHead(404).end('Not found'); }
  });
  return new Promise((done) => server.listen(port, '127.0.0.1', () => done(server)));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await serve();
  console.log('Website preview: http://127.0.0.1:4173');
}
