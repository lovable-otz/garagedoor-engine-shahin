#!/usr/bin/env node
/**
 * Rebuild the multi-site gallery index.html for each live output root, from
 * the persistent design registry. Needed because every `--business` CLI run
 * overwrites index.html with a gallery containing only that one business's
 * card - run this after any single-business regeneration to restore the
 * full "all 20 sites" gallery. See CLAUDE.md for which domains live in which
 * output root.
 *
 * Usage: node scripts/rebuild-gallery.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist', '_reports', 'design-registry.json'), 'utf8')).byDomain;

function buildIndex(outDir, siteDirs, title) {
  const cards = siteDirs.map((dirName) => {
    const domain = Object.keys(reg).find((d) => dirName.startsWith(d));
    const d = reg[domain];
    if (!d) return '';
    return `<a class="card" href="./${dirName}/index.html">
      <div class="sw"><span style="background:${d.fingerprint.primary}"></span><span style="background:${d.fingerprint.accent}"></span></div>
      <h3>${d.name}</h3>
      <p>${d.city}, ${d.state} &middot; <code>${d.domain}</code></p>
      <p class="meta"><b>${d.themeName}</b> &middot; ${d.fingerprint.hero} / ${d.fingerprint.nav}</p>
      <p class="meta">uniqueness ${d.score}</p>
    </a>`;
  }).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#0b0f19;color:#e5e7eb}
header{padding:2rem 1.5rem;border-bottom:1px solid #1f2937}h1{margin:0}.sub{color:#9ca3af}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));padding:1.5rem;max-width:1200px;margin:auto}
.card{display:block;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:1.2rem;text-decoration:none;color:inherit;transition:.15s}
.card:hover{border-color:#3b82f6;transform:translateY(-2px)}.card h3{margin:.4rem 0 .2rem}
.card p{margin:.15rem 0;font-size:.85rem;color:#9ca3af}.meta code{color:#93c5fd}
.sw{display:flex;gap:4px;margin-bottom:.4rem}.sw span{width:28px;height:20px;border-radius:4px;display:block}</style>
</head><body><header><h1>${title}</h1><p class="sub">${siteDirs.length} generated sites &middot; click any card to open the site</p></header>
<div class="grid">${cards}</div></body></html>`;
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log('wrote', path.join(outDir, 'index.html'), 'with', siteDirs.length, 'cards');
}

const distDir = path.join(ROOT, 'dist');
const distTop = fs.readdirSync(distDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !['assets', 'generated-sites', '_reports', '_preview-index', 'vercel-deploy'].includes(e.name))
  .map((e) => e.name);
buildIndex(distDir, distTop, 'Garage-Door Sites - Preview');

const last10Dir = path.join(distDir, 'generated-sites', 'last-10-cities');
if (fs.existsSync(last10Dir)) {
  const last10 = fs.readdirSync(last10Dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  buildIndex(last10Dir, last10, 'Garage-Door Sites - Last 10 Cities');
}
