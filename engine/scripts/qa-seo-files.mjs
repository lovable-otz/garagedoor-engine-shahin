#!/usr/bin/env node
/**
 * QA for the three per-site machine-readable files: robots.txt, sitemap.xml,
 * llms.txt. Complements qa-sites.mjs (which checks the HTML pages).
 *
 * Every check here is a real defect, not a style preference:
 *   - all three files exist
 *   - robots.txt allows crawling and points at THIS site's sitemap
 *   - sitemap URLs are absolute, on the right domain, and UNIQUE (duplicate
 *     <loc> entries are an SEO defect - 5 of 36 sites had them, Toms River
 *     with 15, from content entries colliding on one slug)
 *   - every sitemap URL resolves to a page that was actually built
 *   - every page that was built appears in the sitemap (no orphans)
 *   - llms.txt has the H1 + blockquote summary the spec expects, and its links
 *     resolve and are unique
 *   - no unformatted digit-run phone anywhere (real exports carry
 *     "19566466904"; it must render as "(956) 646-6904")
 *
 *   node scripts/qa-seo-files.mjs              # every site in dist/
 *   node scripts/qa-seo-files.mjs parma searcy # substring match
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

function walkPages(root, out = [], base = '') {
  for (const e of fs.readdirSync(path.join(root, base), { withFileTypes: true })) {
    if (e.name === 'assets') continue;
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) walkPages(root, out, rel);
    else if (e.name === 'index.html') out.push(`/${base ? `${base}/` : ''}`);
  }
  return out;
}

const filters = argv.filter((a, i) => a !== '--dist' && argv[i - 1] !== '--dist');
const sites = fs.readdirSync(DIST)
  .filter((d) => /^(?!.*\.(html?|json|md|xml|txt|m?js|css|csv)$)[a-z0-9-]+\.[a-z]{2,}(-[a-z0-9-]+)?$/.test(d) && fs.existsSync(path.join(DIST, d, 'index.html')))
  .filter((d) => !filters.length || filters.some((f) => d.includes(f)));

let failed = 0;
const rows = [];

for (const site of sites) {
  const root = path.join(DIST, site);
  const domain = site.replace(/^(.*?\.[a-z]{2,})(-.*)?$/, '$1');
  const issues = [];
  const read = (f) => (fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), 'utf8') : null);

  const robots = read('robots.txt');
  const sitemap = read('sitemap.xml');
  const llms = read('llms.txt');
  for (const [name, body] of [['robots.txt', robots], ['sitemap.xml', sitemap], ['llms.txt', llms]]) {
    if (!body) issues.push(`${name} MISSING`);
  }

  // --- robots.txt
  if (robots) {
    if (!/^User-agent:\s*\*/m.test(robots)) issues.push('robots: no "User-agent: *"');
    if (!/^Allow:\s*\//m.test(robots)) issues.push('robots: no Allow rule');
    if (!robots.includes(`https://${domain}/sitemap.xml`)) issues.push('robots: Sitemap line missing or wrong domain');
  }

  // --- sitemap.xml
  // Compared with any trailing slash STRIPPED on BOTH sides. Content-declared
  // service URLs carry no trailing slash while every other page type does, and
  // both forms are the same `<path>/index.html` - matching raw strings reported
  // all 9 of a site's service pages as simultaneously "not built" and
  // "not listed".
  const norm = (p) => String(p).replace(/\/+$/, '') || '/';
  const built = new Set(walkPages(root).map(norm));
  let locs = [];
  if (sitemap) {
    if (!sitemap.startsWith('<?xml')) issues.push('sitemap: no XML declaration');
    locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (!locs.length) issues.push('sitemap: no <loc> entries');
    const seen = new Set(); const dups = new Set();
    for (const l of locs) { if (seen.has(l)) dups.add(l); seen.add(l); }
    if (dups.size) issues.push(`sitemap: ${dups.size} DUPLICATE url(s) e.g. ${[...dups][0]}`);
    const offDomain = locs.filter((l) => !l.startsWith(`https://${domain}/`));
    if (offDomain.length) issues.push(`sitemap: ${offDomain.length} url(s) off-domain e.g. ${offDomain[0]}`);
    const dead = [...seen].map((l) => l.replace(`https://${domain}`, '')).filter((p) => !built.has(norm(p)));
    if (dead.length) issues.push(`sitemap: ${dead.length} url(s) with no built page e.g. ${dead[0]}`);
    const listed = new Set([...seen].map((l) => norm(l.replace(`https://${domain}`, ''))));
    const orphans = [...built].filter((p) => !listed.has(p));
    if (orphans.length) issues.push(`sitemap: ${orphans.length} built page(s) NOT listed e.g. ${orphans[0]}`);
  }

  // --- llms.txt
  if (llms) {
    if (!/^# .+/m.test(llms)) issues.push('llms: no "# Title" heading');
    if (!/^> .+/m.test(llms)) issues.push('llms: no "> summary" blockquote');
    const links = [...llms.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((m) => m[1]);
    if (!links.length) issues.push('llms: no links');
    const dead = links.filter((l) => l.startsWith(`https://${domain}/`))
      .map((l) => l.replace(`https://${domain}`, '')).filter((p) => !built.has(norm(p)));
    if (dead.length) issues.push(`llms: ${dead.length} link(s) with no built page e.g. ${dead[0]}`);
    const seen = new Set(); const dups = new Set();
    for (const l of links) { if (seen.has(l)) dups.add(l); seen.add(l); }
    if (dups.size) issues.push(`llms: ${dups.size} duplicate link(s) e.g. ${[...dups][0]}`);
  }

  // --- unformatted phone, anywhere in the three files
  for (const [name, body] of [['robots.txt', robots], ['sitemap.xml', sitemap], ['llms.txt', llms]]) {
    const m = body && body.match(/(?<!\d)1?\d{10}(?!\d)/);
    if (m) issues.push(`${name}: unformatted phone "${m[0]}"`);
  }

  if (issues.length) failed++;
  rows.push({ site: site.replace(/\.com.*/, ''), pages: built.size, urls: locs.length, issues });
}

console.log('site'.padEnd(34), 'built'.padStart(6), 'inMap'.padStart(6), '  issues');
for (const r of rows) {
  console.log(r.site.padEnd(34), String(r.pages).padStart(6), String(r.urls).padStart(6),
    '  ' + (r.issues.length ? `${r.issues.length}` : 'ok'));
}
for (const r of rows) {
  if (!r.issues.length) continue;
  console.log(`\n${r.site}:`);
  for (const i of r.issues) console.log('   - ' + i);
}
console.log(`\nsites: ${rows.length} | clean: ${rows.length - failed} | with issues: ${failed}`);
process.exit(failed ? 1 : 0);
