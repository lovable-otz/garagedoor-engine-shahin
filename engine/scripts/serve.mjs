#!/usr/bin/env node
/**
 * Preview server for the generated output.
 *
 * Generated sites use ROOT-ABSOLUTE links (e.g. `/services/repair/`) because
 * each deploys to its own domain root. This server makes local previewing work
 * two ways:
 *
 *   • SINGLE SITE  — if the output dir contains exactly one site folder, it is
 *     served DIRECTLY at `/`. So http://localhost:PORT/ is the site's home and
 *     http://localhost:PORT/services/garage-door-repair/ just works.
 *
 *   • MANY SITES   — otherwise the gallery index is at `/` and each site lives
 *     under /<domain>/ (older builds: /<domain>-<city>/). Clicking an internal link is routed into the
 *     originating site via the Referer header.
 *
 * Usage:  node scripts/serve.mjs [dir] [port]   (defaults: dist, 8202)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const PORT = Number(process.argv[3] || 8202);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml',
  '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

function siteDirs(dir) {
  try {
    return fs.readdirSync(dir).filter((d) => {
      try { return fs.statSync(path.join(dir, d)).isDirectory() && !d.startsWith('_'); }
      catch { return false; }
    });
  } catch { return []; }
}

// If there's exactly one site, serve it at the root directly.
const SITES = siteDirs(DIR);
const SINGLE = SITES.length === 1 ? SITES[0] : null;
const ROOT = SINGLE ? path.join(DIR, SINGLE) : DIR;

function resolveFile(root, urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) return null; // traversal guard
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  // Extensionless path with no trailing slash -> that directory's index.html.
  // Content-declared service URLs are authored WITHOUT a trailing slash
  // (/garage-door-repair-parsippany-nj) while the file is still written to
  // <path>/index.html, so without this the site's nine most important pages
  // 404 in local preview even though the production host resolves them.
  if (!path.extname(p)) {
    const idx = path.join(f, 'index.html');
    if (idx.startsWith(root) && fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
  }
  return null;
}

function refererSite(ref) {
  if (!ref) return null;
  try {
    const seg = new URL(ref).pathname.replace(/^\/+/, '').split('/')[0];
    if (seg && SITES.includes(seg)) return seg;
  } catch { /* ignore */ }
  return null;
}

http.createServer((req, res) => {
  let file = resolveFile(ROOT, req.url);

  // Multi-site fallback: route the absolute link into the site it came from.
  if (!file && !SINGLE) {
    const site = refererSite(req.headers.referer);
    if (site) file = resolveFile(DIR, `/${site}${req.url}`);
  }

  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end(`404 ${req.url}`);
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  if (SINGLE) {
    console.log(`Preview server: http://localhost:${PORT}  →  serving ${SINGLE} at /`);
  } else {
    console.log(`Preview server: http://localhost:${PORT}  →  gallery of ${SITES.length} sites`);
    if (SITES[0]) console.log(`  e.g. http://localhost:${PORT}/${SITES[0]}/`);
  }
});
