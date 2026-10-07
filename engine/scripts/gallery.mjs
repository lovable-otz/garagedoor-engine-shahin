#!/usr/bin/env node
/**
 * Multi-port gallery launcher.
 *
 *   • GALLERY  on the base port (default 8200): a card for every generated site.
 *   • EACH SITE on its own port (base+1, base+2, …): served DIRECTLY at `/`, so
 *     root-absolute links (`/services/…`) work exactly like production.
 *
 * Clicking a card opens that site in a NEW TAB on its own port. One Node
 * process hosts every server; Ctrl-C stops them all.
 *
 * Usage:  node scripts/gallery.mjs [dir] [basePort]     (defaults: dist, 8200)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const BASE_PORT = Number(process.argv[3] || 8200);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml',
  '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

function siteDirs(dir) {
  try {
    return fs.readdirSync(dir).filter((d) => {
      try { return fs.statSync(path.join(dir, d)).isDirectory() && !d.startsWith('_'); }
      catch { return false; }
    }).sort();
  } catch { return []; }
}

function resolveFile(root, urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) return null; // traversal guard
  try { return fs.existsSync(f) && fs.statSync(f).isFile() ? f : null; } catch { return null; }
}

/** Static file server rooted at one site folder, serving at `/`. */
function makeSiteServer(root) {
  return http.createServer((req, res) => {
    let file = resolveFile(root, req.url);
    if (!file) {
      // graceful trailing-slash retry (e.g. /services -> /services/index.html)
      if (!req.url.endsWith('/') && !path.extname(req.url.split('?')[0])) {
        file = resolveFile(root, req.url.split('?')[0] + '/');
      }
    }
    if (!file) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end(`404 ${req.url}`); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

// ---- Load per-site card metadata ------------------------------------------
let registry = { byDomain: {} };
try { registry = JSON.parse(fs.readFileSync(path.join(DIR, '_reports', 'design-registry.json'), 'utf8')); } catch { /* optional */ }

function brandColor(folder) {
  try {
    const html = fs.readFileSync(path.join(DIR, folder, 'index.html'), 'utf8');
    const m = html.match(/--brand:\s*(#[0-9a-fA-F]{3,8})/) || html.match(/--brand-600:\s*(#[0-9a-fA-F]{3,8})/);
    if (m) return m[1];
  } catch { /* ignore */ }
  return '#1D4ED8';
}

function metaFor(folder) {
  const key = Object.keys(registry.byDomain || {}).find((d) => folder.startsWith(d + '-'));
  const r = key ? registry.byDomain[key] : {};
  const domain = key || folder.replace(/-[^-]+$/, '');
  return {
    domain,
    name: r.name || domain,
    city: r.city || '',
    state: r.state || '',
    theme: r.themeName || '',
    score: r.score,
    pages: (() => { try { return fs.readdirSync(path.join(DIR, folder), { recursive: true }).filter((f) => String(f).endsWith('.html')).length; } catch { return null; } })(),
    color: brandColor(folder),
  };
}

// ---- Wire up ports ---------------------------------------------------------
const SITES = siteDirs(DIR).map((folder, i) => ({ folder, port: BASE_PORT + 1 + i, ...metaFor(folder) }));

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'GD';
}

function galleryHtml(reqHost) {
  const host = (reqHost || '').split(':')[0] || 'localhost';
  const cards = SITES.map((s) => {
    const url = `http://${host}:${s.port}/`;
    const loc = [s.city, s.state].filter(Boolean).join(', ');
    return `
    <a class="card" href="${url}" target="_blank" rel="noopener" style="--accent:${s.color}">
      <div class="thumb"><span class="mono">${initials(s.name)}</span></div>
      <div class="body">
        <h2>${s.name}</h2>
        <p class="loc">${loc}</p>
        <p class="dom mono">${s.domain}</p>
        <div class="meta">
          ${s.theme ? `<span class="tag">${s.theme}</span>` : ''}
          ${s.pages != null ? `<span class="tag ghost">${s.pages} pages</span>` : ''}
        </div>
        <div class="open">Open site <span class="mono">:${s.port} ↗</span></div>
      </div>
    </a>`;
  }).join('\n');

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Garage Door Sites — Preview Gallery</title>
<style>
  :root{--bg:#0b1220;--panel:#111a2e;--line:#1f2b45;--txt:#e8eefc;--mut:#93a4c8;}
  *{box-sizing:border-box}
  body{margin:0;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:radial-gradient(1200px 600px at 20% -10%,#16233f,transparent),var(--bg);color:var(--txt);min-height:100vh}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  header{max-width:1100px;margin:0 auto;padding:48px 24px 8px}
  header h1{margin:0 0 6px;font-size:28px;letter-spacing:-.02em}
  header p{margin:0;color:var(--mut)}
  .grid{max-width:1100px;margin:0 auto;padding:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
  .card{display:flex;flex-direction:column;text-decoration:none;color:inherit;background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
  .card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 18px 40px -20px var(--accent)}
  .thumb{height:120px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 55%,#000))}
  .thumb .mono{font-size:34px;font-weight:800;color:#fff;letter-spacing:.04em;text-shadow:0 2px 12px rgba(0,0,0,.35)}
  .body{padding:16px 18px 18px}
  .body h2{margin:0 0 2px;font-size:18px}
  .loc{margin:0;color:var(--mut);font-size:14px}
  .dom{margin:6px 0 12px;color:var(--accent);font-size:13px;word-break:break-all}
  .meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
  .tag{font-size:12px;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--accent) 22%,transparent);border:1px solid color-mix(in srgb,var(--accent) 40%,transparent)}
  .tag.ghost{background:transparent;border-color:var(--line);color:var(--mut)}
  .open{font-size:13px;color:var(--mut);display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:12px}
  .card:hover .open{color:var(--txt)}
  footer{max-width:1100px;margin:0 auto;padding:8px 24px 48px;color:var(--mut);font-size:13px}
</style></head><body>
<header>
  <h1>Garage Door Sites</h1>
  <p>${SITES.length} generated sites · gallery on <span class="mono">:${BASE_PORT}</span> · each card opens its site in a new tab on its own port.</p>
</header>
<main class="grid">
${cards}
</main>
<footer>Static preview. Root-absolute links work because every site is served at its own port root.</footer>
<script>
  document.querySelectorAll('a.card').forEach(a => {
    const port = a.href.split(':')[2]?.replace('/', '');
    if (port) a.href = '//' + window.location.hostname + ':' + port + '/';
  });
</script>
</body></html>`;
}

/** Listen, but on EADDRINUSE warn and keep the process alive instead of crashing. */
function listenSafe(server, port, label) {
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') console.error(`  ⚠ port ${port} in use — ${label} not started (free it or pick another base port)`);
    else console.error(`  ⚠ ${label} error: ${e.message}`);
  });
  server.listen(port);
}

// Gallery server on the base port + one server per site.
const gallery = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(galleryHtml(req.headers.host));
});
gallery.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`  ⚠ gallery port ${BASE_PORT} in use — free it or pass another base port`);
  else console.error(`  ⚠ gallery error: ${e.message}`);
});
gallery.listen(BASE_PORT, () => {
  console.log(`\nGallery:  http://localhost:${BASE_PORT}\n`);
});
for (const s of SITES) {
  listenSafe(makeSiteServer(path.join(DIR, s.folder)), s.port, `${s.name} :${s.port}`);
  console.log(`  :${s.port}  ${s.name}  (${s.folder})`);
}
console.log(`\nOpen the gallery and click a card — each site opens in a new tab.\nCtrl-C to stop all ${SITES.length + 1} servers.\n`);
