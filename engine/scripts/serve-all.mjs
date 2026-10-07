#!/usr/bin/env node
/**
 * Serve every generated site locally, each on its OWN port, plus a card-grid
 * index at the base port. Generated sites use root-absolute links
 * (`/services/...`), which only resolve correctly when a site owns its own
 * origin — so unlike scripts/serve.mjs (one shared origin, referer-routed
 * fallback), this gives every site a dedicated port.
 *
 * Usage: node scripts/serve-all.mjs [basePort]
 *   basePort defaults to 8900 → index on 8900, sites on 8901, 8902, ...
 */
import http from 'node:http';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE_PORT = Number(process.argv[2] || 8900);
/**
 * Optional domain-substring filters: serve ONLY the sites that match.
 *   node scripts/serve-all.mjs 8900 chaska daphne
 * Without any, every registered site is served (the original behaviour).
 * Added 2026-09-01: reviewing a new batch means the shipped sites are just
 * noise on the index, and every one of them is frozen anyway.
 */
const FILTERS = process.argv.slice(3).filter((a) => !a.startsWith('--'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml',
  '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// Every place generated site folders may live.
const SITE_ROOTS = [
  path.join(ROOT, 'dist'),
  path.join(ROOT, 'dist', 'generated-sites', 'last-10-cities'),
];

const registryPath = path.join(ROOT, 'dist', '_reports', 'design-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')).byDomain;

function slug(city) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Registry is the source of truth for "what is a site" (as opposed to
// gallery/report/scratch files that also live under dist/).
const sites = [];
for (const [domain, meta] of Object.entries(registry)) {
  // `<domain>` is the folder name now (matches the repo); older builds are
  // `<domain>-<city>`. Prefer the new name, fall back to the legacy one.
  let dirName = null, dir = null;
  for (const name of [domain, `${domain}-${slug(meta.city)}`]) {
    dir = SITE_ROOTS.map((r) => path.join(r, name)).find((p) => fs.existsSync(path.join(p, 'index.html')));
    if (dir) { dirName = name; break; }
  }
  if (dir) sites.push({ domain, dirName, dir, meta });
}
// Sites rebuilt from another engine's templates (scripts/ruhul-rebuild.mjs) are
// not in our design registry - they carry a .template-rebuild.json marker.
for (const dirName of fs.existsSync(path.join(ROOT, 'dist')) ? fs.readdirSync(path.join(ROOT, 'dist')) : []) {
  const marker = path.join(ROOT, 'dist', dirName, '.template-rebuild.json');
  if (!fs.existsSync(marker) || sites.some((s) => s.dirName === dirName)) continue;
  try {
    const m = JSON.parse(fs.readFileSync(marker, 'utf8'));
    sites.push({ domain: m.domain, dirName, designer: m.designer, dir: path.join(ROOT, 'dist', dirName), meta: {
      domain: m.domain, name: m.name, city: m.city, state: m.state,
      themeName: `${m.designer || 'external'} design (template rebuild)`,
      fingerprint: { primary: '#6b7280', accent: '#9ca3af', hero: 'his hero', nav: 'his nav' },
    } });
  } catch { /* unreadable marker - skip */ }
}
if (FILTERS.length) {
  const before = sites.length;
  const kept = sites.filter((s) => FILTERS.some((f) => s.domain.includes(f)));
  sites.length = 0; sites.push(...kept);
  console.log(`Filtered to ${sites.length} of ${before} site(s): ${FILTERS.join(', ')}`);
}
// Build date per site, so the index can be grouped by the day a batch was
// generated (user request 2026-08-27: "category wise devided date wise").
// The registry carries no per-site timestamp, so use the site's own git
// history - every build commits locally, so the commit dates are the record.
//
// The OLDEST commit, not the newest. This was `log -1` (newest), which meant
// any later one-line fix re-dated the site and moved it into that day's batch:
// Raleigh is a 25 August production site that got a small fix on the 27th and
// was then listed under the 27th alongside the genuinely new sites. The user
// asked for it back in its own batch, and they are right - the grouping is
// meant to answer "which batch is this site from", which a fix never changes.
//
// `--format=%cI` lists newest-first, so the LAST line is the initial commit.
// (`--max-parents=0` would also find a root commit, but returns them in no
// guaranteed order when a repo somehow has more than one.)
function buildDate(site) {
  try {
    const out = execSync('git -C "' + site.dir + '" log --format=%cI', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().split('\n').filter(Boolean);
    if (out.length) return out[out.length - 1].slice(0, 10);
  } catch { /* not a repo yet - fall through */ }
  // Only reachable for a site with no git history at all. mtime DOES move on
  // every regeneration, so this is a weaker signal - it just has nothing
  // better to go on until the site is committed.
  try {
    return fs.statSync(path.join(site.dir, 'index.html')).mtime.toISOString().slice(0, 10);
  } catch { return 'unknown'; }
}
for (const s of sites) s.date = buildDate(s);
// newest batch first, alphabetical within a day
// Ports are ALPHABETICAL by domain (user, 2026-09-14): the date-first order
// reshuffled every port once the sites gained git history and new dates, so
// ports the user had noted no longer matched. Alphabetical keeps them stable.
sites.sort((a, b) => a.domain.localeCompare(b.domain));

function resolveFile(root, urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0]);
  const f = path.join(root, p);
  if (!f.startsWith(root)) return null; // traversal guard
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  const withIndex = path.join(f, 'index.html');
  return fs.existsSync(withIndex) && fs.statSync(withIndex).isFile() ? withIndex : null;
}

// The responsive sweep, exposed on EVERY site port as a same-origin module so
// it can drive that site's own pages through a hidden iframe. Served
// virtually - deliberately NOT copied into any site's output, since it is a
// dev tool and not part of a deliverable site.
const SWEEP = path.join(__dirname, 'responsive-sweep.js');

function serveDir(dir, port, label) {
  http.createServer((req, res) => {
    if (req.url.split('?')[0] === '/__sweep.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      fs.createReadStream(SWEEP).pipe(res);
      return;
    }
    const file = resolveFile(dir, req.url);
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end(`404 ${req.url}`);
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`  ${label.padEnd(40)} http://localhost:${port}`));
}

// Ports are PERSISTED (user, 2026-09-17): each domain keeps the port it was
// first given, recorded in dist/_reports/ports.json, and a newly built site
// takes the next free port. Purely alphabetical ports renumbered every site
// after a new batch sorted in ahead of it (e.g. abilene -> first).
const PORTS_FILE = path.join(ROOT, 'dist', '_reports', 'ports.json');
let portMap = {};
try { portMap = JSON.parse(fs.readFileSync(PORTS_FILE, 'utf8')); } catch { /* first run */ }
if (!Object.keys(portMap).length) {
  // Seed from the alphabetical order the user has been using, but only for the
  // sites that existed before persistence (the 61 on 8901-8961).
  const seeded = sites.filter((s) => s.date <= '2026-09-14').sort((a, b) => a.domain.localeCompare(b.domain));
  seeded.forEach((s, i) => { portMap[s.domain] = BASE_PORT + 1 + i; });
}
let nextPort = Math.max(BASE_PORT, ...Object.values(portMap)) + 1;
for (const s of [...sites].sort((a, b) => a.domain.localeCompare(b.domain))) {
  if (!portMap[s.domain]) portMap[s.domain] = nextPort++;
}
try { fs.writeFileSync(PORTS_FILE, JSON.stringify(portMap, null, 2)); } catch { /* read-only is fine */ }
sites.forEach((s) => {
  s.port = portMap[s.domain];
  serveDir(s.dir, s.port, s.domain);
});
// DISPLAY order is date-wise (newest batch first, alphabetical within a day) -
// user, 2026-09-14 - while each site keeps the alphabetical port assigned above,
// so the grouping changes and the port numbers do not.
sites.sort((a, b) => (b.date === a.date ? a.domain.localeCompare(b.domain) : (a.date < b.date ? 1 : -1)));

/**
 * Does this site's /request-a-quote/ actually embed the real lead form?
 *
 * Read from the BUILT PAGE, not from config/quote-form.js - the point of the
 * badge is to show what a site is really serving, so a site whose config says
 * one thing and whose output says another must show the output. Sites without
 * the embed fall back to the engine's own form, which posts to mailto:/tel:.
 */
const REAL_FORM_HOST = 'api.leadconnectorhq.com';
function usesRealForm(site) {
  try {
    return fs.readFileSync(path.join(site.dir, 'request-a-quote', 'index.html'), 'utf8')
      .includes(REAL_FORM_HOST);
  } catch { return false; }
}

// Manually reviewed by the user and confirmed Production on the assignment
// sheet (2026-09-14). Shown as a green "checked" chip on each card.
const CHECKED = new Set([
  'albuquerquegaragedoorco.com', 'arvadagaragedoorpros.com', 'auburngaragedoorpros.com', 'brightongaragedoorpros.com',
  'brownsvillegaragedoorpros.com', 'burbankgaragedoorpros.com', 'chaskagaragedoorpros.com', 'cheyennegaragedoorpros.com',
  'chicagogaragedoorco.com', 'coloradospringsgaragedoorpros.com', 'dallasdoorpros.com', 'danapointgaragedoorco.com',
  'daphnegaragedoorpros.com', 'duncanvillegaragedoorpros.com', 'fortlauderdalegaragedoorpros.com', 'garlandgaragedoorpros.com',
  'godenvergaragedoor.com', 'hanfordgaragedoorpros.com', 'hesperiagaragedoorpros.com', 'hugogaragedoorpros.com',
  'humblegaragedoorpros.com', 'idahofallsgaragedoorpros.com', 'irvinggaragedoorpros.com', 'jacksonvillegaragedoorco.com',
  'kansascitygaragedoorco.com',
  // Added 2026-09-14 after their fixes deployed and the user re-checked them.
  'lodigaragedoorpros.com', 'madisongaragedoorco.com', 'miamigaragedoorco.com', 'murfreesborogaragedoorco.com',
  // The remaining 16, checked by the user 2026-09-14 with no issues found (nothing to push).
  'kansascitygaragedoorpros.com', 'lascrucesgaragedoorpros.com', 'lincolnwoodgaragedoorpros.com', 'livoniagaragedoorpros.com',
  'longmontgaragedoorpros.com', 'lovelandgaragedoorpros.com', 'manhattanbeachgaragedoorpros.com', 'martinsburggaragedoorpros.com',
  'marysvillegaragedoorpros.com', 'matthewsgaragedoorpros.com', 'mckinneygaragedoorco.com', 'mortongrovegaragedoorpros.com',
  'mundeleingaragedoorpros.com', 'newarkgaragedoorpros.com', 'northbrookgaragedoorpros.com', 'oremgaragedoorpros.com',
]);

function card(s) {
  const d = s.meta;
  const noForm = !usesRealForm(s);
  const checked = CHECKED.has(d.domain);
  // href uses "localhost" as a placeholder; the inline script below rewrites
  // it to location.hostname on load, so the same page works whether opened
  // as localhost:8900 or over the LAN as <lan-ip>:8900 — a hardcoded
  // "localhost" link would otherwise point visiting devices at themselves.
  // The card is a DIV, not one big <a>. It has to hold three separate links
  // (local preview / live domain / repo) and anchors cannot be nested - an
  // <a> inside an <a> is invalid and browsers silently break the inner one.
  // The preview link still covers the whole upper block, so clicking the card
  // body behaves as before.
  return `<div class="card${checked ? ' card--checked' : ' card--todo'}">
      <span class="status ${checked ? 'status--done' : 'status--todo'}">${checked ? '&#10003; Checked' : 'Not checked'}</span>
      <a class="card__open" data-port="${s.port}" href="http://localhost:${s.port}/" target="_blank" rel="noopener">
        <div class="sw"><span style="background:${d.fingerprint.primary}"></span><span style="background:${d.fingerprint.accent}"></span></div>
        <h3>${d.name}${noForm ? '<span class="nf" title="Request-a-quote page uses the built-in fallback form, not the real lead form">no real form</span>' : ''}</h3>
        <p>${d.city}, ${d.state} &middot; <code>${d.domain}</code></p>
        <p class="meta"><b>${d.themeName}</b> &middot; ${d.fingerprint.hero} / ${d.fingerprint.nav}</p>
      </a>
      <div class="card__links">
        <span class="port">port ${s.port}</span>
        <a class="lnk" href="https://${d.domain}" target="_blank" rel="noopener" title="Open the live site">Live site &#8599;</a>
        <a class="lnk lnk--gh" href="https://github.com/OrangeToolzBD/${d.domain}" target="_blank" rel="noopener" title="Open the GitHub repo">GitHub &#8599;</a>
      </div>
    </div>`;
}

const indexHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Garage-Door Sites - Local Index</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#0b0f19;color:#e5e7eb}
header{padding:2rem 1.5rem;border-bottom:1px solid #1f2937}h1{margin:0}.sub{color:#9ca3af}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));padding:1.5rem;max-width:1200px;margin:auto}
.card{display:flex;flex-direction:column;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:1.2rem;color:inherit;transition:.15s}
.card:hover{border-color:#3b82f6;transform:translateY(-2px)}.card h3{margin:.4rem 0 .2rem}
.card__open{display:block;text-decoration:none;color:inherit;flex:1}
.card p{margin:.15rem 0;font-size:.85rem;color:#9ca3af}.meta code{color:#93c5fd}
/* Actions row: port label left, the two external links right. margin-top:auto
   pins it to the bottom so cards of differing text length line up. */
.card__links{display:flex;align-items:center;gap:.5rem;margin-top:auto;padding-top:.8rem}
.card .port{color:#34d399;font-weight:700;font-size:.8rem;margin-right:auto}
.lnk{font-size:.75rem;font-weight:700;text-decoration:none;padding:.3rem .6rem;border-radius:6px;
  border:1px solid #374151;color:#cbd5e1;background:#0f172a;white-space:nowrap;transition:.15s}
.lnk:hover{border-color:#3b82f6;color:#fff;background:#1e293b}
.lnk--gh{border-color:#4b5563}
.batch{margin:2.2rem 0 0}
.batch h2{font-size:1.05rem;font-weight:600;color:#e5e7eb;margin:0 0 .9rem;padding-bottom:.5rem;
  border-bottom:1px solid #1f2937;display:flex;align-items:center;gap:.7rem}
.batch .count{font-size:.8rem;font-weight:400;color:#9ca3af}
.batch .latest{font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:#0b0f19;background:#34d399;padding:.15rem .5rem;border-radius:999px}
.sw{display:flex;gap:4px;margin-bottom:.4rem}.sw span{width:28px;height:20px;border-radius:4px;display:block}
/* Amber, not red: "still on the fallback form" is a to-do, not a failure. */
.card h3 .nf{display:inline-block;margin-left:.5rem;vertical-align:middle;
  font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:#0b0f19;background:#fbbf24;padding:.12rem .45rem;border-radius:999px}
.card h3 .ck{display:inline-block;margin-left:.5rem;vertical-align:middle;
  font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:#0b0f19;background:#34d399;padding:.12rem .45rem;border-radius:999px}
.card:has(.ck){border-color:#065f46}
/* Status label: top-right corner of EVERY card, so checked vs not-checked is
   readable at a glance without reading the title chips. */
.card{position:relative}
.status{position:absolute;top:.9rem;right:.9rem;font-size:.72rem;font-weight:800;letter-spacing:.05em;
  text-transform:uppercase;padding:.25rem .65rem;border-radius:999px;line-height:1.2}
.status--done{background:#34d399;color:#052e1c}
.status--todo{background:transparent;color:#9ca3af;border:1px dashed #4b5563}
.card--checked{border-color:#10b981;box-shadow:inset 4px 0 0 #10b981}
.batch .nfcount{font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:#0b0f19;background:#fbbf24;padding:.15rem .5rem;border-radius:999px}</style>
</head><body><header><h1>Garage-Door Sites</h1><p class="sub" id="sub">${sites.length} sites &middot; each on its own port &middot; click a card to open it in a new tab</p></header>
${(() => {
  // Ruhul's template-rebuilt sites get their own category, shown first (user, 2026-09-17).
  const byDate = new Map();
  for (const s of sites.filter((x) => x.designer === 'Ruhul')) { if (!byDate.has('ruhul')) byDate.set('ruhul', []); byDate.get('ruhul').push(s); }
  for (const s of sites.filter((x) => x.designer !== 'Ruhul')) { if (!byDate.has(s.date)) byDate.set(s.date, []); byDate.get(s.date).push(s); }
  const fmt = (d) => d === 'ruhul' ? "Ruhul's sites (his design)" : d === 'unknown' ? 'Date unknown'
    : new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return [...byDate.entries()].map(([date, group], i) => {
    const noForm = group.filter((s) => !usesRealForm(s)).length;
    return `<section class="batch">
      <h2>${fmt(date)} <span class="count">${group.length} site${group.length > 1 ? 's' : ''}</span>${date !== 'ruhul' && [...byDate.keys()].find((k) => k !== 'ruhul') === date ? '<span class="latest">latest</span>' : ''}${
        noForm ? `<span class="nfcount">${noForm} without real form</span>` : ''}</h2>
      <div class="grid">${group.map(card).join('\n')}</div>
    </section>`;
  }).join('\n');
})()}
<script>
document.querySelectorAll('[data-port]').forEach((el) => {
  el.href = 'http://' + location.hostname + ':' + el.dataset.port + '/';
});
document.getElementById('sub').textContent += ' · viewing from ' + location.hostname;
</script>
</body></html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(indexHtml);
}).listen(BASE_PORT, () => {
  console.log(`\nIndex:  http://localhost:${BASE_PORT}\n`);
  console.log(`Sites (${sites.length}):`);
});
