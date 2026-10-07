#!/usr/bin/env node
/**
 * Static QA sweep over generated sites.
 *
 * Checks the things that are decidable from the built output alone, across
 * EVERY page of every site named on the command line (or every site in dist):
 *
 *   1. broken images     - every <img src> resolves to a real file on disk
 *   2. duplicate images  - the same photo used twice on one page
 *   3. dead links        - every internal href resolves to a real page
 *   4. missing alt text  - an <img> with no alt is a real a11y defect
 *
 * Responsiveness is deliberately NOT here - it needs a real layout engine, so
 * it runs in the browser (see the responsive sweep in CLAUDE.md).
 *
 *   node scripts/qa-sites.mjs                    # every site in dist/
 *   node scripts/qa-sites.mjs parma searcy       # substring match
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `--dist <dir>` points the sweep at a build OUTSIDE dist/ - the only way to
// QA a scratch build without writing into dist/, which holds the frozen sites.
const argv = process.argv.slice(2);
const distFlag = argv.indexOf('--dist');
const DIST = distFlag >= 0 && argv[distFlag + 1]
  ? path.resolve(argv[distFlag + 1])
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** Strip the inlined <style> block - it mentions class names and urls that are
 *  not page content and would otherwise be parsed as markup. */
const strip = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '');

function resolveLocal(siteRoot, href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return path.join(siteRoot, 'index.html');
  const rel = clean.replace(/^\//, '');
  const direct = path.join(siteRoot, rel);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  const asDir = path.join(siteRoot, rel, 'index.html');
  if (fs.existsSync(asDir)) return asDir;
  return null;
}

const filters = argv.filter((a, i) => a !== '--dist' && argv[i - 1] !== '--dist');
const sites = fs.readdirSync(DIST)
  .filter((d) => /^(?!.*\.(html?|json|md|xml|txt|m?js|css|csv)$)[a-z0-9-]+\.[a-z]{2,}(-[a-z0-9-]+)?$/.test(d) && fs.existsSync(path.join(DIST, d, 'index.html')))
  .filter((d) => !filters.length || filters.some((f) => d.includes(f)));

const report = [];
for (const site of sites) {
  const root = path.join(DIST, site);
  const pages = walk(root);
  const r = { site, pages: pages.length, brokenImages: [], dupImages: [], deadLinks: [], noAlt: 0, imgs: 0, links: 0 };

  for (const file of pages) {
    const rel = path.relative(root, file);
    const full = strip(fs.readFileSync(file, 'utf8'));
    // Duplicate-image checking is scoped to <main>: the logo legitimately
    // appears in both the header and the footer of every page, which would
    // otherwise report as a duplicate on all 1082 pages. Broken-image and
    // dead-link checking still runs over the WHOLE document.
    const mainOnly = (full.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [, full])[1];
    const html = full;

    // --- images
    const seen = new Map();
    for (const m of mainOnly.matchAll(/<img\b[^>]*>/g)) {
      const src2 = (m[0].match(/\ssrc="([^"]+)"/) || [])[1];
      if (src2 && !src2.startsWith('data:')) {
        const k = src2.split('/').pop();
        seen.set(k, (seen.get(k) || 0) + 1);
      }
    }
    for (const m of html.matchAll(/<img\b[^>]*>/g)) {
      const tag = m[0];
      const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
      if (!src || src.startsWith('data:')) continue;
      r.imgs++;
      if (!/\salt="/.test(tag)) r.noAlt++;
      if (src.startsWith('http')) continue;           // external, not ours to verify
      if (!resolveLocal(root, src)) r.brokenImages.push(`${rel} -> ${src}`);
    }
    for (const [img, n] of seen) if (n > 1) r.dupImages.push(`${rel} -> ${img} x${n}`);

    // --- internal links
    for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
      const href = m[1];
      if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
      r.links++;
      if (!resolveLocal(root, href)) r.deadLinks.push(`${rel} -> ${href}`);
    }
  }
  report.push(r);
}

let bad = 0;
console.log('site'.padEnd(34), 'pages'.padStart(5), 'imgs'.padStart(6), 'links'.padStart(6),
  'broken'.padStart(7), 'dupes'.padStart(6), 'dead'.padStart(5), 'noAlt'.padStart(6));
for (const r of report) {
  const issues = r.brokenImages.length + r.dupImages.length + r.deadLinks.length + r.noAlt;
  if (issues) bad++;
  console.log(
    r.site.replace(/\.com.*/, '').padEnd(34),
    String(r.pages).padStart(5), String(r.imgs).padStart(6), String(r.links).padStart(6),
    String(r.brokenImages.length).padStart(7), String(r.dupImages.length).padStart(6),
    String(r.deadLinks.length).padStart(5), String(r.noAlt).padStart(6));
}
console.log();
const tot = (k) => report.reduce((s, r) => s + r[k].length, 0);
console.log(`sites: ${report.length} | pages: ${report.reduce((s, r) => s + r.pages, 0)}`);
console.log(`broken images: ${tot('brokenImages')} | duplicate-on-page: ${tot('dupImages')} | dead links: ${tot('deadLinks')} | missing alt: ${report.reduce((s, r) => s + r.noAlt, 0)}`);
for (const r of report) {
  for (const k of ['brokenImages', 'dupImages', 'deadLinks']) {
    if (r[k].length) {
      console.log(`\n${r.site} ${k} (${r[k].length}):`);
      for (const x of r[k].slice(0, 6)) console.log('   ' + x);
      if (r[k].length > 6) console.log(`   ... +${r[k].length - 6} more`);
    }
  }
}
process.exit(bad ? 1 : 0);
