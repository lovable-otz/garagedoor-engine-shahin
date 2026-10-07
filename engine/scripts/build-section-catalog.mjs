#!/usr/bin/env node
/**
 * Section Catalog - internal dev/QA tool, NOT part of the real generation
 * pipeline. Renders every real variant of every section axis, using the
 * ACTUAL engine components + the ACTUAL generated CSS for one real business
 * (Chicopee - richest content: areas, services, guides, faq all present),
 * so what you see here is guaranteed to match what a live site can render -
 * no hand-recreated mockups to drift out of sync with css.js.
 *
 * Output: dist/_section-catalog/ (index.html + assets/img/*, root-relative
 * paths - serve it as its own origin, e.g.:
 *   node scripts/serve.mjs dist/_section-catalog 8950
 *
 * Sample reviews are injected ONLY in this script's in-memory clone of the
 * business object, purely so the reviewCard axis has something to render -
 * never written to the real dataset/registry, never part of a real site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDataset } from '../src/data/load.js';
import { resolveContent } from '../src/content/index.js';
import { assignDesign } from '../src/engine/seed.js';
import { makeContext } from '../src/generator/site.js';
import { generateCss } from '../src/design/css.js';
import { newPage, localImgDestName } from '../src/assets/images.js';
import { SECTION_POOLS, POOLS } from '../src/engine/variation.js';
import * as C from '../src/components/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist', '_section-catalog');

const dataset = loadDataset();
const business = structuredClone(dataset.byDomain['chicopeegaragedoorpros.com']);
// Sample-only, in-memory, never persisted - see file header.
business.reviews = [
  { rating: 5, text: 'Same-day fix on a broken spring, fair price, explained everything before starting.', author: 'Dana R.' },
  { rating: 5, text: 'New opener installed in under two hours. Clean work, no surprises on the bill.', author: 'Marcus T.' },
  { rating: 4, text: 'Good communication, showed up on time, door works great now.', author: 'Priya S.' },
];

const design = assignDesign(business, { forceThemeId: 'premium-dark' });
const content = resolveContent(business);
const ctx = makeContext(business, design, content, new Date().getFullYear());
ctx.design.variants.sectionVariants = ctx.design.variants.sectionVariants || {};

function fresh() {
  newPage(ctx);
  return ctx;
}

const items = []; // { group, label, html }

function renderSection(group, variant, fn) {
  fresh();
  let html;
  try { html = fn(); }
  catch (err) { html = `<div class="catalog-error">Render error for ${group}/${variant}: ${String(err.message || err)}</div>`; }
  items.push({ group, variant, html: html || '<div class="catalog-empty">(empty - no real data for this business/variant combo)</div>' });
}

// ---- Primary style axes ---------------------------------------------------

for (const v of POOLS.hero) {
  ctx.design.variants.hero = v;
  renderSection('hero', v, () => C.hero(ctx));
}
ctx.design.variants.hero = 'split-image-right';

ctx.design.variants.sectionVariants.services = 'grid';
for (const v of POOLS.serviceCard) {
  ctx.design.variants.serviceCard = v;
  renderSection('serviceCard', v, () => C.services(ctx, { noHead: true }));
}
ctx.design.variants.serviceCard = POOLS.serviceCard[0];

for (const v of POOLS.reviewCard) {
  ctx.design.variants.reviewCard = v;
  renderSection('reviewCard', v, () => C.reviews(ctx));
}
ctx.design.variants.reviewCard = POOLS.reviewCard[0];

for (const v of POOLS.gallery) {
  ctx.design.variants.gallery = v;
  renderSection('gallery', v, () => C.gallery(ctx));
}
ctx.design.variants.gallery = POOLS.gallery[0];

for (const v of POOLS.footer) {
  ctx.design.variants.footer = v;
  renderSection('footer', v, () => C.footer(ctx));
}
ctx.design.variants.footer = POOLS.footer[0];

ctx.design.variants.sectionVariants.cta = 'centered';
for (const v of POOLS.ctaStyle) {
  ctx.design.variants.ctaStyle = v;
  renderSection('ctaStyle', v, () => C.cta(ctx));
}
ctx.design.variants.ctaStyle = POOLS.ctaStyle[0];

for (const v of POOLS.nav) {
  ctx.design.variants.nav = v;
  renderSection('nav', v, () => C.header(ctx));
}
ctx.design.variants.nav = POOLS.nav[0];

// ---- Section-layout axes ---------------------------------------------------

const SECTION_FN = {
  services: () => C.services(ctx, { noHead: true }),
  why: () => C.why(ctx),
  process: () => C.process(ctx),
  stats: () => C.stats(ctx),
  trustbar: () => C.trustbar(ctx),
  areas: () => C.areas(ctx),
  cta: () => C.cta(ctx),
  brandbar: () => C.brandBar(ctx),
  ctaBanner: () => C.ctaBanner(ctx),
};

for (const axis of ['services', 'why', 'process', 'stats', 'trustbar', 'areas', 'cta', 'brandbar', 'ctaBanner']) {
  for (const v of SECTION_POOLS[axis]) {
    ctx.design.variants.sectionVariants[axis] = v;
    renderSection(axis, v, SECTION_FN[axis]);
  }
  ctx.design.variants.sectionVariants[axis] = SECTION_POOLS[axis][0];
}

// heroStats only renders on the 3 text-only hero variants (see hero()).
ctx.design.variants.hero = 'fullbleed-dark';
for (const v of SECTION_POOLS.heroStats) {
  ctx.design.variants.sectionVariants.heroStats = v;
  renderSection('heroStats', v, () => C.hero(ctx));
}
ctx.design.variants.hero = 'split-image-right';
ctx.design.variants.sectionVariants.heroStats = SECTION_POOLS.heroStats[0];

for (const v of SECTION_POOLS.faq) {
  ctx.design.variants.sectionVariants.faq = v;
  renderSection('faq', v, () => C.faq(ctx));
}
ctx.design.variants.sectionVariants.faq = SECTION_POOLS.faq[0];

// about: no variant pool (single design), included for
// completeness of "every section type", one render each.
if (content.about) renderSection('about', '(single design)', () => C.about(ctx));
renderSection('emergency', '(single design)', () => C.emergency(ctx));

// Variant keys added in this round, per axis - drives the "NEW" badge so
// the requester can visually confirm which previews are the new work
// without having to diff variation.js by hand. nav keeps 'inline-solid'
// (pre-existing, was already the only live value) unbadged; faq is
// entirely new so every key is badged.
const NEW_KEYS = {
  nav: new Set(['centered-serif', 'minimal-underline', 'floating-pill', 'bordered-frame', 'uppercase-tracked']),
  faq: new Set(SECTION_POOLS.faq),
};

// ---- Assemble: one page per axis (a single ~300-item page pushed the
// Browser pane's compositor past its limit - many pages, each short, is
// both more robust and more usable for browsing than one giant scroll). ---

const GROUP_ORDER = [
  'hero', 'heroStats', 'nav', 'emergency', 'trustbar', 'services', 'serviceCard',
  'process', 'why', 'stats', 'gallery', 'brandbar', 'areas', 'reviews',
  'reviewCard', 'faq', 'ctaBanner', 'cta', 'ctaStyle', 'footer', 'about',
];
const byGroup = new Map();
for (const it of items) {
  if (!byGroup.has(it.group)) byGroup.set(it.group, []);
  byGroup.get(it.group).push(it);
}
const orderedGroups = [...GROUP_ORDER.filter((g) => byGroup.has(g)), ...[...byGroup.keys()].filter((g) => !GROUP_ORDER.includes(g))];

const CHROME_CSS = `
  html{scroll-behavior:smooth}
  body{margin:0}
  .catalog-nav{position:sticky;top:0;z-index:500;background:#111;color:#fff;padding:.8rem 1.2rem;display:flex;flex-wrap:wrap;gap:.4rem 1rem;font:13px/1.4 system-ui,sans-serif;border-bottom:3px solid #444}
  .catalog-nav a{color:#9cf;text-decoration:none;text-transform:capitalize}
  .catalog-nav a.is-current{color:#fff;font-weight:700}
  .catalog-nav a:hover{text-decoration:underline}
  .toc-count{opacity:.6;font-size:.85em}
  .catalog-header{background:#111;color:#fff;padding:1.6rem 1.2rem 1rem;font:15px/1.5 system-ui,sans-serif}
  .catalog-header h1{margin:0 0 .3em;font-size:1.3rem;text-transform:capitalize}
  .catalog-header p{margin:0;opacity:.75;max-width:70ch}
  .catalog-group{padding:1.6rem 1.2rem 3rem}
  .catalog-item{border:2px solid #ddd;border-radius:10px;overflow:hidden;margin-bottom:1.6rem;background:#fff}
  .catalog-item__label{font:600 12px/1 ui-monospace,monospace;background:#f4f4f4;color:#333;padding:.6rem .9rem;border-bottom:2px solid #ddd;text-transform:none;display:flex;align-items:center;gap:.5em}
  .catalog-item__label b{color:#0a5;margin-left:.4em}
  .catalog-item__badge{background:#e0342a;color:#fff;font:800 10px/1 ui-monospace,monospace;letter-spacing:.04em;padding:.28em .55em;border-radius:4px;margin-left:auto}
  .toc-badge{background:#e0342a;color:#fff;font-size:.75em;font-weight:800;padding:.1em .4em;border-radius:3px;margin-left:.35em;vertical-align:1px}
  .catalog-item__frame{overflow-x:auto}
  .catalog-empty,.catalog-error{padding:2rem;font:13px system-ui,sans-serif;color:#999;text-align:center}
  .catalog-error{color:#c00}
  .index-list{list-style:none;margin:0;padding:1.2rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.8rem;font:14px system-ui,sans-serif}
  .index-list a{display:block;padding:1rem 1.2rem;border:1px solid #333;border-radius:8px;color:#fff;text-decoration:none;background:#161616;text-transform:capitalize}
  .index-list a:hover{border-color:#9cf}
  .index-list .toc-count{display:block;margin-top:.3em}
`;

const newCountFor = (g) => (NEW_KEYS[g] ? byGroup.get(g).filter((it) => NEW_KEYS[g].has(it.variant)).length : 0);

const navHtml = (current) => `<nav class="catalog-nav"><a href="index.html"${current ? '' : ' class="is-current"'}>index</a>${orderedGroups.map((g) => `<a href="${g}.html"${g === current ? ' class="is-current"' : ''}>${g} <span class="toc-count">${byGroup.get(g).length}</span>${newCountFor(g) ? `<span class="toc-badge">NEW</span>` : ''}</a>`).join('')}</nav>`;

const page = (title, bodyInner) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} - Section Catalog (${business.name})</title>
<style>${generateCss(design)}</style>
<style>${CHROME_CSS}</style>
</head><body>${bodyInner}</body></html>`;

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const g of orderedGroups) {
  const list = byGroup.get(g);
  const isNew = NEW_KEYS[g] || new Set();
  const cards = list.map((it) => `<div class="catalog-item">
      <div class="catalog-item__label">${g} <b>${it.variant}</b>${isNew.has(it.variant) ? '<span class="catalog-item__badge">NEW</span>' : ''}</div>
      <div class="catalog-item__frame">${it.html}</div>
    </div>`).join('\n');
  const newNote = newCountFor(g) ? ` <strong style="color:#e0342a">${newCountFor(g)} new this round.</strong>` : '';
  const body = `${navHtml(g)}
    <div class="catalog-header"><h1>${g}</h1><p>${list.length} variant${list.length === 1 ? '' : 's'} - rendered with the live engine (${business.name}, ${design.themeName} theme, real content).${newNote}</p></div>
    <div class="catalog-group">${cards}</div>`;
  fs.writeFileSync(path.join(OUT_DIR, `${g}.html`), page(g, body));
}

const indexBody = `${navHtml(null)}
  <div class="catalog-header"><h1>Section catalog - every real variant, every axis</h1>
  <p>${items.length} previews across ${orderedGroups.length} section types, one page per axis. Rendered with the live engine (${business.name}, ${design.themeName} theme, real content) - not a mockup. Sample-only review text is injected for the reviewCard axis (never part of a real generated site).</p></div>
  <ul class="index-list">${orderedGroups.map((g) => `<li><a href="${g}.html">${g}${newCountFor(g) ? `<span class="toc-badge">NEW</span>` : ''}<span class="toc-count">${byGroup.get(g).length} variant${byGroup.get(g).length === 1 ? '' : 's'}</span></a></li>`).join('')}</ul>`;
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), page('Index', indexBody));

if (ctx._localPhotosUsed && ctx._localPhotosUsed.size) {
  const imgDir = path.join(OUT_DIR, 'assets', 'img');
  fs.mkdirSync(imgDir, { recursive: true });
  for (const src of ctx._localPhotosUsed) {
    try { fs.copyFileSync(src, path.join(imgDir, localImgDestName(src))); }
    catch { /* source photo missing - skip, page still has its src attr */ }
  }
}

console.log(`Section catalog: ${items.length} previews, ${orderedGroups.length} groups`);
console.log(`Written to ${OUT_DIR}`);
console.log(`Serve with: node scripts/serve.mjs dist/_section-catalog <port>`);
